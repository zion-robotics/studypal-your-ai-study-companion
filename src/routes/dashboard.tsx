import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AppShell } from "@/components/sp/AppShell";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

type UserType = "secondary" | "tertiary";

interface DashboardProfile {
  full_name: string;
  user_type: UserType;
  school: string;
  exam_date: string;
  streak: number;
  xp: number;
  level: number;
}

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
  delay?: number;
}

function StatCard({ icon, label, value, sub, accent, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={`relative overflow-hidden rounded-2xl border p-5 ${
        accent
          ? "border-accent/30 bg-accent/10 shadow-[0_0_30px_-8px_rgb(13_148_136_/_0.3)]"
          : "border-border bg-card"
      }`}
    >
      {accent && (
        <div className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full bg-accent/20 blur-2xl" />
      )}
      <div className="text-2xl mb-3">{icon}</div>
      <div className="text-2xl font-bold tracking-tight">{value}</div>
      <div className="text-sm font-medium text-foreground mt-0.5">{label}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </motion.div>
  );
}

function QuickAction({
  icon,
  label,
  description,
  to,
  delay = 0,
}: {
  icon: string;
  label: string;
  description: string;
  to: string;
  delay?: number;
}) {
  const navigate = useNavigate();
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.35 }}
      onClick={() => navigate({ to })}
      className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-5 text-left transition-all duration-200 hover:border-accent/40 hover:bg-accent/5 hover:shadow-[0_0_20px_-6px_rgb(13_148_136_/_0.25)] active:scale-[0.98]"
    >
      <span className="mt-0.5 text-2xl">{icon}</span>
      <div>
        <div className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors">
          {label}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">{description}</div>
      </div>
      <svg
        viewBox="0 0 24 24"
        className="ml-auto mt-1 h-4 w-4 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-accent"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    </motion.button>
  );
}

function StreakDots({ streak }: { streak: number }) {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const today = new Date().getDay();
  const active = Math.min(streak, 7);

  return (
    <div className="flex gap-2 mt-3">
      {days.map((d, i) => {
        const filled = i < active;
        const isToday = i === (today === 0 ? 6 : today - 1);
        return (
          <div key={i} className="flex flex-col items-center gap-1">
            <div
              className={`h-7 w-7 rounded-lg text-xs font-bold grid place-items-center transition-all ${
                filled
                  ? "bg-accent text-accent-foreground shadow-[0_0_10px_-2px_rgb(13_148_136_/_0.5)]"
                  : "bg-muted text-muted-foreground"
              } ${isToday ? "ring-2 ring-accent ring-offset-2 ring-offset-background" : ""}`}
            >
              {d}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ExamCountdown({ examDate }: { examDate: string }) {
  if (!examDate) return null;
  const days = Math.max(
    0,
    Math.ceil((new Date(examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
  );
  const urgency = days <= 30 ? "text-red-400" : days <= 90 ? "text-yellow-400" : "text-accent";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="rounded-2xl border border-border bg-card p-5 flex items-center justify-between gap-4"
    >
      <div>
        <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Exam Countdown
        </div>
        <div className={`text-3xl font-black mt-1 ${urgency}`}>
          {days} <span className="text-lg font-semibold">days</span>
        </div>
      </div>
      <div className="text-4xl">⏰</div>
    </motion.div>
  );
}

function DailyPulse({ userType }: { userType: UserType }) {
  const isSecondary = userType === "secondary";
  const tasks = isSecondary
    ? [
        { done: true, label: "English Language — Comprehension passage" },
        { done: false, label: "Mathematics — Indices & Logarithms" },
        { done: false, label: "Biology — Cell biology quiz (10 Qs)" },
      ]
    : [
        { done: true, label: "Review lecture notes — Week 5" },
        { done: false, label: "Complete assignment — CSC 301" },
        { done: false, label: "Practice quiz — Data Structures" },
      ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, duration: 0.4 }}
      className="rounded-2xl border border-accent/20 bg-accent/5 p-6 shadow-[0_0_40px_-12px_rgb(13_148_136_/_0.2)]"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-accent">
            Daily Pulse
          </div>
          <div className="text-base font-bold mt-0.5">Today's study plan</div>
        </div>
        <span className="text-2xl">⚡</span>
      </div>
      <div className="space-y-2.5">
        {tasks.map((t, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm transition-all ${
              t.done ? "bg-muted/50 text-muted-foreground line-through" : "bg-background/60 text-foreground"
            }`}
          >
            <div
              className={`h-4 w-4 shrink-0 rounded-full border-2 grid place-items-center ${
                t.done ? "border-accent bg-accent" : "border-border"
              }`}
            >
              {t.done && (
                <svg viewBox="0 0 24 24" className="h-2.5 w-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              )}
            </div>
            {t.label}
          </div>
        ))}
      </div>
      <div className="mt-4 text-xs text-muted-foreground">
        {tasks.filter((t) => t.done).length}/{tasks.length} tasks completed today
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<DashboardProfile>({
    full_name: "Student",
    user_type: "tertiary",
    school: "",
    exam_date: "",
    streak: 3,
    xp: 1240,
    level: 4,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate({ to: "/login" });
        return;
      }

      const { data } = await supabase
        .from("user_profiles")
        .select("full_name,user_type,school,exam_date,streak,xp,level")
        .eq("id", user.id)
        .single();

      if (data) {
        setProfile({
          full_name: data.full_name ?? user.user_metadata?.full_name ?? "Student",
          user_type: data.user_type ?? "tertiary",
          school: data.school ?? "",
          exam_date: data.exam_date ?? "",
          streak: data.streak ?? 0,
          xp: data.xp ?? 0,
          level: data.level ?? 1,
        });
      } else {
        setProfile((p) => ({
          ...p,
          full_name: user.user_metadata?.full_name ?? "Student",
        }));
      }
      setLoading(false);
    }
    load();
  }, [navigate]);

  const isSecondary = profile.user_type === "secondary";
  const firstName = profile.full_name.split(" ")[0];

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const levelLabel = isSecondary
    ? ["JAMB Starter", "WAEC Prep", "Exam Ready", "Sharp Student", "Star Candidate"][
        Math.min(profile.level - 1, 4)
      ]
    : ["Fresher", "Sophomore", "Junior", "Senior", "Honours"][Math.min(profile.level - 1, 4)];

  const quickActions = isSecondary
    ? [
        { icon: "📝", label: "JAMB Practice", description: "Timed mock exam — 40 questions", to: "/session" },
        { icon: "📚", label: "My Subjects", description: "Manage your JAMB subjects", to: "/upload" },
        { icon: "🎙️", label: "Voice Study", description: "Listen to AI explanations", to: "/session" },
        { icon: "👥", label: "Community", description: "Get notes from other students", to: "/community" },
      ]
    : [
        { icon: "🧠", label: "Continue Learning", description: "Pick up where you left off", to: "/session" },
        { icon: "📂", label: "My Courses", description: "Manage course materials", to: "/upload" },
        { icon: "🎙️", label: "Voice Study", description: "AI-powered audio lessons", to: "/session" },
        { icon: "👥", label: "Community", description: "Share and import materials", to: "/community" },
      ];

  if (loading) {
    return (
      <AppShell>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-8 space-y-8">

        {/* Hero Greeting */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-3xl border border-accent/20 bg-gradient-to-br from-accent/10 via-background to-background p-7 shadow-[0_0_60px_-16px_rgb(13_148_136_/_0.25)]"
        >
          {/* Background glow blobs */}
          <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-accent/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-8 left-1/3 h-32 w-32 rounded-full bg-accent/10 blur-2xl" />

          <div className="relative">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-accent">{greeting} 👋</p>
                <h1 className="text-2xl font-black tracking-tight mt-1">
                  {firstName}
                </h1>
                <div className="flex items-center gap-2 mt-2">
                  <span className="rounded-full bg-accent/20 px-2.5 py-0.5 text-xs font-semibold text-accent">
                    {levelLabel}
                  </span>
                  {profile.school && (
                    <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                      {profile.school}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-3xl font-black text-accent">{profile.streak}</div>
                <div className="text-xs text-muted-foreground">day streak 🔥</div>
              </div>
            </div>

            <StreakDots streak={profile.streak} />
          </div>
        </motion.div>

        {/* Exam Countdown (secondary only) */}
        {isSecondary && profile.exam_date && (
          <ExamCountdown examDate={profile.exam_date} />
        )}

        {/* Daily Pulse */}
        <DailyPulse userType={profile.user_type} />

        {/* Stats */}
        <div>
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3"
          >
            Your Progress
          </motion.h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              icon="🔥"
              label="Day Streak"
              value={profile.streak}
              sub="Keep it going!"
              accent
              delay={0.42}
            />
            <StatCard
              icon="⚡"
              label="XP Earned"
              value={profile.xp.toLocaleString()}
              sub={`Level ${profile.level}`}
              delay={0.46}
            />
            <StatCard
              icon={isSecondary ? "📖" : "📂"}
              label={isSecondary ? "Subjects" : "Courses"}
              value="—"
              sub="Add materials"
              delay={0.5}
            />
            <StatCard
              icon="✅"
              label="Quizzes Done"
              value="—"
              sub="Start a quiz"
              delay={0.54}
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3"
          >
            Quick Actions
          </motion.h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {quickActions.map((a, i) => (
              <QuickAction key={a.label} {...a} delay={0.52 + i * 0.06} />
            ))}
          </div>
        </div>

        {/* Life Happened banner — shown if no activity today */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75 }}
          className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-5 flex items-start gap-4"
        >
          <span className="text-2xl shrink-0">💛</span>
          <div>
            <div className="text-sm font-semibold">Life Happened Mode</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Missed a few days? No stress — your plan has been adjusted. You're back on track from
              today. No streaks broken, no pressure.
            </div>
            <button
              onClick={() => navigate({ to: "/session" })}
              className="mt-3 text-xs font-semibold text-accent hover:underline"
            >
              See my updated plan →
            </button>
          </div>
        </motion.div>
      </div>
    </AppShell>
  );
}