import { auth } from "@/lib/auth";
import { calculateAhr999 } from "@/lib/engine/ahr999";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) {
            return new Response("Unauthorized", { status: 401 });
        }

        const data = await calculateAhr999();
        return Response.json(data);
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
