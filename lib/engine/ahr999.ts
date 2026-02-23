import { getBtcPriceHistory, getBtcCurrentPrice } from "../api/coingecko";

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

async function get200DMA(): Promise<number> {
    const now = new Date();
    const from = new Date(now.getTime() - 210 * 24 * 60 * 60 * 1000); // 210 days buffer

    const prices = await getBtcPriceHistory(from, now);

    if (prices.length < 200) {
        // If not enough data, use whatever we have
        const sum = prices.reduce((s, p) => s + p.price, 0);
        return sum / prices.length;
    }

    // Take last 200 data points
    const last200 = prices.slice(-200);
    const sum = last200.reduce((s, p) => s + p.price, 0);
    return sum / 200;
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
