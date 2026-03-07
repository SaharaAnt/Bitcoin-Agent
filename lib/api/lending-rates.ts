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

// The Aave V3 WBTC pool on Ethereum is a good benchmark for deep liquidity BTC lending.
// Pool UUID from DefiLlama
const AAVE_V3_WBTC_POOL_ID = "7e38215a-0685-408e-841f-dfdcbb22a832";

export async function getBitcoinLendingRates() {
    try {
        // Fetch current pool details
        const poolRes = await fetch(`${DEFILLAMA_YIELDS_API}/pools`, {
            next: { revalidate: 3600 } // Cache 1 hr
        });

        if (!poolRes.ok) throw new Error("Failed to fetch pools");
        const poolsData = await poolRes.json();

        const aaveV3WbtcPool = poolsData.data.find((p: any) => p.pool === AAVE_V3_WBTC_POOL_ID);

        if (!aaveV3WbtcPool) {
            throw new Error("Could not find Aave WBTC pool data");
        }

        // Fetch historical chart (last 30 days)
        const chartRes = await fetch(`${DEFILLAMA_YIELDS_API}/chartLendBorrow/${AAVE_V3_WBTC_POOL_ID}`, {
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

        return {
            current: {
                project: "Aave V3 (Ethereum)",
                symbol: "WBTC",
                supplyApy: aaveV3WbtcPool.apyBase || 0,
                borrowApy: aaveV3WbtcPool.apyBaseBorrow || 0,
                tvl: aaveV3WbtcPool.tvlUsd || 0,
                totalBorrow: aaveV3WbtcPool.totalBorrowUsd || 0,
            },
            history: history30d
        };
    } catch (err: any) {
        console.error("Failed to fetch BTC lending rates:", err);
        return { error: err.message };
    }
}
