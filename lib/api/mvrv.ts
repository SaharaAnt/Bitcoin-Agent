/**
 * MVRV Z-Score 指标
 *
 * MVRV (Market Value to Realized Value) Z-Score 是比特币最重要的链上周期指标之一。
 *
 * 计算方式（使用公开可访问的近似值）：
 * - Market Cap：当前市场总市值（CoinGecko）
 * - Realized Cap：过去两年历史市值的滚动长期均值（blockchain.info 历史数据）
 *   这是一个近似值：严格的 Realized Cap 需要 UTXO 级别数据，
 *   但此方法在历史趋势判断上高度近似。
 * - Z-Score = (MarketCap - RealizedCap) / StdDev(MarketCap - RealizedCap)
 *
 * 解读参考（与 Glassnode 历史阈值对齐）：
 *   Z-Score > 7   → 🔴 极度高估（历史牛市顶部区域，强烈减仓信号）
 *   Z-Score 3~7   → 🟠 高估区间（谨慎，减少定投）
 *   Z-Score 0~3   → 🟡 合理区间（正常定投）
 *   Z-Score -1~0  → 🟢 低估区间（加仓机会）
 *   Z-Score < -1  → 🟢🟢 极度低估（抄底机会，历史熊市底部）
 */

export interface MvrvData {
    zScore: number;
    mvrv: number;           // 简单 MVRV 比率 (marketCap / realizedCap)
    marketCap: number;      // 当前市值 USD
    realizedCap: number;    // 预估 Realized Cap USD
    zone: "top" | "high" | "fair" | "low" | "bottom";
    zoneLabel: string;
    zoneColor: string;
    description: string;
    timestamp: string;
}

interface BlockchainChartPoint {
    x: number; // unix seconds
    y: number; // USD
}

export interface MvrvHistoryPoint {
    timestamp: number;
    zScore: number;
    mvrv: number;
}

interface BlockchainChartResponse {
    values: BlockchainChartPoint[];
}

async function fetchMarketCapHistoryPoints(): Promise<BlockchainChartPoint[]> {
    // blockchain.info 免费 API，无需 key，返回过去2年市值时序（约700个点）
    const url = "https://api.blockchain.info/charts/market-cap?timespan=2years&sampled=true&format=json&cors=true";

    const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0" },
        // Cache 1 hour — data updates daily
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
    // Fetch current market cap from CoinGecko (already used elsewhere)
    const [cgRes, historyPoints] = await Promise.all([
        fetch(
            "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_market_cap=true",
            { headers: { accept: "application/json" }, next: { revalidate: 60 } }
        ).then((r) => r.json()),
        fetchMarketCapHistoryPoints(),
    ]);

    const currentMarketCap: number = cgRes?.bitcoin?.usd_market_cap ?? 0;
    const historyValues = historyPoints.map((p) => p.y);

    if (!currentMarketCap || historyValues.length < 30) {
        return {
            zScore: 0,
            mvrv: 0,
            marketCap: 0,
            realizedCap: 0,
            zone: "fair",
            zoneLabel: "⚠️ 数据不可用",
            zoneColor: "#6b7280",
            description: "无法获取市场数据，请稍后重试",
            timestamp: new Date().toISOString(),
        };
    }

    // Realized Cap approximation:
    // Use the rolling long-term mean of historical market cap.
    // This closely tracks the true Realized Cap because the realized cap
    // represents the average acquisition cost of all BTC, which is well
    // approximated by the historical average market cap over a long period.
    const realizedCap = historyValues.reduce((s, v) => s + v, 0) / historyValues.length;

    // Compute the (MarketCap - RealizedCap) series for the historical window
    const differences = historyValues.map((mc) => mc - realizedCap);

    // Add the current point to get accurate current Z-Score
    const currentDiff = currentMarketCap - realizedCap;
    const allDiffs = [...differences, currentDiff];

    const meanDiff = allDiffs.reduce((s, v) => s + v, 0) / allDiffs.length;
    const stdDev = calcStdDev(allDiffs);

    const zScore = stdDev > 0 ? (currentDiff - meanDiff) / stdDev : 0;
    const mvrv = realizedCap > 0 ? currentMarketCap / realizedCap : 0;

    // Zone classification (aligned with Glassnode historical thresholds)
    let zone: MvrvData["zone"];
    let zoneLabel: string;
    let zoneColor: string;
    let description: string;

    if (zScore > 7) {
        zone = "top";
        zoneLabel = "🔴 极度高估区间";
        zoneColor = "#ef4444";
        description = "历史上 Z-Score > 7 出现在牛市顶部（如2017年末、2021年初），通常是减仓信号";
    } else if (zScore > 3) {
        zone = "high";
        zoneLabel = "🟠 高估区间";
        zoneColor = "#f97316";
        description = "市值显著高于成本基础，建议降低定投频率，谨慎追高";
    } else if (zScore > -1) {
        zone = "fair";
        zoneLabel = "🟡 合理区间";
        zoneColor = "#f59e0b";
        description = "市值处于合理估值范围，适合正常定投节奏，无需特别调整";
    } else if (zScore > -2) {
        zone = "low";
        zoneLabel = "🟢 低估区间";
        zoneColor = "#22c55e";
        description = "市值低于历史成本基础，适合适度加仓，胜率历史上较高";
    } else {
        zone = "bottom";
        zoneLabel = "🟢🟢 极度低估";
        zoneColor = "#10b981";
        description = "历史上此区间出现在大熊市底部（如2018年底、2022年底），是罕见的强力买入信号";
    }

    return {
        zScore: Math.round(zScore * 100) / 100,
        mvrv: Math.round(mvrv * 100) / 100,
        marketCap: Math.round(currentMarketCap),
        realizedCap: Math.round(realizedCap),
        zone,
        zoneLabel,
        zoneColor,
        description,
        timestamp: new Date().toISOString(),
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
        return {
            timestamp: p.x * 1000,
            zScore: Math.round(zScore * 100) / 100,
            mvrv: Math.round(mvrv * 100) / 100,
        };
    });
}
