import { NextResponse } from "next/server";
import { getNetworkCongestionStatus } from "@/lib/api/mempool";
import { getMockedLiquidations } from "@/lib/api/liquidations";
import { getBtcCurrentPrice } from "@/lib/api/coingecko";
import { getFearGreedCurrent } from "@/lib/api/fear-greed";

export async function GET() {
    try {
        const [btc, fgi, mempool] = await Promise.all([
            getBtcCurrentPrice(),
            getFearGreedCurrent(),
            getNetworkCongestionStatus(),
        ]);

        const liquidations = await getMockedLiquidations(fgi.value, btc.change24h);

        return NextResponse.json({
            mempool,
            liquidations,
            timestamp: Date.now(),
        });
    } catch (error) {
        console.error("[onchain] Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch onchain data" },
            { status: 500 }
        );
    }
}
