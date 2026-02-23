import { NextResponse } from "next/server";
import { getStoicHistoricalBacktest } from "@/lib/api/stoic-backtest";
import { getBtcCurrentPrice } from "@/lib/api/coingecko";

export async function GET() {
    try {
        const { price: currentPrice } = await getBtcCurrentPrice();
        const events = await getStoicHistoricalBacktest(currentPrice);

        return NextResponse.json({
            events,
            timestamp: Date.now(),
        });
    } catch (error) {
        console.error("[stoic-backtest] Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch historical data" },
            { status: 500 }
        );
    }
}
