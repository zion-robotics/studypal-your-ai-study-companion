import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/sp/AppShell";
import { useProfile } from "@/hooks/useProfile";
import { requireAuth } from "@/lib/guards";
import { getAethexVoices, createStudyAgent, startAethexSession, sendSdpOffer } from "@/lib/aethex";

export const Route = createFileRoute("/session")({
  ssr: false,
  head: () => ({ meta: [{ title: "Session — StudyPal" }] }),
  beforeLoad: requireAuth,
  component: Session,
});

const TERTIARY_LESSON = `The concept of organizational behaviour examines how individuals and groups act within organizations. Key theories include Maslow's hierarchy of needs, which suggests people are motivated by five levels: physiological, safety, social, esteem, and self-actualization. Herzberg's two-factor theory distinguishes between hygiene factors that prevent dissatisfaction and motivators that drive satisfaction. Understanding these frameworks helps managers design environments where people perform at their best.`;

const SECONDARY_LESSON = `Cellular respiration is the process by which cells break down glucose to release energy stored as ATP. It happens in three main stages: glycolysis in the cytoplasm, the Krebs cycle in the mitochondrial matrix, and the electron transport chain on the inner mitochondrial membrane. Each glucose molecule yields roughly 36 to 38 ATP molecules under aerobic conditions. When oxygen is unavailable, cells switch to anaerobic respiration, producing lactic acid in animals and ethanol in yeast.`;

const TERTIARY_QUESTIONS = [
  { q: "According to Maslow, which need must be satisfied first?", opts: ["Esteem", "Safety", "Physiological", "Social"], a: 2 },
  { q: "Herzberg's hygiene factors are best described as:", opts: ["Motivators for performance", "Factors that prevent dissatisfaction", "Leadership styles", "Pay structures"], a: 1 },
  { q: "Which theorist focused on self-actualization?", opts: ["Herzberg", "Taylor", "Maslow", "Weber"], a: 2 },
];

const SECONDARY_QUESTIONS = [
  { q: "Where does glycolysis take place?", opts: ["Mitochondrial matrix", "Cytoplasm", "Inner membrane", "Nucleus"], a: 1 },
  { q: "How many ATP does one glucose molecule yield aerobically?", opts: ["2", "12", "~36–38", "100"], a: 2 },
  { q: "What does yeast produce during anaerobic respiration?", opts: ["Lactic acid", "Glucose", "Oxygen", "Ethanol"], a: 3 },
];

type VoiceState = "idle" | "loading" | "connecting" | "connected" | "error";

function Session() {
  const { profile } = useProfile();
  const isTertiary = profile?.user_type === "tertiary";

  const LESSON = isTertiary ? TERTIARY_LESSON : SECONDARY_LESSON;
  const QUESTIONS = isTertiary ? TERTIARY_QUESTIONS : SECONDARY_QUESTIONS;

  const [phase, setPhase] = useState<"lesson" | "quiz" | "done">("lesson");
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [qi, setQi] = useState(0);
  const [picks, setPicks] = useState<number[]>([]);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const agentIdRef = useRef<string | null>(null);

  const subject = isTertiary
    ? profile?.course ?? "Organisational Behaviour"
    : (profile?.subjects?.[0] ?? "Biology");

  // Cleanup on unmount
  useEffect(() => {
    return () => endVoiceSession();
  }, []);

  async function startVoiceSession() {
    try {
      setVoiceState("loading");
      setVoiceError(null);

      // 1. Get a voice
      const voices = await getAethexVoices();
      if (!voices.length) throw new Error("No voices available");
      const voiceId = voices[0].id;

      // 2. Create agent for this subject (reuse if already created)
      if (!agentIdRef.current) {
        const { agentId } = await createStudyAgent({ subject, voiceId });
        agentIdRef.current = agentId;
      }

      // 3. Start WebRTC session
      setVoiceState("connecting");
      const { sessionId, iceConfig } = await startAethexSession({
        agentId: agentIdRef.current,
      });

      // 4. Set up RTCPeerConnection
      const pc = new RTCPeerConnection(iceConfig);
      pcRef.current = pc;

      // Play agent audio
      pc.ontrack = (ev) => {
        if (audioRef.current) {
          audioRef.current.srcObject = ev.streams[0];
        }
      };

      pc.onconnectionstatechange = () => {
        if (!pcRef.current) return;
        if (pc.connectionState === "connected") setVoiceState("connected");
        if (["failed", "closed", "disconnected"].includes(pc.connectionState)) {
          setVoiceState("idle");
        }
      };

      // 5. Add mic track
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = micStream;
      micStream.getTracks().forEach((t) => pc.addTrack(t, micStream));

      // 6. Create & send SDP offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Wait for ICE gathering
      if (pc.iceGatheringState !== "complete") {
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error("ICE timed out")), 10000);
          pc.onicegatheringstatechange = () => {
            if (pc.iceGatheringState === "complete") {
              clearTimeout(timeout);
              resolve();
            }
          };
        });
      }

      const { sdp, type } = pc.localDescription!;
      const answer = await sendSdpOffer({ sessionId, sdp, type });
      await pc.setRemoteDescription({ sdp: answer.sdp, type: answer.type as RTCSdpType });

      setVoiceState("connected");
    } catch (err: any) {
      setVoiceError(err.message ?? "Something went wrong");
      setVoiceState("error");
      endVoiceSession();
    }
  }

  function endVoiceSession() {
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;
    pcRef.current?.close();
    pcRef.current = null;
    if (audioRef.current) audioRef.current.srcObject = null;
    setVoiceState("idle");
  }

  function pick(i: number) {
    const next = [...picks, i];
    setPicks(next);
    if (next.length >= QUESTIONS.length) setTimeout(() => setPhase("done"), 400);
    else setTimeout(() => setQi((x) => x + 1), 400);
  }

  const score = picks.reduce((s, p, i) => s + (p === QUESTIONS[i]?.a ? 1 : 0), 0);
  const pct = Math.round((score / QUESTIONS.length) * 100);

  const sessionLabel = isTertiary
    ? `${profile?.course ?? "Course"} · ${profile?.level ?? ""}`
    : `${(profile?.exam_types ?? ["JAMB"])[0]} Prep · ${(profile?.subjects ?? ["Biology"])[0]}`;

  const topicLabel = isTertiary ? "Organisational Behaviour" : "Cellular Respiration";

  const voiceBtnLabel = {
    idle: "🎙️ Listen with AI Voice",
    loading: "Setting up voice...",
    connecting: "Connecting...",
    connected: "🔴 End voice session",
    error: "Retry voice",
  }[voiceState];

  return (
    <AppShell>
      {/* Hidden audio element — AethexAI agent speaks through this */}
      <audio ref={audioRef} autoPlay playsInline className="hidden" />

      <div className="mx-auto max-w-3xl space-y-6 p-5 md:p-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              {sessionLabel} · Lesson 1 of 5
            </div>
            <h1 className="mt-1 font-display text-3xl md:text-4xl">{topicLabel}</h1>
          </div>
          <Link
            to="/dashboard"
            onClick={endVoiceSession}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Exit
          </Link>
        </div>

        {!isTertiary && phase === "lesson" && (
          <div className="rounded-2xl bg-accent/10 border border-accent/20 px-4 py-2.5 text-sm text-accent font-medium">
            ⚡ High exam probability topic — commonly appears in JAMB and WAEC Biology
          </div>
        )}

        {/* Voice error banner */}
        {voiceError && (
          <div className="rounded-2xl bg-destructive/10 border border-destructive/20 px-4 py-2.5 text-sm text-destructive">
            Voice error: {voiceError}
          </div>
        )}

        <AnimatePresence mode="wait">
          {phase === "lesson" && (
            <motion.div
              key="lesson"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="rounded-3xl border border-border bg-card p-8"
            >
              <p className="text-lg leading-relaxed">{LESSON}</p>
              <div className="mt-8 flex flex-wrap items-center gap-3">

                {/* AethexAI Voice button */}
                <button
                  onClick={voiceState === "connected" ? endVoiceSession : startVoiceSession}
                  disabled={voiceState === "loading" || voiceState === "connecting"}
                  className={`btn-press inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition
                    ${voiceState === "connected"
                      ? "bg-destructive text-destructive-foreground"
                      : "bg-accent text-accent-foreground"}
                    disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {(voiceState === "loading" || voiceState === "connecting") && (
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                    </svg>
                  )}
                  {voiceBtnLabel}
                </button>

                {voiceState === "connected" && (
                  <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    AI voice active — speak naturally
                  </span>
                )}

                <button
                  onClick={() => { endVoiceSession(); setPhase("quiz"); }}
                  className="ml-auto rounded-full px-4 py-3 text-sm text-muted-foreground hover:text-foreground"
                >
                  Skip to quiz →
                </button>
              </div>
            </motion.div>
          )}

          {phase === "quiz" && (
            <motion.div
              key={qi}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="rounded-3xl border border-border bg-card p-8"
            >
              <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                {isTertiary
                  ? `Question ${qi + 1} / ${QUESTIONS.length}`
                  : `JAMB-style Question ${qi + 1} / ${QUESTIONS.length}`}
              </div>
              <h2 className="mt-2 font-display text-2xl">{QUESTIONS[qi].q}</h2>
              {!isTertiary && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Select the most correct answer — just like in the exam hall
                </p>
              )}
              <div className="mt-6 grid gap-3">
                {QUESTIONS[qi].opts.map((o, i) => {
                  const picked = picks[qi] === i;
                  const isCorrect = i === QUESTIONS[qi].a;
                  const showResult = picks[qi] !== undefined;
                  return (
                    <motion.button
                      key={i}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => pick(i)}
                      className={`rounded-xl border px-4 py-4 text-left text-sm transition ${
                        showResult && isCorrect
                          ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                          : showResult && picked && !isCorrect
                          ? "border-red-500 bg-red-500/10 text-red-700 dark:text-red-400"
                          : picked
                          ? "border-accent bg-accent text-accent-foreground"
                          : "border-border bg-background hover:border-accent"
                      }`}
                    >
                      <span className="font-mono mr-3 text-xs opacity-70">
                        {String.fromCharCode(65 + i)}
                      </span>
                      {o}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {phase === "done" && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-3xl border border-border bg-card p-10 text-center"
            >
              <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Result
              </div>
              <div className={`mt-3 font-display text-6xl ${pct >= 70 ? "text-accent" : "text-destructive"}`}>
                {pct}%
              </div>
              <p className="mt-3 text-muted-foreground">
                You got {score} of {QUESTIONS.length} right.
              </p>
              {!isTertiary && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {pct >= 70
                    ? "🎯 Good work — this topic appeared in 2022 JAMB. You're on track."
                    : "📚 Review this topic again — it's a frequent JAMB question."}
                </p>
              )}
              {isTertiary && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {pct >= 70
                    ? "Solid understanding. Move to the next concept."
                    : "Review the material once more before moving on."}
                </p>
              )}
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link
                  to="/dashboard"
                  className="btn-press rounded-full border border-border bg-background px-5 py-3 text-sm"
                >
                  Back to Dashboard
                </Link>
                <button
                  onClick={() => { setPicks([]); setQi(0); setPhase("lesson"); }}
                  className="btn-press rounded-full bg-accent px-5 py-3 text-sm font-medium text-accent-foreground"
                >
                  Next Lesson
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  );
}
