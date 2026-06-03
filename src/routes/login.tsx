import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { Logo } from "@/components/sp/Logo";
import { ThemeToggle } from "@/components/sp/ThemeToggle";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Log in — StudyPal" }] }),
  component: Login,
});

function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw signInError;
      nav({ to: "/dashboard" });
    } catch (err: any) {
      setError(err.message ?? "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* LEFT — Image Panel */}
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

      {/* RIGHT — Form Panel */}
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
            <p className="font-mono text-xs uppercase tracking-widest text-accent">
              Welcome back
            </p>
            <h1 className="font-display mt-2 text-4xl font-semibold tracking-tight">
              Pick up where you left off.
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your streak is waiting.
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="font-mono block text-xs uppercase tracking-widest text-muted-foreground">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@school.edu.ng"
                className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-all duration-200 focus:border-accent focus:ring-2 focus:ring-accent/20 hover:border-accent/50"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="font-mono block text-xs uppercase tracking-widest text-muted-foreground">
                  Password
                </label>
                <button
                  type="button"
                  className="text-xs text-accent underline-offset-4 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-all duration-200 focus:border-accent focus:ring-2 focus:ring-accent/20 hover:border-accent/50"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-press mt-2 w-full rounded-xl bg-accent py-3.5 text-sm font-semibold text-accent-foreground transition disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Logging you in...
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

          <div className="mt-8 flex items-center justify-center gap-4 opacity-50">
            {["UNILAG", "LASU", "UI", "FUNAAB", "ABU"].map((school) => (
              <span key={school} className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {school}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}