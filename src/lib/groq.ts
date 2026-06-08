import { createServerFn } from "@tanstack/react-start";
import { getServerConfig } from "./config.server";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

// ── STRUCTURED (JSON) ────────────────────────────────────────────────────────
// Server function — key never reaches the browser
export const groqStructured = createServerFn()
  .inputValidator((data: { prompt: string; schemaHint?: string }) => data)
  .handler(async ({ data }) => {
    const { groqApiKey } = getServerConfig();
    if (!groqApiKey) {
      return { ok: true, demo: true, prompt: data.prompt };
    }
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `Respond ONLY with valid JSON. ${data.schemaHint ?? ""}`,
          },
          { role: "user", content: data.prompt },
        ],
      }),
    });
    const result = await res.json();
    try {
      return JSON.parse(result.choices?.[0]?.message?.content ?? "{}");
    } catch {
      return {};
    }
  });

// ── CHAT (plain text) ────────────────────────────────────────────────────────
export const groqChat = createServerFn()
  .inputValidator(
    (data: {
      messages: { role: "system" | "user" | "assistant"; content: string }[];
    }) => data
  )
  .handler(async ({ data }) => {
    const { groqApiKey } = getServerConfig();
    if (!groqApiKey) {
      return { text: "No API key configured. Please set GROQ_API_KEY in your environment." };
    }
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: data.messages,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message ?? `Groq error ${res.status}`);
    }
    const result = await res.json();
    return { text: result.choices?.[0]?.message?.content ?? "No response received." };
  });
