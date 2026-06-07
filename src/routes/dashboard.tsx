import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Bell, Plus, Upload, FileText, Folder,
  ChevronRight, ChevronDown, FilePlus, Search,
  Sparkles, CheckCircle2, MoreVertical,
  ClipboardList, BookOpen, Mic, X, FolderOpen,
  Flame, Target, Calendar, Zap, Brain,
  GraduationCap, TrendingUp,
} from "lucide-react";
import { AppShell } from "./-AppShell";
import { useAuth, getFirstName, getDisplayName, getInitials } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { requireAuth } from "@/lib/guards";
import uploadImg from "@/assets/upload-illustration.jpg";
import chemImg from "@/assets/subj-chemistry.jpg";
import econImg from "@/assets/subj-economy.jpg";
import bioImg from "@/assets/subj-biology.jpg";
import cityImg from "@/assets/city-scene.jpg";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: requireAuth,
  head: () => ({
    meta: [
      { title: "Dashboard — StudyPal" },
      { name: "description", content: "Your daily study pulse." },
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

interface StudyProgress {
  streak: number;
  total_sessions: number;
  syllabus_coverage_percent: number;
  last_active: string | null;
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

function getDaysRemaining(deadline: string | null): number {
  if (!deadline) return 0;
  const diff = new Date(deadline).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

const COURSE_IMAGES = [chemImg, econImg, bioImg, bioImg];
const DOC_COLORS = ["bg-sage", "bg-leaf/20", "bg-coral/15", "bg-primary/10"];

// ─── Daily Pulse Ring ─────────────────────────────────────────────────────────

function PulseRing({ percent }: { percent: number }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <svg width="128" height="128" viewBox="0 0 128 128">
      <circle cx="64" cy="64" r={r} fill="none" stroke="currentColor"
        className="text-sage" strokeWidth="10" />
      <circle cx="64" cy="64" r={r} fill="none"
        stroke="oklch(0.72 0.17 30)" strokeWidth="10"
        strokeLinecap="round" strokeDasharray={circ}
        strokeDashoffset={offset}
        style={{ transform: "rotate(-90deg)", transformOrigin: "center",
          transition: "stroke-dashoffset 1s ease" }} />
      <text x="64" y="60" textAnchor="middle"
        className="fill-foreground font-extrabold" fontSize="22" fontWeight="800">
        {percent}%
      </text>
      <text x="64" y="78" textAnchor="middle"
        fontSize="10" fill="oklch(0.55 0.02 250)">
        today
      </text>
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function DashboardPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [allFolders, setAllFolders]     = useState<CourseFolder[]>([]);
  const [topCourses, setTopCourses]     = useState<CourseFolder[]>([]);
  const [recentDocs, setRecentDocs]     = useState<RecentDoc[]>([]);
  const [unreadCount, setUnreadCount]   = useState(0);
  const [dataLoading, setDataLoading]   = useState(true);
  const [progress, setProgress]         = useState<StudyProgress>({
    streak: 0, total_sessions: 0,
    syllabus_coverage_percent: 0, last_active: null,
  });

  const [searchQuery, setSearchQuery]     = useState("");
  const [searchResults, setSearchResults] = useState<{ docs: RecentDoc[]; folders: CourseFolder[] } | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef  = useRef<HTMLDivElement>(null);

  const [courseOpen, setCourseOpen]         = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CourseFolder | null>(null);
  const courseDropRef = useRef<HTMLDivElement>(null);

  const firstName     = getFirstName(profile, user);
  const displayName   = getDisplayName(profile, user);
  const initials      = getInitials(profile, user);
  const avatarUrl     = profile?.avatar_url ?? null;
  const university    = profile?.university ?? null;
  const courseOfStudy = profile?.course_of_study ?? null;

  // ── Data load ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading || !user) return;
    void fetchDashboardData();
  }, [user, authLoading]);

  async function fetchDashboardData() {
    setDataLoading(true);
    try {
      await Promise.all([
        fetchCourses(), fetchRecentDocs(),
        fetchNotifications(), fetchProgress(),
      ]);
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

    const { data: docRows } = await supabase
      .from("documents")
      .select("folder_id")
      .eq("user_id", user!.id);

    const countMap: Record<string, number> = {};
    for (const d of (docRows ?? [])) {
      if (d.folder_id) countMap[d.folder_id] = (countMap[d.folder_id] ?? 0) + 1;
    }

    const folders: CourseFolder[] = data.map((c: any, i: number) => ({
      id: c.id, title: c.title,
      teacher: c.teacher_name ?? null,
      doc_count: countMap[c.id] ?? 0,
      img: COURSE_IMAGES[i % COURSE_IMAGES.length],
      parent_id: c.parent_id ?? null,
    }));

    setAllFolders(folders);
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

    setRecentDocs(data.map((d: any, i: number) => ({
      ...d,
      status: d.status === "assessed" ? "Assessed" : "Pending",
      color: DOC_COLORS[i % DOC_COLORS.length],
    })));
  }

  async function fetchNotifications() {
    const { count } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user!.id)
      .eq("read", false);
    setUnreadCount(count ?? 0);
  }

  async function fetchProgress() {
    const { data } = await supabase
      .from("progress")
      .select("streak, total_sessions, syllabus_coverage_percent, last_active")
      .eq("user_id", user!.id)
      .maybeSingle();

    if (data) setProgress(data);
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

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node))
        setSearchFocused(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (courseDropRef.current && !courseDropRef.current.contains(e.target as Node))
        setCourseOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const showSearchDrop = searchFocused && searchResults !== null;
  const hasNoFolders   = !dataLoading && allFolders.length === 0;
  const todayPct       = Math.min(100, progress.syllabus_coverage_percent);

  return (
    <AppShell>
      <div className="flex h-full overflow-hidden">

        {/* ── Left — Upload Panel ───────────────────────────────────── */}
        <section className="w-[280px] shrink-0 bg-sage-light p-6 flex flex-col h-full overflow-y-auto">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Upload Notes</h2>
            <Link to="/courses" title="Go to courses">
              <button className="rounded-md p-2 hover:bg-white/50 transition">
                <FilePlus className="h-4 w-4" />
              </button>
            </Link>
          </div>

          {/* User card */}
          <div className="mt-5 rounded-2xl bg-white border px-4 py-3 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full overflow-hidden bg-coral/80 flex items-center justify-center text-white text-sm font-bold shrink-0 ring-2 ring-coral/20">
              {avatarUrl
                ? <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
                : <span>{initials}</span>}
            </div>
            <div className="min-w-0">
              <p className="font-extrabold text-sm truncate">{displayName}</p>
              <p className="text-[10px] text-muted-foreground truncate">
                {courseOfStudy
                  ? `${courseOfStudy}${university ? ` · ${university}` : ""}`
                  : (user?.email ?? "")}
              </p>
            </div>
          </div>

          <div className="mt-4 flex-1 flex items-center justify-center min-h-0">
            <img src={uploadImg} alt="" className="max-w-full max-h-full object-contain" loading="lazy" />
          </div>

          <div className="text-center">
            <h4 className="text-xl font-extrabold">Drop Your Lecture<br />Notes Here</h4>
            <p className="text-xs text-muted-foreground mt-2 mb-4">
              StudyPal structures them into lessons automatically
            </p>

            {/* Course selector */}
            <div ref={courseDropRef} className="relative mb-3">
              <button
                onClick={() => setCourseOpen((o) => !o)}
                className="w-full rounded-xl border bg-white px-3 py-2 flex items-center justify-between text-sm font-medium cursor-pointer hover:bg-white/80 transition"
              >
                <span className={selectedCourse ? "text-foreground" : "text-muted-foreground"}>
                  {selectedCourse ? selectedCourse.title : (hasNoFolders ? "No subjects yet" : "Select a subject…")}
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>

              {courseOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 z-30 rounded-xl border bg-white shadow-lg py-1 max-h-48 overflow-y-auto">
                  {hasNoFolders ? (
                    <Link to="/courses" className="block px-4 py-2.5 text-sm text-coral font-semibold hover:bg-sage-light transition">
                      + Add your first subject
                    </Link>
                  ) : (
                    allFolders.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => { setSelectedCourse(f); setCourseOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-sage-light transition flex items-center gap-2 ${
                          selectedCourse?.id === f.id ? "font-bold text-coral" : "text-foreground"
                        }`}
                      >
                        <Folder className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate">{f.title}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <Link to="/courses">
              <button className="w-full rounded-xl bg-gradient-to-b from-coral to-primary py-3.5 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-coral/30 hover:opacity-95 transition">
                <Upload className="h-4 w-4" /> Upload & Structure
              </button>
            </Link>
          </div>
        </section>

        {/* ── Main ─────────────────────────────────────────────────── */}
        <main className="flex-1 p-8 overflow-y-auto h-full">
          <header className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-coral">
                {getGreeting()}, {firstName} 👋
              </p>
              <h1 className="text-4xl font-extrabold tracking-tight mt-0.5">Daily Pulse</h1>
              {(courseOfStudy || university) && (
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                  <GraduationCap className="h-4 w-4" />
                  {[courseOfStudy, university].filter(Boolean).join(" · ")}
                </p>
              )}
              {!courseOfStudy && !university && (
                <p className="text-sm text-muted-foreground mt-1">
                  Your AI-powered study companion — built for African students
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

          {/* ── Daily Pulse Card ────────────────────────────────────── */}
          <div className="mt-6 rounded-2xl bg-white border p-6 flex items-center gap-6 shadow-sm">
            <PulseRing percent={todayPct} />

            {/* ── CHANGED: stat pills — oval shape, centered text, no overflow ── */}
            <div className="flex-1 grid grid-cols-3 gap-2 min-w-0">
              <StatPill
                icon={<Flame className="h-3.5 w-3.5 shrink-0" />}
                label="Day streak"
                value={dataLoading ? "—" : `${progress.streak}`}
                color="text-coral"
              />
              <StatPill
                icon={<CheckCircle2 className="h-3.5 w-3.5 shrink-0" />}
                label="Sessions done"
                value={dataLoading ? "—" : `${progress.total_sessions}`}
                color="text-leaf"
              />
              <StatPill
                icon={<TrendingUp className="h-3.5 w-3.5 shrink-0" />}
                label="Syllabus covered"
                value={dataLoading ? "—" : `${progress.syllabus_coverage_percent}%`}
                color="text-primary"
              />
            </div>

            <Link to="/session">
              <button className="rounded-xl bg-gradient-to-b from-coral to-primary px-5 py-3 text-white font-bold text-sm shadow-lg shadow-coral/30 hover:opacity-95 transition whitespace-nowrap flex items-center gap-2">
                <Zap className="h-4 w-4" /> Start Session
              </button>
            </Link>
          </div>

          {/* ── Search ─────────────────────────────────────────────── */}
          <div ref={searchRef} className="mt-5 relative">
            <div className="flex items-center justify-between rounded-2xl bg-white border px-5 py-4 shadow-sm">
              <div className="flex items-center gap-3 text-sm font-medium flex-1">
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                <input
                  className="flex-1 outline-none text-sm placeholder:text-muted-foreground bg-transparent"
                  placeholder="Search notes, subjects, lessons…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                />
                {searchQuery && (
                  <button onClick={() => { setSearchQuery(""); setSearchResults(null); }}
                    className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground border-l pl-4 ml-4 font-medium shrink-0">
                <Sparkles className="h-4 w-4 text-coral" />
                AI Search
              </div>
            </div>

            {showSearchDrop && (searchResults!.docs.length > 0 || searchResults!.folders.length > 0) && (
              <div className="absolute top-full left-0 right-0 mt-2 z-40 rounded-2xl bg-white border shadow-xl overflow-hidden max-h-80 overflow-y-auto">
                {searchResults!.folders.length > 0 && (
                  <div>
                    <p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Subjects</p>
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
                    <p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Notes & Materials</p>
                    {searchResults!.docs.map((d) => (
                      <div key={d.id}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-sage-light transition cursor-pointer"
                        onClick={() => { if (d.public_url) window.open(d.public_url, "_blank", "noopener,noreferrer"); setSearchFocused(false); setSearchQuery(""); }}>
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

            {showSearchDrop && searchResults!.docs.length === 0 && searchResults!.folders.length === 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 z-40 rounded-2xl bg-white border shadow-xl px-6 py-6 text-center text-sm text-muted-foreground">
                No notes or subjects matched "{searchQuery}"
              </div>
            )}
          </div>

          {/* ── Subjects ───────────────────────────────────────────── */}
          <div className="mt-5 grid grid-cols-[80px_repeat(3,1fr)] gap-4">
            <Link to="/courses" title="Add a new subject">
              <button className="rounded-2xl border-2 border-dashed border-border bg-white/50 flex flex-col items-center justify-center gap-3 py-6 hover:border-coral transition w-full h-full">
                <span className="[writing-mode:vertical-rl] rotate-180 text-sm font-semibold text-muted-foreground">New Subject</span>
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
                    <CourseFolderCard img={c.img} title={c.title} docCount={c.doc_count} teacher={c.teacher ?? ""} />
                  </Link>
                ))
              : (
                <div className="col-span-3 rounded-2xl border-2 border-dashed border-border bg-white/40 flex flex-col items-center justify-center py-10 gap-3">
                  <FolderOpen className="h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm font-semibold text-muted-foreground">No subjects added yet</p>
                  <Link to="/courses">
                    <button className="text-xs font-bold text-coral hover:underline flex items-center gap-1">
                      <Plus className="h-3 w-3" /> Add your first subject
                    </button>
                  </Link>
                </div>
              )
            }
          </div>

          {/* ── Recent Materials ────────────────────────────────────── */}
          <section className="mt-8">
            <h2 className="text-2xl font-extrabold">Recent Materials</h2>
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
                      key={doc.id} color={doc.color} title={doc.name}
                      course={doc.course_name ?? "—"} size={formatBytes(doc.file_size)}
                      status={doc.status} url={doc.public_url ?? undefined}
                    />
                  ))
                : (
                  <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                    <FileText className="h-8 w-8 text-muted-foreground/30" />
                    <p className="text-sm font-semibold text-muted-foreground">No materials uploaded yet</p>
                    <Link to="/courses">
                      <button className="text-xs font-bold text-coral hover:underline flex items-center gap-1">
                        <Upload className="h-3 w-3" /> Upload your first notes
                      </button>
                    </Link>
                  </div>
                )
              }
            </div>
          </section>
        </main>

        {/* ── Right — AI Study Tools ────────────────────────────────── */}
        <aside className="w-[320px] shrink-0 bg-sage-light/40 flex flex-col h-full overflow-y-auto">
          <div className="h-[220px] shrink-0 relative overflow-hidden">
            <img src={cityImg} alt="" className="w-full h-full object-cover" loading="lazy" />
            <div className="absolute bottom-4 left-4 bg-sidebar-dark/80 backdrop-blur text-white text-xs font-bold px-3 py-1.5 rounded-lg">
              StudyPal AI
            </div>
            {displayName && (
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur text-sidebar-dark text-[10px] font-bold px-2.5 py-1 rounded-full">
                {initials}
              </div>
            )}
          </div>

          <div className="flex-1 p-6 flex flex-col">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-extrabold">Study Tools</h3>
              <Link to="/session">
                <button className="flex items-center gap-1 rounded-lg border bg-white px-3 py-1.5 text-xs font-semibold hover:bg-sage-light transition">
                  Start <ChevronRight className="h-3 w-3" />
                </button>
              </Link>
            </div>

            <div className="mt-4 flex-1 grid grid-cols-2 gap-3">
              <Link to="/session">
                <AiToolCard icon={<Mic className="h-5 w-5" />} label="Voice Study" color="bg-coral/10 text-coral" />
              </Link>
              <Link to="/session">
                <AiToolCard icon={<ClipboardList className="h-5 w-5" />} label="Quiz Me" color="bg-leaf/20 text-leaf" />
              </Link>
              <Link to="/courses">
                <AiToolCard icon={<BookOpen className="h-5 w-5" />} label="My Lessons" color="bg-sage text-secondary-foreground" />
              </Link>
              <Link to="/session">
                <AiToolCard icon={<Brain className="h-5 w-5" />} label="AI Explain" color="bg-primary/10 text-primary" />
              </Link>
            </div>

            {/* Life Happened Mode */}
            <div className="mt-4 rounded-2xl border bg-white p-4 flex items-start gap-3">
              <div className="h-8 w-8 rounded-xl bg-coral/10 text-coral flex items-center justify-center shrink-0">
                <Calendar className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-extrabold">Life Happened?</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">
                  Missed study days? StudyPal recalibrates your plan — no guilt, no broken streaks.
                </p>
                <button className="mt-2 text-[10px] font-bold text-coral hover:underline">
                  Recalibrate my plan →
                </button>
              </div>
            </div>

            {/* Active subjects counter */}
            <Link to="/courses" className="mt-3">
              <div className="rounded-2xl bg-gradient-to-r from-coral to-primary p-4 flex items-center gap-3 text-white hover:opacity-95 transition cursor-pointer">
                <div className="text-2xl font-extrabold">
                  {dataLoading ? "—" : topCourses.length}
                </div>
                <div className="text-xs flex-1 leading-tight">
                  Active subjects<br />with AI-ready notes
                </div>
                <div className="h-9 w-9 rounded-full bg-white/25 backdrop-blur flex items-center justify-center">
                  <ChevronRight className="h-4 w-4" />
                </div>
              </div>
            </Link>

            {user?.email && (
              <p className="mt-3 text-[10px] text-muted-foreground text-center truncate px-2">
                {user.email}
              </p>
            )}
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

// ── CHANGED: StatPill — oval shape, all content centered, no text overflow ──
function StatPill({ icon, label, value, color }: {
  icon: React.ReactNode; label: string; value: string; color: string;
}) {
  return (
    <div className="rounded-full border bg-sage-light/40 px-2 py-4 flex flex-col items-center justify-center gap-1.5 min-w-0 overflow-hidden">
      <div className={`flex items-center justify-center gap-1 ${color} min-w-0 w-full px-1`}>
        {icon}
        <span className="text-[10px] font-bold leading-tight truncate">{label}</span>
      </div>
      <p className="text-xl font-extrabold leading-none">{value}</p>
    </div>
  );
}

function CourseFolderCard({ img, title, docCount, teacher }: {
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
        <Folder className="h-3 w-3" />{docCount} material{docCount !== 1 ? "s" : ""}
      </div>
    </div>
  );
}

function DocumentRow({ color, title, course, size, status, url }: {
  color: string; title: string; course: string; size: string;
  status: "Assessed" | "Pending"; url?: string;
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
            <CheckCircle2 className="h-3 w-3" /> Structured
          </span>
        ) : (
          <span className="rounded-lg bg-sage px-3 py-1.5 text-xs font-bold text-secondary-foreground">
            Pending
          </span>
        )}
        <button className="text-muted-foreground hover:text-foreground" onClick={(e) => e.stopPropagation()}>
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function AiToolCard({ icon, label, color }: {
  icon: React.ReactNode; label: string; color: string;
}) {
  return (
    <div className={`rounded-2xl ${color} p-4 flex flex-col items-start gap-2 hover:opacity-80 transition w-full h-full`}>
      {icon}
      <span className="text-xs font-bold">{label}</span>
    </div>
  );
}
