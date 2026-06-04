import { Link } from "@tanstack/react-router";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      to="/"
      className={`inline-flex items-center gap-2 font-display font-semibold ${className}`}
    >
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-accent-foreground">
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 19V5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2Z" />
          <path d="M9 8h6M9 12h6" />
        </svg>
      </span>
      <span className="tracking-tight">StudyPal</span>
    </Link>
  );
}
