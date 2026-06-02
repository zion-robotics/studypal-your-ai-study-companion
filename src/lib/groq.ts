import { createServerFn } from "@tanstack/react-start";
import { getServerConfig } from "./config.server";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

// Server function — key never reaches the browser
export const groqStructured = createServerFn()
  .validator((data: { prompt: string; schemaHint?: string }) => data)
  .handler(async ({ data }) => {
    const { groqApiKey } = getServerConfig();

    if (!groqApiKey) {
      // Demo fallback when no key is set
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