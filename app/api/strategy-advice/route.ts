import { auth } from "@/lib/auth";
import { analyzeMarketConditions } from "@/lib/engine/strategy-advisor";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) {
            return new Response("Unauthorized", { status: 401 });
        }

        const analysis = await analyzeMarketConditions();

        return Response.json(analysis);
    } catch (error) {
        console.error("[strategy-advice] Error:", error);
        return new Response(
            JSON.stringify({
                error: "Failed to analyze market",
                details: String(error),
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
