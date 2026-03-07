import { NextResponse } from "next/server";
import { getBitcoinLendingRates } from "@/lib/api/lending-rates";

export async function GET() {
    try {
        const data = await getBitcoinLendingRates();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Lending Rates Proxy Error:", error);
        return NextResponse.json({ error: "Failed to fetch lending rates data" }, { status: 500 });
    }
}
