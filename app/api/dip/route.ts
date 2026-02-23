import { NextResponse } from "next/server";
import { calculateBuyTheDip } from "@/lib/engine/buy-the-dip";
import { getBtcCurrentPrice } from "@/lib/api/coingecko";
import { getFearGreedCurrent } from "@/lib/api/fear-greed";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { availableFiat = 0, baseAmount = 100 } = body;

        // 获取最新市场数据
        const [btc, fgi] = await Promise.all([
            getBtcCurrentPrice(),
            getFearGreedCurrent(),
        ]);

        const dipAction = calculateBuyTheDip({
            availableFiat: Number(availableFiat),
            baseAmount: Number(baseAmount),
            currentFgi: fgi.value,
            currentPrice: btc.price,
        });

        return NextResponse.json({
            action: dipAction,
            market: {
                btcPrice: btc.price,
                fgiValue: fgi.value,
                fgiLabel: fgi.label,
            }
        });
    } catch (error) {
        console.error("[dip-engine] Error:", error);
        return NextResponse.json(
            { error: "Failed to calculate dip strategy", details: String(error) },
            { status: 500 }
        );
    }
}
