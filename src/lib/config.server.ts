import process from "node:process";
export function getServerConfig() {
  return {
    nodeEnv: process.env.NODE_ENV,
    groqApiKey: process.env.GROQ_API_KEY,
    aethexApiKey: process.env.AETHEX_API_KEY,
    aethexBaseUrl: process.env.AETHEX_BASE_URL ?? "https://api.aethexai.com/api/v1",
    openRouterApiKey: process.env.OPENROUTER_API_KEY,
  };
}
