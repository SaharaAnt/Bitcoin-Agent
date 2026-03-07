import { NextResponse } from "next/server";
import { getUsdtLendingRates } from "@/lib/api/lending-rates";
import { calculateUsdtSentiment } from "@/lib/api/sentiment";

export async function GET() {
    try {
        const rates = await getUsdtLendingRates();

        if ('error' in rates) {
            return NextResponse.json({ error: rates.error }, { status: 500 });
        }

        const sentiment = calculateUsdtSentiment(
            rates.current.borrowApy,
            rates.history
        );

        return NextResponse.json({
            ...rates,
            sentiment
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
