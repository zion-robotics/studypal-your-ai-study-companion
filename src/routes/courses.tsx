import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Folder, FolderOpen, ChevronDown, ChevronRight,
  MoreHorizontal, Plus, Grid3X3, List,
  Settings2, FilePlus, Upload, X, Loader2,
  FolderPlus, CheckCircle2, AlertCircle,
  Trash2, Pencil, Play, Download, MoreVertical,
} from "lucide-react";
import { AppShell } from "./-AppShell";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { requireAuth } from "@/lib/guards";

export const Route = createFileRoute("/courses")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: "Courses — StudyAI" }] }),
  component: CoursesPage,
});

// ─── Types ────────────────────────────────────────────────────────────────────

type DocType = "PDF" | "SVG" | "XLS" | "DOC" | "IMG" | "TXT" | "PPT";

interface Doc {
  id: string;
  name: string;
  date: string;
  type: DocType;
  url?: string;
  size?: number;
  file_path?: string;
}

interface FolderNode {
  id: string;
  name: string;
  parent_id?: string | null;
  children?: FolderNode[];
  docs?: Doc[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extToType(filename: string): DocType {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return "PDF";
  if (["doc", "docx"].includes(ext)) return "DOC";
  if (["xls", "xlsx", "csv"].includes(ext)) return "XLS";
  if (["ppt", "pptx"].includes(ext)) return "PPT";
  if (["svg"].includes(ext)) return "SVG";
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) return "IMG";
  return "TXT";
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function nanoid() {
  return Math.random().toString(36).slice(2, 10);
}

/** Determine how to open a document given its type and public URL */
function openDoc(doc: Doc) {
  const url = doc.url;
  if (!url) return;

  if (doc.type === "PDF" || doc.type === "IMG" || doc.type === "SVG") {
    // Open natively in the browser
    window.open(url, "_blank", "noopener,noreferrer");
  } else {
    // Word, Excel, PowerPoint → Google Docs Viewer
    const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=false`;
    window.open(viewerUrl, "_blank", "noopener,noreferrer");
  }
}

function downloadDoc(doc: Doc) {
  if (!doc.url) return;
  const a = document.createElement("a");
  a.href = doc.url;
  a.download = doc.name;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ─── Static fallback tree ──────────────────────────────────────────────────────

const FALLBACK_TREE: FolderNode[] = [
  {
    id: "f1", name: "Chemistry",
    children: [
      { id: "f1-1", name: "Organic",    docs: [{ id: "d1", name: "Alkanes overview.pdf",   date: "05/2026", type: "PDF" }, { id: "d2", name: "Functional groups.pdf", date: "05/2026", type: "PDF" }] },
      { id: "f1-2", name: "Inorganic",  docs: [{ id: "d3", name: "Periodic table notes.docx", date: "04/2026", type: "DOC" }, { id: "d4", name: "Bonding diagram.svg", date: "04/2026", type: "SVG" }, { id: "d5", name: "Reaction rates.xlsx", date: "04/2026", type: "XLS" }] },
      { id: "f1-3", name: "Past Papers", docs: [{ id: "d7", name: "2024 Mock Paper.pdf",   date: "01/2026", type: "PDF" }] },
    ],
  },
  { id: "f2", name: "Economics", children: [{ id: "f2-1", name: "Microeconomics", docs: [{ id: "d9", name: "Supply & demand.pdf", date: "05/2026", type: "PDF" }] }] },
  { id: "f3", name: "Biology",   children: [{ id: "f3-1", name: "Cell Biology", docs: [{ id: "d12", name: "Cell division.pdf", date: "05/2026", type: "PDF" }, { id: "d13", name: "Organelle chart.svg", date: "05/2026", type: "SVG" }] }] },
  { id: "f4", name: "Mathematics", docs: [] },
  { id: "f5", name: "Physics", docs: [] },
];

// ─── File Type Icon ────────────────────────────────────────────────────────────

function FileTypeIcon({ type, size = 72 }: { type: DocType; size?: number }) {
  const COLORS: Record<DocType, { body: string; fold: string }> = {
    PDF: { body: "#E53935", fold: "#B71C1C" },
    DOC: { body: "#1565C0", fold: "#0D47A1" },
    XLS: { body: "#2E7D32", fold: "#1B5E20" },
    PPT: { body: "#D84315", fold: "#BF360C" },
    SVG: { body: "#F57C00", fold: "#E65100" },
    IMG: { body: "#6A1FA2", fold: "#4A148C" },
    TXT: { body: "#546E7A", fold: "#37474F" },
  };
  const { body, fold } = COLORS[type];
  const W = size, H = Math.round(size * 1.25);
  const r = W * 0.1, fc = W * 0.28, lx = W * 0.14, ly = H * 0.56, lh = H * 0.26, fs = W * 0.22;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none">
      <path d={`M ${r} 0 H ${W-fc} L ${W} ${fc} V ${H-r} Q ${W} ${H} ${W-r} ${H} H ${r} Q 0 ${H} 0 ${H-r} V ${r} Q 0 0 ${r} 0 Z`} fill={body} />
      <path d={`M ${W-fc} 0 L ${W} ${fc} H ${W-fc} Z`} fill={fold} />
      <rect x={lx} y={ly} width={W-lx*2} height={lh} rx={r*0.5} fill="rgba(0,0,0,0.18)" />
      <text x={W/2} y={ly+lh*0.72} textAnchor="middle" fill="white" fontSize={fs} fontWeight="800" fontFamily="system-ui,sans-serif" letterSpacing={W*-0.01}>
        {type}
      </text>
    </svg>
  );
}

// ─── Doc Action Menu ──────────────────────────────────────────────────────────

function DocActionMenu({
  doc,
  onOpen,
  onDownload,
  onRename,
  onDelete,
}: {
  doc: Doc;
  onOpen: () => void;
  onDownload: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function act(fn: () => void) {
    setOpen(false);
    fn();
  }

  return (
    <div ref={ref} className="relative" onClick={e => e.stopPropagation()}>
      <button
        onClick={() => setOpen(o => !o)}
        className="h-6 w-6 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
      >
        <MoreVertical className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div
          className="absolute right-0 top-7 z-50 rounded-xl shadow-xl py-1 min-w-[156px] overflow-hidden"
          style={{
            background: "rgba(18,18,24,0.96)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <button
            onClick={() => act(onOpen)}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[12.5px] text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <Play className="h-3.5 w-3.5 text-green-400" />
            Open
          </button>
          <button
            onClick={() => act(onDownload)}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[12.5px] text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <Download className="h-3.5 w-3.5 text-blue-400" />
            Download
          </button>
          <button
            onClick={() => act(onRename)}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[12.5px] text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <Pencil className="h-3.5 w-3.5 text-yellow-400" />
            Rename
          </button>
          <div className="my-1 border-t border-white/10" />
          <button
            onClick={() => act(onDelete)}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[12.5px] text-rose-400 hover:text-rose-300 hover:bg-rose-500/15 transition"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Doc Card ─────────────────────────────────────────────────────────────────

function DocCard({
  doc, onOpen, onDownload, onRename, onDelete,
}: {
  doc: Doc;
  onOpen: () => void;
  onDownload: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className="group rounded-2xl bg-white border border-black/[0.07] p-3.5 hover:shadow-md transition cursor-pointer flex flex-col items-center gap-2.5 shadow-sm relative"
      onClick={onOpen}
    >
      <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition">
        <DocActionMenu
          doc={doc}
          onOpen={onOpen}
          onDownload={onDownload}
          onRename={onRename}
          onDelete={onDelete}
        />
      </div>
      <FileTypeIcon type={doc.type} size={64} />
      <div className="w-full text-center">
        <p className="text-[12px] font-semibold text-gray-800 truncate leading-tight">{doc.name}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">{doc.date}</p>
      </div>
    </div>
  );
}

// ─── Doc Row ──────────────────────────────────────────────────────────────────

function DocRow({
  doc, onOpen, onDownload, onRename, onDelete,
}: {
  doc: Doc;
  onOpen: () => void;
  onDownload: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className="flex items-center gap-3.5 px-4 py-2.5 hover:bg-gray-50/70 transition group cursor-pointer"
      onClick={onOpen}
    >
      <FileTypeIcon type={doc.type} size={32} />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-gray-800 truncate">{doc.name}</p>
        <p className="text-[11px] text-gray-400">{doc.date}</p>
      </div>
      <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-gray-100 text-gray-500">{doc.type}</span>
      <div className="opacity-0 group-hover:opacity-100 transition" onClick={e => e.stopPropagation()}>
        <DocActionMenu
          doc={doc}
          onOpen={onOpen}
          onDownload={onDownload}
          onRename={onRename}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}

// ─── Tree Item ─────────────────────────────────────────────────────────────────

function TreeItem({
  node, depth, selectedId, onSelect, onContextMenu,
}: {
  node: FolderNode; depth: number; selectedId: string;
  onSelect: (n: FolderNode) => void;
  onContextMenu: (e: React.MouseEvent, n: FolderNode) => void;
}) {
  const [open, setOpen] = useState(depth === 0);
  const hasChildren = (node.children?.length ?? 0) > 0;
  const isSelected = node.id === selectedId;

  return (
    <div>
      <div
        className={`group flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer select-none transition-colors ${
          isSelected ? "bg-gray-900 text-white" : "hover:bg-gray-100 text-gray-700"
        }`}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
        onClick={() => { setOpen(!open); onSelect(node); }}
      >
        <span className="flex items-center justify-center h-3.5 w-3.5 shrink-0">
          {hasChildren
            ? open
              ? <ChevronDown className="h-3 w-3" />
              : <ChevronRight className="h-3 w-3" />
            : <span className="h-1.5 w-1.5 rounded-full bg-current opacity-25 mx-auto" />}
        </span>
        <span className="shrink-0">
          {isSelected
            ? <FolderOpen className="h-3.5 w-3.5" />
            : <Folder className="h-3.5 w-3.5 opacity-60" />}
        </span>
        <span className={`text-[12.5px] flex-1 truncate ${isSelected ? "font-semibold" : "font-medium"}`}>
          {node.name}
        </span>
        <button
          className="opacity-0 group-hover:opacity-100 h-5 w-5 rounded-md flex items-center justify-center hover:bg-black/10 transition shrink-0"
          onClick={(e) => { e.stopPropagation(); onContextMenu(e, node); }}
        >
          <MoreHorizontal className="h-3 w-3 text-current opacity-70" />
        </button>
      </div>
      {open && hasChildren && (
        <div>
          {node.children!.map(child => (
            <TreeItem key={child.id} node={child} depth={depth + 1}
              selectedId={selectedId} onSelect={onSelect} onContextMenu={onContextMenu} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── New Folder Modal ─────────────────────────────────────────────────────────

function NewFolderModal({
  parentNode, userId, onClose, onCreated,
}: {
  parentNode: FolderNode | null;
  userId: string;
  onClose: () => void;
  onCreated: (folder: FolderNode) => void;
}) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  async function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) { setError("Please enter a folder name."); return; }
    setLoading(true);
    setError(null);

    const newFolder: FolderNode = { id: nanoid(), name: trimmed, docs: [], children: [] };

    try {
      await supabase.from("courses").insert({
        id: newFolder.id,
        user_id: userId,
        title: trimmed,
        parent_id: parentNode?.id ?? null,
        created_at: new Date().toISOString(),
      });
    } catch (_) {}

    onCreated(newFolder);
    onClose();
    setLoading(false);
  }

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-10 w-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0">
            <FolderPlus className="h-5 w-5 text-orange-500" />
          </div>
          <div>
            <h2 className="text-[15px] font-bold text-gray-900 tracking-tight">New Folder</h2>
            <p className="text-[12px] text-gray-400 mt-0.5">
              {parentNode ? `Inside "${parentNode.name}"` : "Top-level course folder"}
            </p>
          </div>
        </div>

        <input
          ref={inputRef}
          value={name}
          onChange={e => { setName(e.target.value); setError(null); }}
          onKeyDown={e => e.key === "Enter" && handleCreate()}
          placeholder="e.g. Organic Chemistry"
          className="w-full rounded-xl border border-black/[0.1] bg-gray-50 px-4 py-2.5 text-[13.5px] font-medium outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400 transition placeholder:text-gray-400"
        />
        {error && <p className="mt-2 text-[12px] text-red-500 font-medium">{error}</p>}

        <div className="flex gap-2.5 mt-5">
          <button onClick={onClose} className="flex-1 rounded-xl border border-black/[0.08] text-[13px] font-semibold text-gray-600 py-2.5 hover:bg-gray-50 transition">
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={loading}
            className="flex-1 rounded-xl text-white text-[13px] font-semibold py-2.5 flex items-center justify-center gap-2 transition disabled:opacity-60"
            style={{ background: "linear-gradient(135deg,#f97316 0%,#dc2626 100%)" }}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderPlus className="h-4 w-4" />}
            Create Folder
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
}

// ─── Rename Modal ─────────────────────────────────────────────────────────────

function RenameModal({
  doc, userId, onClose, onRenamed,
}: {
  doc: Doc;
  userId: string;
  onClose: () => void;
  onRenamed: (id: string, newName: string) => void;
}) {
  const [name, setName] = useState(doc.name);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  async function handleRename() {
    const trimmed = name.trim();
    if (!trimmed) { setError("Please enter a name."); return; }
    if (trimmed === doc.name) { onClose(); return; }
    setLoading(true);
    setError(null);

    try {
      const { error: dbErr } = await supabase
        .from("documents")
        .update({ name: trimmed })
        .eq("id", doc.id)
        .eq("user_id", userId);

      if (dbErr) throw dbErr;
    } catch (_) {
      // If DB fails (e.g. fallback demo data), still update locally
    }

    onRenamed(doc.id, trimmed);
    onClose();
    setLoading(false);
  }

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-10 w-10 rounded-xl bg-yellow-50 border border-yellow-100 flex items-center justify-center shrink-0">
            <Pencil className="h-5 w-5 text-yellow-500" />
          </div>
          <div>
            <h2 className="text-[15px] font-bold text-gray-900 tracking-tight">Rename Document</h2>
            <p className="text-[12px] text-gray-400 mt-0.5 truncate max-w-[220px]">{doc.name}</p>
          </div>
        </div>

        <input
          ref={inputRef}
          value={name}
          onChange={e => { setName(e.target.value); setError(null); }}
          onKeyDown={e => e.key === "Enter" && handleRename()}
          className="w-full rounded-xl border border-black/[0.1] bg-gray-50 px-4 py-2.5 text-[13.5px] font-medium outline-none focus:ring-2 focus:ring-yellow-400/40 focus:border-yellow-400 transition"
        />
        {error && <p className="mt-2 text-[12px] text-red-500 font-medium">{error}</p>}

        <div className="flex gap-2.5 mt-5">
          <button onClick={onClose} className="flex-1 rounded-xl border border-black/[0.08] text-[13px] font-semibold text-gray-600 py-2.5 hover:bg-gray-50 transition">
            Cancel
          </button>
          <button
            onClick={handleRename}
            disabled={loading}
            className="flex-1 rounded-xl text-white text-[13px] font-semibold py-2.5 flex items-center justify-center gap-2 transition disabled:opacity-60"
            style={{ background: "linear-gradient(135deg,#eab308 0%,#d97706 100%)" }}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
            Rename
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

function DeleteModal({
  doc, userId, onClose, onDeleted,
}: {
  doc: Doc;
  userId: string;
  onClose: () => void;
  onDeleted: (id: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setLoading(true);
    setError(null);

    try {
      // Delete from storage if we have a file path
      if (doc.file_path) {
        await supabase.storage.from("documents").remove([doc.file_path]);
      }

      // Delete DB record
      const { error: dbErr } = await supabase
        .from("documents")
        .delete()
        .eq("id", doc.id)
        .eq("user_id", userId);

      if (dbErr) throw dbErr;
    } catch (err: any) {
      // Still remove locally even if DB/storage delete fails (e.g. demo data)
    }

    onDeleted(doc.id);
    onClose();
    setLoading(false);
  }

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
            <Trash2 className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <h2 className="text-[15px] font-bold text-gray-900 tracking-tight">Delete Document</h2>
            <p className="text-[12px] text-gray-400 mt-0.5">This action cannot be undone.</p>
          </div>
        </div>

        <div className="rounded-xl bg-gray-50 border border-black/[0.07] px-4 py-3 mb-5">
          <p className="text-[13px] font-semibold text-gray-700 truncate">{doc.name}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{doc.type} · {doc.date}</p>
        </div>

        {error && <p className="mb-3 text-[12px] text-red-500 font-medium">{error}</p>}

        <div className="flex gap-2.5">
          <button onClick={onClose} className="flex-1 rounded-xl border border-black/[0.08] text-[13px] font-semibold text-gray-600 py-2.5 hover:bg-gray-50 transition">
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 rounded-xl text-white text-[13px] font-semibold py-2.5 flex items-center justify-center gap-2 transition disabled:opacity-60 bg-red-500 hover:bg-red-600"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Delete
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
}

// ─── Upload Document Modal ────────────────────────────────────────────────────

type UploadStatus = "idle" | "uploading" | "done" | "error";

interface PendingFile {
  id: string;
  file: File;
  status: UploadStatus;
  progress: number;
  errorMsg?: string;
  doc?: Doc;
}

function UploadModal({
  targetFolder, userId, onClose, onUploaded,
}: {
  targetFolder: FolderNode;
  userId: string;
  onClose: () => void;
  onUploaded: (docs: Doc[], folderId: string) => void;
}) {
  const [pending, setPending] = useState<PendingFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const allDone = pending.length > 0 && pending.every(p => p.status === "done" || p.status === "error");

  function addFiles(files: FileList | null) {
    if (!files) return;
    const newItems: PendingFile[] = Array.from(files).map(f => ({
      id: nanoid(), file: f, status: "idle", progress: 0,
    }));
    setPending(prev => [...prev, ...newItems]);
  }

  function removeFile(id: string) {
    setPending(prev => prev.filter(p => p.id !== id));
  }

  async function uploadFile(item: PendingFile): Promise<Doc | null> {
    setPending(prev => prev.map(p => p.id === item.id ? { ...p, status: "uploading", progress: 10 } : p));

    const path = `${userId}/${targetFolder.id}/${Date.now()}_${item.file.name}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(path, item.file, { upsert: false });

      if (uploadError) throw uploadError;

      setPending(prev => prev.map(p => p.id === item.id ? { ...p, progress: 70 } : p));

      const { data: { publicUrl } } = supabase.storage.from("documents").getPublicUrl(path);

      const docRecord = {
        id: nanoid(),
        user_id: userId,
        name: item.file.name,
        course_name: targetFolder.name,
        folder_id: targetFolder.id,
        file_size: item.file.size,
        file_path: path,
        public_url: publicUrl,
        status: "pending",
        created_at: new Date().toISOString(),
      };

      try {
        await supabase.from("documents").insert(docRecord);
      } catch (_) {}

      const doc: Doc = {
        id: docRecord.id,
        name: item.file.name,
        date: formatDate(docRecord.created_at),
        type: extToType(item.file.name),
        url: publicUrl,
        size: item.file.size,
        file_path: path,
      };

      setPending(prev => prev.map(p =>
        p.id === item.id ? { ...p, status: "done", progress: 100, doc } : p
      ));

      return doc;
    } catch (err: any) {
      const msg = err?.message ?? "Upload failed";
      const friendly = msg.includes("Bucket not found")
        ? "Storage bucket missing — contact support."
        : msg.includes("row-level security")
        ? "Permission denied. Please log in again."
        : msg;

      setPending(prev => prev.map(p =>
        p.id === item.id ? { ...p, status: "error", errorMsg: friendly } : p
      ));
      return null;
    }
  }

  async function handleUploadAll() {
    const idle = pending.filter(p => p.status === "idle" || p.status === "error");
    // Just upload — do NOT call onUploaded here. handleFinish does that once
    // when the user clicks Done, avoiding the double-add bug.
    await Promise.all(idle.map(uploadFile));
  }

  function handleFinish() {
    // Collect all successfully uploaded docs and report them exactly once
    const docs = pending.filter(p => p.status === "done").map(p => p.doc!);
    if (docs.length > 0) onUploaded(docs, targetFolder.id);
    onClose();
  }

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
            <Upload className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h2 className="text-[15px] font-bold text-gray-900 tracking-tight">Upload Documents</h2>
            <p className="text-[12px] text-gray-400 mt-0.5">To "{targetFolder.name}"</p>
          </div>
          <button onClick={onClose} className="ml-auto text-gray-400 hover:text-gray-600 transition">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div
          className={`relative rounded-2xl border-2 border-dashed transition-colors cursor-pointer ${
            dragging ? "border-orange-400 bg-orange-50" : "border-black/10 bg-gray-50 hover:border-orange-300 hover:bg-orange-50/50"
          }`}
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.svg,.png,.jpg,.jpeg,.gif,.webp,.txt"
            onChange={e => addFiles(e.target.files)}
          />
          <div className="flex flex-col items-center justify-center py-8 gap-2 pointer-events-none">
            <div className="h-10 w-10 rounded-xl bg-white border border-black/[0.08] flex items-center justify-center shadow-sm">
              <Upload className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-[13px] font-semibold text-gray-700">
              {dragging ? "Drop files here" : "Click or drag files here"}
            </p>
            <p className="text-[11.5px] text-gray-400">PDF, DOC, PPT, XLS, SVG, IMG, TXT supported</p>
          </div>
        </div>

        {pending.length > 0 && (
          <div className="mt-3 space-y-2 max-h-52 overflow-y-auto">
            {pending.map(item => (
              <div key={item.id} className="flex items-center gap-3 rounded-xl bg-gray-50 border border-black/[0.06] px-3 py-2.5">
                <FileTypeIcon type={extToType(item.file.name)} size={28} />
                <div className="flex-1 min-w-0">
                  <p className="text-[12.5px] font-semibold text-gray-800 truncate">{item.file.name}</p>
                  {item.status === "uploading" && (
                    <div className="mt-1 h-1 rounded-full bg-gray-200 overflow-hidden">
                      <div className="h-full bg-orange-400 rounded-full transition-all" style={{ width: `${item.progress}%` }} />
                    </div>
                  )}
                  {item.status === "error" && <p className="text-[11px] text-red-500 mt-0.5">{item.errorMsg}</p>}
                  {item.status === "done" && <p className="text-[11px] text-green-600 mt-0.5 font-medium">Uploaded</p>}
                </div>
                {item.status === "done" && <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />}
                {item.status === "error" && <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />}
                {item.status === "uploading" && <Loader2 className="h-4 w-4 text-orange-400 animate-spin shrink-0" />}
                {item.status === "idle" && (
                  <button onClick={() => removeFile(item.id)} className="text-gray-300 hover:text-gray-500 transition shrink-0">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2.5 mt-5">
          <button onClick={onClose} className="flex-1 rounded-xl border border-black/[0.08] text-[13px] font-semibold text-gray-600 py-2.5 hover:bg-gray-50 transition">
            {allDone ? "Close" : "Cancel"}
          </button>
          {allDone ? (
            <button
              onClick={handleFinish}
              className="flex-1 rounded-xl text-white text-[13px] font-semibold py-2.5 flex items-center justify-center gap-2 transition"
              style={{ background: "linear-gradient(135deg,#16a34a 0%,#15803d 100%)" }}
            >
              <CheckCircle2 className="h-4 w-4" /> Done
            </button>
          ) : (
            <button
              onClick={handleUploadAll}
              disabled={pending.length === 0 || pending.every(p => p.status === "uploading")}
              className="flex-1 rounded-xl text-white text-[13px] font-semibold py-2.5 flex items-center justify-center gap-2 transition disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,#f97316 0%,#dc2626 100%)" }}
            >
              <Upload className="h-4 w-4" />
              Upload {pending.length > 0 ? `(${pending.filter(p => p.status === "idle" || p.status === "error").length})` : ""}
            </button>
          )}
        </div>
      </div>
    </ModalBackdrop>
  );
}

// ─── Modal Backdrop ────────────────────────────────────────────────────────────

function ModalBackdrop({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }}
    >
      <div className="absolute inset-0" onClick={onClose} />
      <div
        className="relative w-full rounded-2xl bg-white p-6 shadow-2xl"
        style={{ maxWidth: 480 }}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

// ─── Context Menu ─────────────────────────────────────────────────────────────

function ContextMenu({
  x, y, onClose, onAddDoc, onAddFolder,
}: {
  x: number; y: number;
  onClose: () => void;
  onAddDoc: () => void;
  onAddFolder: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 rounded-2xl shadow-2xl py-1.5 min-w-[172px] text-sm overflow-hidden"
        style={{
          top: y, left: x,
          background: "rgba(18,18,24,0.96)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {[
          { label: "Add document", action: onAddDoc },
          { label: "Add sub-folder", action: onAddFolder },
          { label: "Rename", action: onClose },
          { label: "Archive", action: onClose },
        ].map(({ label, action }) => (
          <button key={label} onClick={action}
            className="w-full text-left px-4 py-2 transition text-white/80 hover:text-white hover:bg-white/10">
            {label}
          </button>
        ))}
        <div className="my-1.5 border-t border-white/10" />
        <button onClick={onClose}
          className="w-full text-left px-4 py-2 transition font-medium text-rose-400 hover:bg-rose-500/15">
          Delete
        </button>
      </div>
    </>
  );
}

// ─── Tree state helpers ───────────────────────────────────────────────────────

function addFolderToTree(tree: FolderNode[], parentId: string | null, newFolder: FolderNode): FolderNode[] {
  if (!parentId) return [...tree, newFolder];
  return tree.map(node => {
    if (node.id === parentId) return { ...node, children: [...(node.children ?? []), newFolder] };
    if (node.children) return { ...node, children: addFolderToTree(node.children, parentId, newFolder) };
    return node;
  });
}

function addDocsToTree(tree: FolderNode[], folderId: string, docs: Doc[]): FolderNode[] {
  return tree.map(node => {
    if (node.id === folderId) return { ...node, docs: [...(node.docs ?? []), ...docs] };
    if (node.children) return { ...node, children: addDocsToTree(node.children, folderId, docs) };
    return node;
  });
}

function renameDocInTree(tree: FolderNode[], docId: string, newName: string): FolderNode[] {
  return tree.map(node => ({
    ...node,
    docs: (node.docs ?? []).map(d => d.id === docId ? { ...d, name: newName } : d),
    children: node.children ? renameDocInTree(node.children, docId, newName) : undefined,
  }));
}

function deleteDocFromTree(tree: FolderNode[], docId: string): FolderNode[] {
  return tree.map(node => ({
    ...node,
    docs: (node.docs ?? []).filter(d => d.id !== docId),
    children: node.children ? deleteDocFromTree(node.children, docId) : undefined,
  }));
}

function findNode(tree: FolderNode[], id: string): FolderNode | null {
  for (const node of tree) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNode(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CoursesPage() {
  const { user } = useAuth();
  const [tree, setTree] = useState<FolderNode[]>([]);
  const [selected, setSelected] = useState<FolderNode | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"Name" | "Date" | "UID">("Name");
  const [ctx, setCtx] = useState<{ x: number; y: number; node: FolderNode } | null>(null);

  const [folderModal, setFolderModal] = useState<{ parentNode: FolderNode | null } | null>(null);
  const [uploadModal, setUploadModal] = useState<{ targetFolder: FolderNode } | null>(null);
  const [renameModal, setRenameModal] = useState<Doc | null>(null);
  const [deleteModal, setDeleteModal] = useState<Doc | null>(null);

  // ── Load user's folders + documents from Supabase on mount ────────────────
  useEffect(() => {
    if (!user) return;

    async function loadData() {
      setDataLoading(true);
      try {
        // Fetch folders and documents in parallel
        const [
          { data: folders, error: fErr },
          { data: docs, error: dErr },
        ] = await Promise.all([
          supabase
            .from("courses")
            .select("id, title, parent_id, created_at")
            .eq("user_id", user!.id)
            .order("created_at", { ascending: true }),
          supabase
            .from("documents")
            .select("id, name, folder_id, file_size, file_path, public_url, status, created_at")
            .eq("user_id", user!.id)
            .order("created_at", { ascending: true }),
        ]);

        // Only fall back to demo tree on a hard fetch error (network/RLS/missing table).
        // An empty folders list is a valid state for a new user — don't show demo data.
        if (fErr) {
          console.warn("Failed to load courses:", fErr.message);
          setTree(FALLBACK_TREE);
          setSelected(FALLBACK_TREE[0].children![1]);
          return;
        }

        // New user with no folders yet — show empty state so they can create one
        if (!folders || folders.length === 0) {
          setTree([]);
          setSelected(null);
          return;
        }

        // Build flat map of folder nodes
        const nodeMap: Record<string, FolderNode> = {};
        for (const f of folders) {
          nodeMap[f.id] = { id: f.id, name: f.title, parent_id: f.parent_id, docs: [], children: [] };
        }

        // Attach documents to their folder node
        // A docs fetch error is non-fatal — folders still render, just without files
        if (!dErr) {
          for (const d of (docs ?? [])) {
            const node = nodeMap[d.folder_id];
            if (node) {
              node.docs!.push({
                id: d.id,
                name: d.name,
                date: formatDate(d.created_at),
                type: extToType(d.name),
                url: d.public_url ?? undefined,
                size: d.file_size ?? undefined,
                file_path: d.file_path ?? undefined,
              });
            }
          }
        } else {
          console.warn("Failed to load documents:", dErr.message);
        }

        // Build nested tree from flat list
        const roots: FolderNode[] = [];
        for (const f of folders) {
          const node = nodeMap[f.id];
          if (f.parent_id && nodeMap[f.parent_id]) {
            nodeMap[f.parent_id].children!.push(node);
          } else {
            roots.push(node);
          }
        }

        setTree(roots);
        // Default to first child folder, or first root if no children
        setSelected(roots[0]?.children?.[0] ?? roots[0] ?? null);
      } finally {
        setDataLoading(false);
      }
    }

    void loadData();
  }, [user]);

  // Keep selected node in sync after tree mutations
  useEffect(() => {
    if (!selected) return;
    const fresh = findNode(tree, selected.id);
    if (fresh) setSelected(fresh);
  }, [tree]);

  const docs = selected?.docs ?? [];
  const sortedDocs = [...docs].sort((a, b) => {
    if (sortBy === "Name") return a.name.localeCompare(b.name);
    if (sortBy === "Date") return b.date.localeCompare(a.date);
    return a.id.localeCompare(b.id);
  });

  function handleContextMenu(e: React.MouseEvent, node: FolderNode) {
    setCtx({ x: e.clientX, y: e.clientY, node });
  }

  function handleFolderCreated(folder: FolderNode) {
    setTree(prev => addFolderToTree(prev, folderModal?.parentNode?.id ?? null, folder));
  }

  function handleDocsUploaded(newDocs: Doc[], folderId?: string) {
    // Prefer the explicitly passed folderId (captured at modal-open time) to avoid
    // stale-closure issues where `selected` has already been updated by the tree sync.
    const targetId = folderId ?? selected?.id;
    if (!targetId) return;
    setTree(prev => addDocsToTree(prev, targetId, newDocs));
  }

  function handleRenamed(id: string, newName: string) {
    setTree(prev => renameDocInTree(prev, id, newName));
  }

  function handleDeleted(id: string) {
    setTree(prev => deleteDocFromTree(prev, id));
  }

  const userId = user?.id ?? "local";

  function docActions(doc: Doc) {
    return {
      onOpen: () => openDoc(doc),
      onDownload: () => downloadDoc(doc),
      onRename: () => setRenameModal(doc),
      onDelete: () => setDeleteModal(doc),
    };
  }

  // ── Loading state ──────────────────────────────────────────────────────────
  if (dataLoading) {
    return (
      <AppShell>
        <div className="flex h-full items-center justify-center bg-[#F5F5F7]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
            <p className="text-[13px] text-gray-400 font-medium">Loading your courses…</p>
          </div>
        </div>
      </AppShell>
    );
  }

  // ── No folders yet ─────────────────────────────────────────────────────────
  if (!selected) {
    return (
      <AppShell>
        <div className="flex h-full items-center justify-center bg-[#F5F5F7]">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="h-16 w-16 rounded-2xl bg-white border border-black/[0.07] flex items-center justify-center shadow-sm">
              <FolderPlus className="h-7 w-7 text-gray-300" />
            </div>
            <div>
              <p className="text-[15px] font-bold text-gray-700">No course folders yet</p>
              <p className="text-[12.5px] text-gray-400 mt-1">Create your first folder to get started</p>
            </div>
            <button
              onClick={() => setFolderModal({ parentNode: null })}
              className="flex items-center gap-2 text-white text-[13px] font-semibold px-5 py-2 rounded-xl transition hover:shadow-md"
              style={{ background: "linear-gradient(135deg,#f97316 0%,#dc2626 100%)" }}
            >
              <FolderPlus className="h-4 w-4" /> New Folder
            </button>
            {folderModal && (
              <NewFolderModal
                parentNode={folderModal.parentNode}
                userId={userId}
                onClose={() => setFolderModal(null)}
                onCreated={(folder) => {
                  setTree([folder]);
                  setSelected(folder);
                  setFolderModal(null);
                }}
              />
            )}
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex h-full overflow-hidden bg-[#F5F5F7]" style={{ fontFamily: "'Inter var','Inter',system-ui,sans-serif" }}>

        {/* ── Folder tree sidebar ── */}
        <aside className="w-[232px] shrink-0 bg-white border-r border-black/[0.06] flex flex-col h-full overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-black/[0.06]">
            <span className="font-bold text-[13px] text-gray-900 tracking-[-0.01em]">My Courses</span>
            <div className="flex items-center gap-0.5">
              <button className="h-7 w-7 rounded-lg hover:bg-gray-100 flex items-center justify-center transition">
                <MoreHorizontal className="h-4 w-4 text-gray-400" />
              </button>
              <button
                title="New top-level folder"
                onClick={() => setFolderModal({ parentNode: null })}
                className="h-7 w-7 rounded-lg hover:bg-gray-100 flex items-center justify-center transition"
              >
                <Plus className="h-4 w-4 text-gray-400" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {tree.map(node => (
              <TreeItem
                key={node.id} node={node} depth={0}
                selectedId={selected.id} onSelect={setSelected}
                onContextMenu={handleContextMenu}
              />
            ))}
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 flex flex-col h-full overflow-hidden">

          {/* Top bar */}
          <div className="flex items-center justify-between px-6 py-2.5 border-b border-black/[0.06] bg-white shrink-0">
            <div className="flex items-center gap-1 text-sm">
              <span className="text-gray-400 text-[12.5px] font-medium mr-1.5">Sort by:</span>
              {(["Name", "Date", "UID"] as const).map(s => (
                <button key={s} onClick={() => setSortBy(s)}
                  className={`px-3 py-1 rounded-lg text-[12.5px] font-medium transition-colors ${
                    sortBy === s ? "bg-gray-900 text-white" : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                  }`}>{s}</button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button className="text-[12.5px] text-gray-500 px-3 py-1.5 rounded-xl hover:bg-gray-100 transition font-medium">Filter</button>
              <button className="text-[12.5px] text-gray-500 px-3 py-1.5 rounded-xl hover:bg-gray-100 transition font-medium">Archive</button>
              <button
                onClick={() => setFolderModal({ parentNode: selected })}
                className="flex items-center gap-1.5 text-[12.5px] font-semibold px-3.5 py-1.5 rounded-xl text-white transition shadow-sm hover:shadow"
                style={{ background: "linear-gradient(135deg,#f97316 0%,#dc2626 100%)" }}
              >
                <FolderOpen className="h-3.5 w-3.5" /> Add Folder
              </button>
            </div>
          </div>

          {/* Folder header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-3 shrink-0 bg-[#F5F5F7]">
            <div className="flex items-center gap-2.5">
              <h2 className="text-[22px] font-extrabold text-gray-900 tracking-[-0.03em]">{selected.name}</h2>
              <button className="h-7 w-7 rounded-lg bg-white border border-black/[0.07] flex items-center justify-center hover:bg-gray-50 transition shadow-sm">
                <Settings2 className="h-3.5 w-3.5 text-gray-400" />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setUploadModal({ targetFolder: selected })}
                className="flex items-center gap-1.5 bg-white border border-black/[0.08] text-[12.5px] font-semibold px-4 py-1.5 rounded-xl hover:bg-gray-50 transition shadow-sm"
              >
                <Plus className="h-3.5 w-3.5 text-gray-500" />
                <span className="text-gray-700">Add Document</span>
              </button>
              <span className="text-[12px] text-gray-400 font-medium">{docs.length} files</span>
              <div className="flex items-center p-0.5 rounded-xl border border-black/[0.07] bg-white shadow-sm overflow-hidden">
                <button onClick={() => setView("grid")}
                  className={`h-7 w-7 flex items-center justify-center rounded-lg transition-colors ${view === "grid" ? "bg-gray-900 text-white" : "text-gray-400 hover:text-gray-600"}`}>
                  <Grid3X3 className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setView("list")}
                  className={`h-7 w-7 flex items-center justify-center rounded-lg transition-colors ${view === "list" ? "bg-gray-900 text-white" : "text-gray-400 hover:text-gray-600"}`}>
                  <List className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Document grid / list */}
          <div className="flex-1 overflow-y-auto px-6 pb-8">
            {sortedDocs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 gap-4">
                <div className="h-16 w-16 rounded-2xl bg-white border border-black/[0.07] flex items-center justify-center shadow-sm">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <path d="M5 8A3 3 0 018 5h8l2 3h9a3 3 0 013 3v14a3 3 0 01-3 3H8a3 3 0 01-3-3V8z" fill="#E2E8F0" />
                    <path d="M5 13h22" stroke="#CBD5E1" strokeWidth="1.5" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-[14px] font-semibold text-gray-700">No documents yet</p>
                  <p className="text-[12.5px] text-gray-400 mt-0.5">Add your first document to get started</p>
                </div>
                <button
                  onClick={() => setUploadModal({ targetFolder: selected })}
                  className="flex items-center gap-2 text-white text-[13px] font-semibold px-5 py-2 rounded-xl transition hover:shadow-md"
                  style={{ background: "linear-gradient(135deg,#f97316 0%,#dc2626 100%)" }}
                >
                  <FilePlus className="h-4 w-4" /> Upload Document
                </button>
              </div>
            ) : view === "grid" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
                {sortedDocs.map(doc => (
                  <DocCard key={doc.id} doc={doc} {...docActions(doc)} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-black/[0.07] overflow-hidden shadow-sm divide-y divide-black/[0.04]">
                {sortedDocs.map(doc => (
                  <DocRow key={doc.id} doc={doc} {...docActions(doc)} />
                ))}
              </div>
            )}
          </div>
        </main>

        {/* ── Context menu ── */}
        {ctx && (
          <ContextMenu
            x={ctx.x} y={ctx.y}
            onClose={() => setCtx(null)}
            onAddDoc={() => { setUploadModal({ targetFolder: ctx.node }); setCtx(null); }}
            onAddFolder={() => { setFolderModal({ parentNode: ctx.node }); setCtx(null); }}
          />
        )}

        {/* ── New Folder Modal ── */}
        {folderModal && (
          <NewFolderModal
            parentNode={folderModal.parentNode}
            userId={userId}
            onClose={() => setFolderModal(null)}
            onCreated={handleFolderCreated}
          />
        )}

        {/* ── Upload Modal ── */}
        {uploadModal && (
          <UploadModal
            targetFolder={uploadModal.targetFolder}
            userId={userId}
            onClose={() => setUploadModal(null)}
            onUploaded={(docs, folderId) => handleDocsUploaded(docs, folderId)}
          />
        )}

        {/* ── Rename Modal ── */}
        {renameModal && (
          <RenameModal
            doc={renameModal}
            userId={userId}
            onClose={() => setRenameModal(null)}
            onRenamed={handleRenamed}
          />
        )}

        {/* ── Delete Modal ── */}
        {deleteModal && (
          <DeleteModal
            doc={deleteModal}
            userId={userId}
            onClose={() => setDeleteModal(null)}
            onDeleted={handleDeleted}
          />
        )}
      </div>
    </AppShell>
  );
}