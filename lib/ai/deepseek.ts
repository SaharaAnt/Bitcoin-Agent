import { createOpenAI } from "@ai-sdk/openai";

const DEEPSEEK_BASE_URL = "https://api.deepseek.com";

let cachedClient: ReturnType<typeof createOpenAI> | null = null;

export function getDeepseekClient() {
  if (cachedClient) return cachedClient;

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error("Missing DEEPSEEK_API_KEY");
  }

  cachedClient = createOpenAI({
    baseURL: DEEPSEEK_BASE_URL,
    apiKey,
  });

  return cachedClient;
}

export function deepseekChatModel(modelName = "deepseek-chat") {
  return getDeepseekClient().chat(modelName);
}

