import { analyzeMacroLiquidity } from "@/lib/engine/macro-advisor";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const macroData = await analyzeMacroLiquidity();
        return NextResponse.json(macroData);
    } catch (error) {
        console.error("[api/macro] Failed to fetch macro data:", error);
        return NextResponse.json(
            { error: "Failed to fetch macro liquidity data" },
            { status: 500 }
        );
    }
}
