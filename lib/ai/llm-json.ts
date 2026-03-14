import { z } from "zod/v4";

function extractFencedBlock(text: string): string | null {
  const jsonFence = text.match(/```json\s*([\s\S]*?)\s*```/i);
  if (jsonFence?.[1]) return jsonFence[1].trim();

  const anyFence = text.match(/```\s*([\s\S]*?)\s*```/);
  if (anyFence?.[1]) return anyFence[1].trim();

  return null;
}

export function parseJsonFromLLM<TSchema extends z.ZodTypeAny>(
  text: string,
  schema: TSchema
): z.infer<TSchema> | null {
  const candidate = extractFencedBlock(text) ?? text.trim();

  try {
    const parsed = JSON.parse(candidate);
    const validated = schema.safeParse(parsed);
    if (!validated.success) return null;
    return validated.data;
  } catch {
    return null;
  }
}

