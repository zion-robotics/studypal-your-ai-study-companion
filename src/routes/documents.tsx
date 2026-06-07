import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "./-AppShell";
import { useEffect, useState } from "react";
import {
  FileText,
  FileImage,
  FileSpreadsheet,
  FileCode,
  Upload,
  Search,
  MoreVertical,
  Plus,
  X,
  List,
  LayoutGrid,
  Folder,
  SlidersHorizontal,
  Info,
  ChevronDown,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { requireAuth } from "@/lib/guards";

export const Route = createFileRoute("/documents")({
  beforeLoad: requireAuth,
  head: () => ({
    meta: [
      { title: "Documents - StudyAI" },
      { name: "description", content: "Manage your study documents, notes, and materials." },
    ],
  }),
  component: DocumentsPage,
});

/* ─── Types ──────────────────────────────────────────────── */

type DocType = "pdf" | "image" | "docx" | "pptx" | "xls" | "other";

type DocItem = {
  id: string;
  name: string;
  subject: string;   // folder / course name
  type: DocType;
  size: string;
  updatedAt: string;
  url?: string;
  file_path?: string;
};

type FolderItem = {
  id: string;
  name: string;
  docCount: number;
};

/* ─── Helpers ────────────────────────────────────────────── */

function extToType(filename: string): DocType {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return "pdf";
  if (["doc", "docx"].includes(ext)) return "docx";
  if (["xls", "xlsx", "csv"].includes(ext)) return "xls";
  if (["ppt", "pptx"].includes(ext)) return "pptx";
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) return "image";
  return "other";
}

function formatSize(bytes?: number): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)  return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

/* ─── Page ───────────────────────────────────────────────── */

function DocumentsPage() {
  const { user } = useAuth();
  const [docs, setDocs]       = useState<DocItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [view, setView]       = useState<"list" | "grid">("list");

  /* ── Load real data from Supabase ───────────────────────── */
  useEffect(() => {
    if (!user) return;

    async function loadData() {
      setLoading(true);

      const [
        { data: dbDocs,    error: docsErr    },
        { data: dbFolders, error: foldersErr },
      ] = await Promise.all([
        supabase
          .from("documents")
          .select("id, name, folder_id, file_size, file_path, public_url, created_at")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("courses")
          .select("id, title")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: true }),
      ]);

      // Build a folder id → name lookup
      const folderMap: Record<string, string> = {};
      for (const f of (dbFolders ?? [])) {
        folderMap[f.id] = f.title;
      }

      // Build doc count per folder
      const docCountMap: Record<string, number> = {};
      for (const d of (dbDocs ?? [])) {
        if (d.folder_id) {
          docCountMap[d.folder_id] = (docCountMap[d.folder_id] ?? 0) + 1;
        }
      }

      // Map DB rows → DocItem
      if (!docsErr && dbDocs) {
        setDocs(
          dbDocs.map((d) => ({
            id: d.id,
            name: d.name,
            subject: folderMap[d.folder_id] ?? "Uncategorised",
            type: extToType(d.name),
            size: formatSize(d.file_size),
            updatedAt: d.created_at,
            url: d.public_url ?? undefined,
            file_path: d.file_path ?? undefined,
          }))
        );
      }

      // Map DB rows → FolderItem (only folders that have docs)
      if (!foldersErr && dbFolders) {
        setFolders(
          dbFolders
            .filter((f) => (docCountMap[f.id] ?? 0) > 0)
            .map((f) => ({
              id: f.id,
              name: f.title,
              docCount: docCountMap[f.id] ?? 0,
            }))
        );
      }

      setLoading(false);
    }

    void loadData();
  }, [user]);

  /* ── Local delete (removes from DB via storage + table) ─── */
  async function removeDoc(doc: DocItem) {
    // Optimistic UI
    setDocs((prev) => prev.filter((d) => d.id !== doc.id));

    if (doc.file_path) {
      await supabase.storage.from("documents").remove([doc.file_path]);
    }
    await supabase
      .from("documents")
      .delete()
      .eq("id", doc.id)
      .eq("user_id", user!.id);
  }

  const filtered = docs.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.subject.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <AppShell>
        <div className="flex h-full items-center justify-center bg-muted/40">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground font-medium">Loading your documents…</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="min-h-screen bg-muted/40 text-foreground">
        <main className="mx-auto w-full max-w-[1400px] px-4 pb-24 pt-4 sm:px-6">
          <div className="rounded-2xl bg-background p-6 shadow-sm sm:p-8">

            {/* Page header */}
            <div className="flex items-start justify-between">
              <h1 className="text-3xl font-normal tracking-tight text-foreground">Your documents</h1>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search documents…"
                    className="h-9 w-56 rounded-full border border-border bg-muted/60 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
            </div>

            {/* Suggested folders — derived from real course folders that have files */}
            {folders.length > 0 && (
              <div className="mt-6">
                <p className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
                  <ChevronDown className="h-4 w-4" /> Course folders
                </p>
                <div className="flex flex-wrap gap-3">
                  {folders.map((f) => (
                    <FolderCard key={f.id} name={f.name} docCount={f.docCount} />
                  ))}
                </div>
              </div>
            )}

            {/* Files header + toolbar */}
            <div className="mt-7 flex items-center justify-between">
              <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                <ChevronDown className="h-4 w-4" />
                {filtered.length > 0 ? `${filtered.length} file${filtered.length !== 1 ? "s" : ""}` : "Files"}
              </p>
              <div className="flex items-center gap-2">
                {/* Upload lives in Courses — link there */}
                <Link
                  to="/courses"
                  className="mr-1 inline-flex h-9 items-center gap-2 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                >
                  <Upload className="h-4 w-4" /> Upload in Courses
                </Link>
                <div className="flex items-center rounded-full border border-border bg-background">
                  <button
                    onClick={() => setView("list")}
                    className={`grid h-8 w-9 place-items-center rounded-l-full transition ${
                      view === "list" ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-muted"
                    }`}
                    aria-label="List view"
                  >
                    <List className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setView("grid")}
                    className={`grid h-8 w-9 place-items-center rounded-r-full transition ${
                      view === "grid" ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-muted"
                    }`}
                    aria-label="Grid view"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Document list / grid */}
            {filtered.length === 0 ? (
              <EmptyListState />
            ) : view === "list" ? (
              <div className="mt-4">
                <div className="grid grid-cols-[minmax(0,2.4fr)_minmax(0,1.6fr)_minmax(0,1fr)_40px] items-center gap-4 border-b border-border px-3 pb-2 text-sm font-medium text-muted-foreground">
                  <span>Name</span>
                  <span className="hidden sm:block">Folder</span>
                  <span className="hidden sm:block">Size</span>
                  <span></span>
                </div>
                <div>
                  {filtered.map((doc) => (
                    <DocRow key={doc.id} doc={doc} onDelete={() => removeDoc(doc)} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {filtered.map((doc) => (
                  <DocCard key={doc.id} doc={doc} />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </AppShell>
  );
}

/* ─── Folder card ────────────────────────────────────────── */

function FolderCard({ name, docCount }: { name: string; docCount: number }) {
  return (
    <div className="flex min-w-[220px] items-center gap-3 rounded-lg bg-muted px-4 py-3 transition hover:bg-accent">
      <Folder className="h-5 w-5 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{name}</p>
        <p className="truncate text-xs text-muted-foreground">{docCount} file{docCount !== 1 ? "s" : ""}</p>
      </div>
    </div>
  );
}

/* ─── Doc Row ────────────────────────────────────────────── */

function DocRow({ doc, onDelete }: { doc: DocItem; onDelete: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);

  function openFile() {
    if (doc.url) window.open(doc.url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="group grid grid-cols-[minmax(0,2.4fr)_minmax(0,1.6fr)_minmax(0,1fr)_40px] items-center gap-4 border-b border-border px-3 py-2.5 transition hover:bg-muted/60">
      {/* Name + icon */}
      <div
        className="flex min-w-0 items-center gap-3 cursor-pointer"
        onClick={openFile}
        title={doc.url ? "Open file" : undefined}
      >
        <DocIcon type={doc.type} />
        <p className="truncate text-sm text-foreground hover:underline">{doc.name}</p>
        {doc.url && <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />}
      </div>

      {/* Folder name */}
      <span className="hidden truncate text-sm text-muted-foreground sm:block">{doc.subject}</span>

      {/* Size */}
      <span className="hidden text-sm text-muted-foreground sm:block">{doc.size}</span>

      {/* Actions */}
      <div className="relative justify-self-end">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition hover:bg-background group-hover:text-foreground"
          aria-label="More"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
        {menuOpen && (
          <>
            <button className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} aria-label="Close menu" />
            <div className="absolute right-0 top-full z-20 mt-1 w-36 rounded-lg border border-border bg-background p-1 shadow-lg">
              {doc.url && (
                <button
                  onClick={() => { openFile(); setMenuOpen(false); }}
                  className="flex w-full items-center rounded-md px-2.5 py-1.5 text-sm text-foreground transition hover:bg-muted"
                >
                  Open
                </button>
              )}
              <button
                onClick={() => { onDelete(); setMenuOpen(false); }}
                className="flex w-full items-center rounded-md px-2.5 py-1.5 text-sm text-destructive transition hover:bg-destructive/10"
              >
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Doc Card (grid) ────────────────────────────────────── */

function DocCard({ doc }: { doc: DocItem }) {
  function openFile() {
    if (doc.url) window.open(doc.url, "_blank", "noopener,noreferrer");
  }

  return (
    <div
      className="rounded-xl border border-border bg-background p-3 transition hover:shadow-md cursor-pointer"
      onClick={openFile}
      title={doc.name}
    >
      <div className="flex items-center gap-2">
        <DocIcon type={doc.type} />
        <p className="truncate text-sm text-foreground">{doc.name}</p>
      </div>
      <div className="mt-3 grid h-28 place-items-center rounded-lg bg-muted text-muted-foreground">
        <DocIcon type={doc.type} large />
      </div>
      <p className="mt-2 truncate text-xs text-muted-foreground">
        {doc.subject} · {doc.size}
      </p>
      <p className="text-[11px] text-muted-foreground/70 mt-0.5">{formatRelative(doc.updatedAt)}</p>
    </div>
  );
}

/* ─── Doc Icon ───────────────────────────────────────────── */

function DocIcon({ type, large }: { type: DocType; large?: boolean }) {
  const size = large ? "h-8 w-8" : "h-5 w-5";
  switch (type) {
    case "pdf":   return <FileText        className={`${size} shrink-0 text-destructive`} />;
    case "image": return <FileImage       className={`${size} shrink-0 text-violet-500`} />;
    case "docx":  return <FileCode        className={`${size} shrink-0 text-primary`} />;
    case "pptx":  return <FileSpreadsheet className={`${size} shrink-0 text-orange-500`} />;
    case "xls":   return <FileSpreadsheet className={`${size} shrink-0 text-green-600`} />;
    default:      return <FileText        className={`${size} shrink-0 text-muted-foreground`} />;
  }
}

/* ─── Empty state ────────────────────────────────────────── */

function EmptyListState() {
  return (
    <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 py-16 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
        <FileText className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-sm font-medium text-foreground">No documents yet</h3>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">
        Upload files from the Courses page — they'll appear here automatically.
      </p>
      <Link
        to="/courses"
        className="mt-5 inline-flex h-9 items-center gap-2 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
      >
        <Upload className="h-4 w-4" /> Go to Courses
      </Link>
    </div>
  );
}