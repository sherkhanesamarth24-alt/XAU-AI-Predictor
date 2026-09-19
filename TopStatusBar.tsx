import React from 'react';
import { Timeframe, MarketBias, ConnectionStatus } from '../types';
import {
  HelpCircle,
  Calculator,
  RefreshCw,
  Radio,
  Wifi,
  WifiOff,
} from 'lucide-react';

interface TopStatusBarProps {
  currentPrice: number;
  marketBias15M: MarketBias;
  biasConfidence: number;
  activeTimeframe: Timeframe;
  onSelectTimeframe: (tf: Timeframe) => void;
  connectionStatus: ConnectionStatus;
  lastUpdateTime: string; // HH:MM:SS
  dataSource: string; // "Twelve Data • LIVE" or "Twelve Data • DISCONNECTED"
  onReconnect: () => void;
  onOpenExplainer: () => void;
  onOpenRiskCalc: () => void;
  errorMessage: string | null;
}

export const TopStatusBar: React.FC<TopStatusBarProps> = ({
  currentPrice,
  marketBias15M,
  biasConfidence,
  activeTimeframe,
  onSelectTimeframe,
  connectionStatus,
  lastUpdateTime,
  dataSource,
  onReconnect,
  onOpenExplainer,
  onOpenRiskCalc,
  errorMessage,
}) => {
  const timeframes: Timeframe[] = ['15M', '5M', '3M', '1M'];
  const isConnected = connectionStatus === 'CONNECTED';
  const isConnecting = connectionStatus === 'CONNECTING';

  const getBiasColor = () => {
    if (!isConnected) return 'text-[#80848e]';
    switch (marketBias15M) {
      case 'BULLISH':
        return 'text-[#089981]';
      case 'BEARISH':
        return 'text-[#f23645]';
      default:
        return 'text-[#80848e]';
    }
  };

  const getStatusLabel = () => {
    if (isConnected) return 'LIVE';
    if (isConnecting) return 'CONNECTING';
    return 'DISCONNECTED';
  };

  return (
    <header
      id="top-status-bar"
      className="min-h-12 border-b border-[#1e222d] flex flex-wrap items-center justify-between px-3.5 py-1.5 bg-[#131722] text-[#d1d4dc] select-none flex-shrink-0 z-20 gap-2"
    >
      {/* Brand & Market Asset Details */}
      <div className="flex items-center space-x-3 sm:space-x-5">
        <div className="flex items-center space-x-2">
          <span className="text-[#ffb119] font-bold text-base tracking-tighter">
            XAU AI
          </span>
          <span className="bg-[#ffb119]/10 text-[#ffb119] text-[10px] px-1.5 py-0.5 rounded border border-[#ffb119]/20 font-mono font-bold leading-none">
            PREDICTOR
          </span>
        </div>

        {/* Live Status Pill: LIVE / CONNECTING / DISCONNECTED */}
        <div
          id="live-status-pill"
          className={`flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-mono font-bold transition-all ${
            isConnected
              ? 'bg-[#089981]/15 text-[#089981] border-[#089981]/40 shadow-sm'
              : isConnecting
              ? 'bg-[#ffb119]/15 text-[#ffb119] border-[#ffb119]/40 animate-pulse'
              : 'bg-[#f23645]/15 text-[#f23645] border-[#f23645]/40 animate-pulse'
          }`}
          title={
            isConnected
              ? 'Twelve Data WebSocket & REST live stream connected'
              : errorMessage || 'Live data feed disconnected'
          }
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected
                ? 'bg-[#089981] animate-ping'
                : isConnecting
                ? 'bg-[#ffb119] animate-pulse'
                : 'bg-[#f23645]'
            }`}
          />
          <span>{getStatusLabel()} ●</span>
        </div>

        {/* Data Source Indicator: Twelve Data • LIVE */}
        <div
          id="data-source-pill"
          className={`hidden sm:flex items-center space-x-1.5 px-2 py-0.5 rounded border text-[10px] font-mono font-medium ${
            isConnected
              ? 'bg-[#1e222d] text-[#089981] border-[#089981]/30'
              : 'bg-[#1e222d] text-[#80848e] border-[#2a2e39]'
          }`}
        >
          <Radio className="w-3 h-3 text-[#ffb119]" />
          <span>{dataSource}</span>
        </div>

        {/* Market Data Telemetry */}
        <div className="flex items-center space-x-3 sm:space-x-4 border-l border-[#2a2e39] pl-3 sm:pl-4">
          <div className="flex flex-col">
            <span className="text-[9px] text-[#80848e] leading-none uppercase tracking-widest font-semibold">
              Instrument
            </span>
            <span className="text-xs sm:text-sm font-bold text-white leading-tight font-mono">
              XAU/USD{' '}
              <span className="text-[#80848e] font-normal text-xs">
                · {activeTimeframe}
              </span>
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[9px] text-[#80848e] leading-none uppercase tracking-widest font-semibold">
              Current Price
            </span>
            <span
              className={`text-xs sm:text-sm font-mono font-bold leading-tight ${
                !isConnected
                  ? 'text-[#80848e]'
                  : marketBias15M === 'BEARISH'
                  ? 'text-[#f23645]'
                  : marketBias15M === 'BULLISH'
                  ? 'text-[#089981]'
                  : 'text-white'
              }`}
            >
              {isConnected && currentPrice > 0
                ? `$${currentPrice.toFixed(2)}`
                : '---.--'}
            </span>
          </div>

          <div className="flex flex-col hidden md:flex">
            <span className="text-[9px] text-[#80848e] leading-none uppercase tracking-widest font-semibold">
              Last Update
            </span>
            <span className="text-xs font-mono text-[#d1d4dc] leading-tight">
              {isConnected && lastUpdateTime ? lastUpdateTime : '--:--:--'}
            </span>
          </div>

          <div className="flex flex-col hidden lg:flex">
            <span className="text-[9px] text-[#80848e] leading-none uppercase tracking-widest font-semibold">
              15M Bias
            </span>
            <span
              className={`text-xs sm:text-sm font-bold leading-tight ${getBiasColor()}`}
            >
              {isConnected ? `${marketBias15M} (${biasConfidence}%)` : 'NO DATA'}
            </span>
          </div>
        </div>
      </div>

      {/* Right Controls Group */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Connection Status Tag */}
        <div className="hidden xl:flex items-center space-x-1.5 text-[11px] font-mono px-2.5 py-0.5 rounded bg-[#1e222d] border border-[#2a2e39]">
          {isConnected ? (
            <Wifi className="w-3.5 h-3.5 text-[#089981]" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-[#f23645]" />
          )}
          <span className="text-[#80848e]">Connection:</span>
          <span
            className={`font-bold ${
              isConnected
                ? 'text-[#089981]'
                : isConnecting
                ? 'text-[#ffb119]'
                : 'text-[#f23645]'
            }`}
          >
            {getStatusLabel()}
          </span>
        </div>

        {/* Reconnect / Refresh button */}
        <button
          id="reconnect-feed-btn"
          onClick={onReconnect}
          className="p-1.5 bg-[#2a2e39]/60 hover:bg-[#2a2e39] text-[#80848e] hover:text-white rounded border border-[#2a2e39] text-xs transition-colors"
          title="Reconnect Twelve Data market feed"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isConnecting ? 'animate-spin' : ''}`} />
        </button>

        {/* Timeframe selector pill group */}
        <div
          id="timeframe-selector"
          className="flex bg-[#2a2e39] rounded p-0.5 text-xs"
        >
          {timeframes.map((tf) => (
            <button
              key={tf}
              id={`tf-button-${tf.toLowerCase()}`}
              onClick={() => onSelectTimeframe(tf)}
              className={`px-2.5 py-0.5 text-[11px] font-mono rounded transition-colors ${
                activeTimeframe === tf
                  ? 'bg-[#131722] text-white shadow-sm font-bold'
                  : 'text-[#80848e] hover:text-white'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Risk Calculator button */}
        <button
          id="open-risk-calc-btn"
          onClick={onOpenRiskCalc}
          className="flex items-center space-x-1 px-2.5 py-1 bg-[#2a2e39]/60 hover:bg-[#2a2e39] text-[#d1d4dc] hover:text-white rounded border border-[#2a2e39] text-[11px] font-medium transition-colors"
          title="Open Gold Risk & Lot Calculator ($2 Risk / $4 Reward)"
        >
          <Calculator className="w-3.5 h-3.5 text-[#ffb119]" />
          <span className="hidden md:inline">Risk Model</span>
        </button>

        {/* Strategy Explainer button */}
        <button
          id="open-explainer-btn"
          onClick={onOpenExplainer}
          className="flex items-center space-x-1 px-2.5 py-1 bg-[#ffb119]/10 hover:bg-[#ffb119]/20 text-[#ffb119] rounded border border-[#ffb119]/20 text-[11px] font-medium transition-colors"
          title="Strategy Documentation & Rules"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Rules</span>
        </button>
      </div>
    </header>
  );
};
