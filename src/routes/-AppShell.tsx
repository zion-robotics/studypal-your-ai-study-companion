import { Link, useLocation } from "@tanstack/react-router";
import {
  Inbox,
  FolderOpen,
  Brain,
  FileText,
  Lightbulb,
  Settings,
  LogOut,
} from "lucide-react";

const NAV = [
  { to: "/dashboard",   icon: <Inbox className="h-5 w-5" />,        label: "Dashboard" },
  { to: "/courses",     icon: <FolderOpen className="h-5 w-5" />,    label: "Courses" },
  { to: "/ai-tools",    icon: <Brain className="h-5 w-5" />,         label: "AI Tools" },
  { to: "/documents",   icon: <FileText className="h-5 w-5" />,      label: "Documents" },
  { to: "/notes",       icon: <Lightbulb className="h-5 w-5" />,     label: "Notes" },
  { to: "/settings",    icon: <Settings className="h-5 w-5" />,      label: "Settings" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();

  return (
    <div className="flex h-screen overflow-hidden bg-background font-display">
      {/* Sidebar */}
      <aside className="flex h-full w-20 flex-col items-center gap-6 bg-sidebar-dark py-6 text-sidebar-dark-foreground overflow-y-auto shrink-0">
        <div className="rounded-xl bg-white/10 px-3 py-2 text-sm font-bold tracking-wider">NRDN+</div>
        <nav className="flex flex-col items-center gap-4 mt-4">
          {NAV.map(({ to, icon, label }) => (
            <Link key={to} to={to} title={label}>
              <button
                className={`h-11 w-11 rounded-xl flex items-center justify-center transition ${
                  pathname === to
                    ? "bg-white text-sidebar-dark"
                    : "text-white/60 hover:text-white hover:bg-white/10"
                }`}
              >
                {icon}
              </button>
            </Link>
          ))}
        </nav>
        <div className="mt-auto">
          <button className="h-11 w-11 rounded-xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </aside>

      {/* Page content */}
      <div className="flex-1 min-w-0 overflow-hidden">{children}</div>
    </div>
  );
}