export type ConnectionStatus = 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'NO_API_KEY';

export interface MarketFeedInfo {
  dataSource: 'XAU/USD';
  connectionStatus: ConnectionStatus;
  lastUpdate: string | null;
  lastTimestamp: number | null;
  isLive: boolean;
  error: string | null;
  tickCount: number;
  sessionHigh: number | null;
  sessionLow: number | null;
  change?: number;
  percentChange?: number;
}

export type Timeframe = '1M' | '3M' | '5M' | '15M';

export interface Candle {
  time: number; // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type MarketBias = 'BULLISH' | 'BEARISH' | 'NEUTRAL';

export type SignalType = 'BUY SETUP' | 'SELL SETUP' | 'NO TRADE';

export type AMDPhase = 
  | '1. Accumulation'
  | '2. Manipulation'
  | '3. Liquidity Sweep/Break'
  | '4. Distribution'
  | '5. Reversal Confirmation'
  | '6. Entry Signal';

export type ConfirmationType = 
  | 'Market Structure Shift (MSS)'
  | 'Break of Structure (BOS)'
  | 'Strong Bullish Candle (Displacement)'
  | 'Strong Bearish Candle (Displacement)'
  | 'Valid Candlestick Reversal (Pinbar / Hammer)'
  | 'Valid Candlestick Reversal (Pinbar / Shooting Star)'
  | 'Rejection from Fib / Standard Deviation Zone'
  | 'None';

export interface AccumulationZone {
  startIndex: number;
  endIndex: number;
  startTime: number;
  endTime: number;
  high: number;
  low: number;
  mean: number;
  isFormed: boolean;
}

export interface ManipulationZone {
  startIndex: number;
  endIndex: number;
  startTime: number;
  endTime: number;
  high: number;
  low: number;
  direction: 'UP' | 'DOWN'; // UP = swept BSL, DOWN = swept SSL
  isFormed: boolean;
}

export interface DistributionZone {
  startIndex: number;
  endIndex: number;
  startTime: number;
  endTime: number;
  high: number;
  low: number;
  direction: 'UP' | 'DOWN';
  targetReached: boolean;
}

export interface ReversalZone {
  type: 'DISCOUNT_BUY_REVERSAL' | 'PREMIUM_SELL_REVERSAL';
  upperPrice: number;
  lowerPrice: number;
  primaryFibRange: string; // e.g. "-2.25 to -2.50"
  deepFibRange: string; // e.g. "-4.00 to -4.50"
  status: 'TESTING' | 'CONFIRMED' | 'PENDING';
  isTapped: boolean;
}

export interface LiquidityLevel {
  id: string;
  type: 'BSL' | 'SSL' | 'EQH' | 'EQL'; // Buy-Side Liquidity, Sell-Side Liquidity, Equal Highs, Equal Lows
  price: number;
  time: number;
  swept: boolean;
  sweepTime?: number;
  sweepPrice?: number;
  label: string;
}

export interface LiquiditySweepBreak {
  type: 'BSL' | 'SSL';
  price: number;
  sweepPrice: number;
  time: number;
  label: string;
  isBroken: boolean;
}

export interface ManipulationLeg {
  highPrice: number;
  lowPrice: number;
  highTime: number;
  lowTime: number;
  direction: 'BULLISH' | 'BEARISH';
  range: number;
  identified: boolean;
}

export interface FibonacciLevel {
  ratio: number;
  price: number;
  label: string;
  isCustom: boolean; // Custom: -2.25, -2.5, -4.0, -4.25, -4.5
  description: string;
}

export interface StandardDeviationZone {
  name: string;
  type: 'BUYING_ZONE' | 'SELLING_CEILING_ZONE' | 'MEDIAN';
  upperPrice: number;
  lowerPrice: number;
  sigmaLevel: number;
  description: string;
}

export interface StrategyAnalysisResult {
  symbol: 'XAU/USD';
  currentPrice: number;
  timeframe: Timeframe;
  overallBias15M: MarketBias;
  biasConfidence: number; // 0-100%
  
  // 6-Stage AMD Setup Detection
  currentPhase: AMDPhase;
  currentPhaseNumber: number; // 1 to 6
  phaseProgressPercent: number; // 0-100%
  
  // Zones & Anchors
  accumulation: AccumulationZone | null;
  manipulation: ManipulationZone | null;
  distribution: DistributionZone | null;
  reversalZone: ReversalZone | null;
  
  // Liquidity
  liquidityLevels: LiquidityLevel[];
  recentSweep: LiquidityLevel | null;
  liquiditySweepBreak: LiquiditySweepBreak | null;
  
  // Manipulation Leg & Derived Metrics
  manipulationLeg: ManipulationLeg | null;
  fibonacciLevels: FibonacciLevel[];
  standardDeviationZones: StandardDeviationZone[];
  
  // Signal Output (Strictly NO TRADE until confirmed, then BUY SETUP or SELL SETUP)
  signal: SignalType;
  tradeDirection: 'BUY' | 'SELL' | 'NONE';
  entryPrice: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  riskRewardRatio: string; // "1:2.0"
  accountRiskUSD: number; // $2.00
  accountProfitUSD: number; // $4.00
  recommendedLotSize: number; // e.g. 0.01 - 0.10 lots
  slPoints: number; // distance in points/dollars ($)
  tpPoints: number;
  
  // Qualitative Signal & Confirmation Details
  confidenceScore: number; // 0 - 100%
  reason: string;
  pendingConfirmation: string | null; // e.g. "Pending: Market Structure Shift (MSS) or Reversal Candlestick"
  detectedSetup: string;
  detectedLiquidity: string;
  detectedManipulationLeg: string;
  detectedFibonacciLevel: string;
  detectedStdDevZone: string;
  confirmationType: ConfirmationType;
  
  // 7-Point Confluence Checklist for UI
  checklist: {
    biasAligned: boolean;
    accumulationIdentified: boolean;
    manipulationDetected: boolean;
    liquiditySwept: boolean;
    distributionToFibZone: boolean;
    stdDevZoneReached: boolean;
    entryConfirmed: boolean;
  };
}

export interface ChartOverlaySettings {
  showAccumulation: boolean;
  showManipulation: boolean;
  showDistribution: boolean;
  showReversalZone: boolean;
  showLiquidity: boolean;
  showManipulationLeg: boolean;
  showFibonacci: boolean;
  showStdDevZones: boolean;
  showBuySellZones: boolean;
  showSignals: boolean;
  showCrosshair: boolean;
  showVolume: boolean;
}

export interface MarketScenario {
  id: string;
  name: string;
  description: string;
  bias: MarketBias;
  setupType: 'BULLISH_AMD' | 'BEARISH_AMD' | 'ACCUMULATION_NO_TRADE' | 'LIVE_SIMULATION';
}
