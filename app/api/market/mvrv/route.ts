import { NextResponse } from "next/server";
import { getMvrvData } from "@/lib/api/mvrv";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET() {
    try {
        const data = await getMvrvData();
        return NextResponse.json(data);
    } catch (error) {
        console.error("[mvrv] Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch MVRV data" },
            { status: 500 }
        );
    }
}
