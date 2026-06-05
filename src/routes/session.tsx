import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/sp/AppShell";
import { speak, stopSpeaking } from "@/lib/speech";
import { useProfile } from "@/hooks/useProfile";

export const Route = createFileRoute("/session")({
  head: () => ({ meta: [{ title: "Session — StudyPal" }] }),
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

  const sessionLabel = isTertiary
    ? `${profile?.course ?? "Course"} · ${profile?.level ?? ""}`
    : `${(profile?.exam_types ?? ["JAMB"])[0]} Prep · ${(profile?.subjects ?? ["Biology"])[0]}`;

  const topicLabel = isTertiary ? "Organisational Behaviour" : "Cellular Respiration";

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6 p-5 md:p-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              {sessionLabel} · Lesson 1 of 5
            </div>
            <h1 className="mt-1 font-display text-3xl md:text-4xl">{topicLabel}</h1>
          </div>
          <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">Exit</Link>
        </div>

        {/* Exam probability banner for secondary */}
        {!isTertiary && phase === "lesson" && (
          <div className="rounded-2xl bg-accent/10 border border-accent/20 px-4 py-2.5 text-sm text-accent font-medium">
            ⚡ High exam probability topic — commonly appears in JAMB and WAEC Biology
          </div>
        )}

        <AnimatePresence mode="wait">
          {phase === "lesson" && (
            <motion.div key="lesson" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
              className="rounded-3xl border border-border bg-card p-8">
              <p className="text-lg leading-relaxed">{LESSON}</p>
              <div className="mt-8 flex items-center gap-3">
                <button onClick={togglePlay}
                  className="btn-press inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-medium text-accent-foreground">
                  {playing ? (
                    <><svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><rect x="6" y="5" width="4" height="14" /><rect x="14" y="5" width="4" height="14" /></svg> Pause</>
                  ) : (
                    <><svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M8 5v14l11-7z" /></svg> Play lesson</>
                  )}
                </button>
                <button onClick={() => { stopSpeaking(); setPlaying(false); }}
                  className="rounded-full border border-border px-4 py-3 text-sm">Stop</button>
                <button onClick={() => { stopSpeaking(); setPhase("quiz"); }}
                  className="ml-auto rounded-full px-4 py-3 text-sm text-muted-foreground hover:text-foreground">
                  Skip to quiz →
                </button>
              </div>
            </motion.div>
          )}

          {phase === "quiz" && (
            <motion.div key={qi} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              className="rounded-3xl border border-border bg-card p-8">
              <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                {isTertiary ? `Question ${qi + 1} / ${QUESTIONS.length}` : `JAMB-style Question ${qi + 1} / ${QUESTIONS.length}`}
              </div>
              <h2 className="mt-2 font-display text-2xl">{QUESTIONS[qi].q}</h2>
              {!isTertiary && (
                <p className="mt-1 text-xs text-muted-foreground">Select the most correct answer — just like in the exam hall</p>
              )}
              <div className="mt-6 grid gap-3">
                {QUESTIONS[qi].opts.map((o, i) => {
                  const picked = picks[qi] === i;
                  const isCorrect = i === QUESTIONS[qi].a;
                  const showResult = picks[qi] !== undefined;
                  return (
                    <motion.button key={i} whileTap={{ scale: 0.97 }} onClick={() => pick(i)}
                      className={`rounded-xl border px-4 py-4 text-left text-sm transition ${
                        showResult && isCorrect ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                        : showResult && picked && !isCorrect ? "border-red-500 bg-red-500/10 text-red-700 dark:text-red-400"
                        : picked ? "border-accent bg-accent text-accent-foreground"
                        : "border-border bg-background hover:border-accent"
                      }`}>
                      <span className="font-mono mr-3 text-xs opacity-70">{String.fromCharCode(65 + i)}</span>
                      {o}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {phase === "done" && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
              className="rounded-3xl border border-border bg-card p-10 text-center">
              <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Result</div>
              <div className={`mt-3 font-display text-6xl ${pct >= 70 ? "text-accent" : "text-destructive"}`}>{pct}%</div>
              <p className="mt-3 text-muted-foreground">You got {score} of {QUESTIONS.length} right.</p>
              {!isTertiary && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {pct >= 70 ? "🎯 Good work — this topic appeared in 2022 JAMB. You're on track." : "📚 Review this topic again — it's a frequent JAMB question."}
                </p>
              )}
              {isTertiary && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {pct >= 70 ? "Solid understanding. Move to the next concept." : "Review the material once more before moving on."}
                </p>
              )}
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link to="/dashboard" className="btn-press rounded-full border border-border bg-background px-5 py-3 text-sm">
                  Back to Dashboard
                </Link>
                <button onClick={() => { setPicks([]); setQi(0); setPhase("lesson"); }}
                  className="btn-press rounded-full bg-accent px-5 py-3 text-sm font-medium text-accent-foreground">
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