import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion, animate } from "framer-motion";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/sp/AppShell";
import { useProfile, daysUntil } from "@/hooks/useProfile";
import { useDashboardData, getActivityMap } from "@/hooks/useDashboardData";
import { requireAuth } from "@/lib/guards";

export const Route = createFileRoute("/dashboard")({
  ssr: false,
  head: () => ({ meta: [{ title: "Dashboard — StudyPal" }] }),
  beforeLoad: requireAuth,
  component: Dashboard,
});

// ─── Animated Counter ─────────────────────────────────────────────────────────
function AnimatedNumber({ value, suffix = "", className = "" }: {
  value: number; suffix?: string; className?: string;
}) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const controls = animate(0, value, {
      duration: 1.4,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return controls.stop;
  }, [value]);
  return <span className={className}>{display}{suffix}</span>;
}

// ─── Ring Progress ────────────────────────────────────────────────────────────
function RingProgress({ pct, size = 180, stroke = 14, sublabel, color = "text-accent" }: {
  pct: number; size?: number; stroke?: number; sublabel?: string; color?: string;
}) {
  const r = (size - stroke * 2) / 2;
  const c = 2 * Math.PI * r;
  const [animPct, setAnimPct] = useState(0);
  useEffect(() => { const t = setTimeout(() => setAnimPct(pct), 150); return () => clearTimeout(t); }, [pct]);
  const offset = c - (animPct / 100) * c;
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90 absolute">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="currentColor" className="text-muted" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="currentColor" className={color}
          strokeWidth={stroke} strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.16,1,0.3,1)" }} />
      </svg>
      <div className="text-center z-10">
        <div className="font-display text-4xl font-black tabular-nums leading-none">
          <AnimatedNumber value={pct} suffix="%" />
        </div>
        {sublabel && <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mt-1">{sublabel}</div>}
      </div>
    </div>
  );
}

// ─── Streak Chart (real data) ─────────────────────────────────────────────────
function StreakChart({ streak, activityMap }: { streak: number; activityMap: Record<string, boolean> }) {
  const today = new Date();
  const days = Array.from({ length: 28 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (27 - i));
    const key = d.toLocaleDateString("en-CA");
    return {
      key,
      date: d,
      studied: !!activityMap[key],
      isToday: i === 27,
    };
  });

  const weeks = Array.from({ length: 4 }, (_, wi) => days.slice(wi * 7, wi * 7 + 7));
  const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">28-day activity</span>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-sm bg-accent" />
          <span className="font-mono text-[10px] text-muted-foreground">studied</span>
          <div className="ml-2 h-2 w-2 rounded-sm bg-muted" />
          <span className="font-mono text-[10px] text-muted-foreground">missed</span>
        </div>
      </div>
      <div className="flex gap-1.5">
        <div className="flex flex-col gap-1.5 mr-1">
          {dayLabels.map((l, i) => (
            <div key={i} className="h-6 w-4 flex items-center justify-center font-mono text-[9px] text-muted-foreground">{l}</div>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1.5 flex-1">
            {week.map((day, di) => (
              <motion.div
                key={di}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: (wi * 7 + di) * 0.015, duration: 0.3, ease: "backOut" }}
                title={`${day.date.toLocaleDateString("en", { month: "short", day: "numeric" })} — ${day.studied ? "Studied ✓" : "Missed"}`}
                className={`h-6 rounded-md transition-all duration-200 cursor-pointer relative group ${
                  day.isToday ? "ring-2 ring-accent ring-offset-1 ring-offset-background" : ""
                } ${
                  day.studied
                    ? "bg-accent shadow-[0_0_8px_rgba(13,148,136,0.4)]"
                    : "bg-muted/60"
                }`}
              >
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-50 whitespace-nowrap rounded-lg border border-border bg-card px-2 py-1 font-mono text-[9px] shadow-lg">
                  {day.date.toLocaleDateString("en", { month: "short", day: "numeric" })}
                  <span className={`ml-1 ${day.studied ? "text-accent" : "text-red-400"}`}>
                    {day.studied ? "✓" : "✗"}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <motion.span
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="text-lg"
        >🔥</motion.span>
        {streak > 0 ? (
          <span className="font-display text-sm">
            <span className="text-accent font-bold">{streak}-day streak</span>
            <span className="text-muted-foreground ml-1">— keep it going</span>
          </span>
        ) : (
          <span className="font-display text-sm text-muted-foreground">No streak yet — start today!</span>
        )}
      </div>
    </div>
  );
}

// ─── Score Badge ──────────────────────────────────────────────────────────────
const scoreBadge = (s: number) =>
  s >= 85 ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
  : s >= 70 ? "bg-amber-500/15 text-amber-400 border border-amber-500/20"
  : "bg-red-500/15 text-red-400 border border-red-500/20";

// ─── Empty State ──────────────────────────────────────────────────────────────
function NoSessions() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="text-3xl mb-2">📚</div>
      <div className="text-sm font-medium text-muted-foreground">No sessions yet</div>
      <div className="text-xs text-muted-foreground mt-1">Complete your first session to see activity here</div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonDash() {
  return (
    <AppShell>
      <div className="p-6 md:p-8 space-y-6 animate-pulse max-w-7xl mx-auto">
        <div className="h-12 w-72 rounded-2xl bg-muted" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-2xl bg-muted" />)}
        </div>
        <div className="h-64 rounded-3xl bg-muted" />
        <div className="grid md:grid-cols-2 gap-4">
          <div className="h-48 rounded-3xl bg-muted" />
          <div className="h-48 rounded-3xl bg-muted" />
        </div>
      </div>
    </AppShell>
  );
}

// ─── SECONDARY DASHBOARD ─────────────────────────────────────────────────────
function SecondaryDashboard({ profile }: { profile: NonNullable<ReturnType<typeof useProfile>["profile"]> }) {
  const days = daysUntil(profile.exam_date);
  const firstName = profile.full_name?.split(" ")[0] ?? "Student";
  const exams = profile.exam_types ?? ["JAMB"];
  const subjects = profile.subjects ?? [];
  const primaryExam = exams[0];

  const [greeting, setGreeting] = useState("Good morning");
  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");
  }, []);

  const { sessions, subjectProgress, streak, totalSessions, avgScore, pastQDone, loading } =
    useDashboardData(subjects);

  const activityMap = getActivityMap(sessions);
  const recentSessions = sessions.slice(0, 3);

  // Overall coverage = average of all subject coverage_pct
  const overallPct = subjectProgress.length > 0
    ? Math.round(subjectProgress.reduce((a, b) => a + b.coverage_pct, 0) / subjectProgress.length)
    : 0;

  const urgency = days <= 14 ? "critical" : days <= 30 ? "high" : "normal";
  const urgencyAccent = urgency === "critical" ? "#ef4444" : urgency === "high" ? "#f59e0b" : "rgb(13,148,136)";
  const urgencyClass = urgency === "critical" ? "text-red-400" : urgency === "high" ? "text-amber-400" : "text-accent";
  const urgencyBg = urgency === "critical"
    ? "from-red-500/10 to-transparent border-red-500/20"
    : urgency === "high"
    ? "from-amber-500/10 to-transparent border-amber-500/20"
    : "from-accent/10 to-transparent border-accent/20";

  const statsRow = [
    { label: "Days left", value: days, suffix: "d", color: urgencyClass },
    { label: "Streak", value: streak, suffix: "d", color: "text-accent" },
    { label: "Past Q done", value: pastQDone, suffix: "", color: "text-foreground" },
    { label: "Avg score", value: avgScore, suffix: "%", color: "text-foreground" },
  ];

  if (loading) return <SkeletonDash />;

  return (
    <AppShell>
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-5 py-7 md:px-8 space-y-6">

          {/* HEADER */}
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{greeting}</p>
              <h1 className="mt-0.5 font-display text-3xl md:text-5xl font-black leading-none">
                {firstName}<span className={urgencyClass}>.</span>
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {exams.join(" · ")} &nbsp;·&nbsp; {subjects.slice(0, 3).join(", ")}
                {subjects.length > 3 && <span className="text-accent"> +{subjects.length - 3}</span>}
              </p>
            </div>
            <Link to="/session"
              className="group relative overflow-hidden rounded-2xl bg-accent px-6 py-3.5 text-sm font-bold text-accent-foreground shadow-[0_8px_30px_rgba(13,148,136,0.35)] hover:shadow-[0_8px_40px_rgba(13,148,136,0.55)] hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
              Start Session
            </Link>
          </motion.div>

          {/* STATS ROW */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {statsRow.map((s, i) => (
              <motion.div key={s.label}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + i * 0.06, duration: 0.45 }}
                className="rounded-2xl border border-border bg-card p-5 hover:border-accent/40 transition-colors group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{s.label}</p>
                <p className={`mt-1.5 font-display text-4xl font-black tabular-nums ${s.color}`}>
                  <AnimatedNumber value={s.value} suffix={s.suffix} />
                </p>
              </motion.div>
            ))}
          </div>

          {/* COUNTDOWN BANNER */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.5 }}
            className={`rounded-2xl border bg-gradient-to-r ${urgencyBg} px-6 py-5 relative overflow-hidden`}>
            <motion.div
              animate={{ opacity: [0.03, 0.08, 0.03], scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute inset-0 rounded-2xl"
              style={{ background: `radial-gradient(ellipse at 20% 50%, ${urgencyAccent}22, transparent 70%)` }}
            />
            <div className="relative flex flex-wrap items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div>
                  <div className={`font-display text-7xl font-black tabular-nums leading-none ${urgencyClass}`}>
                    <AnimatedNumber value={days} />
                  </div>
                  <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mt-1">days to exam</div>
                </div>
                <div className="h-16 w-px bg-border" />
                <div>
                  <div className={`font-display text-2xl font-bold ${urgencyClass}`}>{primaryExam} {new Date().getFullYear()}</div>
                  <div className="mt-1 text-sm text-muted-foreground max-w-xs">
                    {urgency === "critical" ? "🚨 Final stretch — every hour counts now"
                      : urgency === "high" ? "⚡ Push hard — you're in the final month"
                      : "📅 Stay consistent — you have time if you start now"}
                  </div>
                </div>
              </div>
              <RingProgress pct={overallPct} size={100} stroke={10} sublabel="covered"
                color={urgency === "critical" ? "text-red-400" : urgency === "high" ? "text-amber-400" : "text-accent"} />
            </div>
            <div className="relative mt-4 h-2 w-full overflow-hidden rounded-full bg-muted/50">
              <motion.div
                className={`h-full rounded-full ${urgency === "critical" ? "bg-red-500" : urgency === "high" ? "bg-amber-500" : "bg-accent"}`}
                initial={{ width: 0 }} animate={{ width: `${overallPct}%` }}
                transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
              />
            </div>
          </motion.div>

          {/* MAIN GRID */}
          <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
            <div className="space-y-5">

              {/* Subject coverage */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16, duration: 0.5 }}
                className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center justify-between mb-5">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Subject Coverage</span>
                  <span className="font-mono text-[10px] text-accent">{subjects.length} subjects</span>
                </div>
                {subjectProgress.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-6">
                    Start studying to track subject coverage
                  </div>
                ) : (
                  <div className="space-y-4">
                    {subjectProgress.map((sp, i) => {
                      const cov = sp.coverage_pct;
                      const col = cov >= 70 ? "bg-emerald-500" : cov >= 40 ? "bg-amber-500" : "bg-red-500";
                      const txt = cov >= 70 ? "text-emerald-400" : cov >= 40 ? "text-amber-400" : "text-red-400";
                      return (
                        <div key={sp.subject}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm font-medium">{sp.subject}</span>
                            <div className="flex items-center gap-2">
                              <span className={`font-mono text-xs font-bold ${txt}`}>{cov}%</span>
                              <span className={`font-mono text-[9px] px-2 py-0.5 rounded-full ${
                                cov >= 70 ? "bg-emerald-500/10 text-emerald-400"
                                : cov >= 40 ? "bg-amber-500/10 text-amber-400"
                                : "bg-red-500/10 text-red-400"
                              }`}>
                                {cov >= 70 ? "On track" : cov >= 40 ? "Needs work" : cov === 0 ? "Not started" : "⚠ Behind"}
                              </span>
                            </div>
                          </div>
                          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                            <motion.div className={`h-full rounded-full ${col}`}
                              initial={{ width: 0 }} animate={{ width: `${cov}%` }}
                              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 + i * 0.08 }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>

              {/* Today's session */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}
                className="rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/8 to-card p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-accent/5 -translate-y-1/2 translate-x-1/2" />
                <div className="relative flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="font-mono text-[9px] uppercase tracking-widest text-accent mb-2">Today's session</div>
                    <div className="font-display text-2xl font-bold">{primaryExam} {subjects[0] ?? "Study"}</div>
                    <div className="text-sm text-muted-foreground mt-1">Past questions · ~12 min</div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="rounded-full bg-accent/15 px-3 py-1 font-mono text-[9px] uppercase tracking-wider text-accent">
                        🎯 High exam probability
                      </span>
                    </div>
                  </div>
                  <Link to="/session"
                    className="shrink-0 rounded-xl bg-accent px-5 py-3 text-sm font-bold text-accent-foreground shadow-[0_4px_20px_rgba(13,148,136,0.4)] hover:shadow-[0_4px_30px_rgba(13,148,136,0.6)] hover:-translate-y-0.5 transition-all">
                    Start →
                  </Link>
                </div>
                <div className="mt-5 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <motion.div className="h-full rounded-full bg-accent"
                    initial={{ width: 0 }} animate={{ width: `${overallPct}%` }}
                    transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.5 }} />
                </div>
                <div className="mt-1.5 flex justify-between font-mono text-[9px] text-muted-foreground">
                  <span>Overall revision</span><span>{overallPct}%</span>
                </div>
              </motion.div>

              <div className="grid grid-cols-2 gap-3">
                <Link to="/upload" className="rounded-2xl border border-border bg-card p-4 text-center text-sm font-medium text-muted-foreground hover:border-accent hover:text-accent transition-all hover:-translate-y-0.5">
                  + Upload past questions
                </Link>
                <Link to="/community" className="rounded-2xl border border-border bg-card p-4 text-center text-sm font-medium text-muted-foreground hover:border-accent hover:text-accent transition-all hover:-translate-y-0.5">
                  Study resources →
                </Link>
              </div>
            </div>

            {/* RIGHT */}
            <div className="space-y-5">
              <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.18, duration: 0.5 }}
                className="rounded-2xl border border-border bg-card p-5">
                <StreakChart streak={streak} activityMap={activityMap} />
              </motion.div>

              <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.22, duration: 0.5 }}
                className="rounded-2xl border border-border bg-card p-5">
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-4">Recent Practice</div>
                {recentSessions.length === 0 ? <NoSessions /> : (
                  <div className="space-y-2.5">
                    {recentSessions.map((s, i) => (
                      <motion.div key={s.id}
                        initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.25 + i * 0.07, duration: 0.4 }}
                        className="flex items-center justify-between rounded-xl border border-border bg-background/50 p-3 hover:border-accent/40 transition-colors">
                        <div className="flex-1 min-w-0 mr-2">
                          <div className="text-sm font-medium truncate">{s.topic ?? "Session"}</div>
                          <div className="font-mono text-[9px] uppercase text-muted-foreground mt-0.5">
                            {s.subject ?? primaryExam} · {new Date(s.created_at).toLocaleDateString("en", { weekday: "short", hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                        {s.score !== null && (
                          <span className={`shrink-0 rounded-lg px-2.5 py-1 font-mono text-xs font-bold ${scoreBadge(s.score)}`}>
                            {s.score}%
                          </span>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>
          </div>

        </div>
      </div>
    </AppShell>
  );
}

// ─── TERTIARY DASHBOARD ───────────────────────────────────────────────────────
function TertiaryDashboard({ profile }: { profile: NonNullable<ReturnType<typeof useProfile>["profile"]> }) {
  const days = daysUntil(profile.exam_date);
  const firstName = profile.full_name?.split(" ")[0] ?? "Student";
  const course = profile.course ?? "Your Course";
  const level = profile.level ?? "";
  const school = profile.school_name ?? "";
  const totalDays = 90;
  const dayNum = Math.max(1, totalDays - days);

  const [greeting, setGreeting] = useState("Good morning");
  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");
  }, []);

  const { sessions, subjectProgress, streak, totalSessions, avgScore, loading } =
    useDashboardData([course]);

  const activityMap = getActivityMap(sessions);
  const recentSessions = sessions.slice(0, 3);
  const pct = subjectProgress[0]?.coverage_pct ?? 0;

  const statsRow = [
    { label: "Day", value: dayNum, suffix: `/${totalDays}`, color: "text-accent" },
    { label: "Streak", value: streak, suffix: "d", color: "text-accent" },
    { label: "Sessions", value: totalSessions, suffix: "", color: "text-foreground" },
    { label: "Avg score", value: avgScore, suffix: "%", color: "text-foreground" },
  ];

  if (loading) return <SkeletonDash />;

  return (
    <AppShell>
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-5 py-7 md:px-8 space-y-6">

          {/* HEADER */}
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{greeting}</p>
              <h1 className="mt-0.5 font-display text-3xl md:text-5xl font-black leading-none">
                {firstName}<span className="text-accent">.</span>
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">{course} · {level} · {school}</p>
            </div>
            <Link to="/session"
              className="rounded-2xl bg-accent px-6 py-3.5 text-sm font-bold text-accent-foreground shadow-[0_8px_30px_rgba(13,148,136,0.35)] hover:shadow-[0_8px_40px_rgba(13,148,136,0.55)] hover:-translate-y-0.5 transition-all flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
              Start Session
            </Link>
          </motion.div>

          {/* STATS ROW */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {statsRow.map((s, i) => (
              <motion.div key={s.label}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + i * 0.06, duration: 0.45 }}
                className="rounded-2xl border border-border bg-card p-5 hover:border-accent/40 transition-colors group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{s.label}</p>
                <p className={`mt-1.5 font-display text-4xl font-black tabular-nums ${s.color}`}>
                  <AnimatedNumber value={s.value} suffix={s.suffix} />
                </p>
              </motion.div>
            ))}
          </div>

          {/* MAIN GRID */}
          <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
            <div className="space-y-5">

              {/* Pulse card */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14, duration: 0.5 }}
                className="rounded-2xl border border-border bg-card p-6 flex flex-col md:flex-row gap-6 items-center">
                <RingProgress pct={pct} size={160} stroke={14} sublabel="semester" />
                <div className="flex-1">
                  <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{course} · Today</div>
                  <div className="font-display text-2xl font-bold mt-1.5">
                    {recentSessions[0]?.topic ?? "Start your first session"}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">Lecture material · ~12 min</div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 font-mono text-[9px] uppercase tracking-wider">📚 Lecture notes</span>
                    <span className="rounded-full bg-muted px-3 py-1 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Voice ready</span>
                  </div>
                  <div className="mt-5">
                    <div className="flex justify-between font-mono text-[9px] text-muted-foreground mb-1.5">
                      <span>Semester progress</span><span>{pct}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <motion.div className="h-full rounded-full bg-accent"
                        initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.4 }} />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Session card */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, duration: 0.5 }}
                className="rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/8 to-card p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-accent/5 -translate-y-1/2 translate-x-1/2" />
                <div className="relative flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="font-mono text-[9px] uppercase tracking-widest text-accent">Next session</div>
                    <div className="font-display text-2xl font-bold mt-1">{course}</div>
                    <div className="text-sm text-muted-foreground mt-0.5">Lecture material · est. 12 min</div>
                  </div>
                  <Link to="/session"
                    className="rounded-xl bg-accent px-5 py-3 text-sm font-bold text-accent-foreground shadow-[0_4px_20px_rgba(13,148,136,0.4)] hover:-translate-y-0.5 transition-all">
                    Start →
                  </Link>
                </div>
              </motion.div>

              <div className="grid grid-cols-2 gap-3">
                <Link to="/upload" className="rounded-2xl border border-border bg-card p-4 text-center text-sm font-medium text-muted-foreground hover:border-accent hover:text-accent transition-all hover:-translate-y-0.5">
                  + Upload notes
                </Link>
                <Link to="/community" className="rounded-2xl border border-border bg-card p-4 text-center text-sm font-medium text-muted-foreground hover:border-accent hover:text-accent transition-all hover:-translate-y-0.5">
                  Community →
                </Link>
              </div>
            </div>

            {/* RIGHT */}
            <div className="space-y-5">
              <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.18, duration: 0.5 }}
                className="rounded-2xl border border-border bg-card p-5">
                <StreakChart streak={streak} activityMap={activityMap} />
              </motion.div>

              <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.22, duration: 0.5 }}
                className="rounded-2xl border border-border bg-card p-5">
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-4">Recent Sessions</div>
                {recentSessions.length === 0 ? <NoSessions /> : (
                  <div className="space-y-2.5">
                    {recentSessions.map((s, i) => (
                      <motion.div key={s.id}
                        initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.25 + i * 0.07, duration: 0.4 }}
                        className="flex items-center justify-between rounded-xl border border-border bg-background/50 p-3 hover:border-accent/40 transition-colors">
                        <div className="flex-1 min-w-0 mr-2">
                          <div className="text-sm font-medium truncate">{s.topic ?? "Session"}</div>
                          <div className="font-mono text-[9px] uppercase text-muted-foreground mt-0.5">
                            {s.subject ?? course} · {new Date(s.created_at).toLocaleDateString("en", { weekday: "short", hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                        {s.score !== null && (
                          <span className={`shrink-0 rounded-lg px-2.5 py-1 font-mono text-xs font-bold ${scoreBadge(s.score)}`}>
                            {s.score}%
                          </span>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>
          </div>

        </div>
      </div>
    </AppShell>
  );
}

// ─── ROUTER ───────────────────────────────────────────────────────────────────
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