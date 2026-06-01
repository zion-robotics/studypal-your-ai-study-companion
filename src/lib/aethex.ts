// AethexAI utility. Configure VITE_AETHEX_KEY in your env for real calls.
const BASE = "https://aethex.dev/api";

export async function aethex<T = unknown>(path: string, body?: unknown): Promise<T> {
  const key = (import.meta as any).env?.VITE_AETHEX_KEY ?? "YOUR_AETHEX_KEY";
  const res = await fetch(`${BASE}${path}`, {
    method: body ? "POST" : "GET",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  return (await res.json()) as T;
}
