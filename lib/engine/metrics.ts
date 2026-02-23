import type { BuyEvent } from "./types";

export function calcROI(totalInvested: number, finalValue: number): number {
    if (totalInvested === 0) return 0;
    return ((finalValue - totalInvested) / totalInvested) * 100;
}

export function calcAnnualizedReturn(
    totalInvested: number,
    finalValue: number,
    days: number
): number {
    if (totalInvested === 0 || days === 0) return 0;
    const totalReturn = finalValue / totalInvested;
    const years = days / 365;
    return (Math.pow(totalReturn, 1 / years) - 1) * 100;
}

export function calcMaxDrawdown(buys: BuyEvent[]): number {
    if (buys.length === 0) return 0;

    let peak = 0;
    let maxDD = 0;

    for (const buy of buys) {
        if (buy.portfolioValue > peak) {
            peak = buy.portfolioValue;
        }
        const drawdown = ((peak - buy.portfolioValue) / peak) * 100;
        if (drawdown > maxDD) {
            maxDD = drawdown;
        }
    }

    return maxDD;
}

export function calcAverageCost(
    totalInvested: number,
    totalBTC: number
): number {
    if (totalBTC === 0) return 0;
    return totalInvested / totalBTC;
}
