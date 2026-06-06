import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Folder, FolderOpen, ChevronDown, ChevronRight,
  MoreHorizontal, Plus, Grid3X3, List,
  Settings2, FilePlus,
} from "lucide-react";
import { AppShell } from "./-AppShell";

export const Route = createFileRoute("/courses")({
  head: () => ({ meta: [{ title: "Courses — StudyAI" }] }),
  component: CoursesPage,
});

// ─── Data ─────────────────────────────────────────────────────────────────────

type DocType = "PDF" | "SVG" | "XLS" | "DOC" | "IMG" | "TXT";

interface Doc {
  id: string;
  name: string;
  date: string;
  type: DocType;
}

interface FolderNode {
  id: string;
  name: string;
  children?: FolderNode[];
  docs?: Doc[];
}

const TREE: FolderNode[] = [
  {
    id: "f1", name: "Chemistry",
    children: [
      {
        id: "f1-1", name: "Organic",
        docs: [
          { id: "d1", name: "Alkanes overview", date: "05/2026", type: "PDF" },
          { id: "d2", name: "Functional groups", date: "05/2026", type: "PDF" },
        ],
      },
      {
        id: "f1-2", name: "Inorganic",
        docs: [
          { id: "d3", name: "Periodic table notes", date: "04/2026", type: "DOC" },
          { id: "d4", name: "Bonding diagram", date: "04/2026", type: "SVG" },
          { id: "d5", name: "Reaction rates", date: "04/2026", type: "XLS" },
          { id: "d6", name: "Lab report template", date: "03/2026", type: "PDF" },
        ],
      },
      {
        id: "f1-3", name: "Past Papers",
        docs: [
          { id: "d7", name: "2024 Mock Paper", date: "01/2026", type: "PDF" },
          { id: "d8", name: "Marking scheme", date: "01/2026", type: "PDF" },
        ],
      },
    ],
  },
  {
    id: "f2", name: "Economics",
    children: [
      {
        id: "f2-1", name: "Microeconomics",
        docs: [
          { id: "d9", name: "Supply & demand", date: "05/2026", type: "PDF" },
          { id: "d10", name: "Market structures", date: "05/2026", type: "DOC" },
        ],
      },
      {
        id: "f2-2", name: "Macroeconomics",
        docs: [
          { id: "d11", name: "GDP analysis", date: "04/2026", type: "XLS" },
        ],
      },
    ],
  },
  {
    id: "f3", name: "Biology",
    children: [
      {
        id: "f3-1", name: "Cell Biology",
        docs: [
          { id: "d12", name: "Cell division", date: "05/2026", type: "PDF" },
          { id: "d13", name: "Organelle chart", date: "05/2026", type: "SVG" },
          { id: "d14", name: "Mitosis notes", date: "04/2026", type: "DOC" },
          { id: "d15", name: "Lab observations", date: "04/2026", type: "XLS" },
          { id: "d16", name: "Microscopy images", date: "03/2026", type: "IMG" },
          { id: "d17", name: "Essay draft", date: "03/2026", type: "PDF" },
          { id: "d18", name: "Exam checklist", date: "03/2026", type: "PDF" },
        ],
      },
    ],
  },
  { id: "f4", name: "Mathematics", docs: [] },
  { id: "f5", name: "Physics", docs: [] },
  { id: "f6", name: "History", docs: [] },
  { id: "f7", name: "Literature", docs: [] },
  { id: "f8", name: "Geography", docs: [] },
  { id: "f9", name: "Computer Science", docs: [] },
  { id: "f10", name: "Art & Design", docs: [] },
  { id: "f11", name: "Physical Education", docs: [] },
];

// ─── Context menu ──────────────────────────────────────────────────────────────

function ContextMenu({ x, y, onClose, onAdd }: { x: number; y: number; onClose: () => void; onAdd: () => void }) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 rounded-2xl shadow-2xl py-1.5 min-w-[172px] text-sm overflow-hidden"
        style={{
          top: y,
          left: x,
          background: "rgba(18,18,24,0.96)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {[
          { label: "Edit", action: onClose },
          { label: "Add document", action: onAdd },
          { label: "Add folder", action: onClose },
          { label: "Archive", action: onClose },
        ].map(({ label, action }) => (
          <button
            key={label}
            onClick={action}
            className="w-full text-left px-4 py-2 transition text-white/80 hover:text-white hover:bg-white/10"
          >
            {label}
          </button>
        ))}
        <div className="my-1.5 border-t border-white/10" />
        <button
          onClick={onClose}
          className="w-full text-left px-4 py-2 transition font-medium text-rose-400 hover:bg-rose-500/15"
        >
          Delete
        </button>
      </div>
    </>
  );
}

// ─── File Type Icons — pixel-perfect SVG matching the app design ─────────────
//
// Each icon: solid colour body, white folded corner, bold white label.
// Colours: PDF & DOC = red #E53935 / orange #F57C00, XLS = green #2E7D32,
//          SVG = orange #F57C00, IMG = purple #7B1FA2, TXT = slate #546E7A
//
// The same component is used in both grid (size=72) and list (size=34) views.

function FileTypeIcon({ type, size = 72 }: { type: DocType; size?: number }) {
  // Palette
  const COLORS: Record<DocType, { body: string; fold: string }> = {
    PDF: { body: "#E53935", fold: "#B71C1C" },
    DOC: { body: "#1565C0", fold: "#0D47A1" },
    XLS: { body: "#2E7D32", fold: "#1B5E20" },
    SVG: { body: "#F57C00", fold: "#E65100" },
    IMG: { body: "#6A1FA2", fold: "#4A148C" },
    TXT: { body: "#546E7A", fold: "#37474F" },
  };

  const { body, fold } = COLORS[type];
  const W = size;
  const H = Math.round(size * 1.25); // 4:5 aspect ratio
  // Geometry — all proportional to W
  const r  = W * 0.1;          // corner radius of the body
  const fc = W * 0.28;         // fold cut size
  const lx = W * 0.14;         // label left start
  const ly = H * 0.56;         // label band top
  const lh = H * 0.26;         // label band height
  const fs = W * 0.22;         // font size

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* ── Body (rounded rect with top-right corner cut) ── */}
      <path
        d={`
          M ${r} 0
          H ${W - fc}
          L ${W} ${fc}
          V ${H - r}
          Q ${W} ${H} ${W - r} ${H}
          H ${r}
          Q 0 ${H} 0 ${H - r}
          V ${r}
          Q 0 0 ${r} 0
          Z
        `}
        fill={body}
      />
      {/* ── Folded corner triangle ── */}
      <path
        d={`M ${W - fc} 0 L ${W} ${fc} H ${W - fc} Z`}
        fill={fold}
      />
      {/* ── Label band ── */}
      <rect x={lx} y={ly} width={W - lx * 2} height={lh} rx={r * 0.5} fill="rgba(0,0,0,0.18)" />
      {/* ── Label text ── */}
      <text
        x={W / 2}
        y={ly + lh * 0.72}
        textAnchor="middle"
        fontFamily="'Arial Black', 'Arial', sans-serif"
        fontWeight="900"
        fontSize={fs}
        fill="white"
        letterSpacing="1"
      >
        {type}
      </text>
    </svg>
  );
}

/** Compact square icon used in list rows — same design, no label band, just initials */
function FileTypeBadge({ type }: { type: DocType }) {
  const COLORS: Record<DocType, string> = {
    PDF: "#E53935",
    DOC: "#1565C0",
    XLS: "#2E7D32",
    SVG: "#F57C00",
    IMG: "#6A1FA2",
    TXT: "#546E7A",
  };
  const S = 34;
  const fc = S * 0.28;
  const r  = S * 0.12;
  return (
    <svg width={S} height={S} viewBox={`0 0 ${S} ${S}`} fill="none" style={{ flexShrink: 0 }}>
      <rect width={S} height={S} rx={r} fill={COLORS[type]} />
      <text
        x={S / 2}
        y={S * 0.67}
        textAnchor="middle"
        fontFamily="'Arial Black', 'Arial', sans-serif"
        fontWeight="900"
        fontSize={S * 0.26}
        fill="white"
        letterSpacing="0.5"
      >
        {type}
      </text>
    </svg>
  );
}

// ─── Doc Card (Grid) ──────────────────────────────────────────────────────────

const TYPE_TINT: Record<DocType, string> = {
  PDF: "from-red-50   to-red-100/60",
  DOC: "from-blue-50  to-blue-100/60",
  XLS: "from-green-50 to-green-100/60",
  SVG: "from-orange-50 to-orange-100/60",
  IMG: "from-purple-50 to-purple-100/60",
  TXT: "from-slate-50  to-slate-100/60",
};

function DocCard({ doc }: { doc: Doc }) {
  return (
    <div
      className="group relative rounded-2xl border border-black/[0.06] bg-white hover:border-black/[0.12] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)" }}
    >
      {/* Thumbnail area */}
      <div className={`h-[120px] bg-gradient-to-br ${TYPE_TINT[doc.type]} flex items-center justify-center relative`}>
        {/* Subtle dot grid */}
        <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id={`dots-${doc.id}`} x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
              <circle cx="1.5" cy="1.5" r="1" fill="currentColor" className="text-black/20" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#dots-${doc.id})`} />
        </svg>
        {/* Icon — elevated with shadow */}
        <div
          className="relative z-10 transition-transform duration-200 group-hover:scale-105"
          style={{ filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.22))" }}
        >
          <FileTypeIcon type={doc.type} size={68} />
        </div>
        {/* Hover action strip */}
        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <button className="h-6 w-6 rounded-lg bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white transition">
            <Settings2 className="h-3 w-3 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Meta */}
      <div className="px-3 pt-2.5 pb-3">
        <p className="text-[13px] font-semibold text-gray-900 truncate leading-snug">{doc.name}</p>
        <p className="text-[11px] text-gray-400 mt-0.5 font-medium">{doc.date}</p>
      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-3 right-3 h-px bg-gradient-to-r from-transparent via-black/[0.06] to-transparent" />
    </div>
  );
}

// ─── Doc Row (List) ───────────────────────────────────────────────────────────

function DocRow({ doc }: { doc: Doc }) {
  return (
    <div className="group flex items-center gap-3.5 px-4 py-2.5 hover:bg-gray-50/80 transition-colors cursor-pointer">
      <FileTypeBadge type={doc.type} />
      <span className="flex-1 text-[13.5px] font-medium text-gray-800 truncate">{doc.name}</span>
      <span className="text-xs text-gray-400 font-medium shrink-0">{doc.date}</span>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="h-6 w-6 rounded-lg hover:bg-gray-100 flex items-center justify-center transition">
          <Settings2 className="h-3.5 w-3.5 text-gray-400" />
        </button>
      </div>
    </div>
  );
}

// ─── Tree item ────────────────────────────────────────────────────────────────

function TreeItem({
  node, depth, selectedId, onSelect, onContextMenu,
}: {
  node: FolderNode;
  depth: number;
  selectedId: string;
  onSelect: (n: FolderNode) => void;
  onContextMenu: (e: React.MouseEvent, n: FolderNode) => void;
}) {
  const [open, setOpen] = useState(depth === 0);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedId === node.id;

  return (
    <div>
      <div
        className={`flex items-center gap-1.5 py-[7px] rounded-xl cursor-pointer select-none group transition-colors ${
          isSelected
            ? "bg-amber-50 text-amber-900"
            : "hover:bg-gray-100/80 text-gray-600"
        }`}
        style={{ paddingLeft: `${10 + depth * 14}px`, paddingRight: "8px" }}
        onClick={() => { setOpen(!open); onSelect(node); }}
        onContextMenu={(e) => { e.preventDefault(); onContextMenu(e, node); }}
      >
        {hasChildren ? (
          <button
            className="shrink-0 h-4 w-4 flex items-center justify-center rounded"
            onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
          >
            {open
              ? <ChevronDown className="h-3 w-3 text-current opacity-60" />
              : <ChevronRight className="h-3 w-3 text-current opacity-60" />}
          </button>
        ) : (
          <span className="w-4 shrink-0" />
        )}

        {/* Folder icon — custom SVG for warmth */}
        <span className="shrink-0">
          {open && hasChildren ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M1 4.5A1.5 1.5 0 012.5 3h3.382a1 1 0 01.894.553L7.382 5H13.5A1.5 1.5 0 0115 6.5v6A1.5 1.5 0 0113.5 14h-11A1.5 1.5 0 011 12.5v-8z" fill="#F59E0B" />
              <path d="M1 7h14" stroke="#D97706" strokeWidth="0.75" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2.5 3A1.5 1.5 0 001 4.5v8A1.5 1.5 0 002.5 14h11A1.5 1.5 0 0015 12.5v-6A1.5 1.5 0 0013.5 5H7.382l-.606-1.212A1 1 0 005.882 3H2.5z" fill={isSelected ? "#F59E0B" : "#94A3B8"} />
            </svg>
          )}
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
            <TreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              onContextMenu={onContextMenu}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CoursesPage() {
  const [selected, setSelected] = useState<FolderNode>(TREE[0].children![1]);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"Name" | "Date" | "UID">("Name");
  const [ctx, setCtx] = useState<{ x: number; y: number; node: FolderNode } | null>(null);

  const docs = selected.docs ?? [];

  function handleContextMenu(e: React.MouseEvent, node: FolderNode) {
    setCtx({ x: e.clientX, y: e.clientY, node });
  }

  return (
    <AppShell>
      <div className="flex h-full overflow-hidden bg-[#F5F5F7]" style={{ fontFamily: "'Inter var', 'Inter', system-ui, sans-serif" }}>

        {/* ── Folder tree sidebar ── */}
        <aside className="w-[232px] shrink-0 bg-white border-r border-black/[0.06] flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-black/[0.06]">
            <span className="font-bold text-[13px] text-gray-900 tracking-[-0.01em]">My Courses</span>
            <div className="flex items-center gap-0.5">
              <button className="h-7 w-7 rounded-lg hover:bg-gray-100 flex items-center justify-center transition">
                <MoreHorizontal className="h-4 w-4 text-gray-400" />
              </button>
              <button className="h-7 w-7 rounded-lg hover:bg-gray-100 flex items-center justify-center transition">
                <Plus className="h-4 w-4 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Tree */}
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {TREE.map(node => (
              <TreeItem
                key={node.id}
                node={node}
                depth={0}
                selectedId={selected.id}
                onSelect={setSelected}
                onContextMenu={handleContextMenu}
              />
            ))}
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 flex flex-col h-full overflow-hidden">

          {/* Top bar */}
          <div className="flex items-center justify-between px-6 py-2.5 border-b border-black/[0.06] bg-white shrink-0">
            {/* Sort */}
            <div className="flex items-center gap-1 text-sm">
              <span className="text-gray-400 text-[12.5px] font-medium mr-1.5">Sort by:</span>
              {(["Name", "Date", "UID"] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setSortBy(s)}
                  className={`px-3 py-1 rounded-lg text-[12.5px] font-medium transition-colors ${
                    sortBy === s
                      ? "bg-gray-900 text-white"
                      : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button className="text-[12.5px] text-gray-500 px-3 py-1.5 rounded-xl hover:bg-gray-100 transition font-medium">
                Filter
              </button>
              <button className="text-[12.5px] text-gray-500 px-3 py-1.5 rounded-xl hover:bg-gray-100 transition font-medium">
                Archive
              </button>
              <button
                className="flex items-center gap-1.5 text-[12.5px] font-semibold px-3.5 py-1.5 rounded-xl text-white transition shadow-sm hover:shadow"
                style={{ background: "linear-gradient(135deg, #f97316 0%, #dc2626 100%)" }}
              >
                <FolderOpen className="h-3.5 w-3.5" />
                Add Folder
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
                className="flex items-center gap-1.5 bg-white border border-black/[0.08] text-[12.5px] font-semibold px-4 py-1.5 rounded-xl hover:bg-gray-50 transition shadow-sm"
              >
                <Plus className="h-3.5 w-3.5 text-gray-500" />
                <span className="text-gray-700">Add Document</span>
              </button>
              <span className="text-[12px] text-gray-400 font-medium">{docs.length} files</span>
              {/* View toggle */}
              <div
                className="flex items-center p-0.5 rounded-xl border border-black/[0.07] bg-white shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => setView("grid")}
                  className={`h-7 w-7 flex items-center justify-center rounded-lg transition-colors ${
                    view === "grid" ? "bg-gray-900 text-white" : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  <Grid3X3 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setView("list")}
                  className={`h-7 w-7 flex items-center justify-center rounded-lg transition-colors ${
                    view === "list" ? "bg-gray-900 text-white" : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  <List className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Document grid / list */}
          <div className="flex-1 overflow-y-auto px-6 pb-8">
            {docs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 gap-4">
                {/* Empty state */}
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
                  className="flex items-center gap-2 text-white text-[13px] font-semibold px-5 py-2 rounded-xl transition hover:shadow-md"
                  style={{ background: "linear-gradient(135deg, #f97316 0%, #dc2626 100%)" }}
                >
                  <FilePlus className="h-4 w-4" /> Upload Document
                </button>
              </div>
            ) : view === "grid" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
                {docs.map(doc => <DocCard key={doc.id} doc={doc} />)}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-black/[0.07] overflow-hidden shadow-sm divide-y divide-black/[0.04]">
                {docs.map(doc => <DocRow key={doc.id} doc={doc} />)}
              </div>
            )}
          </div>
        </main>

        {/* Context menu */}
        {ctx && (
          <ContextMenu
            x={ctx.x}
            y={ctx.y}
            onClose={() => setCtx(null)}
            onAdd={() => setCtx(null)}
          />
        )}
      </div>
    </AppShell>
  );
}