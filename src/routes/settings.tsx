import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AppShell } from "@/components/sp/AppShell";
import { ThemeToggle } from "@/components/sp/ThemeToggle";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

type UserType = "secondary" | "tertiary";
type LearningMode = "text" | "voice" | "mixed";

interface Profile {
  full_name: string;
  school_name: string;
  user_type: UserType;
  learning_mode: LearningMode;
  notifications_enabled: boolean;
  voice_id: string;
  exam_date: string;
}

const SECTION = "rounded-2xl border border-border bg-card p-6 space-y-5";
const LABEL = "text-sm font-medium text-foreground";
const INPUT =
  "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition";

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className={LABEL}>{label}</div>
        {description && <div className="text-xs text-muted-foreground mt-0.5">{description}</div>}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent/50 ${
          checked ? "bg-accent" : "bg-muted"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

function RadioGroup<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; description: string; icon: string }[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex flex-col gap-1.5 rounded-xl border p-4 text-left transition-all duration-200 ${
            value === opt.value
              ? "border-accent bg-accent/10 text-accent"
              : "border-border bg-background text-muted-foreground hover:border-accent/40 hover:text-foreground"
          }`}
        >
          <span className="text-xl">{opt.icon}</span>
          <span className="text-sm font-semibold text-foreground">{opt.label}</span>
          <span className="text-xs text-muted-foreground">{opt.description}</span>
        </button>
      ))}
    </div>
  );
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  const [profile, setProfile] = useState<Profile>({
    full_name: "",
    school_name: "",
    user_type: "tertiary",
    learning_mode: "mixed",
    notifications_enabled: true,
    voice_id: "default",
    exam_date: "",
  });

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate({ to: "/login" }); return; }
      setUserId(user.id);
      setEmail(user.email ?? "");

      const { data } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setProfile({
          full_name: data.full_name ?? user.user_metadata?.full_name ?? "",
          school_name: data.school_name ?? "",
          user_type: data.user_type ?? "tertiary",
          learning_mode: data.learning_mode ?? "mixed",
          notifications_enabled: data.notifications_enabled ?? true,
          voice_id: data.voice_id ?? "default",
          exam_date: data.exam_date ?? "",
        });
      } else {
        setProfile((p) => ({ ...p, full_name: user.user_metadata?.full_name ?? "" }));
      }
      setLoading(false);
    }
    load();
  }, [navigate]);

  async function handleSave() {
    if (!userId) return;
    setSaving(true);
    const { error } = await supabase.from("user_profiles").upsert(
      {
        user_id: userId,
        full_name: profile.full_name,
        school_name: profile.school_name,
        user_type: profile.user_type,
        learning_mode: profile.learning_mode,
        notifications_enabled: profile.notifications_enabled,
        voice_id: profile.voice_id,
        exam_date: profile.exam_date || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    setSaving(false);
    if (error) toast.error("Could not save: " + error.message);
    else toast.success("Settings saved!");
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  }

  const isSecondary = profile.user_type === "secondary";
  const fade = {
    hidden: { opacity: 0, y: 16 },
    show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07 } }),
  };

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
      <div className="mx-auto max-w-2xl px-4 py-10 space-y-8">
        <motion.div initial="hidden" animate="show" custom={0} variants={fade}>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your profile, preferences, and account.</p>
        </motion.div>

        {/* Profile */}
        <motion.section initial="hidden" animate="show" custom={1} variants={fade} className={SECTION}>
          <h2 className="text-base font-semibold">Profile</h2>
          <div className="space-y-4">
            <div>
              <label className={LABEL}>Full name</label>
              <input className={`${INPUT} mt-1.5`} value={profile.full_name}
                onChange={(e) => setProfile((p) => ({ ...p, full_name: e.target.value }))}
                placeholder="Your name" />
            </div>
            <div>
              <label className={LABEL}>Email</label>
              <input className={`${INPUT} mt-1.5 opacity-60 cursor-not-allowed`} value={email} readOnly />
            </div>
            <div>
              <label className={LABEL}>{isSecondary ? "School / College" : "University / Institution"}</label>
              <input className={`${INPUT} mt-1.5`} value={profile.school_name}
                onChange={(e) => setProfile((p) => ({ ...p, school_name: e.target.value }))}
                placeholder={isSecondary ? "e.g. Lagos State Model College" : "e.g. University of Lagos"} />
            </div>
            {isSecondary && (
              <div>
                <label className={LABEL}>Target Exam Date (JAMB / WAEC)</label>
                <input type="date" className={`${INPUT} mt-1.5`} value={profile.exam_date}
                  onChange={(e) => setProfile((p) => ({ ...p, exam_date: e.target.value }))} />
              </div>
            )}
          </div>
        </motion.section>

        {/* User Type */}
        <motion.section initial="hidden" animate="show" custom={2} variants={fade} className={SECTION}>
          <h2 className="text-base font-semibold">I am studying for…</h2>
          <RadioGroup<UserType>
            value={profile.user_type}
            onChange={(v) => setProfile((p) => ({ ...p, user_type: v }))}
            options={[
              { value: "secondary", label: "JAMB / WAEC", description: "Secondary school & entrance exams", icon: "📚" },
              { value: "tertiary", label: "University", description: "Higher institution courses", icon: "🎓" },
            ]}
          />
        </motion.section>

        {/* Learning Mode */}
        <motion.section initial="hidden" animate="show" custom={3} variants={fade} className={SECTION}>
          <h2 className="text-base font-semibold">Learning Mode</h2>
          <RadioGroup<LearningMode>
            value={profile.learning_mode}
            onChange={(v) => setProfile((p) => ({ ...p, learning_mode: v }))}
            options={[
              { value: "text", label: "Text", description: "Read lessons and quizzes", icon: "📖" },
              { value: "voice", label: "Voice", description: "Listen and speak with AI", icon: "🎙️" },
              { value: "mixed", label: "Mixed", description: "Best of both", icon: "⚡" },
            ]}
          />
        </motion.section>

        {/* Appearance */}
        <motion.section initial="hidden" animate="show" custom={4} variants={fade} className={SECTION}>
          <h2 className="text-base font-semibold">Appearance</h2>
          <div className="flex items-center justify-between">
            <div>
              <div className={LABEL}>Theme</div>
              <div className="text-xs text-muted-foreground mt-0.5">Switch between light and dark mode</div>
            </div>
            <ThemeToggle />
          </div>
        </motion.section>

        {/* Notifications */}
        <motion.section initial="hidden" animate="show" custom={5} variants={fade} className={SECTION}>
          <h2 className="text-base font-semibold">Notifications</h2>
          <Toggle
            checked={profile.notifications_enabled}
            onChange={(v) => setProfile((p) => ({ ...p, notifications_enabled: v }))}
            label="Study reminders"
            description="Daily nudges to keep your streak alive"
          />
        </motion.section>

        {/* Voice */}
        <motion.section initial="hidden" animate="show" custom={6} variants={fade} className={SECTION}>
          <h2 className="text-base font-semibold">Voice (AethexAI)</h2>
          <div>
            <label className={LABEL}>Preferred voice ID</label>
            <input className={`${INPUT} mt-1.5`} value={profile.voice_id}
              onChange={(e) => setProfile((p) => ({ ...p, voice_id: e.target.value }))}
              placeholder="default" />
            <p className="text-xs text-muted-foreground mt-1.5">
              Leave as "default" or paste a voice UUID from the AethexAI catalog.
            </p>
          </div>
        </motion.section>

        {/* Actions */}
        <motion.div initial="hidden" animate="show" custom={7} variants={fade}
          className="flex flex-col sm:flex-row gap-3 pt-2">
          <button onClick={handleSave} disabled={saving}
            className="flex-1 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition hover:opacity-90 disabled:opacity-60 shadow-[0_0_20px_-4px_rgb(13_148_136_/_0.4)]">
            {saving ? "Saving…" : "Save changes"}
          </button>
          <button onClick={handleLogout}
            className="flex-1 rounded-xl border border-border px-6 py-3 text-sm font-medium text-muted-foreground transition hover:border-destructive hover:text-destructive">
            Sign out
          </button>
        </motion.div>
      </div>
    </AppShell>
  );
}