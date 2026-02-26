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

export async function getMovingAverage(days: number): Promise<number> {
    const now = new Date();
    // Add a small buffer to handle incomplete days
    const from = new Date(now.getTime() - (days + 10) * 24 * 60 * 60 * 1000);

    const prices = await getBtcPriceHistory(from, now);

    if (prices.length < days) {
        // If not enough data, use whatever we have left
        if (prices.length === 0) return 0;
        const sum = prices.reduce((s, p) => s + p.price, 0);
        return sum / prices.length;
    }

    // Take last N data points
    const lastN = prices.slice(-days);
    const sum = lastN.reduce((s, p) => s + p.price, 0);
    return sum / days;
}

export async function get200DMA(): Promise<number> {
    return getMovingAverage(200);
}

export async function get60DMA(): Promise<number> {
    return getMovingAverage(60);
}

export async function getBtcCommunityData(): Promise<{
    redditSubscribers: number;
    redditActiveAccounts: number;
    redditAveragePosts48h: number;
    redditAverageComments48h: number;
}> {
    const url = `${COINGECKO_BASE}/coins/bitcoin?localization=false&tickers=false&market_data=false&community_data=true&developer_data=false&sparkline=false`;

    const data = await fetchWithCache<{
        community_data: {
            reddit_subscribers: number;
            reddit_accounts_active_48h: number;
            reddit_average_posts_48h: number;
            reddit_average_comments_48h: number;
        };
    }>(url, 300_000); // 缓存 5 分钟

    return {
        redditSubscribers: data.community_data.reddit_subscribers,
        redditActiveAccounts: data.community_data.reddit_accounts_active_48h,
        redditAveragePosts48h: data.community_data.reddit_average_posts_48h,
        redditAverageComments48h: data.community_data.reddit_average_comments_48h,
    };
}
