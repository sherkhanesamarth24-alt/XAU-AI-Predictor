import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Timeframe,
  Candle,
  StrategyAnalysisResult,
  ChartOverlaySettings,
  ConnectionStatus,
} from './types';
import {
  processLiveTickToCandles,
  aggregateCandles,
} from './utils/realCandleEngine';
import { runGoldStrategyEngine } from './utils/goldStrategyEngine';
import { ChartCanvas } from './components/ChartCanvas';
import { TopStatusBar } from './components/TopStatusBar';
import { SignalPanel } from './components/SignalPanel';
import { StrategyExplainerModal } from './components/StrategyExplainerModal';
import { RiskCalculatorModal } from './components/RiskCalculatorModal';
import {
  WifiOff,
  AlertTriangle,
  RefreshCw,
  Clock,
  Radio,
} from 'lucide-react';

export default function App() {
  // Active Timeframe
  const [activeTimeframe, setActiveTimeframe] = useState<Timeframe>('1M');

  // Real Market Data Candle Collections
  const [candleData, setCandleData] = useState<{
    candles1M: Candle[];
    candles3M: Candle[];
    candles5M: Candle[];
    candles15M: Candle[];
  }>({
    candles1M: [],
    candles3M: [],
    candles5M: [],
    candles15M: [],
  });

  // Live Market Feed Connection State
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('CONNECTING');
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('');
  const [lastTimestamp, setLastTimestamp] = useState<number | null>(null);
  const [liveTicksCount, setLiveTicksCount] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dayHigh, setDayHigh] = useState<number | null>(null);
  const [dayLow, setDayLow] = useState<number | null>(null);

  // Modals
  const [isExplainerOpen, setIsExplainerOpen] = useState<boolean>(false);
  const [isRiskCalcOpen, setIsRiskCalcOpen] = useState<boolean>(false);

  // Chart Overlay Preferences
  const [overlaySettings, setOverlaySettings] = useState<ChartOverlaySettings>({
    showAccumulation: true,
    showManipulation: true,
    showDistribution: true,
    showReversalZone: true,
    showLiquidity: true,
    showManipulationLeg: true,
    showFibonacci: true,
    showStdDevZones: true,
    showBuySellZones: true,
    showSignals: true,
    showCrosshair: true,
    showVolume: true,
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTickTimeRef = useRef<number>(Date.now());

  // Helper to format timestamp to HH:MM:SS
  const formatTimeHHMMSS = (ts?: number) => {
    const d = ts ? new Date(ts * 1000) : new Date();
    return d.toTimeString().split(' ')[0];
  };

  // 1. Fetch Real Historical Candles for XAU/USD from Twelve Data REST API
  const fetchHistoricalCandles = useCallback(async () => {
    try {
      setConnectionStatus((prev) => (prev === 'CONNECTED' ? prev : 'CONNECTING'));
      
      // Fetch 1-minute historical candles (up to 120 bars)
      const res1M = await fetch('/api/market-data/candles?interval=1min&outputsize=120');
      if (!res1M.ok) {
        const errorData = await res1M.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to load 1M real candles');
      }

      const data1M = await res1M.json();
      if (data1M.status === 'ok' && Array.isArray(data1M.candles) && data1M.candles.length > 0) {
        const real1M: Candle[] = data1M.candles;

        // Also fetch 15M candles for multi-timeframe 15M macro trend bias analysis
        let real15M: Candle[] = [];
        try {
          const res15M = await fetch('/api/market-data/candles?interval=15min&outputsize=50');
          if (res15M.ok) {
            const data15M = await res15M.json();
            if (data15M.status === 'ok' && Array.isArray(data15M.candles)) {
              real15M = data15M.candles;
            }
          }
        } catch {
          // Fallback to aggregation
        }

        const real3M = aggregateCandles(real1M, 3);
        const real5M = aggregateCandles(real1M, 5);
        if (real15M.length === 0) {
          real15M = aggregateCandles(real1M, 15);
        }

        setCandleData({
          candles1M: real1M,
          candles3M: real3M,
          candles5M: real5M,
          candles15M: real15M,
        });

        const lastCandle = real1M[real1M.length - 1];
        setLastUpdateTime(formatTimeHHMMSS(lastCandle.time));
        setLastTimestamp(lastCandle.time);
        setConnectionStatus('CONNECTED');
        setErrorMessage(null);
      }
    } catch (err: any) {
      console.warn('[Real Feed] Historical load notice:', err.message);
      setErrorMessage(err.message || 'Connecting to live market feed...');
    }
  }, []);

  // 2. Connect to Live Server-Sent Events (SSE) Stream
  const connectLiveStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    try {
      const sse = new EventSource('/api/market-data/stream');
      eventSourceRef.current = sse;

      sse.onopen = () => {
        setConnectionStatus('CONNECTED');
        setErrorMessage(null);
      };

      sse.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'tick') {
            const price = typeof data.price === 'number' ? data.price : parseFloat(data.price);
            if (!isNaN(price) && price > 0) {
              const ts = data.timestamp || Math.floor(Date.now() / 1000);
              lastTickTimeRef.current = Date.now();

              // Update candle set with real live tick
              setCandleData((prev) => {
                const updated = processLiveTickToCandles(prev.candles1M, price, ts);
                return updated;
              });

              setLastUpdateTime(formatTimeHHMMSS(ts));
              setLastTimestamp(ts);
              setLiveTicksCount((c) => c + 1);
              setConnectionStatus('CONNECTED');
              setErrorMessage(null);

              if (data.dayHigh) setDayHigh(data.dayHigh);
              if (data.dayLow) setDayLow(data.dayLow);
            }
          } else if (data.type === 'status') {
            if (data.connected) {
              setConnectionStatus('CONNECTED');
              setErrorMessage(null);
            } else {
              setConnectionStatus(data.apiKeyConfigured ? 'DISCONNECTED' : 'NO_API_KEY');
              if (data.error) {
                setErrorMessage(data.error);
              }
            }
          }
        } catch (e) {
          console.error('[Real Feed] Parse event error:', e);
        }
      };

      sse.onerror = () => {
        setConnectionStatus('DISCONNECTED');
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }

        // Auto-reconnect after 4 seconds
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
          connectLiveStream();
        }, 4000);
      };
    } catch (e: any) {
      setConnectionStatus('DISCONNECTED');
      setErrorMessage(e.message || 'Stream connection error');
    }
  }, []);

  // Initialize data on mount
  useEffect(() => {
    fetchHistoricalCandles();
    connectLiveStream();

    // Periodic heartbeat / refresh check every 10 seconds
    const interval = setInterval(() => {
      // If no live ticks received in last 15 seconds, ping status or re-poll
      if (Date.now() - lastTickTimeRef.current > 15000) {
        fetch('/api/market-data/status')
          .then((res) => res.json())
          .then((status) => {
            if (status.connected && status.lastTick) {
              setConnectionStatus('CONNECTED');
              setLastUpdateTime(formatTimeHHMMSS(status.lastTick.timestamp));
            } else if (!status.apiKeyConfigured) {
              setConnectionStatus('NO_API_KEY');
              setErrorMessage(status.error || 'Twelve Data API key is not configured');
            } else {
              setConnectionStatus('DISCONNECTED');
            }
          })
          .catch(() => {
            setConnectionStatus('DISCONNECTED');
          });
      }
    }, 10000);

    return () => {
      clearInterval(interval);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [fetchHistoricalCandles, connectLiveStream]);

  // Master Strategy Evaluation Engine (strictly using real live candles and real connection state)
  const isMarketConnected = connectionStatus === 'CONNECTED' && candleData.candles1M.length > 0;

  const strategyAnalysis: StrategyAnalysisResult = useMemo(() => {
    return runGoldStrategyEngine(
      candleData.candles1M,
      candleData.candles3M,
      candleData.candles5M,
      candleData.candles15M,
      activeTimeframe,
      isMarketConnected
    );
  }, [candleData, activeTimeframe, isMarketConnected]);

  // Get active candles based on active timeframe
  const activeCandles = useMemo(() => {
    switch (activeTimeframe) {
      case '15M':
        return candleData.candles15M;
      case '5M':
        return candleData.candles5M;
      case '3M':
        return candleData.candles3M;
      case '1M':
      default:
        return candleData.candles1M;
    }
  }, [candleData, activeTimeframe]);

  const handleUpdateOverlaySettings = (newSettings: Partial<ChartOverlaySettings>) => {
    setOverlaySettings((prev) => ({ ...prev, ...newSettings }));
  };

  // High / Low for session bar
  const sessionHigh = useMemo(() => {
    if (dayHigh && dayHigh > 0) return dayHigh;
    if (candleData.candles1M.length === 0) return 0;
    return Math.max(...candleData.candles1M.map((c) => c.high));
  }, [candleData.candles1M, dayHigh]);

  const sessionLow = useMemo(() => {
    if (dayLow && dayLow > 0) return dayLow;
    if (candleData.candles1M.length === 0) return 0;
    return Math.min(...candleData.candles1M.map((c) => c.low));
  }, [candleData.candles1M, dayLow]);

  // Manual Reconnect handler
  const handleManualReconnect = useCallback(() => {
    setConnectionStatus('CONNECTING');
    fetchHistoricalCandles();
    connectLiveStream();
  }, [fetchHistoricalCandles, connectLiveStream]);

  return (
    <div className="flex flex-col w-screen h-screen bg-[#0b0e14] text-[#d1d4dc] overflow-hidden font-sans select-none">
      {/* 1. TOP STATUS HEADER (Includes LIVE indicator, Data Source, Last Update, and Connection status) */}
      <TopStatusBar
        currentPrice={strategyAnalysis.currentPrice}
        marketBias15M={strategyAnalysis.overallBias15M}
        biasConfidence={strategyAnalysis.biasConfidence}
        activeTimeframe={activeTimeframe}
        onSelectTimeframe={setActiveTimeframe}
        connectionStatus={connectionStatus}
        lastUpdateTime={lastUpdateTime}
        dataSource={isMarketConnected ? 'Twelve Data • LIVE' : 'Twelve Data • DISCONNECTED'}
        onReconnect={handleManualReconnect}
        onOpenExplainer={() => setIsExplainerOpen(true)}
        onOpenRiskCalc={() => setIsRiskCalcOpen(true)}
        errorMessage={errorMessage}
      />

      {/* 2. SUB-STATUS MARKET TICKER BAR */}
      <div
        id="sub-status-ticker"
        className="w-full bg-[#131722] border-b border-[#1e222d] px-3 py-1 flex flex-wrap items-center justify-between text-[11px] font-mono text-[#80848e] gap-2"
      >
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <span className="text-[#80848e]">INSTRUMENT:</span>
            <span className="text-white font-bold">XAU/USD Gold Spot</span>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-[#80848e]">SPOT:</span>
            <span className={`font-bold ${isMarketConnected ? 'text-white' : 'text-[#80848e]'}`}>
              {strategyAnalysis.currentPrice > 0 ? `$${strategyAnalysis.currentPrice.toFixed(2)}` : '---.--'}
            </span>
          </div>

          {sessionHigh > 0 && (
            <div className="flex items-center space-x-1.5">
              <span className="text-[#80848e]">SESSION HIGH:</span>
              <span className="text-[#089981] font-semibold">${sessionHigh.toFixed(2)}</span>
            </div>
          )}

          {sessionLow > 0 && (
            <div className="flex items-center space-x-1.5">
              <span className="text-[#80848e]">SESSION LOW:</span>
              <span className="text-[#f23645] font-semibold">${sessionLow.toFixed(2)}</span>
            </div>
          )}

          <div className="flex items-center space-x-1.5 hidden sm:flex">
            <span className="text-[#80848e]">FEED:</span>
            <span className="text-[#ffb119] font-semibold">Twelve Data WS</span>
          </div>

          <div className="flex items-center space-x-1.5 hidden md:flex">
            <span className="text-[#80848e]">MARKET HOURS:</span>
            <span className="text-[#d1d4dc] font-semibold">24/5 Live Spot</span>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-[10px]">
          <div className="flex items-center space-x-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isMarketConnected ? 'bg-[#089981] animate-pulse' : 'bg-[#f23645]'
              }`}
            />
            <span className={isMarketConnected ? 'text-[#089981] font-semibold' : 'text-[#f23645] font-semibold'}>
              {isMarketConnected ? 'REAL-TIME FEED ACTIVE' : 'FEED DISCONNECTED'}
            </span>
          </div>

          <div className="text-[#80848e] hidden lg:inline">
            Ticks Received: <span className="text-[#d1d4dc] font-mono">{liveTicksCount}</span>
          </div>
        </div>
      </div>

      {/* Disconnection Notice Banner if feed is down */}
      {!isMarketConnected && (
        <div
          id="connection-alert-banner"
          className="w-full bg-[#f23645]/10 border-b border-[#f23645]/30 px-3.5 py-2 flex flex-wrap items-center justify-between text-xs text-[#f23645] gap-2"
        >
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 animate-pulse text-[#f23645]" />
            <span className="font-bold tracking-wide">
              LIVE DATA DISCONNECTED — SIGNALS PAUSED
            </span>
            <span className="text-[#80848e] hidden md:inline border-l border-[#2a2e39] pl-2 text-[11px]">
              {errorMessage || 'Waiting for live XAU/USD market data feed from Twelve Data (TWELVE_DATA_API_KEY).'}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono text-[#80848e]">
              NO TRADE · Signals Active on Live Feed Only
            </span>
            <button
              id="reconnect-banner-btn"
              onClick={handleManualReconnect}
              className="flex items-center space-x-1 px-2.5 py-0.5 bg-[#f23645]/20 hover:bg-[#f23645]/30 text-white rounded font-mono text-[11px] font-bold transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reconnect</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. MAIN WORKSPACE (Large Real-Time Candlestick Chart on Left, Real Strategy Signal Panel on Right) */}
      <main className="flex-1 flex flex-col lg:flex-row w-full h-full overflow-hidden">
        {/* Left Side: Real-Time Candlestick Chart Canvas */}
        <section className="flex-1 h-[55vh] lg:h-full relative overflow-hidden bg-[#0a0a0b]">
          <ChartCanvas
            candles={activeCandles}
            analysis={strategyAnalysis}
            timeframe={activeTimeframe}
            overlaySettings={overlaySettings}
            onUpdateSettings={handleUpdateOverlaySettings}
          />
        </section>

        {/* Right Side: Real-Time Signal & Strategy Execution Panel */}
        <section className="w-full lg:w-80 xl:w-[320px] h-[45vh] lg:h-full bg-[#131722] flex-shrink-0 border-t lg:border-t-0 lg:border-l border-[#1e222d]">
          <SignalPanel
            analysis={strategyAnalysis}
            onOpenRiskCalc={() => setIsRiskCalcOpen(true)}
            onOpenExplainer={() => setIsExplainerOpen(true)}
          />
        </section>
      </main>

      {/* 4. MODALS */}
      <StrategyExplainerModal
        isOpen={isExplainerOpen}
        onClose={() => setIsExplainerOpen(false)}
      />

      <RiskCalculatorModal
        isOpen={isRiskCalcOpen}
        onClose={() => setIsRiskCalcOpen(false)}
        currentPrice={strategyAnalysis.currentPrice}
        initialEntry={strategyAnalysis.entryPrice}
        initialSL={strategyAnalysis.stopLoss}
      />
    </div>
  );
}
