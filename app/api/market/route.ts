import { NextResponse } from "next/server";
import { getBtcCurrentPrice } from "@/lib/api/coingecko";
import { getFearGreedCurrent } from "@/lib/api/fear-greed";

export async function GET() {
    try {
        const [btc, fgi] = await Promise.all([
            getBtcCurrentPrice(),
            getFearGreedCurrent(),
        ]);

        return NextResponse.json({
            btc,
            fgi,
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
