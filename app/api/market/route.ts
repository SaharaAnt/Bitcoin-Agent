import { NextResponse } from "next/server";
import { getBtcCurrentPrice, getBtcDailyPrices } from "@/lib/api/coingecko";
import { getFearGreedCurrent, getFearGreedHistory } from "@/lib/api/fear-greed";

export async function GET() {
    try {
        const [btc, fgi, btcHistoryRaw, fgiHistoryRaw] = await Promise.all([
            getBtcCurrentPrice(),
            getFearGreedCurrent(),
            getBtcDailyPrices(
                new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                new Date()
            ),
            getFearGreedHistory(30),
        ]);

        return NextResponse.json({
            btc,
            fgi,
            btcHistory: btcHistoryRaw.map((p) => p.price),
            fgiHistory: fgiHistoryRaw.map((d) => d.value).reverse(),
            timestamp: Date.now(),
            live: true,
        });
    } catch (error) {
        console.error("[market] Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch market data", details: String(error) },
            { status: 500 }
        );
    }
}
