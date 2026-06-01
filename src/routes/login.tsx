import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { Logo } from "@/components/sp/Logo";
import { ThemeToggle } from "@/components/sp/ThemeToggle";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Log in — StudyPal" }] }),
  component: Login,
});

function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  return (
    <div className="relative grid min-h-screen place-items-center bg-background px-5">
      <div className="absolute right-5 top-5"><ThemeToggle /></div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
        <div className="mb-10 flex justify-center"><Logo /></div>
        <div className="rounded-3xl border border-border bg-card p-8">
          <h1 className="font-display text-3xl">Welcome back.</h1>
          <p className="mt-2 text-sm text-muted-foreground">Pick up where you left off.</p>
          <form onSubmit={(e) => { e.preventDefault(); nav({ to: "/dashboard" }); }} className="mt-8 space-y-4">
            <label className="block">
              <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Email</span>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="you@school.edu.ng" className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30" />
            </label>
            <label className="block">
              <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Password</span>
              <input type="password" required placeholder="••••••••" className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30" />
            </label>
            <button className="btn-press w-full rounded-xl bg-accent py-3 text-sm font-medium text-accent-foreground">Continue with Email</button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            New here? <Link to="/signup" className="font-medium text-foreground underline-offset-4 hover:underline">Create an account</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
