import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Logo } from "@/components/sp/Logo";
import { ThemeToggle } from "@/components/sp/ThemeToggle";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Sign up — StudyPal" }] }),
  component: Signup,
});

function Signup() {
  const nav = useNavigate();
  return (
    <div className="relative grid min-h-screen place-items-center bg-background px-5">
      <div className="absolute right-5 top-5"><ThemeToggle /></div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
        <div className="mb-10 flex justify-center"><Logo /></div>
        <div className="rounded-3xl border border-border bg-card p-8">
          <h1 className="font-display text-3xl">Start studying smarter.</h1>
          <p className="mt-2 text-sm text-muted-foreground">Free forever. No card needed.</p>
          <form onSubmit={(e) => { e.preventDefault(); nav({ to: "/onboarding" }); }} className="mt-8 space-y-4">
            <label className="block">
              <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Full name</span>
              <input required placeholder="Amara Okeke" className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30" />
            </label>
            <label className="block">
              <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Email</span>
              <input type="email" required placeholder="you@school.edu.ng" className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30" />
            </label>
            <label className="block">
              <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Password</span>
              <input type="password" required placeholder="At least 8 characters" className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30" />
            </label>
            <button className="btn-press w-full rounded-xl bg-accent py-3 text-sm font-medium text-accent-foreground">Continue with Email</button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already in? <Link to="/login" className="font-medium text-foreground underline-offset-4 hover:underline">Log in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
