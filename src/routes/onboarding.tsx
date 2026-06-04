import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Logo } from "@/components/sp/Logo";
import { ThemeToggle } from "@/components/sp/ThemeToggle";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Onboarding — StudyPal" }] }),
  component: Onboarding,
});

function Onboarding() {
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [subject, setSubject] = useState("");
  const [goal, setGoal] = useState("");
  const [date, setDate] = useState("");
  const [hours, setHours] = useState(1.5);
  const [voice, setVoice] = useState(true);
  const [notif, setNotif] = useState(true);

  return (
    <div className="min-h-screen bg-background px-5 py-8">
      <div className="mx-auto flex max-w-3xl items-center justify-between">
        <Logo />
        <ThemeToggle />
      </div>

      <div className="mx-auto mt-12 max-w-2xl">
        <div className="mb-10 flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition ${i <= step ? "bg-accent" : "bg-muted"}`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.4 }}
            className="rounded-3xl border border-border bg-card p-8"
          >
            {step === 0 && (
              <>
                <div className="font-mono text-xs text-muted-foreground">STEP 01 / 03</div>
                <h2 className="mt-2 font-display text-3xl md:text-4xl">What are you studying?</h2>
                <p className="mt-2 text-muted-foreground">
                  Tell us the subject or course. Be specific — it helps the AI.
                </p>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. JAMB Biology, Digital Marketing"
                  className="mt-8 w-full rounded-xl border border-border bg-background px-4 py-4 text-lg outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
                />
              </>
            )}

            {step === 1 && (
              <>
                <div className="font-mono text-xs text-muted-foreground">STEP 02 / 03</div>
                <h2 className="mt-2 font-display text-3xl md:text-4xl">Set your goal.</h2>
                <p className="mt-2 text-muted-foreground">What does "done" look like, and when?</p>
                <div className="mt-8 space-y-5">
                  <label className="block">
                    <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                      Your goal
                    </span>
                    <textarea
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                      rows={3}
                      placeholder="Pass JAMB Biology with at least 70%"
                      className="mt-2 w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
                    />
                  </label>
                  <label className="block">
                    <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                      Ready by
                    </span>
                    <input
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      type="date"
                      className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
                    />
                  </label>
                  <label className="block">
                    <div className="flex justify-between font-mono text-xs uppercase tracking-wider text-muted-foreground">
                      <span>Hours available per day</span>
                      <span className="text-accent">{hours.toFixed(1)} h</span>
                    </div>
                    <input
                      type="range"
                      min={0.5}
                      max={4}
                      step={0.5}
                      value={hours}
                      onChange={(e) => setHours(parseFloat(e.target.value))}
                      className="mt-3 w-full accent-[oklch(0.66_0.19_38)]"
                    />
                  </label>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="font-mono text-xs text-muted-foreground">STEP 03 / 03</div>
                <h2 className="mt-2 font-display text-3xl md:text-4xl">
                  How do you want to learn?
                </h2>
                <p className="mt-2 text-muted-foreground">Adjust later, anytime.</p>
                <div className="mt-8 space-y-3">
                  <Toggle
                    label="Voice mode — AI reads to you"
                    checked={voice}
                    onChange={setVoice}
                  />
                  <Toggle label="Daily nudges & reminders" checked={notif} onChange={setNotif} />
                </div>
              </>
            )}

            <div className="mt-10 flex items-center justify-between">
              <button
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
                className="rounded-full px-4 py-2 text-sm text-muted-foreground disabled:opacity-30"
              >
                ← Back
              </button>

              {step < 2 ? (
                <button
                  onClick={() => setStep((s) => s + 1)}
                  className="btn-press rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-foreground"
                >
                  Continue
                </button>
              ) : (
                <button
                  onClick={() => nav({ to: "/dashboard" })}
                  className="btn-press rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-foreground"
                >
                  Build My Study Plan
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between rounded-xl border border-border bg-background px-4 py-4 text-left text-sm transition hover:border-accent"
    >
      <span>{label}</span>
      <span
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${checked ? "bg-accent" : "bg-muted"}`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-background transition ${checked ? "translate-x-5" : "translate-x-1"}`}
        />
      </span>
    </button>
  );
}
