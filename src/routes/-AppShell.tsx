import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FolderOpen,
  Brain,
  FileText,
  Lightbulb,
  Settings,
  LogOut,
  Zap,
  Users,
} from "lucide-react";
import { useAuth, getInitials } from "@/hooks/useAuth";

const NAV = [
  { to: "/dashboard", icon: <LayoutDashboard className="h-5 w-5" />, label: "Dashboard" },
  
  { to: "/courses",   icon: <FolderOpen className="h-5 w-5" />,      label: "Courses" },
  { to: "/session",  icon: <Brain className="h-5 w-5" />,           label: "Study" },
  { to: "/documents", icon: <FileText className="h-5 w-5" />,        label: "Documents" },
  { to: "/notes",     icon: <Lightbulb className="h-5 w-5" />,       label: "Notes" },
  { to: "/settings",  icon: <Settings className="h-5 w-5" />,        label: "Settings" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const initials  = getInitials(profile, user);
  const avatarUrl = profile?.avatar_url ?? null;

  async function handleLogout() {
    await signOut();
    navigate({ to: "/login" });
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background font-display">

      {/* Sidebar */}
      <aside className="group/sidebar flex h-full flex-col items-center bg-sidebar-dark py-6
        text-sidebar-dark-foreground overflow-y-auto shrink-0 overflow-x-hidden
        w-[72px] hover:w-[200px] transition-[width] duration-300 ease-in-out">

        {/* Logo */}
        <Link to="/dashboard" className="w-full px-4 flex items-center gap-3 shrink-0">
          <div className="h-9 w-9 rounded-xl bg-coral flex items-center justify-center shrink-0">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="font-extrabold text-sm tracking-wide text-white
            opacity-0 group-hover/sidebar:opacity-100
            transition-opacity duration-200 whitespace-nowrap overflow-hidden">
            StudyPal
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex flex-col gap-1 mt-8 w-full px-2">
          {NAV.map(({ to, icon, label }) => {
            const active = pathname === to;
            return (
              <Link key={to} to={to}>
                <button
                  className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition-colors duration-150
                    ${active
                      ? "bg-white text-sidebar-dark"
                      : "text-white/60 hover:text-white hover:bg-white/10"
                    }`}
                >
                  {/* Icon — always visible */}
                  <span className="shrink-0">{icon}</span>
                  {/* Label — fades in on hover */}
                  <span className="text-sm font-semibold whitespace-nowrap overflow-hidden
                    opacity-0 group-hover/sidebar:opacity-100
                    transition-opacity duration-200">
                    {label}
                  </span>
                </button>
              </Link>
            );
          })}
        </nav>

        {/* Bottom — avatar + logout */}
        <div className="mt-auto flex flex-col gap-1 w-full px-2">

          {/* User row */}
          <div className="flex items-center gap-3 px-2.5 py-2.5 rounded-xl">
            <div className="h-8 w-8 rounded-full overflow-hidden bg-coral/80 flex items-center
              justify-center text-white text-xs font-bold ring-2 ring-white/20 shrink-0">
              {avatarUrl
                ? <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
                : <span>{initials}</span>}
            </div>
            <span className="text-xs text-white/70 font-medium truncate
              opacity-0 group-hover/sidebar:opacity-100
              transition-opacity duration-200 whitespace-nowrap overflow-hidden">
              {profile?.full_name ?? user?.email ?? ""}
            </span>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl
              text-white/60 hover:text-white hover:bg-white/10 transition-colors duration-150"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span className="text-sm font-semibold whitespace-nowrap overflow-hidden
              opacity-0 group-hover/sidebar:opacity-100
              transition-opacity duration-200">
              Log out
            </span>
          </button>
        </div>
      </aside>

      {/* Page content */}
      <div className="flex-1 min-w-0 h-full overflow-hidden">{children}</div>
    </div>
  );
}