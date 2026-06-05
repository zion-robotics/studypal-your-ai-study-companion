import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/sp/AppShell";
import { useCountUp } from "@/hooks/useCountUp";
import { useProfile, daysUntil } from "@/hooks/useProfile";
import { supabase } from "@/lib/supabase";
import { requireAuth } from "@/lib/guards";

export const Route = createFileRoute("/dashboard")({
  ssr: false,
  head: () => ({ meta: [{ title: "Dashboard — StudyPal" }] }),
  beforeLoad: requireAuth,
  component: Dashboard,
});

function Ring({ pct }: { pct: number }) {
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
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">today's pulse</div>
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
        <div className="h-56 rounded-3xl bg-muted" />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-48 rounded-3xl bg-muted" />
          <div className="h-48 rounded-3xl bg-muted" />
        </div>
      </div>
    </AppShell>
  );
}

function Dashboard() {
  const nav = useNavigate();
  const { profile, loading } = useProfile();
  const [pct, setPct] = useState(0);
  const [greeting, setGreeting] = useState("Good morning");

  useEffect(() => {
    const h = new Date().getHours();
    if (h < 12) setGreeting("Good morning");
    else if (h < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  useEffect(() => {
    if (!loading && !profile) nav({ to: "/onboarding" });
    if (profile) { const t = setTimeout(() => setPct(70), 100); return () => clearTimeout(t); }
  }, [profile, loading]);

  if (loading) return <SkeletonDash />;

  const isTertiary = profile?.user_type === "tertiary";
  const days = daysUntil(profile?.exam_date);
  const firstName = profile?.full_name?.split(" ")[0] ?? "Student";

  const primaryLabel = isTertiary ? profile?.course ?? "Your Course" : (profile?.exam_types ?? ["JAMB"]).join(" · ");
  const subLabel = isTertiary ? `${profile?.level ?? ""} · ${profile?.school_name ?? ""}` : `${(profile?.subjects ?? []).slice(0, 3).join(" · ")}`;

  const activity = isTertiary
    ? [
        { subject: profile?.course ?? "Course", topic: "Introduction to the module", score: 92, when: "Today · 09:42" },
        { subject: profile?.course ?? "Course", topic: "Core concepts review", score: 78, when: "Yesterday · 18:20" },
        { subject: profile?.course ?? "Course", topic: "Practice problems", score: 64, when: "Mon · 07:10" },
      ]
    : [
        { subject: "JAMB Biology", topic: "Cellular Respiration", score: 92, when: "Today · 09:42" },
        { subject: "JAMB Biology", topic: "Mitosis vs Meiosis", score: 78, when: "Yesterday · 18:20" },
        { subject: "WAEC Economics", topic: "Demand & Supply", score: 64, when: "Mon · 07:10" },
      ];

  const badge = (s: number) =>
    s >= 85 ? "bg-emerald-500/15 text-emerald-500"
    : s >= 70 ? "bg-amber-500/15 text-amber-500"
    : "bg-red-500/15 text-red-500";

  const motivational = isTertiary
    ? `Your exam is in ${days} days. Stay consistent.`
    : `${(profile?.exam_types ?? ["JAMB"])[0]} is in ${days} days. Every session moves you closer.`;

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-6 p-5 md:p-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="font-mono text-xs text-muted-foreground uppercase tracking-widest">{greeting}</div>
            <h1 className="mt-1 font-display text-3xl md:text-4xl">
              {firstName}, day {Math.max(1, 38 - days)} of 38.
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{subLabel}</p>
          </div>
          <Link to="/session" className="btn-press rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground">
            Start today's session
          </Link>
        </motion.div>

        {/* Motivational banner */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03, duration: 0.5 }}
          className="rounded-2xl bg-accent/10 border border-accent/20 px-5 py-3 text-sm text-accent font-medium">
          ⚡ {motivational}
        </motion.div>

        {/* Daily Pulse */}
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, duration: 0.5 }}
          className="grid gap-6 rounded-3xl border border-border bg-card p-6 md:grid-cols-[auto,1fr] md:p-8">
          <div className="flex items-center justify-center"><Ring pct={pct} /></div>
          <div className="flex flex-col justify-between gap-6">
            <div>
              <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                {isTertiary ? `${primaryLabel} · Today` : `${primaryLabel} Prep · Today`}
              </div>
              <div className="mt-2 font-display text-2xl">
                {isTertiary ? "Core Concepts Review" : "Cellular Respiration"}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">1 lesson · 12 min · voice ready</div>
              {!isTertiary && (
                <span className="mt-2 inline-block rounded-full bg-accent/10 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-accent">
                  🎯 Likely exam topic
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Streak", value: "7 days" },
                { label: isTertiary ? "Syllabus" : "Coverage", value: "34%" },
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

        {/* Session card + activity */}
        <div className="grid gap-6 md:grid-cols-[1.3fr,1fr]">
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }}
            className="rounded-3xl border border-border bg-card p-6 md:p-8">
            <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Next session</div>
            <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="font-display text-2xl">{primaryLabel}</div>
                <div className="text-sm text-muted-foreground">
                  {isTertiary ? "Lecture material · est. 12 min" : "Past question practice · est. 12 min"}
                </div>
              </div>
              <Link to="/session" className="btn-press rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground">
                Start Session
              </Link>
            </div>
            <div className="mt-6">
              <div className="mb-2 flex justify-between font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                <span>Plan progress</span>
                <span>Lesson 12 / 38</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-accent transition-all duration-1000" style={{ width: "34%" }} />
              </div>
            </div>
          </motion.section>

          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.5 }}
            className="rounded-3xl border border-border bg-card p-6">
            <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Recent activity</div>
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
          <MiniStat label={isTertiary ? "Sessions done" : "Past Q done"} value={42} />
          <MiniStat label="Avg score" value={86} suffix="%" />
          <MiniStat label={isTertiary ? "Topics covered" : "Subjects left"} value={isTertiary ? 13 : 4} />
        </motion.section>

      </div>
    </AppShell>
  );
}