import React, { useState } from 'react';
import { StrategyAnalysisResult } from '../types';
import {
  TrendingUp,
  TrendingDown,
  MinusCircle,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Crosshair,
  Percent,
  DollarSign,
  Layers,
  ArrowRight,
  Info,
  Scale,
  Sparkles,
  Copy,
  Check,
} from 'lucide-react';

interface SignalPanelProps {
  analysis: StrategyAnalysisResult;
  onOpenRiskCalc: () => void;
  onOpenExplainer: () => void;
}

export const SignalPanel: React.FC<SignalPanelProps> = ({
  analysis,
  onOpenRiskCalc,
  onOpenExplainer,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getSignalHeader = () => {
    switch (analysis.signal) {
      case 'BUY':
        return (
          <div className="p-3.5 rounded-lg bg-[#089981]/10 border border-[#089981]/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded bg-[#089981]/20 border border-[#089981]/40 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-[#089981]" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-base sm:text-lg font-black text-[#089981] tracking-tight">
                      🟢 BUY SETUP
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-[#089981]/20 text-[#089981] text-[9px] font-mono font-bold">
                      CONFIRMED
                    </span>
                  </div>
                  <p className="text-[11px] text-[#80848e]">
                    Phase 6: Confirmed Long Entry at Reversal Zone
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-[#089981] font-mono">
                  {analysis.confidenceScore}%
                </div>
                <div className="text-[9px] text-[#80848e] uppercase tracking-wider font-semibold">
                  Confidence
                </div>
              </div>
            </div>
          </div>
        );

      case 'SELL':
        return (
          <div className="p-3.5 rounded-lg bg-[#f23645]/10 border border-[#f23645]/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded bg-[#f23645]/20 border border-[#f23645]/40 flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-[#f23645]" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-base sm:text-lg font-black text-[#f23645] tracking-tight">
                      🔴 SELL SETUP
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-[#f23645]/20 text-[#f23645] text-[9px] font-mono font-bold">
                      CONFIRMED
                    </span>
                  </div>
                  <p className="text-[11px] text-[#80848e]">
                    Phase 6: Confirmed Short Entry at Reversal Zone
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-[#f23645] font-mono">
                  {analysis.confidenceScore}%
                </div>
                <div className="text-[9px] text-[#80848e] uppercase tracking-wider font-semibold">
                  Confidence
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="p-3.5 rounded-lg bg-[#2a2e39]/30 border border-[#2a2e39]">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded bg-[#2a2e39] flex items-center justify-center">
                  <MinusCircle className="w-5 h-5 text-[#80848e]" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-base sm:text-lg font-black text-[#d1d4dc] tracking-tight">
                      ⚪ NO TRADE
                    </span>
                    {analysis.tradeDirection && (
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${
                        analysis.tradeDirection === 'BUY' ? 'bg-[#089981]/20 text-[#089981]' : 'bg-[#f23645]/20 text-[#f23645]'
                      }`}>
                        POTENTIAL {analysis.tradeDirection}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#80848e]">
                    Phase {analysis.currentPhaseNumber || 1}/6: {analysis.currentPhase || 'Accumulation'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-[#80848e] font-mono">
                  {analysis.confidenceScore}%
                </div>
                <div className="text-[9px] text-[#80848e] uppercase tracking-wider font-semibold">
                  Progress
                </div>
              </div>
            </div>

            {analysis.pendingConfirmation && (
              <div className="mt-2.5 pt-2 border-t border-[#2a2e39] flex items-center space-x-1.5 text-[10px] text-[#ffb119]">
                <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{analysis.pendingConfirmation}</span>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <aside id="signal-panel-root" className="w-full h-full bg-[#131722] border-l border-[#1e222d] flex flex-col overflow-y-auto text-[#d1d4dc]">
      {/* Top Banner Header */}
      <div className="p-3 space-y-2.5 border-b border-[#1e222d]">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Crosshair className="w-3.5 h-3.5 text-[#ffb119]" />
            <h2 className="font-bold text-xs uppercase tracking-wider text-white">
              Signal & Execution Panel
            </h2>
          </div>
          <button
            onClick={onOpenExplainer}
            className="text-[11px] text-[#ffb119] hover:text-white flex items-center space-x-1 transition-colors"
          >
            <span>Rules</span>
            <Info className="w-3 h-3" />
          </button>
        </div>

        {/* Dynamic Signal State Card */}
        {getSignalHeader()}
      </div>

      {/* Main Trade Parameters Grid (Entry, SL, TP, Risk/Reward) */}
      <div className="p-3 space-y-2.5 border-b border-[#1e222d]">
        <div className="flex items-center justify-between text-[11px] font-semibold text-[#80848e]">
          <span>EXECUTION METRICS</span>
          <span className="text-[#ffb119] font-mono text-[10px]">1:2 R:R Model</span>
        </div>

        <div className="grid grid-cols-3 gap-1.5 text-center font-mono">
          {/* Entry Price */}
          <div className="p-2 rounded bg-[#1e222d] border border-[#2a2e39] flex flex-col justify-center relative group">
            <span className="text-[9px] uppercase text-[#80848e] font-sans font-medium">Entry</span>
            <span className="text-xs sm:text-sm font-bold text-white mt-0.5">
              {analysis.entryPrice ? `${analysis.entryPrice.toFixed(2)}` : `${analysis.currentPrice.toFixed(2)}`}
            </span>
            {analysis.entryPrice && (
              <button
                onClick={() => copyToClipboard(analysis.entryPrice!.toString(), 'entry')}
                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-0.5 text-[#80848e] hover:text-white"
              >
                {copiedKey === 'entry' ? <Check className="w-2.5 h-2.5 text-[#089981]" /> : <Copy className="w-2.5 h-2.5" />}
              </button>
            )}
          </div>

          {/* Stop Loss */}
          <div className="p-2 rounded bg-[#1e222d] border border-[#f23645]/30 flex flex-col justify-center relative group">
            <span className="text-[9px] uppercase text-[#f23645] font-sans font-medium">Stop Loss</span>
            <span className="text-xs sm:text-sm font-bold text-[#f23645] mt-0.5">
              {analysis.stopLoss ? `${analysis.stopLoss.toFixed(2)}` : '—'}
            </span>
            {analysis.stopLoss && (
              <button
                onClick={() => copyToClipboard(analysis.stopLoss!.toString(), 'sl')}
                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-0.5 text-[#80848e] hover:text-white"
              >
                {copiedKey === 'sl' ? <Check className="w-2.5 h-2.5 text-[#089981]" /> : <Copy className="w-2.5 h-2.5" />}
              </button>
            )}
          </div>

          {/* Take Profit */}
          <div className="p-2 rounded bg-[#1e222d] border border-[#089981]/30 flex flex-col justify-center relative group">
            <span className="text-[9px] uppercase text-[#089981] font-sans font-medium">Take Profit</span>
            <span className="text-xs sm:text-sm font-bold text-[#089981] mt-0.5">
              {analysis.takeProfit ? `${analysis.takeProfit.toFixed(2)}` : '—'}
            </span>
            {analysis.takeProfit && (
              <button
                onClick={() => copyToClipboard(analysis.takeProfit!.toString(), 'tp')}
                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-0.5 text-[#80848e] hover:text-white"
              >
                {copiedKey === 'tp' ? <Check className="w-2.5 h-2.5 text-[#089981]" /> : <Copy className="w-2.5 h-2.5" />}
              </button>
            )}
          </div>
        </div>

        {/* Risk / Reward & Position Sizing Summary */}
        <div className="p-2.5 rounded bg-[#1e222d] border border-[#2a2e39] space-y-1.5 text-xs">
          <div className="flex items-center justify-between text-[#d1d4dc]">
            <span className="flex items-center space-x-1.5">
              <Scale className="w-3 h-3 text-[#ffb119]" />
              <span className="text-[11px]">Risk:Reward Ratio</span>
            </span>
            <span className="font-mono font-bold text-[#089981]">1 : 2.0 (Fixed)</span>
          </div>

          <div className="flex items-center justify-between text-[#d1d4dc]">
            <span className="flex items-center space-x-1.5">
              <DollarSign className="w-3 h-3 text-[#f23645]" />
              <span className="text-[11px]">Target Account Risk</span>
            </span>
            <span className="font-mono font-bold text-[#f23645]">
              ${analysis.accountRiskUSD.toFixed(2)} USD
            </span>
          </div>

          <div className="flex items-center justify-between text-[#d1d4dc]">
            <span className="flex items-center space-x-1.5">
              <DollarSign className="w-3 h-3 text-[#089981]" />
              <span className="text-[11px]">Target Account Reward</span>
            </span>
            <span className="font-mono font-bold text-[#089981]">
              ${analysis.accountProfitUSD.toFixed(2)} USD
            </span>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-[#2a2e39] text-[#d1d4dc]">
            <span className="text-[10px] text-[#80848e]">Contract Size (100oz):</span>
            <button
              onClick={onOpenRiskCalc}
              className="font-mono font-bold text-[#ffb119] hover:underline flex items-center space-x-1"
            >
              <span>{analysis.recommendedLotSize} Lots</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Detected Strategy Components (AMD, Liquidity, Fib, Std Dev, Confirmation) */}
      <div className="p-3 space-y-2 border-b border-[#1e222d]">
        <div className="flex items-center justify-between text-[11px] font-semibold text-[#80848e]">
          <span>AMD 6-STAGE SETUP PIPELINE</span>
          <span className="text-[10px] text-[#ffb119] font-mono">Stage {analysis.currentPhaseNumber || 1} of 6</span>
        </div>

        {/* 6-Stage Horizontal Progress Mini-Bar */}
        <div className="grid grid-cols-6 gap-1 py-1">
          {[
            { num: 1, name: 'Accum' },
            { num: 2, name: 'Manip' },
            { num: 3, name: 'Sweep' },
            { num: 4, name: 'Distrib' },
            { num: 5, name: 'Reversal' },
            { num: 6, name: 'Entry' },
          ].map((stage) => {
            const isCompleted = (analysis.currentPhaseNumber || 1) >= stage.num;
            const isCurrent = (analysis.currentPhaseNumber || 1) === stage.num;
            return (
              <div
                key={stage.num}
                className={`flex flex-col items-center p-1 rounded text-center transition-all ${
                  isCurrent
                    ? 'bg-[#ffb119]/20 border border-[#ffb119] text-[#ffb119]'
                    : isCompleted
                    ? 'bg-[#089981]/10 border border-[#089981]/30 text-[#089981]'
                    : 'bg-[#1e222d] border border-[#2a2e39] text-[#80848e]'
                }`}
              >
                <span className="text-[8px] font-bold font-mono">#{stage.num}</span>
                <span className="text-[7.5px] uppercase truncate w-full">{stage.name}</span>
              </div>
            );
          })}
        </div>

        <div className="space-y-1.5 text-xs pt-1">
          {/* Detected Setup */}
          <div className="p-2 rounded bg-[#1e222d] border border-[#2a2e39] space-y-0.5">
            <div className="text-[9px] uppercase tracking-wider text-[#80848e] font-semibold flex items-center space-x-1">
              <Layers className="w-3 h-3 text-[#ffb119]" />
              <span>Current AMD Phase</span>
            </div>
            <p className="font-medium text-white text-[11px] leading-tight">
              Phase {analysis.currentPhaseNumber || 1}: {analysis.currentPhase}
            </p>
          </div>

          {/* Detected Liquidity */}
          <div className="p-2 rounded bg-[#1e222d] border border-[#2a2e39] space-y-0.5">
            <div className="text-[9px] uppercase tracking-wider text-[#80848e] font-semibold flex items-center space-x-1">
              <Sparkles className="w-3 h-3 text-[#2962ff]" />
              <span>Detected Liquidity</span>
            </div>
            <p className="font-mono text-[#d1d4dc] text-[10px]">
              {analysis.detectedLiquidity}
            </p>
          </div>

          {/* Detected Manipulation Leg */}
          <div className="p-2 rounded bg-[#1e222d] border border-[#2a2e39] space-y-0.5">
            <div className="text-[9px] uppercase tracking-wider text-[#80848e] font-semibold flex items-center space-x-1">
              <Crosshair className="w-3 h-3 text-[#ffb119]" />
              <span>Manipulation Leg (Anchors)</span>
            </div>
            <p className="font-mono text-[#ffb119] text-[10px]">
              {analysis.detectedManipulationLeg}
            </p>
          </div>

          {/* Detected Fibonacci Level */}
          <div className="p-2 rounded bg-[#1e222d] border border-[#2a2e39] space-y-0.5">
            <div className="text-[9px] uppercase tracking-wider text-[#80848e] font-semibold flex items-center space-x-1">
              <Percent className="w-3 h-3 text-[#ffb119]" />
              <span>Custom Fib Extension (-2.25 to -4.5)</span>
            </div>
            <p className="font-mono text-white text-[10px]">
              {analysis.detectedFibonacciLevel}
            </p>
          </div>

          {/* Detected Standard Deviation Zone */}
          <div className="p-2 rounded bg-[#1e222d] border border-[#2a2e39] space-y-0.5">
            <div className="text-[9px] uppercase tracking-wider text-[#80848e] font-semibold flex items-center space-x-1">
              <Scale className="w-3 h-3 text-[#089981]" />
              <span>Standard Deviation Zone</span>
            </div>
            <p className="font-medium text-[#089981] text-[10px]">
              {analysis.detectedStdDevZone}
            </p>
          </div>

          {/* Confirmation Type */}
          <div className="p-2 rounded bg-[#1e222d] border border-[#2a2e39] space-y-0.5">
            <div className="text-[9px] uppercase tracking-wider text-[#80848e] font-semibold flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3 text-[#2962ff]" />
              <span>Entry Confirmation Type</span>
            </div>
            <p className="font-semibold text-white text-[10px]">
              {analysis.confirmationType}
            </p>
          </div>
        </div>
      </div>

      {/* Strategy Reason Log */}
      <div className="p-3 space-y-2 border-b border-[#1e222d]">
        <div className="text-[10px] font-semibold text-[#80848e] uppercase tracking-wider">
          STRATEGY REASON & ANALYSIS
        </div>
        <div className="p-2.5 rounded bg-[#1e222d] border border-[#2a2e39] text-[11px] text-[#d1d4dc] leading-relaxed font-sans">
          {analysis.reason}
        </div>
      </div>

      {/* 7-Point Confluence Checklist */}
      <div className="p-3 space-y-2 flex-1">
        <div className="text-[10px] font-semibold text-[#80848e] uppercase tracking-wider">
          7-STEP CONFLUENCE CRITERIA
        </div>

        <div className="space-y-1 text-[11px]">
          <div className="flex items-center justify-between p-1.5 rounded bg-[#1e222d]">
            <span className="text-[#d1d4dc]">1. 15M Market Bias Aligned</span>
            {analysis.checklist.biasAligned ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-[#089981]" />
            ) : (
              <XCircle className="w-3.5 h-3.5 text-[#80848e]" />
            )}
          </div>

          <div className="flex items-center justify-between p-1.5 rounded bg-[#1e222d]">
            <span className="text-[#d1d4dc]">2. Accumulation Range Formed</span>
            {analysis.checklist.accumulationIdentified ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-[#089981]" />
            ) : (
              <XCircle className="w-3.5 h-3.5 text-[#80848e]" />
            )}
          </div>

          <div className="flex items-center justify-between p-1.5 rounded bg-[#1e222d]">
            <span className="text-[#d1d4dc]">3. Manipulation Phase Triggered</span>
            {analysis.checklist.manipulationDetected ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-[#089981]" />
            ) : (
              <XCircle className="w-3.5 h-3.5 text-[#80848e]" />
            )}
          </div>

          <div className="flex items-center justify-between p-1.5 rounded bg-[#1e222d]">
            <span className="text-[#d1d4dc]">4. Liquidity Swept (BSL / SSL)</span>
            {analysis.checklist.liquiditySwept ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-[#089981]" />
            ) : (
              <XCircle className="w-3.5 h-3.5 text-[#80848e]" />
            )}
          </div>

          <div className="flex items-center justify-between p-1.5 rounded bg-[#1e222d]">
            <span className="text-[#d1d4dc]">5. Custom Fib Zone (-2.25 to -4.5)</span>
            {analysis.checklist.fibZoneReached ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-[#089981]" />
            ) : (
              <XCircle className="w-3.5 h-3.5 text-[#80848e]" />
            )}
          </div>

          <div className="flex items-center justify-between p-1.5 rounded bg-[#1e222d]">
            <span className="text-[#d1d4dc]">6. Std Dev Target Hit</span>
            {analysis.checklist.stdDevZoneReached ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-[#089981]" />
            ) : (
              <XCircle className="w-3.5 h-3.5 text-[#80848e]" />
            )}
          </div>

          <div className="flex items-center justify-between p-1.5 rounded bg-[#1e222d]">
            <span className="text-[#d1d4dc]">7. 1M/3M Entry Confirmation</span>
            {analysis.checklist.entryConfirmed ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-[#089981]" />
            ) : (
              <XCircle className="w-3.5 h-3.5 text-[#80848e]" />
            )}
          </div>
        </div>
      </div>

      {/* Bottom Disclaimer Banner */}
      <div className="p-2.5 bg-[#0a0a0b] border-t border-[#1e222d] text-[9px] text-[#80848e] text-center">
        ⚠️ Market Analysis & Prediction Tool for XAU/USD. Not financial advice or automated execution bot.
      </div>
    </aside>
  );
};

