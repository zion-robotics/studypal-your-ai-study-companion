import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { Logo } from "@/components/sp/Logo";
import { ThemeToggle } from "@/components/sp/ThemeToggle";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Sign up — StudyPal" }] }),
  component: Signup,
});

function Signup() {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      });
      if (signUpError) throw signUpError;
      nav({ to: "/onboarding" });
    } catch (err: any) {
      setError(err.message ?? "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* LEFT — Image Panel */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between overflow-hidden bg-[#0A0A0A]">
        <img
          src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=900&q=80"
          alt="Student studying"
          className="absolute inset-0 h-full w-full object-cover opacity-50"
        />
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-[#0A0A0A]/60" />

        {/* Top logo */}
        <div className="relative z-10 p-10">
          <Logo />
        </div>

        {/* Bottom quote */}
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
          {/* Stats row */}
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

      {/* RIGHT — Form Panel */}
      <div className="relative flex w-full flex-col justify-center bg-background px-6 py-12 lg:w-1/2 lg:px-16">
        <div className="absolute right-5 top-5">
          <ThemeToggle />
        </div>

        {/* Mobile logo */}
        <div className="mb-8 flex justify-center lg:hidden">
          <Logo />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto w-full max-w-sm"
        >
          {/* Header */}
          <div className="mb-8">
            <p className="font-mono text-xs uppercase tracking-widest text-accent">
              Get started free
            </p>
            <h1 className="font-display mt-2 text-4xl font-semibold tracking-tight">
              Start studying smarter.
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              No credit card. No pressure. Just learning.
            </p>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {error}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {[
              {
                label: "Full name",
                type: "text",
                value: name,
                setter: setName,
                placeholder: "Amara Okeke",
              },
              {
                label: "Email address",
                type: "email",
                value: email,
                setter: setEmail,
                placeholder: "you@school.edu.ng",
              },
              {
                label: "Password",
                type: "password",
                value: password,
                setter: setPassword,
                placeholder: "At least 8 characters",
              },
            ].map((field) => (
              <div key={field.label}>
                <label className="font-mono block text-xs uppercase tracking-widest text-muted-foreground">
                  {field.label}
                </label>
                <input
                  type={field.type}
                  required
                  minLength={field.type === "password" ? 8 : undefined}
                  value={field.value}
                  onChange={(e) => field.setter(e.target.value)}
                  placeholder={field.placeholder}
                  className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-all duration-200 focus:border-accent focus:ring-2 focus:ring-accent/20 hover:border-accent/50"
                />
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              className="btn-press mt-2 w-full rounded-xl bg-accent py-3.5 text-sm font-semibold text-accent-foreground transition disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Creating your account...
                </span>
              ) : (
                "Create Free Account →"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">secure · encrypted · private</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Footer link */}
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-accent underline-offset-4 hover:underline"
            >
              Log in
            </Link>
          </p>

          {/* Trust badges */}
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
