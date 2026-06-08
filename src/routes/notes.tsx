// @ts-ignore – runtime font injection
if (typeof document !== "undefined" && !document.getElementById("dm-sans-font")) {
  const link = document.createElement("link");
  link.id = "dm-sans-font";
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400&display=swap";
  document.head.appendChild(link);
}

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Search,
  Plus,
  Pin,
  PinOff,
  Tag,
  Trash2,
  Edit3,
  BookOpen,
  Lightbulb,
  Star,
  MoreVertical,
  X,
  Bold,
  Italic,
  List,
  Hash,
  Clock,
  ChevronDown,
  AlignLeft,
  Sparkles,
  Save,
  Loader2,
} from "lucide-react";
import { AppShell } from "./-AppShell";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { requireAuth } from "@/lib/guards";

export const Route = createFileRoute("/notes")({
  beforeLoad: requireAuth,
  head: () => ({
    meta: [
      { title: "Notes: StudyAI" },
      { name: "description", content: "Your personal study notes." },
    ],
  }),
  component: NotesPage,
});

/* ─── Types ─────────────────────────────────────────────── */

type NoteColor = "yellow" | "sage" | "coral" | "sky" | "lavender" | "white";
type NoteTag = "Chemistry" | "Biology" | "Economics" | "Math" | "General" | "Important";

interface Note {
  id: string;
  title: string;
  body: string;
  color: NoteColor;
  tags: NoteTag[];
  course: string;
  pinned: boolean;
  starred: boolean;
  updatedAt: string;
  wordCount: number;
}

/* ─── Colour map — intentional decorative colors, kept as-is ── */

const NOTE_COLORS: Record<NoteColor, { bg: string; border: string; dot: string; label: string }> = {
  yellow:   { bg: "bg-amber-50",   border: "border-amber-200",   dot: "bg-amber-400",   label: "Amber"    },
  sage:     { bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-400", label: "Sage"     },
  coral:    { bg: "bg-rose-50",    border: "border-rose-200",    dot: "bg-rose-400",    label: "Coral"    },
  sky:      { bg: "bg-sky-50",     border: "border-sky-200",     dot: "bg-sky-400",     label: "Sky"      },
  lavender: { bg: "bg-violet-50",  border: "border-violet-200",  dot: "bg-violet-400",  label: "Lavender" },
  white:    { bg: "bg-card",       border: "border-border",      dot: "bg-muted-foreground/30", label: "White" },
};

const TAG_STYLES: Record<NoteTag, string> = {
  Chemistry: "bg-amber-100 text-amber-800",
  Biology:   "bg-emerald-100 text-emerald-800",
  Economics: "bg-violet-100 text-violet-800",
  Math:      "bg-sky-100 text-sky-800",
  General:   "bg-muted text-muted-foreground",
  Important: "bg-rose-100 text-rose-700",
};

const ALL_TAGS: NoteTag[] = ["Chemistry", "Biology", "Economics", "Math", "General", "Important"];
const ALL_COLORS: NoteColor[] = ["yellow", "sage", "coral", "sky", "lavender", "white"];

/* ─── Helpers ────────────────────────────────────────────── */

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)   return "Just now";
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)   return `${days}d ago`;
  const wks = Math.floor(days / 7);
  if (wks < 5)    return `${wks}w ago`;
  return new Date(iso).toLocaleDateString();
}

function isValidColor(v: string): v is NoteColor {
  return ["yellow", "sage", "coral", "sky", "lavender", "white"].includes(v);
}

function isValidTag(v: string): v is NoteTag {
  return ["Chemistry", "Biology", "Economics", "Math", "General", "Important"].includes(v);
}

/* ─── Page ───────────────────────────────────────────────── */

export default function NotesPage() {
  const { user } = useAuth();
  const [notes, setNotes]           = useState<Note[]>([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [search, setSearch]         = useState("");
  const [activeTag, setActiveTag]   = useState<NoteTag | "All">("All");
  const [editing, setEditing]       = useState<Note | null>(null);
  const [isNew, setIsNew]           = useState(false);
  const [menuId, setMenuId]         = useState<string | null>(null);

  const [draftTitle, setDraftTitle] = useState("");
  const [draftBody, setDraftBody]   = useState("");
  const [draftColor, setDraftColor] = useState<NoteColor>("yellow");
  const [draftTags, setDraftTags]   = useState<NoteTag[]>([]);

  useEffect(() => {
    if (!user) return;
    async function loadNotes() {
      setLoading(true);
      const { data, error } = await supabase
        .from("notes")
        .select("id, title, body, color, tags, course, pinned, starred, updated_at, word_count")
        .eq("user_id", user!.id)
        .order("updated_at", { ascending: false });

      if (!error && data) {
        setNotes(
          data.map((r) => ({
            id: r.id,
            title: r.title ?? "Untitled Note",
            body: r.body ?? "",
            color: isValidColor(r.color) ? r.color : "yellow",
            tags: Array.isArray(r.tags) ? r.tags.filter(isValidTag) : [],
            course: r.course ?? "General",
            pinned: r.pinned ?? false,
            starred: r.starred ?? false,
            updatedAt: r.updated_at,
            wordCount: r.word_count ?? 0,
          }))
        );
      }
      setLoading(false);
    }
    void loadNotes();
  }, [user]);

  const filtered = notes.filter((n) => {
    const matchSearch = n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.body.toLowerCase().includes(search.toLowerCase());
    const matchTag = activeTag === "All" || n.tags.includes(activeTag);
    return matchSearch && matchTag;
  });

  const pinned   = filtered.filter((n) => n.pinned);
  const unpinned = filtered.filter((n) => !n.pinned);

  function openNew() {
    setDraftTitle(""); setDraftBody(""); setDraftColor("yellow"); setDraftTags([]);
    setEditing(null); setIsNew(true);
  }

  function openEdit(note: Note) {
    setDraftTitle(note.title); setDraftBody(note.body);
    setDraftColor(note.color); setDraftTags([...note.tags]);
    setEditing(note); setIsNew(false); setMenuId(null);
  }

  function closeEditor() { setEditing(null); setIsNew(false); }

  async function saveNote() {
    if (!user) return;
    setSaving(true);
    const wc = draftBody.trim().split(/\s+/).filter(Boolean).length;
    const now = new Date().toISOString();

    if (isNew) {
      const payload = {
        user_id: user.id,
        title: draftTitle || "Untitled Note",
        body: draftBody,
        color: draftColor,
        tags: draftTags,
        course: draftTags[0] ?? "General",
        pinned: false,
        starred: false,
        word_count: wc,
        updated_at: now,
        created_at: now,
      };
      const { data, error } = await supabase.from("notes").insert(payload).select("id").single();
      if (!error && data) {
        setNotes((prev) => [{ id: data.id, title: payload.title, body: payload.body, color: payload.color, tags: payload.tags, course: payload.course, pinned: payload.pinned, starred: payload.starred, updatedAt: now, wordCount: wc }, ...prev]);
      }
    } else if (editing) {
      const updates = { title: draftTitle || "Untitled Note", body: draftBody, color: draftColor, tags: draftTags, course: draftTags[0] ?? editing.course, word_count: wc, updated_at: now };
      const { error } = await supabase.from("notes").update(updates).eq("id", editing.id).eq("user_id", user.id);
      if (!error) setNotes((prev) => prev.map((n) => n.id === editing.id ? { ...n, ...updates, wordCount: wc, updatedAt: now } : n));
    }

    setSaving(false);
    closeEditor();
  }

  async function togglePin(id: string) {
    if (!user) return;
    const note = notes.find((n) => n.id === id);
    if (!note) return;
    const pinned = !note.pinned;
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, pinned } : n)));
    setMenuId(null);
    await supabase.from("notes").update({ pinned, updated_at: new Date().toISOString() }).eq("id", id).eq("user_id", user.id);
  }

  async function toggleStar(id: string) {
    if (!user) return;
    const note = notes.find((n) => n.id === id);
    if (!note) return;
    const starred = !note.starred;
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, starred } : n)));
    await supabase.from("notes").update({ starred }).eq("id", id).eq("user_id", user.id);
  }

  async function deleteNote(id: string) {
    if (!user) return;
    setNotes((prev) => prev.filter((n) => n.id !== id));
    setMenuId(null);
    await supabase.from("notes").delete().eq("id", id).eq("user_id", user.id);
  }

  const editorOpen = isNew || editing !== null;

  if (loading) {
    return (
      <AppShell>
        <div className="flex h-full items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground font-medium">Loading your notes…</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex h-full overflow-hidden bg-background" style={{ fontFamily: "'DM Sans', sans-serif" }}>

        {/* ── Left sidebar ─────────────────────────────── */}
        <aside className="w-[220px] shrink-0 border-r border-border bg-muted/40 flex flex-col py-6 px-4 gap-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Notebooks</h2>
          </div>

          <SidebarItem icon={<AlignLeft className="h-4 w-4" />} label="All Notes" count={notes.length} active={activeTag === "All"} onClick={() => setActiveTag("All")} />
          <SidebarItem icon={<Star className="h-4 w-4" />} label="Starred" count={notes.filter((n) => n.starred).length} active={false} onClick={() => {}} />
          <SidebarItem icon={<Pin className="h-4 w-4" />} label="Pinned" count={notes.filter((n) => n.pinned).length} active={false} onClick={() => {}} />

          <div className="my-3 border-t border-border" />

          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 px-1">By Subject</p>
          {ALL_TAGS.filter((t) => t !== "General" && t !== "Important").map((tag) => (
            <SidebarItem
              key={tag}
              icon={<div className={`h-2 w-2 rounded-full ${TAG_STYLES[tag].split(" ")[0]}`} />}
              label={tag}
              count={notes.filter((n) => n.tags.includes(tag)).length}
              active={activeTag === tag}
              onClick={() => setActiveTag(activeTag === tag ? "All" : tag)}
            />
          ))}

          <div className="mt-auto pt-4">
            <button
              onClick={openNew}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-foreground text-background text-sm font-semibold py-2.5 hover:opacity-80 transition"
            >
              <Plus className="h-4 w-4" /> New Note
            </button>
          </div>
        </aside>

        {/* ── Main content ─────────────────────────────── */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* Top bar */}
          <div className="shrink-0 border-b border-border bg-background px-6 py-4 flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground">My Notes</h1>
              <p className="text-xs text-muted-foreground mt-0.5">{notes.length} notes across all subjects</p>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2 w-56 shadow-sm">
                <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search notes…"
                  className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground text-foreground"
                />
              </div>
              <button
                onClick={openNew}
                className="flex items-center gap-2 bg-foreground text-background text-sm font-semibold px-4 py-2 rounded-xl hover:opacity-80 transition shadow-sm"
              >
                <Plus className="h-4 w-4" /> New Note
              </button>
            </div>
          </div>

          {/* Tag filter strip */}
          <div className="shrink-0 px-6 py-3 flex items-center gap-2 border-b border-border overflow-x-auto bg-background">
            {(["All", ...ALL_TAGS] as (NoteTag | "All")[]).map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full transition ${
                  activeTag === tag
                    ? "bg-foreground text-background"
                    : "bg-card border border-border text-muted-foreground hover:border-foreground/30"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Notes grid */}
          <div className="flex-1 overflow-y-auto px-6 py-6 bg-background">
            <div className="flex items-center gap-6 mb-5 text-xs text-muted-foreground">
              <span><span className="font-bold text-foreground">{filtered.length}</span> notes</span>
              <span><span className="font-bold text-foreground">{pinned.length}</span> pinned</span>
              <span><span className="font-bold text-foreground">{filtered.filter(n=>n.starred).length}</span> starred</span>
            </div>

            {filtered.length === 0 ? (
              <EmptyState onNew={openNew} />
            ) : (
              <>
                {pinned.length > 0 && (
                  <section className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Pin className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Pinned</span>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {pinned.map((n) => (
                        <NoteCard key={n.id} note={n} menuOpen={menuId === n.id}
                          onMenuToggle={() => setMenuId(menuId === n.id ? null : n.id)}
                          onEdit={() => openEdit(n)} onPin={() => togglePin(n.id)}
                          onStar={() => toggleStar(n.id)} onDelete={() => deleteNote(n.id)}
                          onMenuClose={() => setMenuId(null)} />
                      ))}
                    </div>
                  </section>
                )}

                {unpinned.length > 0 && (
                  <section>
                    {pinned.length > 0 && (
                      <div className="flex items-center gap-2 mb-3">
                        <AlignLeft className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Other Notes</span>
                      </div>
                    )}
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {unpinned.map((n) => (
                        <NoteCard key={n.id} note={n} menuOpen={menuId === n.id}
                          onMenuToggle={() => setMenuId(menuId === n.id ? null : n.id)}
                          onEdit={() => openEdit(n)} onPin={() => togglePin(n.id)}
                          onStar={() => toggleStar(n.id)} onDelete={() => deleteNote(n.id)}
                          onMenuClose={() => setMenuId(null)} />
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}
          </div>
        </main>

        {/* ── Editor panel ─────────────────────────────── */}
        {editorOpen && (
          <>
            <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={closeEditor} />
            <div className="fixed right-0 top-0 bottom-0 z-50 w-[480px] flex flex-col bg-card shadow-2xl border-l border-border overflow-hidden">

              {/* Editor header */}
              <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <Edit3 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-bold text-foreground">{isNew ? "New Note" : "Edit Note"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={saveNote} disabled={saving}
                    className="flex items-center gap-1.5 bg-foreground text-background text-xs font-semibold px-3 py-1.5 rounded-lg hover:opacity-80 transition disabled:opacity-60"
                  >
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    {saving ? "Saving…" : "Save"}
                  </button>
                  <button onClick={closeEditor} className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Toolbar */}
              <div className="shrink-0 flex items-center gap-1 px-5 py-2 border-b border-border bg-muted/40">
                <ToolbarBtn icon={<Bold className="h-3.5 w-3.5" />} label="Bold" onClick={() => setDraftBody((b) => b + "****")} />
                <ToolbarBtn icon={<Italic className="h-3.5 w-3.5" />} label="Italic" onClick={() => setDraftBody((b) => b + "__")} />
                <ToolbarBtn icon={<List className="h-3.5 w-3.5" />} label="List" onClick={() => setDraftBody((b) => b + "\n- ")} />
                <ToolbarBtn icon={<Hash className="h-3.5 w-3.5" />} label="Heading" onClick={() => setDraftBody((b) => b + "\n## ")} />
                <div className="ml-auto flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-[11px] font-semibold text-muted-foreground">AI Assist</span>
                </div>
              </div>

              {/* Title input */}
              <div className="px-5 pt-5 pb-3 border-b border-border">
                <input
                  value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)}
                  placeholder="Note title…"
                  className="w-full text-xl font-extrabold text-foreground placeholder:text-muted-foreground/40 bg-transparent outline-none"
                />
              </div>

              {/* Body textarea */}
              <textarea
                value={draftBody} onChange={(e) => setDraftBody(e.target.value)}
                placeholder="Start writing your note… Use **bold**, _italic_, or - lists"
                className="flex-1 px-5 py-4 text-sm text-foreground placeholder:text-muted-foreground/40 bg-transparent outline-none resize-none leading-relaxed"
              />

              {/* Footer: color + tags */}
              <div className="shrink-0 border-t border-border px-5 py-4 space-y-3 bg-card">
                {/* Color picker */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-muted-foreground w-12">Colour</span>
                  <div className="flex items-center gap-2">
                    {ALL_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setDraftColor(c)}
                        className={`h-5 w-5 rounded-full border-2 transition ${NOTE_COLORS[c].dot} ${
                          draftColor === c ? "border-foreground scale-110" : "border-transparent hover:scale-105"
                        }`}
                        title={NOTE_COLORS[c].label}
                      />
                    ))}
                  </div>
                </div>

                {/* Tag picker */}
                <div className="flex items-start gap-3">
                  <span className="text-xs font-bold text-muted-foreground w-12 pt-1">Tags</span>
                  <div className="flex flex-wrap gap-1.5">
                    {ALL_TAGS.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setDraftTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag])}
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full transition ${
                          draftTags.includes(tag) ? TAG_STYLES[tag] : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                  <span>{draftBody.trim().split(/\s+/).filter(Boolean).length} words</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {editing ? `Last edited ${formatRelative(editing.updatedAt)}` : "New note"}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

/* ─── Note Card ──────────────────────────────────────────── */

function NoteCard({ note, menuOpen, onMenuToggle, onEdit, onPin, onStar, onDelete, onMenuClose }: {
  note: Note; menuOpen: boolean; onMenuToggle: () => void;
  onEdit: () => void; onPin: () => void; onStar: () => void;
  onDelete: () => void; onMenuClose: () => void;
}) {
  const colors = NOTE_COLORS[note.color];
  const preview = note.body
    .replace(/\*\*(.*?)\*\*/g, "$1").replace(/__(.*?)__/g, "$1")
    .replace(/^#{1,3}\s/gm, "").replace(/^-\s/gm, "• ").slice(0, 160);

  return (
    <div
      className={`group relative flex flex-col rounded-2xl border ${colors.bg} ${colors.border} p-4 cursor-pointer hover:shadow-md transition-shadow`}
      style={{ minHeight: 180 }}
      onClick={onEdit}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-[13px] font-extrabold text-foreground leading-snug line-clamp-2 flex-1">{note.title}</h3>
        <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition" onClick={(e) => e.stopPropagation()}>
          <button onClick={onStar} className={`h-6 w-6 rounded-md flex items-center justify-center transition hover:bg-black/5 ${note.starred ? "text-amber-400" : "text-muted-foreground/40"}`}>
            <Star className="h-3.5 w-3.5" fill={note.starred ? "currentColor" : "none"} />
          </button>
          <div className="relative">
            <button onClick={onMenuToggle} className="h-6 w-6 rounded-md flex items-center justify-center hover:bg-black/5 text-muted-foreground transition">
              <MoreVertical className="h-3.5 w-3.5" />
            </button>
            {menuOpen && (
              <>
                <button className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); onMenuClose(); }} />
                <div className="absolute right-0 top-full z-20 mt-1 w-36 rounded-xl border border-border bg-card shadow-lg p-1 text-sm">
                  <MenuItem icon={<Edit3 className="h-3.5 w-3.5" />} label="Edit" onClick={onEdit} />
                  <MenuItem icon={note.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />} label={note.pinned ? "Unpin" : "Pin"} onClick={onPin} />
                  <div className="my-1 border-t border-border" />
                  <MenuItem icon={<Trash2 className="h-3.5 w-3.5" />} label="Delete" onClick={onDelete} danger />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <p className="text-[12px] text-muted-foreground leading-relaxed line-clamp-4 flex-1">{preview}</p>

      <div className="mt-3 flex items-end justify-between">
        <div className="flex flex-wrap gap-1">
          {note.tags.slice(0, 2).map((tag) => (
            <span key={tag} className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${TAG_STYLES[tag]}`}>{tag}</span>
          ))}
          {note.tags.length > 2 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">+{note.tags.length - 2}</span>}
        </div>
        <span className="text-[10px] text-muted-foreground shrink-0 ml-2 flex items-center gap-0.5">
          <Clock className="h-2.5 w-2.5" />{formatRelative(note.updatedAt)}
        </span>
      </div>
    </div>
  );
}

/* ─── Sidebar item ───────────────────────────────────────── */

function SidebarItem({ icon, label, count, active, onClick }: {
  icon: React.ReactNode; label: string; count: number; active: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition ${
        active ? "bg-foreground text-background font-semibold" : "text-foreground hover:bg-muted font-medium"
      }`}
    >
      <span className={active ? "text-background" : "text-muted-foreground"}>{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      <span className={`text-xs ${active ? "text-background/60" : "text-muted-foreground"}`}>{count}</span>
    </button>
  );
}

/* ─── Toolbar button ─────────────────────────────────────── */

function ToolbarBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} title={label}
      className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition">
      {icon}
    </button>
  );
}

/* ─── Dropdown menu item ─────────────────────────────────── */

function MenuItem({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition ${
        danger ? "text-destructive hover:bg-destructive/10" : "text-foreground hover:bg-muted"
      }`}
    >
      {icon}<span className="text-sm">{label}</span>
    </button>
  );
}

/* ─── Empty state ────────────────────────────────────────── */

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center gap-4">
      <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center">
        <Lightbulb className="h-6 w-6 text-muted-foreground/40" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-foreground">No notes found</h3>
        <p className="text-xs text-muted-foreground mt-1">Try a different search or create a new note.</p>
      </div>
      <button
        onClick={onNew}
        className="flex items-center gap-2 bg-foreground text-background text-sm font-semibold px-4 py-2 rounded-xl hover:opacity-80 transition"
      >
        <Plus className="h-4 w-4" /> Create Note
      </button>
    </div>
  );
}
