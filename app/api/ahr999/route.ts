import { auth } from "@/lib/auth";
import { calculateAhr999, calculateAhr999History } from "@/lib/engine/ahr999";

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return new Response("Unauthorized", { status: 401 });
        }

        const includeHistory = new URL(req.url).searchParams.get("history") === "1";

        if (!includeHistory) {
            const data = await calculateAhr999();
            return Response.json(data);
        }

        const history = await calculateAhr999History(365);
        const data = await calculateAhr999(history);
        return Response.json({ ...data, history });
    } catch (error) {
        console.error("[ahr999] Error:", error);
        return new Response(
            JSON.stringify({
                error: "Failed to calculate Ahr999",
                details: String(error),
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
