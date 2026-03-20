/**
 * MVRV Z-Score 指标 & NUPL (Investor Confidence Index)
 */

export interface MvrvData {
    zScore: number;
    mvrv: number;           // 简单 MVRV 比率 (marketCap / realizedCap)
    nupl: number;           // Net Unrealized Profit/Loss (Investor Confidence Index)
    marketCap: number;      // 当前市值 USD
    realizedCap: number;    // 预估 Realized Cap USD
    zone: "top" | "high" | "fair" | "low" | "bottom";
    zoneLabel: string;
    zoneColor: string;
    description: string;
    timestamp: string;
    // Price levels based on MVRV standard deviations
    priceLevels: {
        extremeBottom: number;
        bottom: number;
        fairValue: number;
        mean: number;
        overvalued: number;
        bubble: number;
    };
    currentPrice: number;
    // Investor Confidence (NUPL) specialized metrics
    bullCountdown?: {
        daysToZero: number;
        speedPerDay: number; // Avg NUPL change over last 10 days
        isBullish: boolean;
    };
}

interface BlockchainChartPoint {
    x: number; // unix seconds
    y: number; // USD
}

export interface MvrvHistoryPoint {
    timestamp: number;
    zScore: number;
    mvrv: number;
    nupl: number;
}

interface BlockchainChartResponse {
    values: BlockchainChartPoint[];
}

async function fetchMarketCapHistoryPoints(): Promise<BlockchainChartPoint[]> {
    const url = "https://api.blockchain.info/charts/market-cap?timespan=2years&sampled=true&format=json&cors=true";
    const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0" },
        next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`blockchain.info API error: ${res.status}`);
    const data: BlockchainChartResponse = await res.json();
    return data.values.sort((a, b) => a.x - b.x);
}

function calcStdDev(values: number[]): number {
    const mean = values.reduce((s, v) => s + v, 0) / values.length;
    const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
    return Math.sqrt(variance);
}

export async function getMvrvData(): Promise<MvrvData> {
    const [cgRes, historyPoints] = await Promise.all([
        fetch(
            "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_market_cap=true",
            { headers: { accept: "application/json" }, next: { revalidate: 60 } }
        ).then((r) => r.json()),
        fetchMarketCapHistoryPoints(),
    ]);

    const currentMarketCap: number = cgRes?.bitcoin?.usd_market_cap ?? 0;
    const currentPrice: number = cgRes?.bitcoin?.usd ?? 0;
    const historyValues = historyPoints.map((p) => p.y);

    if (!currentMarketCap || historyValues.length < 30) {
        return {
            zScore: 0, mvrv: 0, nupl: 0, marketCap: 0, realizedCap: 0,
            zone: "fair", zoneLabel: "⚠️ 数据不可用", zoneColor: "#6b7280",
            description: "无法获取市场数据，请稍后重试",
            timestamp: new Date().toISOString(),
            priceLevels: { extremeBottom: 0, bottom: 0, fairValue: 0, mean: 0, overvalued: 0, bubble: 0 },
            currentPrice: 0
        };
    }

    const realizedCap = historyValues.reduce((s, v) => s + v, 0) / historyValues.length;
    const differences = historyValues.map((mc) => mc - realizedCap);
    const currentDiff = currentMarketCap - realizedCap;
    const allDiffs = [...differences, currentDiff];
    const meanDiff = allDiffs.reduce((s, v) => s + v, 0) / allDiffs.length;
    const stdDev = calcStdDev(allDiffs);

    const zScore = stdDev > 0 ? (currentDiff - meanDiff) / stdDev : 0;
    const mvrv = realizedCap > 0 ? currentMarketCap / realizedCap : 0;
    const nupl = 1 - (1 / mvrv);

    // Bull countdown logic (momentum of NUPL)
    const recentNUPLHistory = historyPoints.slice(-11).map(p => 1 - (realizedCap / p.y));
    const nuplStart = recentNUPLHistory[0];
    const nuplEnd = nupl;
    const speedPerDay = (nuplEnd - nuplStart) / 10;
    
    let daysToZero = 0;
    if (nupl < 0 && speedPerDay > 0) {
        daysToZero = Math.round(Math.abs(nupl) / speedPerDay);
    }

    // Price levels calculation
    const supply = currentPrice > 0 ? currentMarketCap / currentPrice : 19600000;
    const calcPriceAtZ = (targetZ: number) => {
        const targetMC = (targetZ * stdDev) + meanDiff + realizedCap;
        return targetMC / supply;
    };

    const priceLevels = {
        extremeBottom: Math.round(calcPriceAtZ(-2.0)),
        bottom: Math.round(calcPriceAtZ(-1.0)),
        fairValue: Math.round(calcPriceAtZ(-0.5)),
        mean: Math.round(calcPriceAtZ(0.0)),
        overvalued: Math.round(calcPriceAtZ(1.0)),
        bubble: Math.round(calcPriceAtZ(2.0)),
    };

    let zone: MvrvData["zone"];
    let zoneLabel: string;
    let zoneColor: string;
    let description: string;

    if (zScore > 7) {
        zone = "top";
        zoneLabel = "🔴 极度高估区间";
        zoneColor = "#ef4444";
        description = "历史上 Z-Score > 7 出现在牛市顶部，通常是减仓信号";
    } else if (zScore > 3) {
        zone = "high";
        zoneLabel = "🟠 高估区间";
        zoneColor = "#f97316";
        description = "市值显著高于成本基础，建议降低定投频率，谨慎追高";
    } else if (zScore > -1) {
        zone = "fair";
        zoneLabel = "🟡 合理区间";
        zoneColor = "#f59e0b";
        description = "市值处于合理估值范围，适合正常定投策略";
    } else if (zScore > -2) {
        zone = "low";
        zoneLabel = "🟢 低估区间";
        zoneColor = "#22c55e";
        description = "市值低于历史成本基础，适合适度加仓";
    } else {
        zone = "bottom";
        zoneLabel = "🟢🟢 极度低估";
        zoneColor = "#10b981";
        description = "历史上此区间出现在大熊市底部，是罕见的强力买入信号";
    }

    return {
        zScore: Math.round(zScore * 100) / 100,
        mvrv: Math.round(mvrv * 100) / 100,
        nupl: Math.round(nupl * 1000) / 1000,
        marketCap: Math.round(currentMarketCap),
        realizedCap: Math.round(realizedCap),
        zone,
        zoneLabel,
        zoneColor,
        description,
        timestamp: new Date().toISOString(),
        priceLevels,
        currentPrice,
        bullCountdown: {
            daysToZero,
            speedPerDay: Math.round(speedPerDay * 10000) / 10000,
            isBullish: nupl >= 0
        }
    };
}

export async function getMvrvHistory(): Promise<MvrvHistoryPoint[]> {
    const historyPoints = await fetchMarketCapHistoryPoints();
    if (historyPoints.length < 30) return [];
    const historyValues = historyPoints.map((p) => p.y);
    const realizedCap = historyValues.reduce((s, v) => s + v, 0) / historyValues.length;
    const differences = historyValues.map((mc) => mc - realizedCap);
    const meanDiff = differences.reduce((s, v) => s + v, 0) / differences.length;
    const stdDev = calcStdDev(differences);

    return historyPoints.map((p) => {
        const diff = p.y - realizedCap;
        const zScore = stdDev > 0 ? (diff - meanDiff) / stdDev : 0;
        const mvrv = realizedCap > 0 ? p.y / realizedCap : 0;
        const nupl = 1 - (1 / mvrv);
        return {
            timestamp: p.x * 1000,
            zScore: Math.round(zScore * 100) / 100,
            mvrv: Math.round(mvrv * 100) / 100,
            nupl: Math.round(nupl * 1000) / 1000,
        };
    });
}
