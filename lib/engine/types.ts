export type Frequency = "daily" | "weekly" | "biweekly" | "monthly";

export interface DCAConfig {
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
    frequency: Frequency;
    amount: number; // USD per buy
    smartDCA: boolean;
    fearThreshold: number; // default 25
    greedThreshold: number; // default 75
    fearMultiplier: number; // default 2.0
    greedMultiplier: number; // default 0.5
}

export interface BuyEvent {
    date: string;
    price: number;
    amountUSD: number;
    btcBought: number;
    totalBTC: number;
    totalInvested: number;
    portfolioValue: number;
    fgiValue?: number;
    multiplier?: number;
}

export interface BacktestResult {
    strategy: "standard" | "smart" | "lump_sum";
    config: DCAConfig;
    buys: BuyEvent[];
    totalInvested: number;
    totalBTC: number;
    finalValue: number;
    roi: number; // percentage
    annualizedReturn: number;
    maxDrawdown: number;
    averageCost: number; // avg USD per BTC
    currentPrice: number;
}

export interface ComparisonResult {
    standard: BacktestResult;
    smart: BacktestResult;
    lumpSum: BacktestResult;
}

export interface DipConfig {
    availableFiat: number;
    baseAmount: number; // Base DCA amount
    currentFgi: number;
    currentPrice: number;
    extremeFearThreshold?: number; // default 20
    fearThreshold?: number; // default 40
}

export interface DipAction {
    action: "BUY" | "HOLD" | "ACCUMULATE_FIAT";
    recommendedAmount: number;
    reasoning: string[];
    riskLevel: "low" | "medium" | "high" | "extreme";
}
