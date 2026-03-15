import { getBtcCurrentPrice, getBtcDailyPrices } from "../api/coingecko";

/**
 * Bitcoin Ahr999 指标
 *
 * 公式: Ahr999 = (price / 200DMA) × (price / expectedPrice)
 *
 * - 200DMA = 200 日均价
 * - expectedPrice = 10^(5.84 × log10(coinAgeDays) - 17.01)
 *   coinAgeDays = 自创世区块(2009-01-03)以来的天数
 *
 * 解读:
 *   < 0.45  → 抄底区间（强烈买入）
 *   0.45~1.2 → 定投区间（正常定投）
 *   > 1.2   → 等待区间（减少定投/观望）
 */

const BTC_GENESIS = new Date("2009-01-03T00:00:00Z");

export interface Ahr999Data {
    value: number;
    zone: "bottom" | "dca" | "wait";
    zoneLabel: string;
    price: number;
    ma200: number;
    expectedPrice: number;
    coinAgeDays: number;
    timestamp: string;
}

export interface Ahr999HistoryPoint {
    date: string;
    value: number;
    zone: "bottom" | "dca" | "wait";
    zoneLabel: string;
    price: number;
    ma200: number;
    expectedPrice: number;
}

function getCoinAgeDays(date: Date = new Date()): number {
    return Math.floor(
        (date.getTime() - BTC_GENESIS.getTime()) / (1000 * 60 * 60 * 24)
    );
}

function getExpectedPrice(coinAgeDays: number): number {
    // Bitcoin exponential growth model
    // expectedPrice = 10^(5.84 × log10(coinAgeDays) - 17.01)
    return Math.pow(10, 5.84 * Math.log10(coinAgeDays) - 17.01);
}


async function fetchWithTimeout<T>(
    fn: () => Promise<T>,
    fallback: T,
    timeoutMs = 10000
): Promise<T> {
    try {
        const result = await Promise.race([
            fn(),
            new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error("Timeout")), timeoutMs)
            ),
        ]);
        return result;
    } catch (err) {
        console.warn("[ahr999] API call failed, using fallback:", err);
        return fallback;
    }
}

export async function calculateAhr999(): Promise<Ahr999Data> {
    const { get200DMA } = await import("../api/coingecko");
    const [btcData, ma200] = await Promise.all([
        fetchWithTimeout(
            () => getBtcCurrentPrice(),
            { price: 0, change24h: 0, marketCap: 0 }
        ),
        fetchWithTimeout(
            () => get200DMA(),
            0
        ),
    ]);

    const coinAgeDays = getCoinAgeDays();
    const expectedPrice = getExpectedPrice(coinAgeDays);
    const price = btcData.price;

    // If API failed
    if (price === 0 || ma200 === 0) {
        return {
            value: 0,
            zone: "dca",
            zoneLabel: "⚠️ 数据不可用",
            price: 0,
            ma200: 0,
            expectedPrice: Math.round(expectedPrice),
            coinAgeDays,
            timestamp: new Date().toISOString(),
        };
    }

    // Ahr999 = (price / 200DMA) × (price / expectedPrice)
    const ahr999 =
        ma200 > 0 && expectedPrice > 0
            ? (price / ma200) * (price / expectedPrice)
            : 0;

    let zone: Ahr999Data["zone"];
    let zoneLabel: string;

    if (ahr999 < 0.45) {
        zone = "bottom";
        zoneLabel = "🟢 抄底区间";
    } else if (ahr999 < 1.2) {
        zone = "dca";
        zoneLabel = "🟡 定投区间";
    } else {
        zone = "wait";
        zoneLabel = "🔴 等待区间";
    }

    return {
        value: Math.round(ahr999 * 1000) / 1000,
        zone,
        zoneLabel,
        price,
        ma200: Math.round(ma200),
        expectedPrice: Math.round(expectedPrice),
        coinAgeDays,
        timestamp: new Date().toISOString(),
    };
}

export async function calculateAhr999History(days = 365): Promise<Ahr999HistoryPoint[]> {
    const end = new Date();
    const start = new Date(end.getTime() - (days + 220) * 24 * 60 * 60 * 1000);
    const targetStart = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);

    const prices = await getBtcDailyPrices(start, end);
    if (prices.length < 210) return [];

    const sorted = prices.sort((a, b) => a.timestamp - b.timestamp);
    const values = sorted.map((p) => p.price);

    let sum = 0;
    for (let i = 0; i < 200; i++) {
        sum += values[i];
    }

    const history: Ahr999HistoryPoint[] = [];
    for (let i = 199; i < sorted.length; i++) {
        const point = sorted[i];
        const date = new Date(point.timestamp);
        const ma200 = sum / 200;
        const coinAgeDays = getCoinAgeDays(date);
        const expectedPrice = getExpectedPrice(coinAgeDays);
        const value =
            ma200 > 0 && expectedPrice > 0
                ? (point.price / ma200) * (point.price / expectedPrice)
                : 0;

        if (date >= targetStart) {
            let zone: Ahr999HistoryPoint["zone"];
            let zoneLabel: string;

            if (value < 0.45) {
                zone = "bottom";
                zoneLabel = "🌠 抄底区间";
            } else if (value < 1.2) {
                zone = "dca";
                zoneLabel = "📈 定投区间";
            } else {
                zone = "wait";
                zoneLabel = "🧊 等待区间";
            }

            history.push({
                date: date.toISOString().split("T")[0],
                value: Math.round(value * 1000) / 1000,
                zone,
                zoneLabel,
                price: Math.round(point.price),
                ma200: Math.round(ma200),
                expectedPrice: Math.round(expectedPrice),
            });
        }

        if (i + 1 < sorted.length) {
            sum += values[i + 1] - values[i - 199];
        }
    }

    return history;
}
