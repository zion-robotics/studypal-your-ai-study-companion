import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Logo } from "@/components/sp/Logo";
import { ThemeToggle } from "@/components/sp/ThemeToggle";
import { supabase } from "@/lib/supabase";
import {
  friendlyAuthError,
  passwordStrength,
  validateEmail,
  validateName,
  validatePassword,
} from "@/lib/validation";
import { requireGuest } from "@/lib/guards";

export const Route = createFileRoute("/signup")({
  ssr: false,
  head: () => ({ meta: [{ title: "Sign up — StudyPal" }] }),
  beforeLoad: requireGuest,
  component: Signup,
});

function FieldError({ msg }: { msg: string | null }) {
  return (
    <AnimatePresence mode="wait">
      {msg && (
        <motion.p
          key={msg}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18 }}
          className="mt-1.5 text-xs font-medium text-red-500"
        >
          {msg}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

function Signup() {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [touched, setTouched] = useState({ name: false, email: false, password: false });
  const [submitError, setSubmitError] = useState<{ text: string; linkTo?: "/login" | "/signup" } | null>(null);
  const [loading, setLoading] = useState(false);

  const nameErr = touched.name ? validateName(name) : null;
  const emailErr = touched.email ? validateEmail(email) : null;
  const pwErr = touched.password ? validatePassword(password) : null;
  const strength = useMemo(() => passwordStrength(password), [password]);

  const formValid =
    !validateName(name) && !validateEmail(email) && !validatePassword(password);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ name: true, email: true, password: true });
    setSubmitError(null);
    if (!formValid) return;
    setLoading(true);
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: name.trim() } },
      });
      if (signUpError) throw signUpError;
      nav({ to: "/onboarding" });
    } catch (err: any) {
      setSubmitError(friendlyAuthError(err?.message ?? "Something went wrong. Try again."));
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-accent/20 hover:border-accent/50";

  return (
    <div className="flex min-h-screen">
      {/* LEFT image panel — desktop only */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between overflow-hidden bg-[#0A0A0A]">
        <img
          src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=900&q=80"
          alt="Student studying"
          className="absolute inset-0 h-full w-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-[#0A0A0A]/60" />
        <div className="relative z-10 p-10">
          <Logo />
        </div>
        <div className="relative z-10 p-10">
          <blockquote className="font-display text-2xl font-semibold leading-snug text-white">
            "The study pal every African student always needed."
          </blockquote>
          <div className="mt-4 flex items-center gap-3">
            <img
              src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=80&q=80"
              className="h-10 w-10 rounded-full object-cover"
              alt="Student"
            />
            <div>
              <p className="text-sm font-medium text-white">Amaka O.</p>
              <p className="text-xs text-white/60">UNILAG Postgrad · Using StudyPal</p>
            </div>
          </div>
          <div className="mt-8 flex gap-6 border-t border-white/10 pt-6">
            {[
              { label: "Active students", value: "2,400+" },
              { label: "Avg session", value: "12 min" },
              { label: "Completion rate", value: "84%" },
            ].map((s) => (
              <div key={s.label}>
                <p className="font-mono text-xl font-bold text-[#14B8A6]">{s.value}</p>
                <p className="text-xs text-white/50">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT form panel — full width on mobile */}
      <div className="relative flex w-full flex-col justify-center bg-background px-6 py-12 lg:w-1/2 lg:px-16">
        <div className="absolute right-5 top-5">
          <ThemeToggle />
        </div>
        <div className="mb-8 flex justify-center lg:hidden">
          <Logo />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto w-full max-w-sm"
        >
          <div className="mb-8">
            <p className="font-mono text-xs uppercase tracking-widest text-accent">Get started free</p>
            <h1 className="font-display mt-2 text-4xl font-semibold tracking-tight">
              Start studying smarter.
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              No credit card. No pressure. Just learning.
            </p>
          </div>

          <AnimatePresence>
            {submitError && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              >
                {submitError.text}{" "}
                {submitError.linkTo && (
                  <Link to={submitError.linkTo} className="font-semibold underline underline-offset-2">
                    {submitError.linkTo === "/login" ? "Log in" : "Sign up"}
                  </Link>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Full name */}
            <div>
              <label className="font-mono block text-xs uppercase tracking-widest text-muted-foreground">
                Full name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (submitError) setSubmitError(null);
                }}
                onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                placeholder="Amara Okeke"
                className={`${inputCls} mt-2 ${nameErr ? "border-red-500 focus:border-red-500" : "border-border focus:border-accent"}`}
              />
              <FieldError msg={nameErr} />
            </div>

            {/* Email */}
            <div>
              <label className="font-mono block text-xs uppercase tracking-widest text-muted-foreground">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (submitError) setSubmitError(null);
                }}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                placeholder="you@school.edu.ng"
                className={`${inputCls} mt-2 ${emailErr ? "border-red-500 focus:border-red-500" : "border-border focus:border-accent"}`}
              />
              <FieldError msg={emailErr} />
            </div>

            {/* Password */}
            <div>
              <label className="font-mono block text-xs uppercase tracking-widest text-muted-foreground">
                Password
              </label>
              <div className="relative mt-2">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (submitError) setSubmitError(null);
                  }}
                  onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                  placeholder="At least 8 characters"
                  className={`${inputCls} pr-11 ${pwErr ? "border-red-500 focus:border-red-500" : "border-border focus:border-accent"}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-muted-foreground hover:text-foreground"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          i <= strength.score ? strength.color : "bg-muted"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {strength.label}
                  </p>
                </div>
              )}
              <FieldError msg={pwErr} />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-press mt-2 w-full rounded-xl bg-accent py-3.5 text-sm font-semibold text-accent-foreground transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating your account…
                </span>
              ) : (
                "Create Free Account →"
              )}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">secure · encrypted · private</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-accent underline-offset-4 hover:underline">
              Log in
            </Link>
          </p>

          <div className="mt-8 flex items-center justify-center gap-4 opacity-50">
            {["UNILAG", "LASU", "UI", "FUNAAB", "ABU"].map((school) => (
              <span
                key={school}
                className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground"
              >
                {school}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}