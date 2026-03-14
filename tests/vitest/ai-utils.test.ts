import { describe, expect, it } from "vitest";
import { uiMessagesToModelMessages } from "@/lib/ai/ui-messages";
import { parseJsonFromLLM } from "@/lib/ai/llm-json";
import { z } from "zod/v4";

describe("uiMessagesToModelMessages", () => {
  it("converts parts text into content", () => {
    const model = uiMessagesToModelMessages([
      { role: "user", parts: [{ type: "text", text: "hi" }] },
    ]);
    expect(model).toEqual([{ role: "user", content: "hi" }]);
  });

  it("passes through string content", () => {
    const model = uiMessagesToModelMessages([{ role: "assistant", content: "ok" }]);
    expect(model).toEqual([{ role: "assistant", content: "ok" }]);
  });

  it("ignores non-text parts", () => {
    const model = uiMessagesToModelMessages([
      {
        role: "user",
        parts: [
          { type: "tool-invocation", toolName: "x" },
          { type: "text", text: "a" },
          { type: "text", text: "b" },
        ],
      },
    ]);
    expect(model).toEqual([{ role: "user", content: "ab" }]);
  });

  it("returns empty array for non-array input", () => {
    expect(uiMessagesToModelMessages(null)).toEqual([]);
  });
});

describe("parseJsonFromLLM", () => {
  const schema = z.object({ score: z.number(), feedback: z.string() });

  it("parses fenced json", () => {
    const parsed = parseJsonFromLLM(
      "```json\n{\"score\": 85, \"feedback\": \"ok\"}\n```",
      schema
    );
    expect(parsed).toEqual({ score: 85, feedback: "ok" });
  });

  it("parses plain json", () => {
    const parsed = parseJsonFromLLM(
      "{\"score\": 50, \"feedback\": \"x\"}",
      schema
    );
    expect(parsed).toEqual({ score: 50, feedback: "x" });
  });

  it("returns null on schema mismatch", () => {
    const parsed = parseJsonFromLLM("{\"score\": \"nope\"}", schema);
    expect(parsed).toBeNull();
  });
});
