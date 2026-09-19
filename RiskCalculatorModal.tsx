import React, { useState } from 'react';
import {
  X,
  Calculator,
  Scale,
  DollarSign,
  Info,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { calculateXauRiskModel } from '../utils/goldStrategyEngine';

interface RiskCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPrice: number;
  initialEntry?: number | null;
  initialSL?: number | null;
}

export const RiskCalculatorModal: React.FC<RiskCalculatorModalProps> = ({
  isOpen,
  onClose,
  currentPrice,
  initialEntry,
  initialSL,
}) => {
  const [accountRiskUSD, setAccountRiskUSD] = useState<number>(2.0); // $2 default
  const [targetRR, setTargetRR] = useState<number>(2.0); // 1:2 default
  const [entryPrice, setEntryPrice] = useState<number>(initialEntry || currentPrice);
  const [slPrice, setSlPrice] = useState<number>(
    initialSL || Number((currentPrice - 3.5).toFixed(2))
  );

  if (!isOpen) return null;

  const riskResult = calculateXauRiskModel(entryPrice, slPrice, accountRiskUSD, targetRR);
  const isBuy = slPrice < entryPrice;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-[#131722] border border-[#2a2e39] rounded-lg shadow-2xl flex flex-col text-[#d1d4dc] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e222d] bg-[#131722]">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded bg-[#089981]/20 border border-[#089981]/40 flex items-center justify-center">
              <Calculator className="w-4 h-4 text-[#089981]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                XAU/USD Risk Model & Contract Calculator
              </h2>
              <p className="text-[11px] text-[#80848e]">
                Target Risk $2.00 • Target Reward $4.00 • 1:2 R:R
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

        {/* Body */}
        <div className="p-4 space-y-3.5 overflow-y-auto">
          {/* Important Rule Notice */}
          <div className="p-2.5 rounded bg-[#ffb119]/10 border border-[#ffb119]/30 text-xs text-[#ffb119] flex items-start space-x-2">
            <Info className="w-3.5 h-3.5 text-[#ffb119] flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Crucial Contract Specification:</span>
              <p className="text-[#d1d4dc] mt-0.5 text-[11px]">
                XAU/USD standard contract is <strong>100 troy ounces</strong>. A $1.00 change in gold price equals $100 per 1.0 standard lot. Lot size dynamically scales to ensure your exact dollar risk stays at $2.00.
              </p>
            </div>
          </div>

          {/* Interactive Inputs */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[#80848e] font-medium mb-1 text-[11px]">
                Account Target Risk ($ USD)
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-2 text-[#80848e] font-mono text-xs">$</span>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={accountRiskUSD}
                  onChange={(e) => setAccountRiskUSD(Math.max(0.1, Number(e.target.value)))}
                  className="w-full bg-[#1e222d] border border-[#2a2e39] rounded pl-6 pr-2.5 py-1.5 text-white font-mono font-bold focus:border-[#ffb119] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#80848e] font-medium mb-1 text-[11px]">
                Risk:Reward Ratio (Fixed 1:2)
              </label>
              <div className="relative">
                <input
                  type="text"
                  disabled
                  value="1 : 2.0"
                  className="w-full bg-[#1e222d] border border-[#2a2e39] rounded px-2.5 py-1.5 text-[#089981] font-mono font-bold cursor-not-allowed opacity-90"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#80848e] font-medium mb-1 text-[11px]">
                Entry Price ($ USD)
              </label>
              <input
                type="number"
                step="0.10"
                value={entryPrice}
                onChange={(e) => setEntryPrice(Number(e.target.value))}
                className="w-full bg-[#1e222d] border border-[#2a2e39] rounded px-2.5 py-1.5 text-white font-mono font-bold focus:border-[#ffb119] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[#80848e] font-medium mb-1 text-[11px]">
                Stop Loss Price ($ USD)
              </label>
              <input
                type="number"
                step="0.10"
                value={slPrice}
                onChange={(e) => setSlPrice(Number(e.target.value))}
                className="w-full bg-[#1e222d] border border-[#2a2e39] rounded px-2.5 py-1.5 text-[#f23645] font-mono font-bold focus:border-[#ffb119] focus:outline-none"
              />
            </div>
          </div>

          {/* Sizing & PnL Output Card */}
          <div className="p-3 rounded bg-[#1e222d] border border-[#2a2e39] space-y-2.5 font-mono">
            <div className="flex items-center justify-between pb-2 border-b border-[#2a2e39]">
              <span className="text-[11px] font-sans text-[#80848e]">Trade Direction</span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${isBuy ? 'bg-[#089981]/20 text-[#089981]' : 'bg-[#f23645]/20 text-[#f23645]'}`}>
                {isBuy ? '🟢 BUY (LONG)' : '🔴 SELL (SHORT)'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="p-2 rounded bg-[#131722] border border-[#2a2e39]">
                <div className="text-[9px] text-[#80848e] font-sans">SL Distance</div>
                <div className="text-xs font-bold text-[#f23645] mt-0.5">${riskResult.slDistanceUSD}</div>
              </div>
              <div className="p-2 rounded bg-[#131722] border border-[#2a2e39]">
                <div className="text-[9px] text-[#80848e] font-sans">TP Price</div>
                <div className="text-xs font-bold text-[#089981] mt-0.5">${riskResult.takeProfitPrice}</div>
              </div>
              <div className="p-2 rounded bg-[#131722] border border-[#ffb119]/30">
                <div className="text-[9px] text-[#ffb119] font-sans">Exact Lot Size</div>
                <div className="text-xs font-bold text-[#ffb119] mt-0.5">{riskResult.exactLotSize} Lots</div>
              </div>
              <div className="p-2 rounded bg-[#131722] border border-[#089981]/30">
                <div className="text-[9px] text-[#089981] font-sans">Account Reward</div>
                <div className="text-xs font-bold text-[#089981] mt-0.5">+${riskResult.accountRewardUSD.toFixed(2)}</div>
              </div>
            </div>

            {/* Contract Formula Demonstration */}
            <div className="pt-1 text-[10px] text-[#80848e] space-y-0.5 font-sans">
              <div>
                <strong>Formula:</strong>{' '}
                <span className="font-mono text-[#d1d4dc]">
                  Lots = ${accountRiskUSD.toFixed(2)} / (${riskResult.slDistanceUSD} × 100) = {riskResult.exactLotSize} Lots
                </span>
              </div>
              <div className="text-[#80848e]">
                • Stop Loss: -${accountRiskUSD.toFixed(2)} USD &nbsp;|&nbsp; Take Profit: +${riskResult.accountRewardUSD.toFixed(2)} USD
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-[#1e222d] bg-[#131722] flex justify-end">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded bg-[#089981] hover:bg-[#089981]/80 text-white font-bold text-xs transition-colors"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
