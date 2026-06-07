import { createServerFn } from "@tanstack/react-start";
import { getServerConfig } from "./config.server";


// ─── Server-side helpers (API key never reaches browser) ───────────────────

export const getAethexVoices = createServerFn().handler(async () => {
  const { aethexApiKey, aethexBaseUrl } = getServerConfig();
  const res = await fetch(`${aethexBaseUrl}/voices?language=english`, {
    headers: { "X-API-Key": aethexApiKey!, "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`Failed to fetch voices: ${res.status}`);
  const voices = await res.json();
  return voices.filter((v: any) => !v.is_cloned) as { id: string; name: string }[];
});

export const createStudyAgent = createServerFn()
  .inputValidator((data: { subject: string; voiceId: string }) => data)
  .handler(async ({ data }) => {
    const { aethexApiKey, aethexBaseUrl } = getServerConfig();

    const systemPrompt = `You are StudyPal, an AI study companion for African university students.
You are currently helping the student study: ${data.subject}.

Your job:
- Read lesson content clearly and at a calm, steady pace
- Ask comprehension questions after each lesson
- Evaluate the student's answers and give encouraging, constructive feedback
- If the student is struggling, simplify your explanation
- Keep sessions short and focused — 10 to 15 minutes maximum
- Speak in clear, friendly English. You can occasionally use familiar phrases an African student would recognize
- Never make the student feel bad for not knowing something

When you finish a lesson, say: "Great session! Let's lock that in. Here's your question:"
Then ask one comprehension question and wait for the answer.`;

    const res = await fetch(`${aethexBaseUrl}/agents`, {
      method: "POST",
      headers: { "X-API-Key": aethexApiKey!, "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `StudyPal — ${data.subject}`,
        system_prompt: systemPrompt,
        first_message: `Hey! Ready to study ${data.subject}? Let's keep it short and sharp. I'll read your lesson, then ask you one question to make sure it sticks. Say "ready" when you want to begin.`,
        voice_id: data.voiceId,
        language: "english",
      }),
    });

    if (!res.ok) throw new Error(`Failed to create agent: ${res.status}`);
    const agent = await res.json();
    return { agentId: agent.id as string };
  });

export const startAethexSession = createServerFn()
  .inputValidator((data: { agentId: string }) => data)
  .handler(async ({ data }) => {
    const { aethexApiKey, aethexBaseUrl } = getServerConfig();
    const res = await fetch(`${aethexBaseUrl}/conversation/connect`, {
      method: "POST",
      headers: { "X-API-Key": aethexApiKey!, "Content-Type": "application/json" },
      body: JSON.stringify({ agent_id: data.agentId }),
    });
    if (!res.ok) throw new Error(`Failed to start session: ${res.status}`);
    const session = await res.json();
    return { sessionId: session.session_id as string, iceConfig: session.ice_config };
  });

export const sendSdpOffer = createServerFn()
  .inputValidator((data: { sessionId: string; sdp: string; type: string }) => data)
  .handler(async ({ data }) => {
    const { aethexApiKey, aethexBaseUrl } = getServerConfig();
    const res = await fetch(`${aethexBaseUrl}/conversation/${data.sessionId}/offer`, {
      method: "POST",
      headers: { "X-API-Key": aethexApiKey!, "Content-Type": "application/json" },
      body: JSON.stringify({ sdp: data.sdp, type: data.type }),
    });
    if (!res.ok) throw new Error(`SDP offer failed: ${res.status}`);
    const answer = await res.json();
    return { sdp: answer.sdp as string, type: answer.type as string };
  });
