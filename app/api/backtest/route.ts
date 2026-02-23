import { NextResponse } from "next/server";
import { runBacktest, runSmartBacktest, runComparison } from "@/lib/engine/dca-engine";
import { auth } from "@/lib/auth";
import type { Frequency } from "@/lib/engine/types";

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const {
            startDate,
            endDate,
            frequency,
            amount,
            smartDCA = false,
            compare = false,
            fearThreshold = 25,
            greedThreshold = 75,
            fearMultiplier = 2.0,
            greedMultiplier = 0.5,
        } = body;

        if (!startDate || !endDate || !frequency || !amount) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const config = {
            startDate,
            endDate,
            frequency: frequency as Frequency,
            amount: Number(amount),
            smartDCA,
            fearThreshold,
            greedThreshold,
            fearMultiplier,
            greedMultiplier,
        };

        if (compare) {
            const result = await runComparison(config);
            return NextResponse.json(result);
        }

        const result = smartDCA
            ? await runSmartBacktest(config)
            : await runBacktest(config);

        return NextResponse.json(result);
    } catch (error) {
        console.error("Backtest error:", error);
        return NextResponse.json(
            { error: "回测执行失败" },
            { status: 500 }
        );
    }
}
