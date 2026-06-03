import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { AppShell } from "@/components/sp/AppShell";
import { groqStructured } from "@/lib/groq";

export const Route = createFileRoute("/upload")({
  head: () => ({ meta: [{ title: "Upload notes — StudyPal" }] }),
  component: Upload,
});

function Upload() {
  const nav = useNavigate();
  const structureNotes = useServerFn(groqStructured);
  const [subject, setSubject] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [status, setStatus] = useState<"idle" | "thinking" | "ready">("idle");
  const [topics, setTopics] = useState<string[]>([]);

  async function structure() {
    setStatus("thinking");
    const fallback = [
      "Foundations & vocabulary",
      "Core concepts in plain language",
      "Worked example: real exam question",
      "Common mistakes to avoid",
      "Quick recap & retention check",
    ];
    try {
      const r = await structureNotes({
        data: {
          prompt: `Structure these notes into 5–7 ordered lesson topics. Subject: ${subject}. Notes: ${notes.slice(0, 4000)}`,
          schemaHint: "Return { topics: string[] }",
        },
      });
      setTopics(Array.isArray((r as any).topics) ? (r as any).topics : fallback);
    } catch { setTopics(fallback); }
    setTimeout(() => setStatus("ready"), 800);
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-6 p-5 md:p-8">
        <div>
          <div className="font-mono text-xs text-muted-foreground">NEW LESSON</div>
          <h1 className="mt-1 font-display text-3xl md:text-4xl">Drop in your notes. We'll do the structuring.</h1>
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); setFile(e.dataTransfer.files?.[0] ?? null); }}
          className={`rounded-3xl border-2 border-dashed bg-card p-10 text-center transition ${drag ? "border-accent bg-accent/5" : "border-border"}`}
        >
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent text-accent-foreground">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M12 18v-6M9 15l3-3 3 3"/></svg>
          </div>
          <div className="mt-4 font-display text-xl">{file ? file.name : "Drag a PDF here"}</div>
          <p className="mt-1 text-sm text-muted-foreground">or paste your raw notes below — works either way</p>
          <label className="btn-press mt-5 inline-flex cursor-pointer rounded-full border border-border bg-background px-4 py-2 text-sm">
            Choose a file
            <input type="file" accept=".pdf,.txt,.md,.docx" hidden onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
        </div>

        <div className="space-y-4 rounded-3xl border border-border bg-card p-6">
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject name (e.g. JAMB Biology)" className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30" />
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={8} placeholder="Paste raw lecture notes here..." className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30" />
          <button onClick={structure} disabled={!subject || (!notes && !file) || status === "thinking"} className="btn-press w-full rounded-xl bg-accent py-3 text-sm font-medium text-accent-foreground disabled:opacity-50">
            {status === "thinking" ? "Structuring..." : "Structure My Notes"}
          </button>
        </div>

        <AnimatePresence>
          {status === "thinking" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-3xl border border-border bg-card p-8 text-center">
              <div className="mx-auto h-3 w-3 animate-ping rounded-full bg-accent" />
              <div className="mt-4 font-display text-lg">AI is organizing your content...</div>
              <div className="mt-1 font-mono text-xs uppercase tracking-widest text-muted-foreground">Groq · Aethex · streaming</div>
            </motion.div>
          )}

          {status === "ready" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-border bg-card p-6">
              <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Lesson plan preview</div>
              <ol className="mt-4 divide-y divide-border">
                {topics.map((t, i) => (
                  <li key={i} className="flex items-center gap-4 py-3">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-muted font-mono text-xs">0{i + 1}</span>
                    <span className="text-sm">{t}</span>
                  </li>
                ))}
              </ol>
              <button onClick={() => nav({ to: "/dashboard" })} className="btn-press mt-6 w-full rounded-xl bg-accent py-3 text-sm font-medium text-accent-foreground">
                Generate My Study Plan
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  );
}
