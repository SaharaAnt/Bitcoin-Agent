import { auth } from "@/lib/auth";
import { getBtcCommunityData, getBtcCurrentPrice } from "@/lib/api/coingecko";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) {
            return new Response("Unauthorized", { status: 401 });
        }

        const [community, priceData] = await Promise.all([
            getBtcCommunityData(),
            getBtcCurrentPrice(),
        ]);

        const subscribers = community?.redditSubscribers ?? 0;
        const price = priceData.price;

        if (!subscribers || !price) {
            return new Response(JSON.stringify({ error: "Data unavailable" }), { status: 503 });
        }

        const ratio = subscribers / price;

        // Historical cycle benchmarks (from the user's article)
        // Ratio is INVERTED: lower ratio = higher valuation (more "expensive")
        const BENCHMARKS = {
            bull_2013_first_top:  122.7,   // 2013 first peak
            bull_2013_second_top: 64.8,    // 2013 second peak
            bull_2017_top:        30.7,    // 2017 peak
            bear_2015_bottom:     740.0,   // 2015 bear bottom
            bear_2018_bottom:     290.0,   // 2018 bear bottom
            // Projected next cycle
            projected_next_top:   15.0,    // estimated next bull top
            projected_next_bottom: 150.0,  // estimated next bear bottom
        };

        // Determine current zone
        let zone: "bubble_danger" | "fomo" | "neutral" | "dca" | "accumulation" | "deep_value";
        let zoneLabel: string;
        let zoneColor: string;

        if (ratio <= 15) {
            zone = "bubble_danger"; zoneLabel = "极度泡沫 🔴"; zoneColor = "#ff0033";
        } else if (ratio <= 40) {
            zone = "fomo"; zoneLabel = "FOMO 牛顶区"; zoneColor = "#ff6600";
        } else if (ratio <= 100) {
            zone = "neutral"; zoneLabel = "中性估值区"; zoneColor = "#eab308";
        } else if (ratio <= 200) {
            zone = "dca"; zoneLabel = "价值低估区"; zoneColor = "#22c55e";
        } else if (ratio <= 400) {
            zone = "accumulation"; zoneLabel = "熊底积累区"; zoneColor = "#00f3ff";
        } else {
            zone = "deep_value"; zoneLabel = "极度低估 💎"; zoneColor = "#a855f7";
        }

        // Price target at projected top ratio (15)
        const projectedTopPrice = subscribers / BENCHMARKS.projected_next_top;
        // Price target at projected bottom ratio (150)
        const projectedBottomPrice = subscribers / BENCHMARKS.projected_next_bottom;

        // PE-equivalent metrics
        // "PE" = 1 / ratio = price / subscribers
        const impliedPE = price / subscribers;
        // "EPS Growth" = current subs / previous cycle subs (rough proxy)
        const subsGrowthFactor = 8_100_000 / 6_600_000; // Since 2021 peak

        return Response.json({
            subscribers,
            price,
            ratio: parseFloat(ratio.toFixed(2)),
            zone,
            zoneLabel,
            zoneColor,
            projectedTopPrice: Math.round(projectedTopPrice),
            projectedBottomPrice: Math.round(projectedBottomPrice),
            impliedPE: parseFloat(impliedPE.toFixed(6)),
            benchmarks: BENCHMARKS,
            subsGrowthFactor: parseFloat(subsGrowthFactor.toFixed(2)),
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("[fans-price] Error:", error);
        return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
    }
}
