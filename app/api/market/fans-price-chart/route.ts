import { auth } from "@/lib/auth";
import { ProxyAgent } from "undici";

// Historical r/Bitcoin subscriber anchor points (date → approximate subscribers)
// Derived from known ratio + price data points in the user's article
const SUBSCRIBER_ANCHORS: Array<{ ts: number; subs: number }> = [
    { ts: new Date("2013-01-01").getTime(), subs: 25_000 },
    { ts: new Date("2013-04-01").getTime(), subs: 45_000 },
    { ts: new Date("2013-11-28").getTime(), subs: 147_000 },  // ~2013 first peak: ratio 122.7, price ~$1197
    { ts: new Date("2014-03-01").getTime(), subs: 165_000 },
    { ts: new Date("2015-01-14").getTime(), subs: 148_000 },  // ~2015 bear bottom: ratio 740, price ~$200
    { ts: new Date("2015-07-01").getTime(), subs: 205_000 },
    { ts: new Date("2016-01-01").getTime(), subs: 240_000 },
    { ts: new Date("2016-07-01").getTime(), subs: 310_000 },
    { ts: new Date("2017-01-01").getTime(), subs: 400_000 },
    { ts: new Date("2017-12-17").getTime(), subs: 614_000 },  // 2017 top: ratio 30.7, price ~$20k
    { ts: new Date("2018-06-01").getTime(), subs: 900_000 },
    { ts: new Date("2018-12-15").getTime(), subs: 928_000 },  // 2018 bear bottom: ratio 290, price ~$3,200
    { ts: new Date("2019-04-01").getTime(), subs: 1_060_000 },
    { ts: new Date("2019-07-10").getTime(), subs: 1_230_000 }, // ratio 85.3 at ~$12,400
    { ts: new Date("2020-01-01").getTime(), subs: 1_400_000 },
    { ts: new Date("2020-05-01").getTime(), subs: 1_600_000 },
    { ts: new Date("2020-09-01").getTime(), subs: 1_900_000 },
    { ts: new Date("2021-01-01").getTime(), subs: 2_400_000 },
    { ts: new Date("2021-04-14").getTime(), subs: 2_880_000 }, // 2021 high: ratio 44.9, price ~$64k
    { ts: new Date("2021-10-01").getTime(), subs: 3_500_000 },
    { ts: new Date("2022-01-01").getTime(), subs: 4_000_000 },
    { ts: new Date("2022-06-01").getTime(), subs: 4_500_000 },
    { ts: new Date("2022-12-01").getTime(), subs: 5_000_000 },
    { ts: new Date("2023-06-01").getTime(), subs: 5_600_000 },
    { ts: new Date("2024-01-01").getTime(), subs: 6_600_000 },
    { ts: new Date("2024-07-01").getTime(), subs: 7_200_000 },
    { ts: new Date("2025-01-01").getTime(), subs: 7_700_000 },
    { ts: new Date("2026-01-01").getTime(), subs: 8_000_000 },
    { ts: new Date("2026-04-01").getTime(), subs: 8_150_000 },
];

// Linear interpolation between two anchor points
function interpolateSubs(ts: number): number {
    if (ts <= SUBSCRIBER_ANCHORS[0].ts) return SUBSCRIBER_ANCHORS[0].subs;
    if (ts >= SUBSCRIBER_ANCHORS[SUBSCRIBER_ANCHORS.length - 1].ts) {
        return SUBSCRIBER_ANCHORS[SUBSCRIBER_ANCHORS.length - 1].subs;
    }
    for (let i = 0; i < SUBSCRIBER_ANCHORS.length - 1; i++) {
        const a = SUBSCRIBER_ANCHORS[i];
        const b = SUBSCRIBER_ANCHORS[i + 1];
        if (ts >= a.ts && ts <= b.ts) {
            const t = (ts - a.ts) / (b.ts - a.ts);
            return Math.round(a.subs + t * (b.subs - a.subs));
        }
    }
    return SUBSCRIBER_ANCHORS[SUBSCRIBER_ANCHORS.length - 1].subs;
}

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) {
            return new Response("Unauthorized", { status: 401 });
        }

        const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
        const isVercel = process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
        const fetchOptions: any = {};
        if (proxyUrl && !isVercel) {
            try { fetchOptions.dispatcher = new ProxyAgent(proxyUrl); } catch (e) {}
        }

        // Fetch ~3.5 years of BTC daily price history from CryptoCompare (1279 days)
        const toTs = Math.floor(Date.now() / 1000);
        const url = `https://min-api.cryptocompare.com/data/v2/histoday?fsym=BTC&tsym=USD&limit=1999&toTs=${toTs}`;

        const res = await fetch(url, fetchOptions);
        if (!res.ok) throw new Error(`CryptoCompare error: ${res.status}`);
        const json = await res.json() as any;
        if (json.Response === "Error") throw new Error(json.Message);

        const prices: Array<{ time: number; close: number }> = json.Data.Data;

        // Filter to only data from 2013 onwards and build chart data
        const chartData = prices
            .filter(d => d.time >= 1356998400 && d.close > 0) // 2013-01-01
            .map(d => {
                const ts = d.time * 1000;
                const price = d.close;
                const subs = interpolateSubs(ts);
                const ratio = subs / price;
                const date = new Date(ts).toISOString().split("T")[0];
                return {
                    date,
                    price: Math.round(price),
                    subs,
                    ratio: parseFloat(ratio.toFixed(2)),
                };
            });

        // Downsample to at most 600 points for faster rendering (weekly granularity for old data)
        const MAX_POINTS = 500;
        const step = Math.max(1, Math.floor(chartData.length / MAX_POINTS));
        const sampled = chartData.filter((_, i) => i % step === 0 || i === chartData.length - 1);

        return Response.json({
            data: sampled,
            totalDays: chartData.length,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("[fans-price-chart] Error:", error);
        return new Response(JSON.stringify({ error: "Failed to fetch chart data" }), { status: 500 });
    }
}
