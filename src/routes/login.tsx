import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Logo } from "@/components/sp/Logo";
import { ThemeToggle } from "@/components/sp/ThemeToggle";
import { supabase } from "@/lib/supabase";
import { friendlyAuthError, validateEmail } from "@/lib/validation";
import { requireGuest } from "@/lib/guards";

type LoginSearchParams = {
  email?: string;
  message?: string;
};

export const Route = createFileRoute("/login")({
  ssr: false,
  head: () => ({ meta: [{ title: "Log in — StudyPal" }] }),
  beforeLoad: requireGuest,
  validateSearch: (search: Record<string, unknown>): LoginSearchParams => ({
    email: search.email as string | undefined,
    message: search.message as string | undefined,
  }),
  component: Login,
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

function Login() {
  const nav = useNavigate();
  const search = Route.useSearch();
  
  const [email, setEmail] = useState(search.email ?? "");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [submitError, setSubmitError] = useState<{ text: string; linkTo?: "/login" | "/signup" } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (search.message) {
      setSubmitError({ text: search.message });
    }
  }, [search.message]);

  const emailErr = touched.email ? validateEmail(email) : null;
  const pwErr = touched.password && !password ? "Enter your password" : null;
  const formValid = !validateEmail(email) && password.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ email: true, password: true });
    setSubmitError(null);
    if (!formValid) return;
    setLoading(true);
    
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      
      if (signInError) throw signInError;
      
      nav({ to: "/dashboard" });
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
          src="https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=900&q=80"
          alt="Student with laptop"
          className="absolute inset-0 h-full w-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-[#0A0A0A]/60" />
        <div className="relative z-10 p-10">
          <Logo />
        </div>
        <div className="relative z-10 p-10">
          <blockquote className="font-display text-2xl font-semibold leading-snug text-white">
            "It actually checks if I understood — not just if I watched."
          </blockquote>
          <div className="mt-4 flex items-center gap-3">
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&q=80"
              className="h-10 w-10 rounded-full object-cover"
              alt="Student"
            />
            <div>
              <p className="text-sm font-medium text-white">Emeka T.</p>
              <p className="text-xs text-white/60">300L Engineering · Studying while working</p>
            </div>
          </div>
          <div className="mt-8 flex gap-6 border-t border-white/10 pt-6">
            {[
              { label: "Sessions today", value: "1,847" },
              { label: "Topics covered", value: "9,200+" },
              { label: "Avg score", value: "78%" },
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
            <p className="font-mono text-xs uppercase tracking-widest text-accent">Welcome back</p>
            <h1 className="font-display mt-2 text-4xl font-semibold tracking-tight">
              Pick up where you left off.
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">Your streak is waiting.</p>
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

            <div>
              <div className="flex items-center justify-between">
                <label className="font-mono block text-xs uppercase tracking-widest text-muted-foreground">
                  Password
                </label>
                <button type="button" className="text-xs text-accent underline-offset-4 hover:underline">
                  Forgot password?
                </button>
              </div>
              <div className="relative mt-2">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (submitError) setSubmitError(null);
                  }}
                  onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                  placeholder="••••••••"
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
                  Logging you in…
                </span>
              ) : (
                "Continue with Email →"
              )}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">secure · encrypted · private</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <p className="text-center text-sm text-muted-foreground">
            New to StudyPal?{" "}
            <Link to="/signup" className="font-semibold text-accent underline-offset-4 hover:underline">
              Create a free account
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
