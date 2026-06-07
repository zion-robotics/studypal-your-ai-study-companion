import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/sp/AppShell";
import { groqStructured } from "@/lib/groq";
import { supabase } from "@/lib/supabase";
import { useProfile } from "@/hooks/useProfile";
import { requireAuth } from "@/lib/guards";
import { Play, Pause, ChevronRight, Zap, Loader2 } from "lucide-react";

export const Route = createFileRoute("/session")({
  ssr: false,
  head: () => ({ meta: [{ title: "Session — StudyPal" }] }),
  beforeLoad: requireAuth,
  component: Session,
});

type Question = { q: string; opts: string[]; a: number };
type Phase = "loading" | "lesson" | "quiz" | "done";

const FALLBACK_QUESTIONS: Question[] = [
  { q: "What is the main topic of this lesson?", opts: ["Concept A", "Concept B", "Concept C", "Concept D"], a: 0 },
  { q: "Which best describes a key idea from the material?", opts: ["Option A", "Option B", "Option C", "Option D"], a: 1 },
  { q: "What should you focus on when reviewing this topic?", opts: ["Detail A", "Detail B", "Detail C", "Detail D"], a: 2 },
];

function Session() {
  const { profile } = useProfile();
  const isTertiary = profile?.user_type === "tertiary";
  const generateQuestions = useServerFn(groqStructured);

  const [phase, setPhase] = useState<Phase>("loading");
  const [lesson, setLesson] = useState<{ subject: string; notes: string; topics: string[] } | null>(null);
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentTopic, setCurrentTopic] = useState("");
  const [playing, setPlaying] = useState(false);
  const [qi, setQi] = useState(0);
  const [picks, setPicks] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLesson();
    return () => window.speechSynthesis?.cancel();
  }, []);

  async function loadLesson() {
    setError(null);
    setPhase("loading");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Not logged in");
        setPhase("lesson");
        return;
      }

      const { data, error: err } = await supabase
        .from("lessons")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (err || !data) {
        setError("No lessons found. Upload your notes first.");
        setPhase("lesson");
        return;
      }

      setLesson({ subject: data.subject, notes: data.notes, topics: data.topics });
      setLessonId(data.id);
      setCurrentTopic(data.topics?.[0] ?? data.subject);
      await generateQuestionsFromLesson(data.subject, data.notes, data.topics?.[0]);
    } catch (e) {
      setError("Something went wrong loading your lesson.");
      setPhase("lesson");
    }
  }

  async function generateQuestionsFromLesson(subject: string, notes: string, topic: string) {
    try {
      const result = await generateQuestions({
        data: {
          prompt: `Based on these study notes, generate exactly 3 multiple choice questions about "${topic}".
Notes: ${notes?.slice(0, 3000)}
Return JSON: { "questions": [{ "q": "question text", "opts": ["A", "B", "C", "D"], "a": 0 }] }
- "a" is the index of the correct answer (0-3)
- Make questions specific to the content, not generic
- ${isTertiary ? "University level difficulty" : "JAMB/WAEC exam style"}`,
          schemaHint: 'Return { questions: Array<{ q: string, opts: string[4], a: number }> }',
        },
      });

      const qs = (result as any)?.questions;
      if (Array.isArray(qs) && qs.length > 0) {
        setQuestions(qs);
      } else {
        setQuestions(FALLBACK_QUESTIONS);
      }
    } catch {
      setQuestions(FALLBACK_QUESTIONS);
    }
    setPhase("lesson");
  }

  function togglePlay() {
    if (playing) {
      window.speechSynthesis?.cancel();
      setPlaying(false);
      return;
    }
    if (!lesson) return;
    const text = `Topic: ${currentTopic}. ${lesson.notes?.slice(0, 1500)}`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.92;
    utterance.onend = () => setPlaying(false);
    window.speechSynthesis.speak(utterance);
    setPlaying(true);
  }

  async function pick(i: number) {
    const next = [...picks, i];
    setPicks(next);
    if (next.length >= questions.length) {
      setTimeout(async () => {
        setPhase("done");
        const { data: { user } } = await supabase.auth.getUser();
        if (user && lessonId) {
          const score = next.reduce((s, p, idx) => s + (p === questions[idx]?.a ? 1 : 0), 0);
          await supabase.from("sessions").insert({
            user_id: user.id,
            lesson_id: lessonId,
            subject: lesson?.subject,
            topic: currentTopic,
            score,
            total: questions.length,
            completed: true,
          });
        }
      }, 400);
    } else {
      setTimeout(() => setQi((x) => x + 1), 400);
    }
  }

  const score = picks.reduce((s, p, i) => s + (p === questions[i]?.a ? 1 : 0), 0);
  const pct = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;

  // ── Loading state ──
  if (phase === "loading") {
    return (
      <AppShell>
        <div className="flex h-full items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-accent mx-auto" />
            <p className="font-display text-lg">Loading your lesson...</p>
            <p className="text-sm text-muted-foreground">Groq is generating your questions</p>
          </div>
        </div>
      </AppShell>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <AppShell>
        <div className="flex h-full items-center justify-center p-8">
          <div className="text-center space-y-4 max-w-sm">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-accent/10 flex items-center justify-center">
              <Zap className="h-8 w-8 text-accent" />
            </div>
            <p className="font-display text-xl font-extrabold">No lesson loaded</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Link
              to="/upload"
              className="inline-block rounded-xl bg-accent px-6 py-3 text-sm font-medium text-accent-foreground"
            >
              Upload Your Notes →
            </Link>
            <div className="pt-2">
              <Link to="/dashboard" className="text-xs text-muted-foreground hover:text-foreground transition">
                ← Back to dashboard
              </Link>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="h-full overflow-y-auto bg-background">
        <div className="mx-auto max-w-2xl px-5 py-8 space-y-6">

          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="rounded-full bg-accent/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-accent">
                  {lesson?.subject}
                </span>
                <span className="rounded-full bg-muted px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Lesson 1 of {lesson?.topics?.length ?? 5}
                </span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight">{currentTopic}</h1>
            </div>
            <Link
              to="/dashboard"
              onClick={() => window.speechSynthesis?.cancel()}
              className="rounded-xl border bg-card px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition"
            >
              Exit
            </Link>
          </div>

          {/* Exam banner */}
          {!isTertiary && phase === "lesson" && (
            <div className="rounded-2xl bg-accent/10 border border-accent/20 px-4 py-3 flex items-center gap-2">
              <Zap className="h-4 w-4 text-accent shrink-0" />
              <p className="text-sm font-semibold text-accent">
                High exam probability — commonly appears in JAMB and WAEC
              </p>
            </div>
          )}

          <AnimatePresence mode="wait">

            {/* ── Lesson phase ── */}
            {phase === "lesson" && (
              <motion.div key="lesson"
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>

                <div className="rounded-2xl bg-card border p-6">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                    Your notes · {currentTopic}
                  </div>
                  <p className="text-base leading-relaxed text-foreground">
                    {lesson?.notes?.slice(0, 800)}
                    {(lesson?.notes?.length ?? 0) > 800 && (
                      <span className="text-muted-foreground"> ... (continued in voice)</span>
                    )}
                  </p>
                </div>

                {/* Voice controls */}
                <div className="mt-4 rounded-2xl bg-muted/40 border p-5 flex items-center gap-4">
                  <button
                    onClick={togglePlay}
                    className="h-12 w-12 rounded-xl bg-accent flex items-center justify-center text-accent-foreground shadow-lg hover:opacity-90 transition shrink-0"
                  >
                    {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold">
                      {playing ? "Reading your notes aloud..." : "Listen to your notes"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {playing ? "Tap to pause" : "Hands-free — great for commutes"}
                    </p>
                  </div>
                  {playing && (
                    <div className="flex gap-0.5 items-end h-6 shrink-0">
                      {[3, 5, 8, 5, 3, 6, 4].map((h, i) => (
                        <motion.div key={i}
                          animate={{ height: [h, h * 2.5, h] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                          className="w-1 rounded-full bg-accent"
                          style={{ height: h }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => { window.speechSynthesis?.cancel(); setPhase("quiz"); }}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground font-medium transition"
                  >
                    Ready for the quiz <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Quiz phase ── */}
            {phase === "quiz" && (
              <motion.div key={`quiz-${qi}`}
                initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>

                <div className="mb-4">
                  <div className="flex justify-between text-xs font-semibold text-muted-foreground mb-2">
                    <span>{isTertiary ? "Comprehension check" : "JAMB-style question"}</span>
                    <span>{qi + 1} / {questions.length}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted">
                    <div
                      className="h-1.5 rounded-full bg-accent transition-all duration-500"
                      style={{ width: `${((qi + 1) / questions.length) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="rounded-2xl bg-card border p-6">
                  <h2 className="text-xl font-extrabold leading-snug">{questions[qi]?.q}</h2>
                  {!isTertiary && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Select the most correct answer — just like in the exam hall
                    </p>
                  )}
                  <div className="mt-5 grid gap-3">
                    {questions[qi]?.opts.map((o, i) => {
                      const picked = picks[qi] === i;
                      const isCorrect = i === questions[qi].a;
                      const showResult = picks[qi] !== undefined;
                      return (
                        <motion.button key={i} whileTap={{ scale: 0.98 }} onClick={() => pick(i)}
                          className={`w-full rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition flex items-center gap-3 ${
                            showResult && isCorrect
                              ? "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400"
                              : showResult && picked && !isCorrect
                              ? "border-destructive bg-destructive/10 text-destructive"
                              : "border-border bg-background hover:border-accent"
                          }`}>
                          <span className={`h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                            showResult && isCorrect
                              ? "bg-green-500/20 text-green-700 dark:text-green-400"
                              : showResult && picked && !isCorrect
                              ? "bg-destructive/20 text-destructive"
                              : "bg-muted text-muted-foreground"
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
                <div className="rounded-2xl bg-card border p-8 text-center">
                  <svg width="120" height="120" viewBox="0 0 120 120" className="mx-auto mb-4">
                    <circle cx="60" cy="60" r="50" fill="none"
                      stroke="currentColor" className="text-muted" strokeWidth="10" />
                    <circle cx="60" cy="60" r="50" fill="none"
                      stroke={pct >= 70 ? "oklch(0.65 0.16 145)" : "oklch(0.72 0.17 30)"}
                      strokeWidth="10" strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 50}`}
                      strokeDashoffset={`${2 * Math.PI * 50 * (1 - pct / 100)}`}
                      style={{ transform: "rotate(-90deg)", transformOrigin: "center", transition: "stroke-dashoffset 1s ease" }}
                    />
                    <text x="60" y="55" textAnchor="middle" fontSize="24" fontWeight="800"
                      fill={pct >= 70 ? "oklch(0.65 0.16 145)" : "oklch(0.72 0.17 30)"}>
                      {pct}%
                    </text>
                    <text x="60" y="72" textAnchor="middle" fontSize="11" fill="oklch(0.55 0.02 250)">
                      score
                    </text>
                  </svg>

                  <h2 className="text-2xl font-extrabold">
                    {pct >= 70 ? "Great work! 🎯" : "Keep going! 📚"}
                  </h2>
                  <p className="mt-2 text-muted-foreground">
                    You got <span className="font-bold text-foreground">{score} of {questions.length}</span> correct
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {pct >= 70
                      ? "Solid session. Your progress has been saved."
                      : "Review the material and try again — consistency beats perfection."}
                  </p>

                  <div className="mt-6 grid grid-cols-3 gap-3">
                    <div className="rounded-xl bg-muted/50 p-3">
                      <p className="text-2xl font-extrabold text-accent">{score}</p>
                      <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">Correct</p>
                    </div>
                    <div className="rounded-xl bg-muted/50 p-3">
                      <p className="text-2xl font-extrabold">{questions.length - score}</p>
                      <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">To review</p>
                    </div>
                    <div className="rounded-xl bg-muted/50 p-3">
                      <p className="text-2xl font-extrabold text-green-600">+1</p>
                      <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">Session saved</p>
                    </div>
                  </div>

                  <div className="mt-6 flex gap-3 justify-center">
                    <Link to="/dashboard"
                      className="rounded-xl border bg-background px-5 py-3 text-sm font-semibold hover:shadow-sm transition">
                      Dashboard
                    </Link>
                    <button
                      onClick={() => { setPicks([]); setQi(0); loadLesson(); }}
                      className="rounded-xl bg-accent px-5 py-3 text-sm font-bold text-accent-foreground hover:opacity-95 transition"
                    >
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
