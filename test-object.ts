import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const deepseek = createOpenAI({
    baseURL: "https://api.deepseek.com",
    apiKey: process.env.DEEPSEEK_API_KEY,
});

async function run() {
    try {
        const { object } = await generateObject({
            model: deepseek.chat("deepseek-chat"),
            system: "You are a helpful assistant.",
            prompt: "Give me a random number and a feedback message. Format as JSON: {\"score\": number, \"feedback\": string}",
            schema: z.object({
                score: z.number(),
                feedback: z.string()
            }),
        });
        console.log("JSON mode success:", object);
    } catch (e: any) {
        console.error("DEBUG:", e?.data?.error || e);
    }
}

run();
