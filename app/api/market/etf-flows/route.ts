import { NextResponse } from "next/server";
import { getBitcoinEtfFlowHistory } from "@/lib/api/etf-flows";

export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
    try {
        const data = await getBitcoinEtfFlowHistory();
        return NextResponse.json(data);
    } catch (err: any) {
        console.error("ETF API error in route:", err);
        return NextResponse.json(
            { error: err.message || "Failed to fetch ETF tracking data" },
            { status: 500 }
        );
    }
}
