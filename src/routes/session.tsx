import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "./-AppShell";
import { speak, stopSpeaking } from "@/lib/speech";
import { useProfile } from "@/hooks/useProfile";
import { requireAuth } from "@/lib/guards";
import { Play, Pause, Square, ChevronRight, Zap } from "lucide-react";

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

function Session() {
  const { profile } = useProfile();
  const isTertiary = profile?.user_type === "tertiary";

  const LESSON = isTertiary ? TERTIARY_LESSON : SECONDARY_LESSON;
  const QUESTIONS = isTertiary ? TERTIARY_QUESTIONS : SECONDARY_QUESTIONS;

  const [phase, setPhase] = useState<"lesson" | "quiz" | "done">("lesson");
  const [playing, setPlaying] = useState(false);
  const [qi, setQi] = useState(0);
  const [picks, setPicks] = useState<number[]>([]);
  const stopRef = useRef<() => void>(() => {});

  useEffect(() => () => stopSpeaking(), []);

  function togglePlay() {
    if (playing) { stopSpeaking(); setPlaying(false); return; }
    stopRef.current = speak(LESSON, { rate: 0.95 });
    setPlaying(true);
  }

  function pick(i: number) {
    const next = [...picks, i];
    setPicks(next);
    if (next.length >= QUESTIONS.length) setTimeout(() => setPhase("done"), 400);
    else setTimeout(() => setQi((x) => x + 1), 400);
  }

  const score = picks.reduce((s, p, i) => s + (p === QUESTIONS[i]?.a ? 1 : 0), 0);
  const pct = Math.round((score / QUESTIONS.length) * 100);

  const topicLabel = isTertiary ? "Organisational Behaviour" : "Cellular Respiration";
  const subjectLabel = isTertiary
    ? `${profile?.course ?? "Course"} · ${profile?.level ?? ""}`
    : `${(profile?.exam_types ?? ["JAMB"])[0]} Prep · ${(profile?.subjects ?? ["Biology"])[0]}`;

  return (
    <AppShell>
      <div className="h-full overflow-y-auto bg-background">
        <div className="mx-auto max-w-2xl px-5 py-8 space-y-6">

          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="rounded-full bg-coral/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-coral">
                  {subjectLabel}
                </span>
                <span className="rounded-full bg-sage px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-secondary-foreground">
                  Lesson 1 of 5
                </span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight">{topicLabel}</h1>
            </div>
            <Link to="/dashboard"
              className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground hover:shadow-sm transition">
              Exit
            </Link>
          </div>

          {/* JAMB banner */}
          {!isTertiary && phase === "lesson" && (
            <div className="rounded-2xl bg-coral/10 border border-coral/20 px-4 py-3 flex items-center gap-2">
              <Zap className="h-4 w-4 text-coral shrink-0" />
              <p className="text-sm font-semibold text-coral">
                High exam probability — commonly appears in JAMB and WAEC Biology
              </p>
            </div>
          )}

          <AnimatePresence mode="wait">

            {/* ── Lesson phase ── */}
            {phase === "lesson" && (
              <motion.div key="lesson"
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>

                {/* Lesson card */}
                <div className="rounded-2xl bg-white border p-6 shadow-sm">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                    Lesson content
                  </div>
                  <p className="text-base leading-relaxed text-foreground">{LESSON}</p>
                </div>

                {/* Voice controls */}
                <div className="mt-4 rounded-2xl bg-sage-light border p-5 flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <button onClick={togglePlay}
                      className="h-12 w-12 rounded-xl bg-gradient-to-b from-coral to-primary flex items-center justify-center text-white shadow-lg shadow-coral/30 hover:opacity-90 transition">
                      {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                    </button>
                    <button onClick={() => { stopSpeaking(); setPlaying(false); }}
                      className="h-12 w-12 rounded-xl border bg-white flex items-center justify-center text-muted-foreground hover:text-foreground hover:shadow-sm transition">
                      <Square className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold">
                      {playing ? "AI is reading your lesson…" : "Listen to your lesson"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {playing ? "Tap pause to stop" : "Hands-free learning — perfect for commutes"}
                    </p>
                  </div>
                  {playing && (
                    <div className="flex gap-0.5 items-end h-6">
                      {[3,5,8,5,3,6,4].map((h, i) => (
                        <motion.div key={i}
                          animate={{ height: [h, h * 2.5, h] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                          className="w-1 rounded-full bg-coral"
                          style={{ height: h }} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Skip */}
                <div className="mt-3 flex justify-end">
                  <button onClick={() => { stopSpeaking(); setPhase("quiz"); }}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground font-medium transition">
                    Ready for the quiz <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Quiz phase ── */}
            {phase === "quiz" && (
              <motion.div key={`quiz-${qi}`}
                initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs font-semibold text-muted-foreground mb-2">
                    <span>{isTertiary ? "Comprehension check" : "JAMB-style question"}</span>
                    <span>{qi + 1} / {QUESTIONS.length}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-sage">
                    <div
                      className="h-1.5 rounded-full bg-coral transition-all duration-500"
                      style={{ width: `${((qi + 1) / QUESTIONS.length) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="rounded-2xl bg-white border p-6 shadow-sm">
                  <h2 className="text-xl font-extrabold leading-snug">{QUESTIONS[qi].q}</h2>
                  {!isTertiary && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Select the most correct answer — just like in the exam hall
                    </p>
                  )}
                  <div className="mt-5 grid gap-3">
                    {QUESTIONS[qi].opts.map((o, i) => {
                      const picked = picks[qi] === i;
                      const isCorrect = i === QUESTIONS[qi].a;
                      const showResult = picks[qi] !== undefined;
                      return (
                        <motion.button key={i} whileTap={{ scale: 0.98 }} onClick={() => pick(i)}
                          className={`w-full rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition flex items-center gap-3 ${
                            showResult && isCorrect
                              ? "border-leaf bg-leaf/10 text-leaf"
                              : showResult && picked && !isCorrect
                              ? "border-coral bg-coral/10 text-coral"
                              : picked
                              ? "border-coral bg-coral/5"
                              : "border-border bg-background hover:border-coral hover:bg-sage-light"
                          }`}>
                          <span className={`h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                            showResult && isCorrect ? "bg-leaf/20 text-leaf"
                            : showResult && picked && !isCorrect ? "bg-coral/20 text-coral"
                            : "bg-sage text-muted-foreground"
                          }`}>
                            {String.fromCharCode(65 + i)}
                          </span>
                          {o}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Done phase ── */}
            {phase === "done" && (
              <motion.div key="done"
                initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>

                <div className="rounded-2xl bg-white border p-8 shadow-sm text-center">
                  {/* Score ring */}
                  <div className="flex justify-center mb-4">
                    <svg width="120" height="120" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor"
                        className="text-sage" strokeWidth="10" />
                      <circle cx="60" cy="60" r="50" fill="none"
                        stroke={pct >= 70 ? "oklch(0.65 0.16 145)" : "oklch(0.72 0.17 30)"}
                        strokeWidth="10" strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 50}`}
                        strokeDashoffset={`${2 * Math.PI * 50 * (1 - pct / 100)}`}
                        style={{ transform: "rotate(-90deg)", transformOrigin: "center", transition: "stroke-dashoffset 1s ease" }} />
                      <text x="60" y="55" textAnchor="middle" fontSize="24" fontWeight="800"
                        fill={pct >= 70 ? "oklch(0.65 0.16 145)" : "oklch(0.72 0.17 30)"}>
                        {pct}%
                      </text>
                      <text x="60" y="72" textAnchor="middle" fontSize="11"
                        fill="oklch(0.55 0.02 250)">score</text>
                    </svg>
                  </div>

                  <h2 className="text-2xl font-extrabold">
                    {pct >= 70 ? "Great work! 🎯" : "Keep going! 📚"}
                  </h2>
                  <p className="mt-2 text-muted-foreground">
                    You got <span className="font-bold text-foreground">{score} of {QUESTIONS.length}</span> correct
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {!isTertiary
                      ? pct >= 70
                        ? "This topic appeared in 2022 JAMB. You're on track."
                        : "Review this topic — it's a frequent JAMB question."
                      : pct >= 70
                        ? "Solid understanding. Move to the next concept."
                        : "Review the material once more before moving on."}
                  </p>

                  <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-xl bg-sage-light p-3">
                      <p className="text-2xl font-extrabold text-coral">{score}</p>
                      <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">Correct</p>
                    </div>
                    <div className="rounded-xl bg-sage-light p-3">
                      <p className="text-2xl font-extrabold">{QUESTIONS.length - score}</p>
                      <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">To review</p>
                    </div>
                    <div className="rounded-xl bg-sage-light p-3">
                      <p className="text-2xl font-extrabold text-leaf">+1</p>
                      <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">Session logged</p>
                    </div>
                  </div>

                  <div className="mt-6 flex gap-3 justify-center">
                    <Link to="/dashboard"
                      className="rounded-xl border bg-white px-5 py-3 text-sm font-semibold hover:shadow-sm transition">
                      Dashboard
                    </Link>
                    <button onClick={() => { setPicks([]); setQi(0); setPhase("lesson"); }}
                      className="rounded-xl bg-gradient-to-b from-coral to-primary px-5 py-3 text-sm font-bold text-white shadow-lg shadow-coral/30 hover:opacity-95 transition">
                      Next Lesson →
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </AppShell>
  );
}
