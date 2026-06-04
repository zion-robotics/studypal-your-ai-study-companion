import { Link, useRouterState } from "@tanstack/react-router";
import { type ReactNode } from "react";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: "M3 12 12 3l9 9M5 10v10h14V10" },
  { to: "/upload", label: "My Lessons", icon: "M4 4h16v16H4zM4 9h16M9 4v16" },
  { to: "/session", label: "Study", icon: "M5 3v18l7-4 7 4V3z" },
  {
    to: "/community",
    label: "Community",
    icon: "M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M23 21v-2a4 4 0 0 0-3-3.87M17 3.13A4 4 0 0 1 17 11",
  },
];

function NavItem({
  to,
  label,
  icon,
  active,
}: {
  to: string;
  label: string;
  icon: string;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={`flex items-center justify-center group-hover/sidebar:justify-start gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
        active
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={icon} />
      </svg>
      <span className="overflow-hidden whitespace-nowrap transition-all duration-200 w-0 opacity-0 group-hover/sidebar:w-auto group-hover/sidebar:opacity-100">
        {label}
      </span>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="group/sidebar hidden md:flex sticky top-0 h-screen shrink-0 flex-col border-r border-border bg-sidebar px-4 py-5 overflow-y-auto transition-all duration-300 w-20 hover:w-64">
        {/* Logo */}
        <div className="mb-8 overflow-hidden">
          <Logo />
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1">
          {nav.map((n) => (
            <NavItem
              key={n.to}
              to={n.to}
              label={n.label}
              icon={n.icon}
              active={pathname.startsWith(n.to)}
            />
          ))}
        </nav>

        {/* User profile at bottom */}
        <div className="mt-auto overflow-hidden rounded-xl border border-transparent group-hover/sidebar:border-border p-3">
          <div className="flex items-center justify-center group-hover/sidebar:justify-start gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
              A
            </div>
            <div className="text-sm leading-tight overflow-hidden whitespace-nowrap transition-all duration-200 w-0 opacity-0 group-hover/sidebar:w-auto group-hover/sidebar:opacity-100">
              <div className="font-medium">Amara O.</div>
              <div className="text-xs text-muted-foreground">Free plan</div>
            </div>
            <div className="ml-auto shrink-0 hidden group-hover/sidebar:block">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 pb-24 md:pb-0">{children}</main>

      {/* Bottom nav (mobile) */}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-border bg-background/95 backdrop-blur md:hidden">
        {nav.map((n) => {
          const active = pathname.startsWith(n.to);
          return (
            <Link
              key={n.to}
              to={n.to}
              className={`flex flex-col items-center gap-1 py-3 text-[11px] ${
                active ? "text-accent" : "text-muted-foreground"
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={n.icon} />
              </svg>
              {n.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
