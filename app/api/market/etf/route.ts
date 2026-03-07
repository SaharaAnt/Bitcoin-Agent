import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
    try {
        const filePath = path.join(process.cwd(), "lib", "data", "farside-data.json");
        const fileData = fs.readFileSync(filePath, "utf-8");
        const data: { date: string; total: number }[] = JSON.parse(fileData);

        if (!data || data.length === 0) {
            return NextResponse.json({ error: "No data available" }, { status: 404 });
        }

        // Calculate metrics
        let totalNetInflow = 0;
        let positiveDays = 0;
        let negativeDays = 0;

        // Clean out invalid rows
        const validData = data.filter((d) => !isNaN(d.total));

        validData.forEach((d) => {
            totalNetInflow += d.total;
            if (d.total > 0) positiveDays++;
            else if (d.total < 0) negativeDays++;
        });

        const latest14Days = validData.slice(-14).map((d) => ({
            ...d,
            // Format to millions for frontend charting
            totalM: d.total / 1_000_000,
        }));

        const latestDay = latest14Days[latest14Days.length - 1];
        const previousDay = latest14Days[latest14Days.length - 2];

        // Ensure we are returning data safely
        return NextResponse.json({
            metrics: {
                totalNetInflow: totalNetInflow,
                totalNetInflowM: totalNetInflow / 1_000_000,
                averageDailyFlowM: (totalNetInflow / validData.length) / 1_000_000,
                positiveDays,
                negativeDays,
                totalDays: validData.length,
            },
            latestDay: {
                date: latestDay.date,
                flow: latestDay.total,
                flowM: latestDay.totalM,
                isPositive: latestDay.total > 0,
            },
            previousDay: {
                date: previousDay.date,
                flow: previousDay.total,
                flowM: previousDay.totalM,
                isPositive: previousDay.total > 0,
            },
            history14d: latest14Days,
            // Provide recent 5 days for text agents
            recent5Days: validData.slice(-5).map(d => ({ date: d.date, totalM: d.total / 1_000_000 })),
        });
    } catch (error) {
        console.error("Error reading ETF data:", error);
        return NextResponse.json(
            { error: "Failed to load ETF flow data" },
            { status: 500 }
        );
    }
}
