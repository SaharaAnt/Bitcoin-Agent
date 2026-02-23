const COINGECKO_BASE = "https://api.coingecko.com/api/v3";

interface PricePoint {
    timestamp: number;
    price: number;
}

// Simple in-memory cache
const cache = new Map<string, { data: unknown; expires: number }>();

async function fetchWithCache<T>(url: string, ttlMs = 60_000): Promise<T> {
    const cached = cache.get(url);
    if (cached && cached.expires > Date.now()) {
        return cached.data as T;
    }

    const headers: Record<string, string> = {
        accept: "application/json",
    };

    const apiKey = process.env.COINGECKO_API_KEY;
    if (apiKey && apiKey !== "your_coingecko_demo_api_key") {
        headers["x-cg-demo-api-key"] = apiKey;
    }

    const res = await fetch(url, { headers });
    if (!res.ok) {
        throw new Error(`CoinGecko API error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    cache.set(url, { data, expires: Date.now() + ttlMs });
    return data as T;
}

export async function getBtcPriceHistory(
    fromDate: Date,
    toDate: Date
): Promise<PricePoint[]> {
    const from = Math.floor(fromDate.getTime() / 1000);
    const to = Math.floor(toDate.getTime() / 1000);

    const url = `${COINGECKO_BASE}/coins/bitcoin/market_chart/range?vs_currency=usd&from=${from}&to=${to}`;

    const data = await fetchWithCache<{ prices: [number, number][] }>(
        url,
        300_000 // cache 5 min
    );

    return data.prices.map(([timestamp, price]) => ({
        timestamp,
        price,
    }));
}

export async function getBtcCurrentPrice(): Promise<{
    price: number;
    change24h: number;
    marketCap: number;
}> {
    const url = `${COINGECKO_BASE}/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`;

    const data = await fetchWithCache<{
        bitcoin: {
            usd: number;
            usd_24h_change: number;
            usd_market_cap: number;
        };
    }>(url, 30_000);

    return {
        price: data.bitcoin.usd,
        change24h: data.bitcoin.usd_24h_change,
        marketCap: data.bitcoin.usd_market_cap,
    };
}

// Get daily prices (one per day) for backtesting
export async function getBtcDailyPrices(
    fromDate: Date,
    toDate: Date
): Promise<PricePoint[]> {
    const prices = await getBtcPriceHistory(fromDate, toDate);

    // Deduplicate to one entry per day
    const dailyMap = new Map<string, PricePoint>();
    for (const p of prices) {
        const dateKey = new Date(p.timestamp).toISOString().split("T")[0];
        if (!dailyMap.has(dateKey)) {
            dailyMap.set(dateKey, p);
        }
    }

    return Array.from(dailyMap.values()).sort(
        (a, b) => a.timestamp - b.timestamp
    );
}
