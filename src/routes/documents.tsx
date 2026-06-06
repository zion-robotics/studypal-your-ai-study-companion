import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "./-AppShell";
import { useState } from "react";
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
} from "lucide-react";

export const Route = createFileRoute("/documents")({
  head: () => ({
    meta: [
      { title: "Documents - Noted" },
      { name: "description", content: "Manage your study documents, notes, and materials." },
    ],
  }),
  component: DocumentsPage,
});

type DocItem = {
  id: string;
  name: string;
  subject: string;
  type: "pdf" | "image" | "docx" | "pptx" | "other";
  size: string;
  pages?: number;
  updatedAt: string;
  status: "analyzed" | "processing" | "uploaded";
  owner: string;
};

const MOCK_DOCS: DocItem[] = [
  { id: "1", name: "Organic Chemistry - Chapter 7.pdf", subject: "Chemistry", type: "pdf", size: "4.2 MB", pages: 28, updatedAt: "2 hours ago", status: "analyzed", owner: "me" },
  { id: "2", name: "Calculus III Lecture Notes.pdf", subject: "Mathematics", type: "pdf", size: "8.1 MB", pages: 45, updatedAt: "Yesterday", status: "analyzed", owner: "me" },
  { id: "3", name: "History Essay Draft.docx", subject: "History", type: "docx", size: "1.3 MB", updatedAt: "2 days ago", status: "uploaded", owner: "me" },
  { id: "4", name: "Biology Cell Diagram.png", subject: "Biology", type: "image", size: "2.8 MB", updatedAt: "3 days ago", status: "analyzed", owner: "me" },
  { id: "5", name: "CS Algorithms - Week 5.pptx", subject: "Computer Science", type: "pptx", size: "12.5 MB", updatedAt: "4 days ago", status: "processing", owner: "me" },
  { id: "6", name: "Psychology Research Paper.pdf", subject: "Psychology", type: "pdf", size: "6.7 MB", pages: 32, updatedAt: "1 week ago", status: "analyzed", owner: "me" },
  { id: "7", name: "Physics Problem Set.pdf", subject: "Physics", type: "pdf", size: "3.4 MB", pages: 15, updatedAt: "1 week ago", status: "analyzed", owner: "me" },
  { id: "8", name: "Literature Review Notes.docx", subject: "English", type: "docx", size: "0.9 MB", updatedAt: "2 weeks ago", status: "uploaded", owner: "me" },
];

function DocumentsPage() {
  const [docs, setDocs] = useState<DocItem[]>(MOCK_DOCS);
  const [search, setSearch] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [view, setView] = useState<"list" | "grid">("list");

  const filtered = docs.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.subject.toLowerCase().includes(search.toLowerCase()),
  );

  const removeDoc = (id: string) => setDocs((prev) => prev.filter((d) => d.id !== id));

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
              <button
                className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition hover:bg-muted"
                aria-label="Info"
              >
                <Info className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Suggested folders */}
          <div className="mt-6">
            <button className="flex items-center gap-2 text-sm font-medium text-foreground">
              <ChevronDown className="h-4 w-4" /> Suggested folders
            </button>
            <div className="mt-3 flex flex-wrap gap-3">
              <FolderCard name="Chemistry" location="In My Documents" />
              <FolderCard name="Mathematics" location="In My Documents" />
            </div>
          </div>

          {/* Suggested files header + toolbar */}
          <div className="mt-7 flex items-center justify-between">
            <button className="flex items-center gap-2 text-sm font-medium text-foreground">
              <ChevronDown className="h-4 w-4" /> Suggested files
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowUpload(true)}
                className="mr-1 inline-flex h-9 items-center gap-2 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
              >
                <Upload className="h-4 w-4" /> Upload
              </button>
              <button
                className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition hover:bg-muted"
                aria-label="Filter"
              >
                <SlidersHorizontal className="h-4 w-4" />
              </button>
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

          {/* Document list */}
          {filtered.length === 0 ? (
            <EmptyListState onUpload={() => setShowUpload(true)} />
          ) : view === "list" ? (
            <div className="mt-4">
              {/* Column header */}
              <div className="grid grid-cols-[minmax(0,2.4fr)_minmax(0,1.6fr)_minmax(0,1fr)_40px] items-center gap-4 border-b border-border px-3 pb-2 text-sm font-medium text-muted-foreground">
                <span>Name</span>
                <span className="hidden sm:block">Subject</span>
                <span className="hidden sm:block">Owner</span>
                <span></span>
              </div>
              <div>
                {filtered.map((doc) => (
                  <DocRow key={doc.id} doc={doc} onDelete={() => removeDoc(doc.id)} />
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

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} />}
    </div>
    </AppShell>
  );
}

/* ---------------- FOLDER CARD ---------------- */

function FolderCard({ name, location }: { name: string; location: string }) {
  return (
    <div className="flex min-w-[240px] items-center gap-3 rounded-lg bg-muted px-4 py-3 transition hover:bg-accent">
      <Folder className="h-5 w-5 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{name}</p>
        <p className="truncate text-xs text-muted-foreground">{location}</p>
      </div>
      <button className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground transition hover:bg-background">
        <MoreVertical className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ---------------- DOC ROW ---------------- */

function DocRow({ doc, onDelete }: { doc: DocItem; onDelete: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="group grid grid-cols-[minmax(0,2.4fr)_minmax(0,1.6fr)_minmax(0,1fr)_40px] items-center gap-4 border-b border-border px-3 py-2.5 transition hover:bg-muted/60">
      {/* Name + icon */}
      <div className="flex min-w-0 items-center gap-3">
        <DocIcon type={doc.type} />
        <p className="truncate text-sm text-foreground">{doc.name}</p>
      </div>

      {/* Subject */}
      <span className="hidden truncate text-sm text-muted-foreground sm:block">{doc.subject}</span>

      {/* Owner */}
      <div className="hidden items-center gap-2 sm:flex">
        <div className="grid h-6 w-6 place-items-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
          {doc.owner === "me" ? "EM" : doc.owner.slice(0, 1).toUpperCase()}
        </div>
        <span className="text-sm text-muted-foreground">{doc.owner}</span>
      </div>

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
              <button className="flex w-full items-center rounded-md px-2.5 py-1.5 text-sm text-foreground transition hover:bg-muted">
                Open
              </button>
              <button className="flex w-full items-center rounded-md px-2.5 py-1.5 text-sm text-foreground transition hover:bg-muted">
                Rename
              </button>
              <button
                onClick={() => {
                  onDelete();
                  setMenuOpen(false);
                }}
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

/* ---------------- DOC CARD (grid view) ---------------- */

function DocCard({ doc }: { doc: DocItem }) {
  return (
    <div className="rounded-xl border border-border bg-background p-3 transition hover:shadow-md">
      <div className="flex items-center gap-2">
        <DocIcon type={doc.type} />
        <p className="truncate text-sm text-foreground">{doc.name}</p>
      </div>
      <div className="mt-3 grid h-28 place-items-center rounded-lg bg-muted text-muted-foreground">
        <DocIcon type={doc.type} large />
      </div>
      <p className="mt-2 truncate text-xs text-muted-foreground">
        {doc.subject} {"\u00B7"} {doc.size}
      </p>
    </div>
  );
}

/* ---------------- DOC ICON ---------------- */

function DocIcon({ type, large }: { type: DocItem["type"]; large?: boolean }) {
  const size = large ? "h-8 w-8" : "h-5 w-5";
  switch (type) {
    case "pdf":
      return <FileText className={`${size} shrink-0 text-destructive`} />;
    case "image":
      return <FileImage className={`${size} shrink-0 text-destructive`} />;
    case "docx":
      return <FileCode className={`${size} shrink-0 text-primary`} />;
    case "pptx":
      return <FileSpreadsheet className={`${size} shrink-0 text-accent-foreground`} />;
    default:
      return <FileText className={`${size} shrink-0 text-muted-foreground`} />;
  }
}

/* ---------------- EMPTY STATE ---------------- */

function EmptyListState({ onUpload }: { onUpload: () => void }) {
  return (
    <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 py-16 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
        <FileText className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-sm font-medium text-foreground">No documents found</h3>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">
        Try adjusting your search, or upload a new document to get started.
      </p>
      <button
        onClick={onUpload}
        className="mt-5 inline-flex h-9 items-center gap-2 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
      >
        <Upload className="h-4 w-4" /> Upload document
      </button>
    </div>
  );
}

/* ---------------- UPLOAD MODAL ---------------- */

function UploadModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-background p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium tracking-tight text-foreground">Upload document</h2>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 rounded-xl border-2 border-dashed border-border bg-muted/40 p-10 text-center transition hover:border-foreground/30">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
            <Upload className="h-5 w-5" />
          </div>
          <p className="mt-4 text-sm font-medium text-foreground">Drop files here, or click to browse</p>
          <p className="mt-1 text-xs text-muted-foreground">PDF, DOCX, PPTX, JPG, PNG {"\u00B7"} up to 50 MB</p>
          <button className="mt-5 inline-flex h-9 items-center gap-2 rounded-full border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted">
            <Plus className="h-4 w-4" /> Select files
          </button>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="h-9 rounded-full px-4 text-sm font-medium text-primary transition hover:bg-muted"
          >
            Cancel
          </button>
          <button className="h-9 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90">
            Upload
          </button>
        </div>
      </div>
    </div>
  );
}