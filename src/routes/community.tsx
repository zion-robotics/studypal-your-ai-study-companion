import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { AppShell } from "./-AppShell";
import { useProfile } from "@/hooks/useProfile";
import { requireAuth } from "@/lib/guards";
import { Heart, MessageCircle, Plus, X, Zap } from "lucide-react";

export const Route = createFileRoute("/community")({
  ssr: false,
  head: () => ({ meta: [{ title: "Community — StudyPal" }] }),
  beforeLoad: requireAuth,
  component: Community,
});

type Post = {
  id: number;
  name: string;
  avatar: string;
  tag: string;
  category: "university" | "exam-prep";
  content: string;
  likes: number;
  comments: number;
  liked?: boolean;
};

const SEED: Post[] = [
  { id: 1, name: "Tunde A.", avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&q=80", tag: "JAMB Biology", category: "exam-prep", content: "Sharing my mitosis cheat sheet — covered all 4 phases in one page. Saved me last week. DM for the PDF.", likes: 42, comments: 8 },
  { id: 2, name: "Amaka N.", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80", tag: "Digital Marketing", category: "university", content: "Anyone else using StudyPal for HubSpot certs? The voice mode while doing chores is unreal.", likes: 29, comments: 5 },
  { id: 3, name: "Emeka O.", avatar: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=200&q=80", tag: "Accounting", category: "university", content: "Day 30 streak. Started while working night shift. StudyPal just doesn't quit on me.", likes: 88, comments: 14 },
  { id: 4, name: "Chisom E.", avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&q=80", tag: "WAEC Chemistry", category: "exam-prep", content: "Just scored 8/8 on the comprehension check for organic chemistry. The JAMB-style questions really work.", likes: 55, comments: 9 },
];

const FILTERS = ["All", "University", "Exam Prep", "JAMB", "WAEC"] as const;
type Filter = typeof FILTERS[number];

const UNIVERSITY_TAGS = ["Computer Science", "Accounting", "Engineering", "Law", "Nursing", "Business", "Digital Marketing", "Other"];
const EXAM_TAGS = ["JAMB Biology", "JAMB Chemistry", "WAEC Maths", "WAEC Physics", "NECO English", "Other"];

function Community() {
  const { profile } = useProfile();
  const isTertiary = profile?.user_type === "tertiary";

  const [posts, setPosts] = useState<Post[]>(SEED);
  const [filter, setFilter] = useState<Filter>("All");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [postCategory, setPostCategory] = useState<"university" | "exam-prep">(
    isTertiary ? "university" : "exam-prep"
  );
  const [tag, setTag] = useState(isTertiary ? UNIVERSITY_TAGS[0] : EXAM_TAGS[0]);

  const filtered = posts.filter((p) => {
    if (filter === "All") return true;
    if (filter === "University") return p.category === "university";
    if (filter === "Exam Prep") return p.category === "exam-prep";
    if (filter === "JAMB") return p.tag.includes("JAMB");
    if (filter === "WAEC") return p.tag.includes("WAEC");
    return true;
  });

  const resourceOfDay = isTertiary
    ? { title: "Study tip of the day", content: "Break your session into 3 parts: review, practice, recall. The recall phase is what most students skip — and it's the most important.", tag: "Study Strategy" }
    : { title: "JAMB question of the day", content: "In which organelle does the Krebs cycle occur? A) Cytoplasm B) Nucleus C) Mitochondrial matrix D) Ribosome — Answer: C. This appeared in 2021 JAMB Biology.", tag: "JAMB Biology" };

  function like(id: number) {
    setPosts((p) => p.map((x) =>
      x.id === id ? { ...x, liked: !x.liked, likes: x.likes + (x.liked ? -1 : 1) } : x
    ));
  }

  function share() {
    if (!draft.trim()) return;
    setPosts((p) => [{
      id: Date.now(), name: "You",
      avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&q=80",
      tag, category: postCategory, content: draft, likes: 0, comments: 0,
    }, ...p]);
    setDraft("");
    setOpen(false);
  }

  return (
    <AppShell>
      <div className="h-full overflow-y-auto bg-background">
        <div className="mx-auto max-w-2xl px-5 py-8 space-y-6">

          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <span className="rounded-full bg-coral/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-coral">
                Community
              </span>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
                Resources from your peers
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                African students helping each other study smarter
              </p>
            </div>
            <button onClick={() => setOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-b from-coral to-primary px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-coral/30 hover:opacity-95 transition shrink-0">
              <Plus className="h-4 w-4" /> Share
            </button>
          </div>

          {/* Resource of the day */}
          <div className="rounded-2xl bg-sage-light border p-5">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-coral" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-coral">
                {resourceOfDay.title}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-foreground">{resourceOfDay.content}</p>
            <span className="mt-3 inline-block rounded-full bg-coral/10 px-3 py-1 text-[10px] font-bold text-coral">
              {resourceOfDay.tag}
            </span>
          </div>

          {/* Filter pills */}
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
                  filter === f
                    ? "bg-coral text-white border-coral shadow-sm shadow-coral/30"
                    : "border-border bg-white hover:border-coral text-foreground"
                }`}>
                {f}
              </button>
            ))}
          </div>

          {/* Posts */}
          <div className="space-y-4">
            {filtered.map((p, i) => (
              <motion.article key={p.id}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.35 }}
                className="rounded-2xl bg-white border p-5 shadow-sm hover:shadow-md transition">

                <header className="flex items-center gap-3">
                  <img src={p.avatar} alt={p.name}
                    className="h-10 w-10 rounded-full object-cover ring-2 ring-sage" />
                  <div className="flex-1 min-w-0">
                    <p className="font-extrabold text-sm">{p.name}</p>
                    <p className="text-[10px] text-muted-foreground font-semibold">{p.tag}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold shrink-0 ${
                    p.category === "university"
                      ? "bg-sage text-secondary-foreground"
                      : "bg-coral/10 text-coral"
                  }`}>
                    {p.category === "university" ? "University" : "Exam Prep"}
                  </span>
                </header>

                <p className="mt-4 text-sm leading-relaxed">{p.content}</p>

                <footer className="mt-4 flex items-center gap-4">
                  <button onClick={() => like(p.id)}
                    className="flex items-center gap-1.5 text-sm font-semibold transition"
                    style={{ color: p.liked ? "oklch(0.72 0.17 30)" : undefined }}>
                    <motion.span
                      key={p.likes}
                      animate={p.liked ? { scale: [1, 1.4, 1] } : { scale: 1 }}
                      transition={{ duration: 0.3 }}>
                      <Heart className="h-4 w-4" fill={p.liked ? "currentColor" : "none"} />
                    </motion.span>
                    <span className="text-muted-foreground tabular-nums">{p.likes}</span>
                  </button>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MessageCircle className="h-4 w-4" />
                    <span className="tabular-nums">{p.comments}</span>
                  </div>
                </footer>
              </motion.article>
            ))}
          </div>
        </div>
      </div>

      {/* Share modal */}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm p-5"
            onClick={() => setOpen(false)}>
            <motion.div onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-lg rounded-2xl bg-white border shadow-xl p-6">

              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-extrabold">Share a resource</h3>
                <button onClick={() => setOpen(false)}
                  className="h-8 w-8 rounded-xl border flex items-center justify-center text-muted-foreground hover:text-foreground transition">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground mb-4">Help someone studying the same thing.</p>

              {/* Category */}
              <div className="flex gap-2 mb-4">
                {(["university", "exam-prep"] as const).map((c) => (
                  <button key={c}
                    onClick={() => { setPostCategory(c); setTag(c === "university" ? UNIVERSITY_TAGS[0] : EXAM_TAGS[0]); }}
                    className={`rounded-xl border px-4 py-2 text-xs font-bold transition ${
                      postCategory === c
                        ? "bg-coral text-white border-coral"
                        : "border-border hover:border-coral"
                    }`}>
                    {c === "university" ? "University" : "Exam Prep"}
                  </button>
                ))}
              </div>

              <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={4}
                placeholder="What did you learn? Drop a tip, link or insight..."
                className="w-full resize-none rounded-xl border px-4 py-3 text-sm outline-none focus:border-coral focus:ring-2 focus:ring-coral/20 transition" />

              {/* Tags */}
              <div className="mt-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Subject tag</p>
                <div className="flex flex-wrap gap-2">
                  {(postCategory === "university" ? UNIVERSITY_TAGS : EXAM_TAGS).map((t) => (
                    <button key={t} onClick={() => setTag(t)}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                        tag === t ? "bg-coral text-white border-coral" : "border-border hover:border-coral"
                      }`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => setOpen(false)}
                  className="rounded-xl border px-4 py-2.5 text-sm font-semibold hover:bg-sage-light transition">
                  Cancel
                </button>
                <button onClick={share}
                  className="rounded-xl bg-gradient-to-b from-coral to-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-coral/30 hover:opacity-95 transition">
                  Post →
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
