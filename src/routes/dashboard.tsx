import { createFileRoute } from "@tanstack/react-router";
import {
  Bell, Plus, Upload, FileText, Folder,
  ChevronRight, ChevronDown, FilePlus, Search,
  Sparkles, CheckCircle2, MoreVertical,
  ClipboardList, FlipHorizontal, BookOpen, Mic,
} from "lucide-react";
import { AppShell } from "./-AppShell";
import uploadImg from "@/assets/upload-illustration.jpg";
import chemImg from "@/assets/subj-chemistry.jpg";
import econImg from "@/assets/subj-economy.jpg";
import bioImg from "@/assets/subj-biology.jpg";
import cityImg from "@/assets/city-scene.jpg";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — StudyAI" },
      { name: "description", content: "Your study hub." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <AppShell>
      <div className="flex h-full overflow-hidden">
        {/* Left column */}
        <section className="w-[280px] shrink-0 bg-sage-light p-6 flex flex-col h-full overflow-y-auto">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Quick Upload</h2>
            <button className="rounded-md p-2 hover:bg-white/50"><FilePlus className="h-4 w-4" /></button>
          </div>
          <div className="mt-6 flex-1 flex items-center justify-center min-h-0">
            <img src={uploadImg} alt="" className="max-w-full max-h-full object-contain" loading="lazy" />
          </div>
          <div className="text-center">
            <h4 className="text-xl font-extrabold">Upload Files or<br />Documents</h4>
            <p className="text-xs text-muted-foreground mt-2 mb-4">Drop files into a course folder:</p>
            <div className="mb-3 rounded-xl border bg-white px-3 py-2 flex items-center justify-between text-sm font-medium cursor-pointer hover:bg-white/80 transition">
              <span className="text-muted-foreground">Select a course…</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </div>
            <button className="w-full rounded-xl bg-gradient-to-b from-coral to-primary py-3.5 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-coral/30 hover:opacity-95 transition">
              <Upload className="h-4 w-4" /> Upload Document
            </button>
          </div>
        </section>

        {/* Main */}
        <main className="flex-1 p-8 overflow-y-auto h-full">
          <header className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight">My Study Hub</h1>
              <p className="text-sm text-muted-foreground mt-2">Organise your courses, upload documents, and study smarter</p>
            </div>
            <button className="relative rounded-full bg-white shadow-sm p-3 border">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-coral text-white text-[10px] font-bold flex items-center justify-center">4</span>
            </button>
          </header>

          <div className="mt-6 flex items-center justify-between rounded-2xl bg-white border px-5 py-4 shadow-sm">
            <div className="flex items-center gap-3 text-sm font-medium flex-1">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input className="flex-1 outline-none text-sm placeholder:text-muted-foreground bg-transparent" placeholder="Search documents, notes, quizzes…" />
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground border-l pl-4 ml-4 font-medium">
              <Sparkles className="h-4 w-4 text-coral" />
              AI Search
            </div>
          </div>

          <div className="mt-6 grid grid-cols-[80px_repeat(3,1fr)] gap-4">
            <button className="rounded-2xl border-2 border-dashed border-border bg-white/50 flex flex-col items-center justify-center gap-3 py-6 hover:border-coral transition">
              <span className="[writing-mode:vertical-rl] rotate-180 text-sm font-semibold text-muted-foreground">New Folder</span>
              <div className="h-7 w-7 rounded-md bg-coral/10 text-coral flex items-center justify-center"><Plus className="h-4 w-4" /></div>
            </button>
            <CourseFolder img={chemImg} title="Chemistry" docCount={12} teacher="Mr. Loris Bowl" />
            <CourseFolder img={econImg} title="Economics" docCount={8} teacher="Mrs. Olivia Win" />
            <CourseFolder img={bioImg} title="Biology" docCount={15} teacher="Mrs. Brisia Olive" />
          </div>

          <section className="mt-8">
            <h2 className="text-2xl font-extrabold">Recent Documents</h2>
            <div className="mt-4 rounded-2xl bg-white border divide-y">
              <DocumentRow color="bg-sage" title="Organic Chemistry — Chapter 4.pdf" course="Chemistry" size="2.4 MB" status="Assessed" />
              <DocumentRow color="bg-leaf/20" title="Microeconomics Lecture Notes.docx" course="Economics" size="1.1 MB" status="Pending" />
              <DocumentRow color="bg-coral/15" title="Cell Biology Textbook Extract.pdf" course="Biology" size="5.7 MB" status="Assessed" />
            </div>
          </section>
        </main>

        {/* Right column */}
        <aside className="w-[320px] shrink-0 bg-sage-light/40 flex flex-col h-full overflow-y-auto">
          <div className="h-[220px] shrink-0 relative overflow-hidden">
            <img src={cityImg} alt="" className="w-full h-full object-cover" loading="lazy" />
            <div className="absolute bottom-4 left-4 bg-sidebar-dark/80 backdrop-blur text-white text-xs font-bold px-3 py-1.5 rounded-lg">AI Study Assistant</div>
          </div>
          <div className="flex-1 p-6 flex flex-col">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-extrabold">AI Tools</h3>
              <button className="flex items-center gap-1 rounded-lg border bg-white px-3 py-1.5 text-xs font-semibold">
                All <ChevronDown className="h-3 w-3" />
              </button>
            </div>
            <div className="mt-4 flex-1 grid grid-cols-2 gap-3">
              <AiToolCard icon={<ClipboardList className="h-5 w-5" />} label="Quiz Me" color="bg-coral/10 text-coral" />
              <AiToolCard icon={<FlipHorizontal className="h-5 w-5" />} label="Flashcards" color="bg-leaf/20 text-leaf" />
              <AiToolCard icon={<BookOpen className="h-5 w-5" />} label="Summarise" color="bg-sage text-secondary-foreground" />
              <AiToolCard icon={<Mic className="h-5 w-5" />} label="Voice Notes" color="bg-primary/10 text-primary" />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1 px-1">
              {["Chem", "Econ", "Bio", "Math", "Phys", "Hist", "Art"].map((m) => (
                <span key={m} className={m === "Bio" ? "text-coral font-bold" : ""}>{m}</span>
              ))}
            </div>
            <div className="mt-4 rounded-2xl bg-gradient-to-r from-coral to-primary p-4 flex items-center gap-3 text-white">
              <div className="text-2xl font-extrabold">4</div>
              <div className="text-xs flex-1 leading-tight">Active course folders<br />with AI-ready documents</div>
              <button className="h-9 w-9 rounded-full bg-white/25 backdrop-blur flex items-center justify-center">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function CourseFolder({ img, title, docCount, teacher }: { img: string; title: string; docCount: number; teacher: string }) {
  return (
    <div className="rounded-2xl bg-white border p-4 hover:shadow-md transition cursor-pointer">
      <div className="h-24 rounded-xl bg-sage-light/60 flex items-center justify-center mb-3 overflow-hidden">
        <img src={img} alt={title} className="h-full object-contain" loading="lazy" />
      </div>
      <h3 className="font-extrabold">{title}</h3>
      <p className="text-xs text-muted-foreground mt-0.5">{teacher}</p>
      <div className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-coral">
        <Folder className="h-3 w-3" />{docCount} documents
      </div>
    </div>
  );
}

function DocumentRow({ color, title, course, size, status }: { color: string; title: string; course: string; size: string; status: "Assessed" | "Pending" }) {
  return (
    <div className="flex items-center gap-4 px-5 py-4">
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
        {status === "Assessed"
          ? <span className="rounded-lg bg-leaf/20 px-3 py-1.5 text-xs font-bold text-leaf flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Assessed</span>
          : <span className="rounded-lg bg-sage px-3 py-1.5 text-xs font-bold text-secondary-foreground">Pending</span>}
        <button className="text-muted-foreground hover:text-foreground"><MoreVertical className="h-4 w-4" /></button>
      </div>
    </div>
  );
}

function AiToolCard({ icon, label, color }: { icon: React.ReactNode; label: string; color: string }) {
  return (
    <button className={`rounded-2xl ${color} p-4 flex flex-col items-start gap-2 hover:opacity-80 transition`}>
      {icon}
      <span className="text-xs font-bold">{label}</span>
    </button>
  );
}