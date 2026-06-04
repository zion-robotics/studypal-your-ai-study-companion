import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/sp/AppShell";
import { useCountUp } from "@/hooks/useCountUp";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — StudyPal" }] }),
  component: Dashboard,
});

function Ring({ pct }: { pct: number }) {
  const r = 92,
    c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div className="relative grid h-56 w-56 place-items-center">
      <svg viewBox="0 0 220 220" className="absolute inset-0 -rotate-90">
        <circle
          cx="110"
          cy="110"
          r={r}
          stroke="currentColor"
          className="text-muted"
          strokeWidth="16"
          fill="none"
        />
        <circle
          cx="110"
          cy="110"
          r={r}
          stroke="currentColor"
          className="text-accent"
          strokeWidth="16"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.2,.8,.2,1)" }}
        />
      </svg>
      <div className="animate-heartbeat text-center">
        <div className="font-display text-5xl">{Math.round(pct)}%</div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          today's pulse
        </div>
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  suffix = "",
}: {
  label: string;
  value: number;
  suffix?: string;
}) {
  const [start, setStart] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const t = setTimeout(() => setStart(true), 200);
    return () => clearTimeout(t);
  }, []);
  const v = useCountUp(value, 1200, start);
  return (
    <div ref={ref} className="rounded-2xl border border-border bg-card p-5">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 font-display text-3xl tabular-nums">
        {Math.round(v)}
        {suffix}
      </div>
    </div>
  );
}

function Dashboard() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setPct(70), 100);
    return () => clearTimeout(t);
  }, []);

  const activity = [
    { subject: "JAMB Biology", topic: "Cellular Respiration", score: 92, when: "Today · 09:42" },
    { subject: "JAMB Biology", topic: "Mitosis vs Meiosis", score: 78, when: "Yesterday · 18:20" },
    { subject: "JAMB Biology", topic: "Plant Nutrition", score: 64, when: "Mon · 07:10" },
  ];
  const badge = (s: number) =>
    s >= 85
      ? "bg-emerald-500/15 text-emerald-500"
      : s >= 70
        ? "bg-amber-500/15 text-amber-500"
        : "bg-red-500/15 text-red-500";

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-6 p-5 md:p-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-wrap items-end justify-between gap-4"
        >
          <div>
            <div className="font-mono text-xs text-muted-foreground">GOOD MORNING</div>
            <h1 className="mt-1 font-display text-3xl md:text-4xl">Amara, day 12 of 38.</h1>
          </div>
          <Link
            to="/session"
            className="btn-press rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground"
          >
            Start today's session
          </Link>
        </motion.div>

        {/* Daily Pulse */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.5 }}
          className="grid gap-6 rounded-3xl border border-border bg-card p-6 md:grid-cols-[auto,1fr] md:p-8"
        >
          <div className="flex items-center justify-center">
            <Ring pct={pct} />
          </div>
          <div className="flex flex-col justify-between gap-6">
            <div>
              <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Today
              </div>
              <div className="mt-2 font-display text-2xl">Cellular Respiration</div>
              <div className="mt-1 text-sm text-muted-foreground">
                1 lesson · 12 min · voice ready
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-xl border border-border p-4">
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Streak
                </div>
                <div className="mt-1 font-display text-2xl">7 days</div>
              </div>
              <div className="rounded-xl border border-border p-4">
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Syllabus
                </div>
                <div className="mt-1 font-display text-2xl">34%</div>
              </div>
              <div className="rounded-xl border border-border p-4">
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Days left
                </div>
                <div className="mt-1 font-display text-2xl">26</div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Session card + activity */}
        <div className="grid gap-6 md:grid-cols-[1.3fr,1fr]">
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="rounded-3xl border border-border bg-card p-6 md:p-8"
          >
            <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Next session
            </div>
            <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="font-display text-2xl">JAMB Biology</div>
                <div className="text-sm text-muted-foreground">
                  Topic 8: Cellular Respiration · est. 12 min
                </div>
              </div>
              <Link
                to="/session"
                className="btn-press rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground"
              >
                Start Session
              </Link>
            </div>
            <div className="mt-6">
              <div className="mb-2 flex justify-between font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                <span>Plan progress</span>
                <span>Lesson 12 / 38</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-1000"
                  style={{ width: "34%" }}
                />
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="rounded-3xl border border-border bg-card p-6"
          >
            <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Recent activity
            </div>
            <ul className="mt-4 space-y-3">
              {activity.map((a, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between rounded-xl border border-border p-3"
                >
                  <div>
                    <div className="text-sm font-medium">{a.topic}</div>
                    <div className="font-mono text-[10px] uppercase text-muted-foreground">
                      {a.when}
                    </div>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 font-mono text-xs ${badge(a.score)}`}>
                    {a.score}%
                  </span>
                </li>
              ))}
            </ul>
          </motion.section>
        </div>

        {/* Quick stats */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="grid grid-cols-2 gap-4 md:grid-cols-4"
        >
          <MiniStat label="Current streak" value={7} suffix="d" />
          <MiniStat label="Sessions done" value={42} />
          <MiniStat label="Avg score" value={86} suffix="%" />
          <MiniStat label="Topics covered" value={13} />
        </motion.section>
      </div>
    </AppShell>
  );
}
