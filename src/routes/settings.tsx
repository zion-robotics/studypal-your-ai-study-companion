import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { AppShell } from "@/components/sp/AppShell";
import { ThemeToggle } from "@/components/sp/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { requireAuth } from "@/lib/guards";

export const Route = createFileRoute("/settings")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: "Settings — StudyPal" }] }),
  component: SettingsPage,
});

type Form = {
  full_name: string;
  school_name: string;
  course: string;
  level: string;
  hours_per_day: number;
  learning_mode: "voice" | "text" | "mixed";
  notifications_enabled: boolean;
  user_type: "tertiary" | "secondary";
};

function SettingsPage() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState("");
  const [form, setForm] = useState<Form>({
    full_name: "",
    school_name: "",
    course: "",
    level: "",
    hours_per_day: 1,
    learning_mode: "mixed",
    notifications_enabled: true,
    user_type: "secondary",
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email ?? "");
      const { data } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      setForm((f) => ({
        ...f,
        full_name: data?.full_name ?? user.user_metadata?.full_name ?? "",
        school_name: data?.school_name ?? "",
        course: data?.course ?? "",
        level: data?.level ?? "",
        hours_per_day: data?.hours_per_day ?? 1,
        learning_mode: (data?.learning_mode as Form["learning_mode"]) ?? "mixed",
        notifications_enabled: data?.notifications_enabled ?? true,
        user_type: (data?.user_type as Form["user_type"]) ?? "secondary",
      }));
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  async function save() {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase
        .from("user_profiles")
        .upsert({ user_id: user.id, ...form }, { onConflict: "user_id" });
      if (error) {
        toast.error("Couldn't save. Try again.");
      } else {
        await supabase.auth.updateUser({ data: { full_name: form.full_name } });
        toast.success("Settings saved.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    nav({ to: "/login" });
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-5 py-10 md:px-10">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="font-display text-3xl tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">{email}</p>
        </motion.div>

        {loading ? (
          <div className="mt-10 text-sm text-muted-foreground">Loading…</div>
        ) : (
          <div className="mt-8 space-y-6">
            {/* Appearance */}
            <section className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-display text-lg">Appearance</h2>
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Theme</div>
                  <div className="text-xs text-muted-foreground">Switch between light and dark.</div>
                </div>
                <ThemeToggle />
              </div>
            </section>

            {/* Profile */}
            <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <h2 className="font-display text-lg">Profile</h2>
              <Field label="Full name">
                <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              </Field>
              <Field label="I am a">
                <Select value={form.user_type} onValueChange={(v) => setForm({ ...form, user_type: v as Form["user_type"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="secondary">Secondary student (JAMB / WAEC)</SelectItem>
                    <SelectItem value="tertiary">University student</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label={form.user_type === "tertiary" ? "University" : "School"}>
                <Input value={form.school_name} onChange={(e) => setForm({ ...form, school_name: e.target.value })} />
              </Field>
              {form.user_type === "tertiary" && (
                <>
                  <Field label="Course / Major">
                    <Input value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} />
                  </Field>
                  <Field label="Level">
                    <Input value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} placeholder="e.g. 200 level" />
                  </Field>
                </>
              )}
            </section>

            {/* Study */}
            <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <h2 className="font-display text-lg">Study preferences</h2>
              <Field label="Hours per day">
                <Input
                  type="number"
                  min={0.5}
                  max={12}
                  step={0.5}
                  value={form.hours_per_day}
                  onChange={(e) => setForm({ ...form, hours_per_day: Number(e.target.value) || 1 })}
                />
              </Field>
              <Field label="Learning mode">
                <Select value={form.learning_mode} onValueChange={(v) => setForm({ ...form, learning_mode: v as Form["learning_mode"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mixed">Mixed (voice + text)</SelectItem>
                    <SelectItem value="voice">Voice-first</SelectItem>
                    <SelectItem value="text">Text-only</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </section>

            {/* Notifications */}
            <section className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-display text-lg">Notifications</h2>
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Daily study reminders</div>
                  <div className="text-xs text-muted-foreground">A gentle nudge so you don't break your streak.</div>
                </div>
                <Switch
                  checked={form.notifications_enabled}
                  onCheckedChange={(c) => setForm({ ...form, notifications_enabled: c })}
                />
              </div>
            </section>

            {/* Actions */}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button variant="ghost" onClick={signOut} className="text-muted-foreground hover:text-destructive">
                Sign out
              </Button>
              <Button onClick={save} disabled={saving} className="bg-accent text-accent-foreground hover:bg-accent/90">
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}