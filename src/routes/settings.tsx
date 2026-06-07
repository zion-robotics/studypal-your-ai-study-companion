import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, forwardRef } from "react";
import { motion } from "framer-motion";
import {
  User,
  GraduationCap,
  Headphones,
  Palette,
  Bell,
  Mic2,
  Shield,
  LogOut,
  Check,
  BookOpen,
  Sparkles,
  School,
  Building2,
  Type,
  AudioLines,
  Zap,
} from "lucide-react";
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

const NAV = [
  { id: "profile", label: "Profile", icon: User },
  { id: "studying", label: "Studying for", icon: GraduationCap },
  { id: "learning", label: "Learning mode", icon: Headphones },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "voice", label: "Voice", icon: Mic2 },
  { id: "account", label: "Account", icon: Shield },
] as const;

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/60 transition";

const Section = forwardRef<
  HTMLElement,
  {
    id: string;
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    children: React.ReactNode;
  }
>(function Section({ id, title, description, icon: Icon, children }, ref) {
  return (
    <motion.section
      ref={ref}
      id={id}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.4 }}
      className="scroll-mt-24 rounded-2xl border border-border bg-card"
    >
      <header className="flex items-start gap-3 border-b border-border/60 px-6 py-5">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">{title}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
      </header>
      <div className="px-6 py-6">{children}</div>
    </motion.section>
  );
});

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
      <div className="min-w-0">
        <div className="text-sm font-medium text-foreground">{label}</div>
        {description && (
          <div className="mt-0.5 text-xs text-muted-foreground">{description}</div>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent/40 ${
          checked ? "bg-accent" : "bg-muted"
        }`}
      >
        <span
          className={`pointer-events-none mt-[1px] inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow ring-0 transition duration-200 ${
            checked ? "translate-x-[22px]" : "translate-x-[2px]"
          }`}
        />
      </button>
    </div>
  );
}

function OptionCard<T extends string>({
  active,
  onClick,
  icon: Icon,
  label,
  description,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex flex-col gap-2 rounded-xl border p-4 text-left transition-all duration-200 ${
        active
          ? "border-accent/70 bg-accent/[0.06] shadow-[0_0_0_4px_rgb(var(--accent-rgb)/0.04)]"
          : "border-border bg-background hover:border-foreground/20"
      }`}
    >
      <div className="flex items-center justify-between">
        <div
          className={`grid h-8 w-8 place-items-center rounded-lg transition ${
            active ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
          }`}
        >
          <Icon className="h-4 w-4" />
        </div>
        {active && (
          <span className="grid h-5 w-5 place-items-center rounded-full bg-accent text-accent-foreground">
            <Check className="h-3 w-3" strokeWidth={3} />
          </span>
        )}
      </div>
      <div>
        <div className="text-sm font-semibold text-foreground">{label}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">{description}</div>
      </div>
    </button>
  );
}

function SettingsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [activeNav, setActiveNav] = useState<string>("profile");
  const initialRef = useRef<Profile | null>(null);

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
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate({ to: "/login" });
        return;
      }
      setUserId(user.id);
      setEmail(user.email ?? "");

      const { data } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      const next: Profile = data
        ? {
            full_name: data.full_name ?? user.user_metadata?.full_name ?? "",
            school_name: data.school_name ?? "",
            user_type: data.user_type ?? "tertiary",
            learning_mode: data.learning_mode ?? "mixed",
            notifications_enabled: data.notifications_enabled ?? true,
            voice_id: data.voice_id ?? "default",
            exam_date: data.exam_date ?? "",
          }
        : {
            full_name: user.user_metadata?.full_name ?? "",
            school_name: "",
            user_type: "tertiary",
            learning_mode: "mixed",
            notifications_enabled: true,
            voice_id: "default",
            exam_date: "",
          };

      setProfile(next);
      initialRef.current = next;
      setLoading(false);
    }
    load();
  }, [navigate]);

  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const setSectionRef = (id: string) => (el: HTMLElement | null) => {
    if (el) sectionRefs.current.set(id, el);
    else sectionRefs.current.delete(id);
  };

  useEffect(() => {
    if (loading) return;

    const obs = new IntersectionObserver(
      (entries) => {
        // Pick the topmost intersecting section
        const intersecting = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => {
            const rectA = a.boundingClientRect.top;
            const rectB = b.boundingClientRect.top;
            return rectA - rectB;
          });
        if (intersecting.length > 0) {
          setActiveNav(intersecting[0].target.id);
        }
      },
      {
        root: scrollContainerRef.current,
        rootMargin: "-15% 0px -70% 0px",
        threshold: 0,
      },
    );

    sectionRefs.current.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [loading]);

  const dirty = useMemo(() => {
    if (!initialRef.current) return false;
    return JSON.stringify(initialRef.current) !== JSON.stringify(profile);
  }, [profile]);

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
    if (error) {
      toast.error("Could not save: " + error.message);
    } else {
      toast.success("Settings saved");
      initialRef.current = profile;
    }
  }

  function handleReset() {
    if (initialRef.current) setProfile(initialRef.current);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  }

  const isSecondary = profile.user_type === "secondary";
  const initials =
    profile.full_name
      .trim()
      .split(/\s+/)
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";

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
      <div ref={scrollContainerRef} className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-6xl px-4 pb-32 pt-10 sm:px-6 lg:px-8">
        {/* Page header */}
        <motion.header
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-8 flex flex-col gap-5 border-b border-border pb-8 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-accent to-accent/60 text-lg font-semibold text-accent-foreground shadow-sm">
              {initials}
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Settings
              </p>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {profile.full_name || "Your account"}
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">{email}</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-border bg-card/50 px-3 py-1.5 text-xs text-muted-foreground sm:inline-flex">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            <span>
              {isSecondary ? "Secondary track" : "Tertiary track"} · {profile.learning_mode} mode
            </span>
          </div>
        </motion.header>

        <div className="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)]">
          {/* Sidebar */}
          <aside className="hidden lg:block">
            <nav className="sticky top-24 space-y-1">
              {NAV.map((item) => {
                const Icon = item.icon;
                const active = activeNav === item.id;
                return (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                      active
                        ? "bg-accent/10 font-medium text-foreground"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 ${active ? "text-accent" : "text-muted-foreground"}`}
                    />
                    {item.label}
                  </a>
                );
              })}
            </nav>
          </aside>

          {/* Content */}
          <div className="space-y-6">
            <Section
              ref={setSectionRef("profile")}
              id="profile"
              title="Profile"
              description="Your identity across the platform."
              icon={User}
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Full name">
                  <input
                    className={inputClass}
                    value={profile.full_name}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, full_name: e.target.value }))
                    }
                    placeholder="Your name"
                  />
                </Field>
                <Field label="Email" hint="Read-only">
                  <input
                    className={`${inputClass} cursor-not-allowed opacity-60`}
                    value={email}
                    readOnly
                  />
                </Field>
                <Field
                  label={isSecondary ? "School / College" : "University / Institution"}
                >
                  <input
                    className={inputClass}
                    value={profile.school_name}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, school_name: e.target.value }))
                    }
                    placeholder={
                      isSecondary
                        ? "e.g. Lagos State Model College"
                        : "e.g. University of Lagos"
                    }
                  />
                </Field>
                {isSecondary && (
                  <Field label="Target exam date" hint="JAMB / WAEC">
                    <input
                      type="date"
                      className={inputClass}
                      value={profile.exam_date}
                      onChange={(e) =>
                        setProfile((p) => ({ ...p, exam_date: e.target.value }))
                      }
                    />
                  </Field>
                )}
              </div>
            </Section>

            <Section
              id="studying"
              title="Studying for"
              description="We'll tune lessons and difficulty to your track."
              icon={GraduationCap}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <OptionCard
                  active={profile.user_type === "secondary"}
                  onClick={() => setProfile((p) => ({ ...p, user_type: "secondary" }))}
                  icon={School}
                  label="JAMB / WAEC"
                  description="Secondary school & entrance exams"
                />
                <OptionCard
                  active={profile.user_type === "tertiary"}
                  onClick={() => setProfile((p) => ({ ...p, user_type: "tertiary" }))}
                  icon={Building2}
                  label="University"
                  description="Higher institution courses"
                />
              </div>
            </Section>

            <Section
              id="learning"
              title="Learning mode"
              description="Choose how you absorb new material."
              icon={Headphones}
            >
              <div className="grid gap-3 sm:grid-cols-3">
                <OptionCard
                  active={profile.learning_mode === "text"}
                  onClick={() => setProfile((p) => ({ ...p, learning_mode: "text" }))}
                  icon={Type}
                  label="Text"
                  description="Read lessons and quizzes"
                />
                <OptionCard
                  active={profile.learning_mode === "voice"}
                  onClick={() => setProfile((p) => ({ ...p, learning_mode: "voice" }))}
                  icon={AudioLines}
                  label="Voice"
                  description="Listen and speak with AI"
                />
                <OptionCard
                  active={profile.learning_mode === "mixed"}
                  onClick={() => setProfile((p) => ({ ...p, learning_mode: "mixed" }))}
                  icon={Zap}
                  label="Mixed"
                  description="Best of both worlds"
                />
              </div>
            </Section>

            <Section
              id="appearance"
              title="Appearance"
              description="How the interface looks on your device."
              icon={Palette}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-foreground">Theme</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    Switch between light and dark mode.
                  </div>
                </div>
                <ThemeToggle />
              </div>
            </Section>

            <Section
              id="notifications"
              title="Notifications"
              description="Stay on track with gentle, useful nudges."
              icon={Bell}
            >
              <Toggle
                checked={profile.notifications_enabled}
                onChange={(v) =>
                  setProfile((p) => ({ ...p, notifications_enabled: v }))
                }
                label="Study reminders"
                description="Daily nudges to keep your streak alive."
              />
            </Section>

            <Section
              id="voice"
              title="Voice"
              description="AethexAI voice configuration."
              icon={Mic2}
            >
              <Field
                label="Preferred voice ID"
                hint="Leave as default or paste a voice UUID"
              >
                <input
                  className={inputClass}
                  value={profile.voice_id}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, voice_id: e.target.value }))
                  }
                  placeholder="default"
                />
              </Field>
              <p className="mt-3 flex items-start gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
                <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                Browse the AethexAI catalog to find voices that match your study style.
              </p>
            </Section>

            <Section
              id="account"
              title="Account"
              description="Manage your session and access."
              icon={Shield}
            >
              <div className="flex items-center justify-between gap-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                <div>
                  <div className="text-sm font-medium text-foreground">Sign out</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    End your session on this device.
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 rounded-lg border border-destructive/40 bg-background px-4 py-2 text-sm font-medium text-destructive transition hover:bg-destructive hover:text-destructive-foreground"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </Section>
          </div>
        </div>
      </div>

      {/* Sticky save bar */}
      <motion.div
        initial={false}
        animate={{ y: dirty ? 0 : 120, opacity: dirty ? 1 : 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
        className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4"
      >
        <div className="pointer-events-auto flex w-full max-w-2xl items-center justify-between gap-4 rounded-2xl border border-border bg-card/95 px-4 py-3 shadow-lg backdrop-blur">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent/60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            You have unsaved changes
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
            >
              Discard
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition hover:opacity-90 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      </motion.div>
      </div>
    </AppShell>
  );
}