import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

export function TopNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm md:flex">
          <a href="#problem" className="text-muted-foreground hover:text-foreground transition">Problem</a>
          <a href="#how" className="text-muted-foreground hover:text-foreground transition">How it works</a>
          <a href="#features" className="text-muted-foreground hover:text-foreground transition">Features</a>
          <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition">Stories</a>
        </nav>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link to="/login" className="hidden text-sm font-medium text-foreground hover:text-accent md:inline">Log in</Link>
          <Link to="/signup" className="btn-press inline-flex items-center rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground">
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
