import React from 'react';
import {
  X,
  Layers,
  TrendingUp,
  Target,
  Percent,
  Scale,
  Crosshair,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  Clock,
} from 'lucide-react';

interface StrategyExplainerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StrategyExplainerModal: React.FC<StrategyExplainerModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#131722] border border-[#2a2e39] rounded-lg shadow-2xl flex flex-col text-[#d1d4dc] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e222d] bg-[#131722]">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded bg-[#ffb119]/20 border border-[#ffb119]/40 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#ffb119]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                XAU/USD Strategy Blueprint: AMD + Liquidity + Custom Fib + Std Dev
              </h2>
              <p className="text-[11px] text-[#80848e]">
                Institutional Gold Market Cycle & Precision Reversal Logic
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded bg-[#1e222d] hover:bg-[#2a2e39] text-[#80848e] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 space-y-4 overflow-y-auto">
          {/* Timeframe Hierarchy */}
          <div className="p-3 rounded bg-[#1e222d] border border-[#2a2e39] space-y-2">
            <h3 className="text-xs font-bold text-[#ffb119] flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Multi-Timeframe Top-Down Hierarchy</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 rounded bg-[#131722] border border-[#2a2e39]">
                <div className="font-bold text-[#ffb119] font-mono text-xs">15M</div>
                <div className="font-semibold text-white mt-0.5 text-[11px]">Market Bias</div>
                <div className="text-[#80848e] text-[10px] mt-0.5">High-timeframe trend direction & order flow.</div>
              </div>
              <div className="p-2.5 rounded bg-[#131722] border border-[#2a2e39]">
                <div className="font-bold text-[#2962ff] font-mono text-xs">5M</div>
                <div className="font-semibold text-white mt-0.5 text-[11px]">Setup Analysis</div>
                <div className="text-[#80848e] text-[10px] mt-0.5">Accumulation ranges & Liquidity pools.</div>
              </div>
              <div className="p-2.5 rounded bg-[#131722] border border-[#2a2e39]">
                <div className="font-bold text-[#ab47bc] font-mono text-xs">3M</div>
                <div className="font-semibold text-white mt-0.5 text-[11px]">Setup Confirmation</div>
                <div className="text-[#80848e] text-[10px] mt-0.5">Manipulation Leg, Fib levels & Std Dev.</div>
              </div>
              <div className="p-2.5 rounded bg-[#131722] border border-[#2a2e39]">
                <div className="font-bold text-[#089981] font-mono text-xs">1M</div>
                <div className="font-semibold text-white mt-0.5 text-[11px]">Entry Trigger</div>
                <div className="text-[#80848e] text-[10px] mt-0.5">MSS displacement, pinbar & execution.</div>
              </div>
            </div>
          </div>

          {/* 9 Core Strategy Steps */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-[#ffb119]" />
              <span>The 9-Stage Strategy Lifecycle</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
              {/* Step 1: Accumulation */}
              <div className="p-2.5 rounded bg-[#1e222d] border border-[#2962ff]/30 space-y-1">
                <div className="flex items-center space-x-1.5">
                  <span className="w-4 h-4 rounded-full bg-[#2962ff]/20 text-[#2962ff] font-bold font-mono flex items-center justify-center text-[9px]">1</span>
                  <span className="font-bold text-[#2962ff] text-xs">Accumulation Range</span>
                </div>
                <p className="text-[#d1d4dc] text-[11px]">
                  Consolidation area where institutions build orders. The system automatically tracks High, Low, and Mean equilibrium, marking a blue zone.
                </p>
              </div>

              {/* Step 2: Manipulation */}
              <div className="p-2.5 rounded bg-[#1e222d] border border-[#ffb119]/30 space-y-1">
                <div className="flex items-center space-x-1.5">
                  <span className="w-4 h-4 rounded-full bg-[#ffb119]/20 text-[#ffb119] font-bold font-mono flex items-center justify-center text-[9px]">2</span>
                  <span className="font-bold text-[#ffb119] text-xs">Manipulation Movement</span>
                </div>
                <p className="text-[#d1d4dc] text-[11px]">
                  False breakout designed to induce retail stop triggers. Marked with an amber box as price aggressively breaks out.
                </p>
              </div>

              {/* Step 3: Previous Liquidity */}
              <div className="p-2.5 rounded bg-[#1e222d] border border-[#f23645]/30 space-y-1">
                <div className="flex items-center space-x-1.5">
                  <span className="w-4 h-4 rounded-full bg-[#f23645]/20 text-[#f23645] font-bold font-mono flex items-center justify-center text-[9px]">3</span>
                  <span className="font-bold text-[#f23645] text-xs">Previous Liquidity Pools</span>
                </div>
                <p className="text-[#d1d4dc] text-[11px]">
                  Key swing highs (BSL) and swing lows (SSL), Equal Highs (EQH), and session extreme liquidity lines.
                </p>
              </div>

              {/* Step 4: Liquidity Sweep */}
              <div className="p-2.5 rounded bg-[#1e222d] border border-[#f23645]/30 space-y-1">
                <div className="flex items-center space-x-1.5">
                  <span className="w-4 h-4 rounded-full bg-[#f23645]/20 text-[#f23645] font-bold font-mono flex items-center justify-center text-[9px]">4</span>
                  <span className="font-bold text-[#f23645] text-xs">Liquidity Sweep Trigger</span>
                </div>
                <p className="text-[#d1d4dc] text-[11px]">
                  Real-time detection when price wicks beyond previous liquidity, purging stop orders before immediate institutional absorption.
                </p>
              </div>

              {/* Step 5: Manipulation Leg */}
              <div className="p-2.5 rounded bg-[#1e222d] border border-[#ffb119]/30 space-y-1">
                <div className="flex items-center space-x-1.5">
                  <span className="w-4 h-4 rounded-full bg-[#ffb119]/20 text-[#ffb119] font-bold font-mono flex items-center justify-center text-[9px]">5</span>
                  <span className="font-bold text-[#ffb119] text-xs">Manipulation Leg Identification</span>
                </div>
                <p className="text-[#d1d4dc] text-[11px]">
                  Identifies swing origin and terminal sweep point. High & Low levels serve as mathematical anchors for Fib & Std Dev.
                </p>
              </div>

              {/* Step 6: Custom Fibonacci Extensions */}
              <div className="p-2.5 rounded bg-[#1e222d] border border-[#ab47bc]/30 space-y-1">
                <div className="flex items-center space-x-1.5">
                  <span className="w-4 h-4 rounded-full bg-[#ab47bc]/20 text-[#ab47bc] font-bold font-mono flex items-center justify-center text-[9px]">6</span>
                  <span className="font-bold text-[#ab47bc] text-xs">Custom Fibonacci Extensions</span>
                </div>
                <p className="text-[#d1d4dc] text-[11px]">
                  Calculates critical negative extensions: <span className="font-mono text-[#ffb119] font-bold">-2.25, -2.50, -4.00, -4.25, -4.50</span>. Level <span className="font-mono text-[#ffb119] font-bold">-2.50</span> represents primary target.
                </p>
              </div>

              {/* Step 7: Standard Deviation Zones */}
              <div className="p-2.5 rounded bg-[#1e222d] border border-[#089981]/30 space-y-1">
                <div className="flex items-center space-x-1.5">
                  <span className="w-4 h-4 rounded-full bg-[#089981]/20 text-[#089981] font-bold font-mono flex items-center justify-center text-[9px]">7</span>
                  <span className="font-bold text-[#089981] text-xs">Standard Deviation Bands</span>
                </div>
                <p className="text-[#d1d4dc] text-[11px]">
                  Defines premium selling ceiling zones (+2.0σ to +2.5σ, +4.0σ to +4.5σ) and discount buying zones (-2.0σ to -2.5σ, -4.0σ to -4.5σ).
                </p>
              </div>

              {/* Step 8: Distribution */}
              <div className="p-2.5 rounded bg-[#1e222d] border border-[#00bcd4]/30 space-y-1">
                <div className="flex items-center space-x-1.5">
                  <span className="w-4 h-4 rounded-full bg-[#00bcd4]/20 text-[#00bcd4] font-bold font-mono flex items-center justify-center text-[9px]">8</span>
                  <span className="font-bold text-[#00bcd4] text-xs">Distribution Phase</span>
                </div>
                <p className="text-[#d1d4dc] text-[11px]">
                  The expansion leg delivering price toward the opposite liquidity pool or equilibrium target following the manipulation sweep.
                </p>
              </div>

              {/* Step 9: Reversal & Entry Confirmation */}
              <div className="p-2.5 rounded bg-[#1e222d] border border-[#089981]/30 space-y-1 md:col-span-2">
                <div className="flex items-center space-x-1.5">
                  <span className="w-4 h-4 rounded-full bg-[#089981]/20 text-[#089981] font-bold font-mono flex items-center justify-center text-[9px]">9</span>
                  <span className="font-bold text-[#089981] text-xs">Strict Entry Confirmation Rules</span>
                </div>
                <p className="text-[#d1d4dc] text-[11px]">
                  Signals are ONLY generated when price is inside the Fib/Std Dev zone AND confirmed by one of:
                </p>
                <ul className="list-disc list-inside text-[#80848e] space-y-0.5 pl-1 text-[11px]">
                  <li><strong className="text-white">MSS (Market Structure Shift):</strong> Break of minor swing with strong displacement body close.</li>
                  <li><strong className="text-white">Reversal Candlestick:</strong> High-volume pinbar, hammer, or shooting star with wick ratio ≥ 2x body.</li>
                  <li><strong className="text-white">Liquidity Rejection:</strong> Rapid wick rejection returning price back inside range.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Risk Management Policy */}
          <div className="p-3 rounded bg-[#1e222d] border border-[#ffb119]/30 space-y-1.5">
            <h4 className="text-[11px] font-bold text-[#ffb119] uppercase tracking-wider flex items-center space-x-1.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Risk Management Rules: $2 Risk : $4 Reward (1:2 R:R)</span>
            </h4>
            <p className="text-[11px] text-[#d1d4dc] leading-relaxed">
              For XAU/USD, 1 standard lot = 100 troy ounces. A $2 account risk does NOT equal a $2 price move. The engine computes exact lot size via:
              <br />
              <code className="text-[#ffb119] font-mono bg-[#131722] px-1.5 py-0.5 rounded mt-1 inline-block text-[10px]">
                Position Size (Lots) = Account Risk ($2.00) / (SL Distance in Dollars × 100)
              </code>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-[#1e222d] bg-[#131722] flex justify-end">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded bg-[#ffb119] hover:bg-[#ffb119]/80 text-black font-bold text-xs transition-colors"
          >
            Understood & Close
          </button>
        </div>
      </div>
    </div>
  );
};
