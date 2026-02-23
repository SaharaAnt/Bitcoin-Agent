import type {
    DCAConfig,
    BacktestResult,
    BuyEvent,
    Frequency,
    ComparisonResult,
} from "./types";
import {
    calcROI,
    calcAnnualizedReturn,
    calcMaxDrawdown,
    calcAverageCost,
} from "./metrics";
import { getBtcDailyPrices } from "../api/coingecko";
import { getFearGreedMap } from "../api/fear-greed";

interface PricePoint {
    timestamp: number;
    price: number;
}

function shouldBuyOnDate(
    date: Date,
    startDate: Date,
    frequency: Frequency
): boolean {
    const diffDays = Math.floor(
        (date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    switch (frequency) {
        case "daily":
            return true;
        case "weekly":
            return diffDays % 7 === 0;
        case "biweekly":
            return diffDays % 14 === 0;
        case "monthly":
            return date.getDate() === startDate.getDate() ||
                (date.getDate() === new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate() &&
                    startDate.getDate() > new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate());
        default:
            return false;
    }
}

function buildPriceMap(prices: PricePoint[]): Map<string, number> {
    const map = new Map<string, number>();
    for (const p of prices) {
        const key = new Date(p.timestamp).toISOString().split("T")[0];
        map.set(key, p.price);
    }
    return map;
}

export async function runBacktest(config: DCAConfig): Promise<BacktestResult> {
    const start = new Date(config.startDate);
    const end = new Date(config.endDate);

    const prices = await getBtcDailyPrices(start, end);
    const priceMap = buildPriceMap(prices);

    const buys: BuyEvent[] = [];
    let totalBTC = 0;
    let totalInvested = 0;

    const current = new Date(start);
    while (current <= end) {
        const dateKey = current.toISOString().split("T")[0];
        const price = priceMap.get(dateKey);

        if (price && shouldBuyOnDate(current, start, config.frequency)) {
            const btcBought = config.amount / price;
            totalBTC += btcBought;
            totalInvested += config.amount;

            buys.push({
                date: dateKey,
                price,
                amountUSD: config.amount,
                btcBought,
                totalBTC,
                totalInvested,
                portfolioValue: totalBTC * price,
            });
        }

        current.setDate(current.getDate() + 1);
    }

    const lastPrice = prices[prices.length - 1]?.price ?? 0;
    const finalValue = totalBTC * lastPrice;
    const days = Math.floor(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
        strategy: "standard",
        config,
        buys,
        totalInvested,
        totalBTC,
        finalValue,
        roi: calcROI(totalInvested, finalValue),
        annualizedReturn: calcAnnualizedReturn(totalInvested, finalValue, days),
        maxDrawdown: calcMaxDrawdown(buys),
        averageCost: calcAverageCost(totalInvested, totalBTC),
        currentPrice: lastPrice,
    };
}

export async function runSmartBacktest(
    config: DCAConfig
): Promise<BacktestResult> {
    const start = new Date(config.startDate);
    const end = new Date(config.endDate);

    const prices = await getBtcDailyPrices(start, end);
    const priceMap = buildPriceMap(prices);

    // Get FGI data spanning the backtest period
    const daysDiff = Math.ceil(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );
    const fgiMap = await getFearGreedMap(daysDiff + 30);

    const buys: BuyEvent[] = [];
    let totalBTC = 0;
    let totalInvested = 0;

    const current = new Date(start);
    while (current <= end) {
        const dateKey = current.toISOString().split("T")[0];
        const price = priceMap.get(dateKey);

        if (price && shouldBuyOnDate(current, start, config.frequency)) {
            const fgiValue = fgiMap.get(dateKey);
            let multiplier = 1;

            if (fgiValue !== undefined) {
                if (fgiValue <= config.fearThreshold) {
                    multiplier = config.fearMultiplier; // Buy more in fear
                } else if (fgiValue >= config.greedThreshold) {
                    multiplier = config.greedMultiplier; // Buy less in greed
                }
            }

            const adjustedAmount = config.amount * multiplier;
            const btcBought = adjustedAmount / price;
            totalBTC += btcBought;
            totalInvested += adjustedAmount;

            buys.push({
                date: dateKey,
                price,
                amountUSD: adjustedAmount,
                btcBought,
                totalBTC,
                totalInvested,
                portfolioValue: totalBTC * price,
                fgiValue,
                multiplier,
            });
        }

        current.setDate(current.getDate() + 1);
    }

    const lastPrice = prices[prices.length - 1]?.price ?? 0;
    const finalValue = totalBTC * lastPrice;
    const days = Math.floor(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
        strategy: "smart",
        config,
        buys,
        totalInvested,
        totalBTC,
        finalValue,
        roi: calcROI(totalInvested, finalValue),
        annualizedReturn: calcAnnualizedReturn(totalInvested, finalValue, days),
        maxDrawdown: calcMaxDrawdown(buys),
        averageCost: calcAverageCost(totalInvested, totalBTC),
        currentPrice: lastPrice,
    };
}

export async function runLumpSum(config: DCAConfig): Promise<BacktestResult> {
    const start = new Date(config.startDate);
    const end = new Date(config.endDate);

    const prices = await getBtcDailyPrices(start, end);
    if (prices.length === 0) {
        throw new Error("No price data available for the specified date range");
    }

    const firstPrice = prices[0].price;
    const lastPrice = prices[prices.length - 1].price;

    // Calculate what the total standard DCA investment would be
    let buyCount = 0;
    const current = new Date(start);
    while (current <= end) {
        if (shouldBuyOnDate(current, start, config.frequency)) {
            buyCount++;
        }
        current.setDate(current.getDate() + 1);
    }

    const totalInvested = buyCount * config.amount;
    const totalBTC = totalInvested / firstPrice;
    const finalValue = totalBTC * lastPrice;
    const days = Math.floor(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );

    const buys: BuyEvent[] = [
        {
            date: config.startDate,
            price: firstPrice,
            amountUSD: totalInvested,
            btcBought: totalBTC,
            totalBTC,
            totalInvested,
            portfolioValue: totalBTC * firstPrice,
        },
    ];

    // Track portfolio value over time for drawdown calculation
    for (const p of prices) {
        buys.push({
            date: new Date(p.timestamp).toISOString().split("T")[0],
            price: p.price,
            amountUSD: 0,
            btcBought: 0,
            totalBTC,
            totalInvested,
            portfolioValue: totalBTC * p.price,
        });
    }

    return {
        strategy: "lump_sum",
        config,
        buys,
        totalInvested,
        totalBTC,
        finalValue,
        roi: calcROI(totalInvested, finalValue),
        annualizedReturn: calcAnnualizedReturn(totalInvested, finalValue, days),
        maxDrawdown: calcMaxDrawdown(buys),
        averageCost: firstPrice,
        currentPrice: lastPrice,
    };
}

export async function runComparison(
    config: DCAConfig
): Promise<ComparisonResult> {
    const [standard, smart, lumpSum] = await Promise.all([
        runBacktest(config),
        runSmartBacktest({ ...config, smartDCA: true }),
        runLumpSum(config),
    ]);

    return { standard, smart, lumpSum };
}
