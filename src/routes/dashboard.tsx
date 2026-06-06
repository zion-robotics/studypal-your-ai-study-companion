import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/sp/AppShell";
import { useCountUp } from "@/hooks/useCountUp";
import { useProfile, daysUntil } from "@/hooks/useProfile";
import { requireAuth } from "@/lib/guards";

export const Route = createFileRoute("/dashboard")({
  ssr: false,
  head: () => ({ meta: [{ title: "Dashboard — StudyPal" }] }),
  beforeLoad: requireAuth,
  component: Dashboard,
});

// ─── Shared Components ────────────────────────────────────────────────────────

function Ring({ pct, label }: { pct: number; label: string }) {
  const r = 92, c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div className="relative grid h-56 w-56 place-items-center">
      <svg viewBox="0 0 220 220" className="absolute inset-0 -rotate-90">
        <circle cx="110" cy="110" r={r} stroke="currentColor" className="text-muted" strokeWidth="16" fill="none" />
        <circle cx="110" cy="110" r={r} stroke="currentColor" className="text-accent" strokeWidth="16" fill="none"
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.2,.8,.2,1)" }} />
      </svg>
      <div className="animate-heartbeat text-center">
        <div className="font-display text-5xl">{Math.round(pct)}%</div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, suffix = "" }: { label: string; value: number; suffix?: string }) {
  const [start, setStart] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const t = setTimeout(() => setStart(true), 200); return () => clearTimeout(t); }, []);
  const v = useCountUp(value, 1200, start);
  return (
    <div ref={ref} className="rounded-2xl border border-border bg-card p-5">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-2 font-display text-3xl tabular-nums">{Math.round(v)}{suffix}</div>
    </div>
  );
}

function SkeletonDash() {
  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-6 p-5 md:p-8 animate-pulse">
        <div className="h-10 w-64 rounded-xl bg-muted" />
        <div className="h-32 rounded-3xl bg-muted" />
        <div className="h-56 rounded-3xl bg-muted" />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-48 rounded-3xl bg-muted" />
          <div className="h-48 rounded-3xl bg-muted" />
        </div>
      </div>
    </AppShell>
  );
}

const badge = (s: number) =>
  s >= 85 ? "bg-emerald-500/15 text-emerald-500"
  : s >= 70 ? "bg-amber-500/15 text-amber-500"
  : "bg-red-500/15 text-red-500";

// ─── Tertiary Dashboard ───────────────────────────────────────────────────────

function TertiaryDashboard({ profile }: { profile: NonNullable<ReturnType<typeof useProfile>["profile"]> }) {
  const [pct, setPct] = useState(0);
  const [greeting, setGreeting] = useState("Good morning");
  const days = daysUntil(profile.exam_date);
  const firstName = profile.full_name?.split(" ")[0] ?? "Student";
  const course = profile.course ?? "Your Course";
  const level = profile.level ?? "";
  const school = profile.school_name ?? "";
  const totalDays = 90;
  const dayNum = Math.max(1, totalDays - days);

  useEffect(() => {
    const h = new Date().getHours();
    if (h < 12) setGreeting("Good morning");
    else if (h < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");
    const t = setTimeout(() => setPct(34), 100);
    return () => clearTimeout(t);
  }, []);

  const activity = [
    { topic: "Introduction to the module", course, score: 92, when: "Today · 09:42" },
    { topic: "Core concepts review", course, score: 78, when: "Yesterday · 18:20" },
    { topic: "Practice problems", course, score: 64, when: "Mon · 07:10" },
  ];

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-6 p-5 md:p-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="font-mono text-xs text-muted-foreground uppercase tracking-widest">{greeting}</div>
            <h1 className="mt-1 font-display text-3xl md:text-4xl">{firstName}, day {dayNum} of {totalDays}.</h1>
            <p className="mt-1 text-sm text-muted-foreground">{course} · {level} · {school}</p>
          </div>
          <Link to="/session" className="btn-press rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground">
            Start today's session
          </Link>
        </motion.div>

        {/* Info banner */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03, duration: 0.5 }}
          className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-accent/10 px-4 py-2 text-center">
              <div className="font-display text-2xl font-bold text-accent">{days}</div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">days to exam</div>
            </div>
            <div>
              <div className="text-sm font-medium">Semester exam approaching</div>
              <div className="text-xs text-muted-foreground">Stay consistent — 34% of material covered</div>
            </div>
          </div>
          <Link to="/upload" className="rounded-full border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition">
            Upload notes →
          </Link>
        </motion.div>

        {/* Pulse + today */}
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, duration: 0.5 }}
          className="grid gap-6 rounded-3xl border border-border bg-card p-6 md:grid-cols-[auto,1fr] md:p-8">
          <div className="flex items-center justify-center">
            <Ring pct={pct} label="semester coverage" />
          </div>
          <div className="flex flex-col justify-between gap-6">
            <div>
              <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{course} · Today</div>
              <div className="mt-2 font-display text-2xl">Core Concepts Review</div>
              <div className="mt-1 text-sm text-muted-foreground">Lecture material · Topic 4 of 12 · est. 12 min</div>
              <div className="mt-3 flex items-center gap-2">
                <span className="rounded-full bg-blue-500/10 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-blue-500">
                  📚 Lecture notes
                </span>
                <span className="rounded-full bg-muted px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Voice ready
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Streak", value: "7 days" },
                { label: "Syllabus", value: "34%" },
                { label: "Days left", value: String(days) },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-border p-4">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{s.label}</div>
                  <div className="mt-1 font-display text-2xl">{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Session + activity */}
        <div className="grid gap-6 md:grid-cols-[1.3fr,1fr]">
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }}
            className="rounded-3xl border border-border bg-card p-6 md:p-8">
            <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Next session</div>
            <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="font-display text-2xl">{course}</div>
                <div className="text-sm text-muted-foreground">Lecture material · est. 12 min</div>
              </div>
              <Link to="/session" className="btn-press rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground">
                Start Session
              </Link>
            </div>
            <div className="mt-6">
              <div className="mb-2 flex justify-between font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                <span>Semester progress</span>
                <span>Topic 4 / 12</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-accent transition-all duration-1000" style={{ width: "34%" }} />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Link to="/upload" className="rounded-xl border border-border p-3 text-center text-sm text-muted-foreground hover:border-accent hover:text-foreground transition">
                + Upload notes
              </Link>
              <Link to="/community" className="rounded-xl border border-border p-3 text-center text-sm text-muted-foreground hover:border-accent hover:text-foreground transition">
                Community →
              </Link>
            </div>
          </motion.section>

          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.5 }}
            className="rounded-3xl border border-border bg-card p-6">
            <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Recent sessions</div>
            <ul className="mt-4 space-y-3">
              {activity.map((a, i) => (
                <li key={i} className="flex items-center justify-between rounded-xl border border-border p-3">
                  <div>
                    <div className="text-sm font-medium">{a.topic}</div>
                    <div className="font-mono text-[10px] uppercase text-muted-foreground">{a.when}</div>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 font-mono text-xs ${badge(a.score)}`}>{a.score}%</span>
                </li>
              ))}
            </ul>
          </motion.section>
        </div>

        {/* Quick stats */}
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}
          className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <MiniStat label="Current streak" value={7} suffix="d" />
          <MiniStat label="Sessions done" value={42} />
          <MiniStat label="Avg score" value={86} suffix="%" />
          <MiniStat label="Topics covered" value={13} />
        </motion.section>

      </div>
    </AppShell>
  );
}

// ─── Secondary Dashboard ──────────────────────────────────────────────────────

function SecondaryDashboard({ profile }: { profile: NonNullable<ReturnType<typeof useProfile>["profile"]> }) {
  const [pct, setPct] = useState(0);
  const [greeting, setGreeting] = useState("Good morning");
  const days = daysUntil(profile.exam_date);
  const firstName = profile.full_name?.split(" ")[0] ?? "Student";
  const exams = profile.exam_types ?? ["JAMB"];
  const subjects = profile.subjects ?? ["Biology", "Chemistry", "Mathematics"];
  const primaryExam = exams[0];

  // Urgency level based on days remaining
  const urgency = days <= 14 ? "critical" : days <= 30 ? "high" : "normal";
  const urgencyColor = urgency === "critical" ? "border-red-500/40 bg-red-500/5" : urgency === "high" ? "border-amber-500/40 bg-amber-500/5" : "border-accent/20 bg-accent/5";
  const urgencyText = urgency === "critical" ? "text-red-500" : urgency === "high" ? "text-amber-500" : "text-accent";

  useEffect(() => {
    const h = new Date().getHours();
    if (h < 12) setGreeting("Good morning");
    else if (h < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");
    const t = setTimeout(() => setPct(47), 100);
    return () => clearTimeout(t);
  }, []);

  const activity = [
    { subject: `${primaryExam} Biology`, topic: "Cellular Respiration", score: 92, when: "Today · 09:42", freq: true },
    { subject: `${primaryExam} Chemistry`, topic: "Mole Concept", score: 78, when: "Yesterday · 18:20", freq: true },
    { subject: `${primaryExam} Mathematics`, topic: "Quadratic Equations", score: 64, when: "Mon · 07:10", freq: false },
  ];

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-6 p-5 md:p-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="font-mono text-xs text-muted-foreground uppercase tracking-widest">{greeting}</div>
            <h1 className="mt-1 font-display text-3xl md:text-4xl">{firstName}. Let's get to work.</h1>
            <p className="mt-1 text-sm text-muted-foreground">{exams.join(" · ")} · {subjects.slice(0, 3).join(", ")}</p>
          </div>
          <Link to="/session" className="btn-press rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground">
            Start today's session
          </Link>
        </motion.div>

        {/* EXAM COUNTDOWN — the war room banner */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03, duration: 0.5 }}
          className={`rounded-2xl border ${urgencyColor} px-6 py-5`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-5">
              <div className="text-center">
                <div className={`font-display text-5xl font-black tabular-nums ${urgencyText}`}>{days}</div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">days left</div>
              </div>
              <div className="h-12 w-px bg-border" />
              <div>
                <div className={`font-display text-xl font-semibold ${urgencyText}`}>{primaryExam} {new Date().getFullYear()}</div>
                <div className="text-sm text-muted-foreground">
                  {urgency === "critical" ? "🚨 Final stretch — every hour counts" : urgency === "high" ? "⚡ Push hard — you're in the final month" : "📅 Stay consistent — you have time if you start now"}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1 text-right">
              <div className="font-mono text-sm text-muted-foreground">Coverage so far</div>
              <div className={`font-display text-2xl font-bold ${urgencyText}`}>47%</div>
              <div className="font-mono text-xs text-muted-foreground">{subjects.length} subjects</div>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-4">
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <motion.div className={`h-full rounded-full ${urgency === "critical" ? "bg-red-500" : urgency === "high" ? "bg-amber-500" : "bg-accent"}`}
                initial={{ width: 0 }} animate={{ width: "47%" }} transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }} />
            </div>
          </div>
        </motion.div>

        {/* Subjects coverage grid */}
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06, duration: 0.5 }}>
          <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-3">Subject coverage</div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {subjects.map((sub, i) => {
              const coverages = [67, 45, 23, 78, 34, 56, 12, 89, 43];
              const cov = coverages[i % coverages.length];
              return (
                <div key={sub} className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium truncate">{sub}</div>
                    <span className={`font-mono text-xs font-bold ${cov >= 70 ? "text-emerald-500" : cov >= 40 ? "text-amber-500" : "text-red-500"}`}>{cov}%</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className={`h-full rounded-full transition-all duration-1000 ${cov >= 70 ? "bg-emerald-500" : cov >= 40 ? "bg-amber-500" : "bg-red-500"}`}
                      style={{ width: `${cov}%` }} />
                  </div>
                  <div className="mt-1.5 font-mono text-[10px] text-muted-foreground">
                    {cov >= 70 ? "On track" : cov >= 40 ? "Needs work" : "⚠ Behind"}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.section>

        {/* Pulse + today */}
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.5 }}
          className="grid gap-6 rounded-3xl border border-border bg-card p-6 md:grid-cols-[auto,1fr] md:p-8">
          <div className="flex items-center justify-center">
            <Ring pct={pct} label="syllabus covered" />
          </div>
          <div className="flex flex-col justify-between gap-6">
            <div>
              <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{primaryExam} Biology · Today</div>
              <div className="mt-2 font-display text-2xl">Cellular Respiration</div>
              <div className="mt-1 text-sm text-muted-foreground">Past question practice · est. 12 min</div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-accent/10 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-accent">
                  🎯 High exam probability
                </span>
                <span className="rounded-full bg-muted px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Appeared in 2019, 2021, 2023
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Streak", value: "7 days" },
                { label: "Coverage", value: "47%" },
                { label: "Days left", value: String(days) },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-border p-4">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{s.label}</div>
                  <div className={`mt-1 font-display text-2xl ${s.label === "Days left" && urgency === "critical" ? "text-red-500" : ""}`}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Session card + activity */}
        <div className="grid gap-6 md:grid-cols-[1.3fr,1fr]">
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }}
            className="rounded-3xl border border-border bg-card p-6 md:p-8">
            <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Today's exam prep</div>
            <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="font-display text-2xl">{primaryExam} Biology</div>
                <div className="text-sm text-muted-foreground">Past question practice · 3 questions · JAMB-style</div>
              </div>
              <Link to="/session" className="btn-press rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground">
                Start Session
              </Link>
            </div>
            <div className="mt-6">
              <div className="mb-2 flex justify-between font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                <span>Overall revision progress</span>
                <span>47%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-accent transition-all duration-1000" style={{ width: "47%" }} />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Link to="/upload" className="rounded-xl border border-border p-3 text-center text-sm text-muted-foreground hover:border-accent hover:text-foreground transition">
                + Upload past Q
              </Link>
              <Link to="/community" className="rounded-xl border border-border p-3 text-center text-sm text-muted-foreground hover:border-accent hover:text-foreground transition">
                Study resources →
              </Link>
            </div>
          </motion.section>

          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.5 }}
            className="rounded-3xl border border-border bg-card p-6">
            <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Recent practice</div>
            <ul className="mt-4 space-y-3">
              {activity.map((a, i) => (
                <li key={i} className="flex items-center justify-between rounded-xl border border-border p-3">
                  <div className="flex-1 min-w-0 mr-2">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium truncate">{a.topic}</div>
                      {a.freq && <span className="shrink-0 text-[10px] text-accent">🎯</span>}
                    </div>
                    <div className="font-mono text-[10px] uppercase text-muted-foreground">{a.subject} · {a.when}</div>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 font-mono text-xs ${badge(a.score)}`}>{a.score}%</span>
                </li>
              ))}
            </ul>
          </motion.section>
        </div>

        {/* Quick stats */}
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}
          className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <MiniStat label="Current streak" value={7} suffix="d" />
          <MiniStat label="Past Q done" value={127} />
          <MiniStat label="Avg score" value={76} suffix="%" />
          <MiniStat label="Subjects left" value={subjects.length} />
        </motion.section>

      </div>
    </AppShell>
  );
}

// ─── Main Router ──────────────────────────────────────────────────────────────

function Dashboard() {
  const nav = useNavigate();
  const { profile, loading } = useProfile();

  useEffect(() => {
    if (!loading && !profile) nav({ to: "/onboarding" });
  }, [profile, loading]);

  if (loading) return <SkeletonDash />;
  if (!profile) return <SkeletonDash />;

  if (profile.user_type === "tertiary") return <TertiaryDashboard profile={profile} />;
  return <SecondaryDashboard profile={profile} />;
}