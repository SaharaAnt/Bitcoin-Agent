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

/**
 * 累计水下天数：投资组合价值低于已投入本金的天数。
 * 代表情绪上"亏本"的煎熬时光总长度。
 */
export function calcUnderwaterDays(buys: BuyEvent[]): number {
    return buys.filter((b) => b.portfolioValue < b.totalInvested).length;
}

/**
 * 最长回撤期：从任何历史峰值跌落后，连续处于该峰值以下的最长天数。
 * 代表"至暗时刻"持续了多久，是情绪耐受力最真实的考验。
 */
export function calcLongestDrawdownDays(buys: BuyEvent[]): number {
    if (buys.length === 0) return 0;

    let peak = 0;
    let currentStreak = 0;
    let longestStreak = 0;

    for (const buy of buys) {
        if (buy.portfolioValue >= peak) {
            // New high — reset streak
            peak = buy.portfolioValue;
            currentStreak = 0;
        } else {
            // Still below peak
            currentStreak++;
            if (currentStreak > longestStreak) {
                longestStreak = currentStreak;
            }
        }
    }

    return longestStreak;
}

/**
 * 正收益占比（胜率）：账面盈利的天数占回测总天数的百分比。
 * 代表策略给投资者"正向情绪反馈"的频率。
 */
export function calcWinRate(buys: BuyEvent[]): number {
    if (buys.length === 0) return 0;
    const profitableDays = buys.filter((b) => b.portfolioValue > b.totalInvested).length;
    return (profitableDays / buys.length) * 100;
}
