import { streamText, stepCountIs } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { SYSTEM_PROMPT } from "@/lib/agent/system-prompt";
import { agentTools } from "@/lib/agent/tools";
import { auth } from "@/lib/auth";

const deepseek = createOpenAI({
    baseURL: "https://api.deepseek.com",
    apiKey: process.env.DEEPSEEK_API_KEY,
});

// Convert UIMessage (parts format) to ModelMessage (content format)
function convertMessages(uiMessages: any[]) {
    return uiMessages.map((msg: any) => {
        // If already has content string, pass through
        if (typeof msg.content === "string") {
            return { role: msg.role, content: msg.content };
        }
        // Extract text from parts array
        const text = (msg.parts || [])
            .filter((p: any) => p.type === "text")
            .map((p: any) => p.text)
            .join("");
        return { role: msg.role, content: text };
    });
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            console.error("[chat] Unauthorized - no session user");
            return new Response("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { messages: uiMessages } = body;

        console.log("[chat] Request from user:", session.user.email, "messages:", uiMessages.length);

        const result = streamText({
            model: deepseek.chat("deepseek-chat"),
            system: SYSTEM_PROMPT,
            messages: convertMessages(uiMessages),
            tools: agentTools,
            stopWhen: stepCountIs(5),
        });

        return result.toUIMessageStreamResponse();
    } catch (error) {
        console.error("[chat] Error:", error);
        return new Response(
            JSON.stringify({ error: "Internal server error", details: String(error) }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
