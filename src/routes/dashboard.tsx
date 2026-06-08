import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Bell, Plus, Upload, FileText, Folder,
  ChevronRight, ChevronDown, Search,
  Sparkles, CheckCircle2, MoreVertical,
  ClipboardList, FlipHorizontal, BookOpen, Mic,
  GraduationCap, X, FolderOpen,
} from "lucide-react";
import { AppShell } from "./-AppShell";
import { useAuth, getFirstName, getDisplayName, getInitials } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { requireAuth } from "@/lib/guards";
import chemImg from "@/assets/subj-chemistry.jpg";
import econImg from "@/assets/subj-economy.jpg";
import bioImg from "@/assets/subj-biology.jpg";
import cityImg from "@/assets/city-scene.jpg";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: requireAuth,
  head: () => ({
    meta: [
      { title: "Dashboard — StudyAI" },
      { name: "description", content: "Your study hub." },
    ],
  }),
  component: DashboardPage,
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface RecentDoc {
  id: string;
  name: string;
  course_name: string | null;
  file_size: number | null;
  status: "Assessed" | "Pending";
  color: string;
  public_url: string | null;
}

interface CourseFolder {
  id: string;
  title: string;
  teacher: string | null;
  doc_count: number;
  img: string;
  parent_id: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const COURSE_IMAGES = [chemImg, econImg, bioImg, bioImg];
const DOC_COLORS = ["bg-sage", "bg-leaf/20", "bg-coral/15", "bg-primary/10"];

// ─── Page ─────────────────────────────────────────────────────────────────────

function DashboardPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // All folders (for the "Select a course" dropdown)
  const [allFolders, setAllFolders]   = useState<CourseFolder[]>([]);
  // Top-3 root folders shown as cards
  const [topCourses, setTopCourses]   = useState<CourseFolder[]>([]);
  const [recentDocs, setRecentDocs]   = useState<RecentDoc[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dataLoading, setDataLoading] = useState(true);

  // Search
  const [searchQuery, setSearchQuery]       = useState("");
  const [searchResults, setSearchResults]   = useState<{ docs: RecentDoc[]; folders: CourseFolder[] } | null>(null);
  const [searchFocused, setSearchFocused]   = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const firstName    = getFirstName(profile, user);
  const displayName  = getDisplayName(profile, user);
  const initials     = getInitials(profile, user);
  const avatarUrl    = profile?.avatar_url ?? null;
  const university   = profile?.university ?? null;
  const courseOfStudy = profile?.course_of_study ?? null;

  // ── Data load ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading || !user) return;
    void fetchDashboardData();
  }, [user, authLoading]);

  async function fetchDashboardData() {
    setDataLoading(true);
    try {
      await Promise.all([fetchCourses(), fetchRecentDocs(), fetchNotifications()]);
    } finally {
      setDataLoading(false);
    }
  }

  async function fetchCourses() {
    const { data, error } = await supabase
      .from("courses")
      .select("id, title, teacher_name, parent_id, created_at")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) return;

    // Count docs per folder
    const { data: docRows } = await supabase
      .from("documents")
      .select("folder_id")
      .eq("user_id", user!.id);

    const countMap: Record<string, number> = {};
    for (const d of (docRows ?? [])) {
      if (d.folder_id) countMap[d.folder_id] = (countMap[d.folder_id] ?? 0) + 1;
    }

    const folders: CourseFolder[] = data.map((c: any, i: number) => ({
      id: c.id,
      title: c.title,
      teacher: c.teacher_name ?? null,
      doc_count: countMap[c.id] ?? 0,
      img: COURSE_IMAGES[i % COURSE_IMAGES.length],
      parent_id: c.parent_id ?? null,
    }));

    setAllFolders(folders);
    // Only root folders as course cards (no parent), max 3
    setTopCourses(folders.filter((f) => !f.parent_id).slice(0, 3));
  }

  async function fetchRecentDocs() {
    const { data, error } = await supabase
      .from("documents")
      .select("id, name, course_name, file_size, status, public_url")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (error || !data || data.length === 0) return;

    setRecentDocs(
      data.map((d: any, i: number) => ({
        ...d,
        status: d.status === "assessed" ? "Assessed" : "Pending",
        color: DOC_COLORS[i % DOC_COLORS.length],
      }))
    );
  }

  async function fetchNotifications() {
    const { count } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user!.id)
      .eq("read", false);

    setUnreadCount(count ?? 0);
  }

  // ── Search ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults(null); return; }
    const q = searchQuery.toLowerCase();
    setSearchResults({
      docs:    recentDocs.filter(d => d.name.toLowerCase().includes(q) || (d.course_name ?? "").toLowerCase().includes(q)),
      folders: allFolders.filter(f => f.title.toLowerCase().includes(q)),
    });
  }, [searchQuery, recentDocs, allFolders]);

  // Close search dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const showSearchDrop = searchFocused && (searchQuery.trim() !== "" || true) && searchResults !== null;
  const hasNoFolders = !dataLoading && allFolders.length === 0;

  return (
    <AppShell>
      <div className="flex h-full overflow-hidden">

        {/* ── Main ─────────────────────────────────────────────────── */}
        <main className="flex-1 p-8 overflow-y-auto h-full">
          <header className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-coral">
                {getGreeting()}, {firstName} 👋
              </p>
              <h1 className="text-4xl font-extrabold tracking-tight mt-0.5">My Study Hub</h1>
              {(courseOfStudy || university) && (
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                  <GraduationCap className="h-4 w-4" />
                  {[courseOfStudy, university].filter(Boolean).join(" · ")}
                </p>
              )}
              {!courseOfStudy && !university && (
                <p className="text-sm text-muted-foreground mt-1">
                  Organise your courses, upload documents, and study smarter
                </p>
              )}
            </div>

            <button className="relative rounded-full bg-white shadow-sm p-3 border">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-coral text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          </header>

          {/* ── Search ─────────────────────────────────────────────── */}
          <div ref={searchRef} className="mt-6 relative">
            <div className="flex items-center justify-between rounded-2xl bg-white border px-5 py-4 shadow-sm">
              <div className="flex items-center gap-3 text-sm font-medium flex-1">
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                <input
                  className="flex-1 outline-none text-sm placeholder:text-muted-foreground bg-transparent"
                  placeholder="Search documents, folders…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                />
                {searchQuery && (
                  <button onClick={() => { setSearchQuery(""); setSearchResults(null); }} className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground border-l pl-4 ml-4 font-medium shrink-0">
                <Sparkles className="h-4 w-4 text-coral" />
                AI Search
              </div>
            </div>

            {/* Search results dropdown */}
            {showSearchDrop && (searchResults!.docs.length > 0 || searchResults!.folders.length > 0) && (
              <div className="absolute top-full left-0 right-0 mt-2 z-40 rounded-2xl bg-white border shadow-xl overflow-hidden max-h-80 overflow-y-auto">
                {searchResults!.folders.length > 0 && (
                  <div>
                    <p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Folders</p>
                    {searchResults!.folders.map((f) => (
                      <Link key={f.id} to="/courses" onClick={() => { setSearchFocused(false); setSearchQuery(""); }}>
                        <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-sage-light transition cursor-pointer">
                          <Folder className="h-4 w-4 text-coral shrink-0" />
                          <span className="text-sm font-semibold">{f.title}</span>
                          <span className="ml-auto text-[11px] text-muted-foreground">{f.doc_count} docs</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
                {searchResults!.docs.length > 0 && (
                  <div>
                    <p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Documents</p>
                    {searchResults!.docs.map((d) => (
                      <div
                        key={d.id}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-sage-light transition cursor-pointer"
                        onClick={() => {
                          if (d.public_url) window.open(d.public_url, "_blank", "noopener,noreferrer");
                          setSearchFocused(false);
                          setSearchQuery("");
                        }}
                      >
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold truncate">{d.name}</p>
                          <p className="text-[11px] text-muted-foreground">{d.course_name ?? "—"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* No results */}
            {showSearchDrop && searchResults!.docs.length === 0 && searchResults!.folders.length === 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 z-40 rounded-2xl bg-white border shadow-xl px-6 py-6 text-center text-sm text-muted-foreground">
                No documents or folders matched "{searchQuery}"
              </div>
            )}
          </div>

          {/* ── Course folders ──────────────────────────────────────── */}
          <div className="mt-6 grid grid-cols-[80px_repeat(3,1fr)] gap-4">
            {/* New Folder — goes to Courses page */}
            <Link to="/courses" title="Create a new folder in Courses">
              <button className="rounded-2xl border-2 border-dashed border-border bg-white/50 flex flex-col items-center justify-center gap-3 py-6 hover:border-coral transition w-full h-full">
                <span className="[writing-mode:vertical-rl] rotate-180 text-sm font-semibold text-muted-foreground">
                  New Folder
                </span>
                <div className="h-7 w-7 rounded-md bg-coral/10 text-coral flex items-center justify-center">
                  <Plus className="h-4 w-4" />
                </div>
              </button>
            </Link>

            {dataLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-2xl bg-white border p-4 animate-pulse">
                    <div className="h-24 rounded-xl bg-sage-light/60 mb-3" />
                    <div className="h-4 bg-muted rounded w-2/3 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                ))
              : topCourses.length > 0
              ? topCourses.map((c) => (
                  <Link key={c.id} to="/courses">
                    <CourseFolderCard
                      img={c.img}
                      title={c.title}
                      docCount={c.doc_count}
                      teacher={c.teacher ?? ""}
                    />
                  </Link>
                ))
              : (
                // Empty state — prompt to create first folder
                <div className="col-span-3 rounded-2xl border-2 border-dashed border-border bg-white/40 flex flex-col items-center justify-center py-10 gap-3">
                  <FolderOpen className="h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm font-semibold text-muted-foreground">No course folders yet</p>
                  <Link to="/courses">
                    <button className="text-xs font-bold text-coral hover:underline flex items-center gap-1">
                      <Plus className="h-3 w-3" /> Create your first folder
                    </button>
                  </Link>
                </div>
              )
            }
          </div>

          {/* ── Recent Documents ────────────────────────────────────── */}
          <section className="mt-8">
            <h2 className="text-2xl font-extrabold">Recent Documents</h2>
            <div className="mt-4 rounded-2xl bg-white border divide-y">
              {dataLoading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                      <div className="h-11 w-11 rounded-xl bg-muted shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-3 bg-muted rounded w-1/3" />
                      </div>
                    </div>
                  ))
                : recentDocs.length > 0
                ? recentDocs.map((doc) => (
                    <DocumentRow
                      key={doc.id}
                      color={doc.color}
                      title={doc.name}
                      course={doc.course_name ?? "—"}
                      size={formatBytes(doc.file_size)}
                      status={doc.status}
                      url={doc.public_url ?? undefined}
                    />
                  ))
                : (
                  <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                    <FileText className="h-8 w-8 text-muted-foreground/30" />
                    <p className="text-sm font-semibold text-muted-foreground">No documents uploaded yet</p>
                    <Link to="/courses">
                      <button className="text-xs font-bold text-coral hover:underline flex items-center gap-1">
                        <Upload className="h-3 w-3" /> Upload your first document
                      </button>
                    </Link>
                  </div>
                )
              }
            </div>
          </section>
        </main>

        {/* ── Right column — Study ──────────────────────────────────── */}
        <aside className="w-[320px] shrink-0 bg-sage-light/40 flex flex-col h-full overflow-y-auto">
          <div className="h-[220px] shrink-0 relative overflow-hidden">
            <img src={cityImg} alt="" className="w-full h-full object-cover" loading="lazy" />
            <div className="absolute bottom-4 left-4 bg-sidebar-dark/80 backdrop-blur text-white text-xs font-bold px-3 py-1.5 rounded-lg">
              AI Study Assistant
            </div>
            {displayName && (
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur text-sidebar-dark text-[10px] font-bold px-2.5 py-1 rounded-full">
                {initials}
              </div>
            )}
          </div>

          <div className="flex-1 p-6 flex flex-col">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-extrabold">Study</h3>
              <Link to="/ai-tools">
                <button className="flex items-center gap-1 rounded-lg border bg-white px-3 py-1.5 text-xs font-semibold hover:bg-sage-light transition">
                  All <ChevronDown className="h-3 w-3" />
                </button>
              </Link>
            </div>

            <div className="mt-4 flex-1 grid grid-cols-2 gap-3">
              <Link to="/ai-tools">
                <AiToolCard
                  icon={<ClipboardList className="h-5 w-5" />}
                  label="Quiz Me"
                  color="bg-coral/10 text-coral"
                />
              </Link>
              <Link to="/ai-tools">
                <AiToolCard
                  icon={<FlipHorizontal className="h-5 w-5" />}
                  label="Flashcards"
                  color="bg-leaf/20 text-leaf"
                />
              </Link>
              <Link to="/ai-tools">
                <AiToolCard
                  icon={<BookOpen className="h-5 w-5" />}
                  label="Summarise"
                  color="bg-sage text-secondary-foreground"
                />
              </Link>
              <Link to="/ai-tools">
                <AiToolCard
                  icon={<Mic className="h-5 w-5" />}
                  label="Voice Notes"
                  color="bg-primary/10 text-primary"
                />
              </Link>
            </div>

            {/* Active courses counter → links to Courses page */}
            <Link to="/courses" className="mt-4">
              <div className="rounded-2xl bg-gradient-to-r from-coral to-primary p-4 flex items-center gap-3 text-white hover:opacity-95 transition cursor-pointer">
                <div className="text-2xl font-extrabold">
                  {dataLoading ? "—" : topCourses.length}
                </div>
                <div className="text-xs flex-1 leading-tight">
                  Active course folders<br />with AI-ready documents
                </div>
                <div className="h-9 w-9 rounded-full bg-white/25 backdrop-blur flex items-center justify-center">
                  <ChevronRight className="h-4 w-4" />
                </div>
              </div>
            </Link>

            {user?.email && (
              <p className="mt-3 text-[10px] text-muted-foreground text-center truncate px-2">
                Signed in as {user.email}
              </p>
            )}
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CourseFolderCard({
  img, title, docCount, teacher,
}: {
  img: string; title: string; docCount: number; teacher: string;
}) {
  return (
    <div className="rounded-2xl bg-white border p-4 hover:shadow-md transition cursor-pointer h-full">
      <div className="h-24 rounded-xl bg-sage-light/60 flex items-center justify-center mb-3 overflow-hidden">
        <img src={img} alt={title} className="h-full object-contain" loading="lazy" />
      </div>
      <h3 className="font-extrabold">{title}</h3>
      {teacher && <p className="text-xs text-muted-foreground mt-0.5">{teacher}</p>}
      <div className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-coral">
        <Folder className="h-3 w-3" />{docCount} document{docCount !== 1 ? "s" : ""}
      </div>
    </div>
  );
}

function DocumentRow({
  color, title, course, size, status, url,
}: {
  color: string; title: string; course: string; size: string; status: "Assessed" | "Pending"; url?: string;
}) {
  return (
    <div
      className={`flex items-center gap-4 px-5 py-4 ${url ? "cursor-pointer hover:bg-muted/30 transition" : ""}`}
      onClick={() => url && window.open(url, "_blank", "noopener,noreferrer")}
    >
      <div className={`h-11 w-11 rounded-xl ${color} flex items-center justify-center shrink-0`}>
        <FileText className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-bold truncate">{title}</h4>
        <div className="flex items-center gap-4 mt-1 text-xs text-coral/80">
          <span>📁 {course}</span>
          <span>💾 {size}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {status === "Assessed" ? (
          <span className="rounded-lg bg-leaf/20 px-3 py-1.5 text-xs font-bold text-leaf flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Assessed
          </span>
        ) : (
          <span className="rounded-lg bg-sage px-3 py-1.5 text-xs font-bold text-secondary-foreground">
            Pending
          </span>
        )}
        <button
          className="text-muted-foreground hover:text-foreground"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function AiToolCard({
  icon, label, color,
}: {
  icon: React.ReactNode; label: string; color: string;
}) {
  return (
    <div className={`rounded-2xl ${color} p-4 flex flex-col items-start gap-2 hover:opacity-80 transition w-full h-full`}>
      {icon}
      <span className="text-xs font-bold">{label}</span>
    </div>
  );
}