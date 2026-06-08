import { createServerFn } from "@tanstack/react-start";
import { getServerConfig } from "./config.server";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const VISION_MODEL = "openai/gpt-4o";

type TextPart = { type: "text"; text: string };
type ImagePart = { type: "image_url"; image_url: { url: string } };
type MessageContent = string | (TextPart | ImagePart)[];

// ── VISION (image input via OpenRouter + GPT-4o) ─────────────────────────────
// Server function — key never reaches the browser
export const openRouterVision = createServerFn()
  .inputValidator(
    (data: {
      messages: { role: "user" | "assistant" | "system"; content: MessageContent }[];
      systemPrompt?: string;
    }) => data
  )
  .handler(async ({ data }) => {
    const { openRouterApiKey } = getServerConfig();
    if (!openRouterApiKey) {
      return { text: "No OpenRouter API key configured. Please set OPENROUTER_API_KEY in your environment." };
    }

    const messages = data.systemPrompt
      ? [{ role: "system" as const, content: data.systemPrompt }, ...data.messages]
      : data.messages;

    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        authorization: `Bearer ${openRouterApiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: VISION_MODEL,
        messages,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message ?? `OpenRouter error ${res.status}`);
    }

    const result = await res.json();
    return { text: result.choices?.[0]?.message?.content ?? "No response received." };
  });
