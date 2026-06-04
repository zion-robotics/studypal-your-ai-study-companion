import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { AppShell } from "@/components/sp/AppShell";

export const Route = createFileRoute("/community")({
  head: () => ({ meta: [{ title: "Community — StudyPal" }] }),
  component: Community,
});

type Post = {
  id: number;
  name: string;
  avatar: string;
  tag: string;
  content: string;
  likes: number;
  comments: number;
  liked?: boolean;
};

const SEED: Post[] = [
  {
    id: 1,
    name: "Tunde A.",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&q=80",
    tag: "JAMB Biology",
    content:
      "Sharing my mitosis cheat sheet — covered all 4 phases in one page. Saved me last week.",
    likes: 42,
    comments: 8,
  },
  {
    id: 2,
    name: "Amaka N.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
    tag: "Digital Marketing",
    content:
      "Anyone else using StudyPal for HubSpot certs? The voice mode while doing chores is unreal.",
    likes: 29,
    comments: 5,
  },
  {
    id: 3,
    name: "Emeka O.",
    avatar: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=200&q=80",
    tag: "Accounting",
    content: "Day 30 streak. Started while working night shift. StudyPal just doesn't quit on me.",
    likes: 88,
    comments: 14,
  },
];

const TAGS = [
  "JAMB Biology",
  "Digital Marketing",
  "Accounting",
  "Mathematics",
  "Programming",
  "Other",
];

function Community() {
  const [posts, setPosts] = useState<Post[]>(SEED);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [tag, setTag] = useState(TAGS[0]);

  function like(id: number) {
    setPosts((p) =>
      p.map((x) =>
        x.id === id ? { ...x, liked: !x.liked, likes: x.likes + (x.liked ? -1 : 1) } : x,
      ),
    );
  }
  function share() {
    if (!draft.trim()) return;
    setPosts((p) => [
      {
        id: Date.now(),
        name: "You",
        avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&q=80",
        tag,
        content: draft,
        likes: 0,
        comments: 0,
      },
      ...p,
    ]);
    setDraft("");
    setOpen(false);
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6 p-5 md:p-8">
        <div className="flex items-end justify-between">
          <div>
            <div className="font-mono text-xs text-muted-foreground">COMMUNITY</div>
            <h1 className="mt-1 font-display text-3xl md:text-4xl">Resources from your peers.</h1>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="btn-press rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground"
          >
            Share a Resource
          </button>
        </div>

        <div className="space-y-4">
          {posts.map((p, i) => (
            <motion.article
              key={p.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              className="rounded-3xl border border-border bg-card p-6"
            >
              <header className="flex items-center gap-3">
                <img src={p.avatar} alt={p.name} className="h-10 w-10 rounded-full object-cover" />
                <div className="flex-1">
                  <div className="text-sm font-medium">{p.name}</div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {p.tag}
                  </div>
                </div>
              </header>
              <p className="mt-4 text-[15px] leading-relaxed">{p.content}</p>
              <footer className="mt-5 flex items-center gap-5 text-sm text-muted-foreground">
                <button onClick={() => like(p.id)} className="group flex items-center gap-2">
                  <motion.span
                    key={p.likes}
                    initial={{ scale: 1 }}
                    animate={p.liked ? { scale: [1, 1.4, 1] } : { scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className={p.liked ? "text-accent" : ""}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      fill={p.liked ? "currentColor" : "none"}
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </motion.span>
                  <span className="tabular-nums">{p.likes}</span>
                </button>
                <div className="flex items-center gap-2">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <span className="tabular-nums">{p.comments}</span>
                </div>
              </footer>
            </motion.article>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-background/70 backdrop-blur p-5"
            onClick={() => setOpen(false)}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-lg rounded-3xl border border-border bg-card p-6"
            >
              <h3 className="font-display text-2xl">Share a resource</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Help someone studying the same thing.
              </p>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={5}
                placeholder="What did you learn? Drop a tip, link or insight..."
                className="mt-5 w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
              />
              <div className="mt-4">
                <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Subject
                </div>
                <div className="flex flex-wrap gap-2">
                  {TAGS.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTag(t)}
                      className={`rounded-full border px-3 py-1.5 text-xs ${tag === t ? "border-accent bg-accent text-accent-foreground" : "border-border"}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-full px-4 py-2 text-sm text-muted-foreground"
                >
                  Cancel
                </button>
                <button
                  onClick={share}
                  className="btn-press rounded-full bg-accent px-5 py-2 text-sm font-medium text-accent-foreground"
                >
                  Post
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
