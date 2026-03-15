import type { ModelMessage } from "ai";

type UiTextPart = { type: "text"; text: string };

type UiMessageLike = {
  role?: unknown;
  content?: unknown;
  parts?: unknown;
};

function textFromParts(parts: unknown): string {
  if (!Array.isArray(parts)) return "";

  return (parts as unknown[])
    .filter((part): part is UiTextPart => {
      return (
        typeof part === "object" &&
        part !== null &&
        "type" in part &&
        (part as { type?: unknown }).type === "text" &&
        "text" in part &&
        typeof (part as { text?: unknown }).text === "string"
      );
    })
    .map((p) => p.text)
    .join("");
}

/**
 * Frontend `useChat` sends UIMessage shape: `{ role, parts: [{ type: "text", text }, ...] }`
 * AI SDK `streamText` expects ModelMessage shape: `{ role, content: "..." }`
 */
export function uiMessagesToModelMessages(input: unknown): ModelMessage[] {
  if (!Array.isArray(input)) return [];

  return (input as UiMessageLike[]).map((msg) => {
    const role =
      msg.role === "user" || msg.role === "assistant" || msg.role === "system"
        ? msg.role
        : "user";
    const content =
      typeof msg.content === "string" ? msg.content : textFromParts(msg.parts);

    return { role, content };
  });
}
