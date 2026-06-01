// Groq API helper. Provide a key via VITE_GROQ_API_KEY for client-side prototyping
// or proxy through a server function for production.
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function groqStructured<T = unknown>(prompt: string, schemaHint?: string): Promise<T> {
  const key = (import.meta as any).env?.VITE_GROQ_API_KEY;
  if (!key) {
    // Graceful offline fallback so the UI keeps working in demo mode.
    return ({ ok: true, demo: true, prompt, schemaHint } as unknown) as T;
  }
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: `Respond ONLY with valid JSON. ${schemaHint ?? ""}` },
        { role: "user", content: prompt },
      ],
    }),
  });
  const data = await res.json();
  try { return JSON.parse(data.choices?.[0]?.message?.content ?? "{}") as T; }
  catch { return ({} as T); }
}
