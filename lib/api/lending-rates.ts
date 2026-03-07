export interface LendingPoolData {
    chain: string;
    project: string;
    symbol: string;
    tvlUsd: number;
    apyBase: number; // Deposit/Supply rate
    apyReward: number;
    apy: number; // Total supply APY
    apyBaseBorrow: number; // Borrow rate
    apyRewardBorrow: number;
    apyBorrow: number; // Total borrow APY
    totalSupplyUsd: number;
    totalBorrowUsd: number;
}

export interface YieldChartData {
    timestamp: string;
    tvlUsd: number;
    apy: number;            // Historical supply APY
    apyReward: number | null;
    apyBase: number | null;
    apyBorrow: number | null;   // Historical borrow APY
    apyRewardBorrow: number | null;
    apyBaseBorrow: number | null;
}

const DEFILLAMA_YIELDS_API = "https://yields.llama.fi";

// Compound V3 WBTC pool on Ethereum consistently has active borrowing demand and rates.
// Pool UUID from DefiLlama
const TARGET_WBTC_POOL_ID = "c1ca08e4-d618-415e-ad63-fcec58705469";

export async function getBitcoinLendingRates() {
    try {
        // 1. Fetch current pool data (TVL, project info, base rates)
        const poolRes = await fetch(`${DEFILLAMA_YIELDS_API}/pools`, {
            next: { revalidate: 3600 } // Cache 1 hr
        });

        if (!poolRes.ok) throw new Error("Failed to fetch pools from DeFiLlama");
        const poolsData = await poolRes.json();

        const wbtcPool = poolsData.data.find((p: any) => p.pool === TARGET_WBTC_POOL_ID);

        if (!wbtcPool) {
            throw new Error("Could not find WBTC pool data");
        }

        // 2. Fetch historical lending/borrowing chart for the pool
        const chartRes = await fetch(`${DEFILLAMA_YIELDS_API}/chartLendBorrow/${TARGET_WBTC_POOL_ID}`, {
            next: { revalidate: 3600 }
        });

        if (!chartRes.ok) throw new Error("Failed to fetch pool chart data");
        const chartData = await chartRes.json();

        // The API returns historical data point array `chartData.data`
        // [{ timestamp, tvlUsd, apy, apyBase, apyBorrow, apyBaseBorrow }]
        // We slice the last 30 data points (approx 1 per day)
        const history30d = Array.isArray(chartData.data)
            ? chartData.data.slice(-30).map((d: any) => ({
                date: d.timestamp.split('T')[0], // YYYY-MM-DD
                supplyApy: d.apyBase || 0,
                borrowApy: d.apyBaseBorrow || 0
            }))
            : [];

        // Find the latest chart data point to get the most recent totalBorrowUsd if wbtcPool doesn't have it
        const latestChartData = Array.isArray(chartData.data) && chartData.data.length > 0
            ? chartData.data[chartData.data.length - 1]
            : null;

        return {
            current: {
                project: wbtcPool.project,
                symbol: wbtcPool.symbol,
                supplyApy: wbtcPool.apyBase || 0,
                borrowApy: wbtcPool.apyBaseBorrow || 0,
                tvl: wbtcPool.tvlUsd || 0,
                totalBorrow: wbtcPool.totalBorrowUsd || (latestChartData ? latestChartData.totalBorrowUsd : 0) || 0,
            },
            history: history30d
        };
    } catch (err: any) {
        console.error("Failed to fetch BTC lending rates:", err);
        return { error: err.message };
    }
}
