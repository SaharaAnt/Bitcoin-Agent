import { streamText, stepCountIs } from "ai";
import { z } from "zod/v4";
import { SYSTEM_PROMPT } from "@/lib/agent/system-prompt";
import { agentTools } from "@/lib/agent/tools";
import { deepseekChatModel } from "@/lib/ai/deepseek";
import { uiMessagesToModelMessages } from "@/lib/ai/ui-messages";
import { parseJsonBody, requireUser, withApiHandler } from "@/lib/http/api";

const chatBodySchema = z.object({
    messages: z.array(z.unknown()),
});

export const POST = withApiHandler("chat", async (req) => {
    const user = await requireUser();
    const body = await parseJsonBody(req, chatBodySchema);

    console.log(
        "[chat] Request from user:",
        user.email ?? user.id ?? "(unknown)",
        "messages:",
        body.messages.length
    );

    const result = streamText({
        model: deepseekChatModel("deepseek-chat"),
        system: SYSTEM_PROMPT,
        messages: uiMessagesToModelMessages(body.messages),
        tools: agentTools,
        stopWhen: stepCountIs(5),
    });

    return result.toUIMessageStreamResponse();
});
