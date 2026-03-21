import { NextResponse } from "next/server";
import { calculateAhr999 } from "@/lib/engine/ahr999";
import { getMvrvData } from "@/lib/api/mvrv";
import { getUsdtLendingRates } from "@/lib/api/lending-rates";
import { getBtcCurrentPrice } from "@/lib/api/coingecko";

export const dynamic = "force-dynamic";

export async function GET() {
    const results: any = {};
    
    try {
        results.btcPrice = await getBtcCurrentPrice();
    } catch (e: any) {
        results.btcPrice = { error: e.message, stack: e.stack };
    }

    try {
        results.ahr999 = await calculateAhr999();
    } catch (e: any) {
        results.ahr999 = { error: e.message, stack: e.stack };
    }

    try {
        results.mvrv = await getMvrvData();
    } catch (e: any) {
        results.mvrv = { error: e.message, stack: e.stack };
    }

    try {
        results.usdt = await getUsdtLendingRates();
    } catch (e: any) {
        results.usdt = { error: e.message, stack: e.stack };
    }
    
    return NextResponse.json(results);
}
