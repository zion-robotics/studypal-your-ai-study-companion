import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  MessagesSquare, Send, ThumbsUp, Reply,
  Pin, Search, ChevronDown, Sparkles,
  BookOpen, AtSign,
} from "lucide-react";
import { AppShell } from "./-AppShell";

export const Route = createFileRoute("/discussions")({
  head: () => ({ meta: [{ title: "Discussions — StudyAI" }] }),
  component: DiscussionsPage,
});

interface Message {
  id: string;
  author: string;
  initials: string;
  color: string;
  time: string;
  text: string;
  likes: number;
  pinned?: boolean;
  replies?: Message[];
}

interface Channel {
  id: string;
  course: string;
  topic: string;
  unread: number;
  messages: Message[];
}

const CHANNELS: Channel[] = [
  {
    id: "c1", course: "Chemistry", topic: "Organic — Alkanes", unread: 3,
    messages: [
      { id: "m1", author: "Mr. Loris Bowl", initials: "LB", color: "bg-emerald-600", time: "9:14 AM", pinned: true, text: "Good morning everyone! Today we'll be discussing the structural isomers of butane. Make sure you've reviewed pages 47–52 before class.", likes: 5, replies: [] },
      { id: "m2", author: "Aisha Nwosu",    initials: "AN", color: "bg-coral",        time: "9:22 AM", text: "I found the difference between n-butane and isobutane a bit confusing. Can anyone explain the naming convention again?", likes: 2, replies: [
        { id: "m2r1", author: "Emeka Eze", initials: "EE", color: "bg-blue-500", time: "9:25 AM", text: "n-butane is the straight-chain form, isobutane is branched. The prefix 'n-' stands for 'normal' (unbranched). Hope that helps!", likes: 4, replies: [] },
      ]},
      { id: "m3", author: "Fatima Al-Rashid", initials: "FA", color: "bg-violet-500", time: "9:31 AM", text: "Also worth noting: isobutane has a lower boiling point than n-butane because the branched structure reduces surface area contact between molecules.", likes: 6, replies: [] },
    ],
  },
  {
    id: "c2", course: "Economics", topic: "Supply & Demand", unread: 1,
    messages: [
      { id: "m4", author: "Mrs. Olivia Win", initials: "OW", color: "bg-blue-600", time: "10:00 AM", text: "For tomorrow's class, think about a real-world example of a supply shock from the past 5 years. We'll use these as case studies.", likes: 3, replies: [] },
      { id: "m5", author: "Chukwuemeka Obi", initials: "CO", color: "bg-orange-500", time: "10:18 AM", text: "Would the semiconductor shortage of 2021 count? It caused massive shifts in the car industry.", likes: 7, replies: [] },
    ],
  },
  {
    id: "c3", course: "Biology", topic: "Cell Division", unread: 0,
    messages: [
      { id: "m6", author: "Mrs. Brisia Olive", initials: "BO", color: "bg-leaf", time: "8:45 AM", text: "Excellent work on last week's lab report! Average score was 78%. I'm posting individual feedback by Friday.", likes: 9, replies: [] },
    ],
  },
];

function Avatar({ initials, color, size = "md" }: { initials: string; color: string; size?: "sm" | "md" }) {
  const s = size === "sm" ? "h-7 w-7 text-[10px]" : "h-9 w-9 text-xs";
  return <div className={`${color} ${s} rounded-full flex items-center justify-center text-white font-bold shrink-0`}>{initials}</div>;
}

function MessageBubble({ msg, depth = 0 }: { msg: Message; depth?: number }) {
  const [showReplies, setShowReplies] = useState(false);
  const hasReplies = msg.replies && msg.replies.length > 0;

  return (
    <div className={depth > 0 ? "ml-10 mt-2" : ""}>
      <div className={`group flex gap-3 p-4 rounded-2xl transition ${msg.pinned ? "bg-amber-50 border border-amber-200" : "hover:bg-gray-50"}`}>
        <Avatar initials={msg.initials} color={msg.color} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold">{msg.author}</span>
            {msg.pinned && <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full"><Pin className="h-2.5 w-2.5" /> Pinned</span>}
            <span className="text-[11px] text-muted-foreground">{msg.time}</span>
          </div>
          <p className="text-sm text-foreground/90 mt-1 leading-relaxed">{msg.text}</p>
          <div className="flex items-center gap-3 mt-2">
            <button className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-coral transition font-medium">
              <ThumbsUp className="h-3.5 w-3.5" /> {msg.likes}
            </button>
            {depth === 0 && (
              <button onClick={() => setShowReplies(s => !s)} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition font-medium">
                <Reply className="h-3.5 w-3.5" /> Reply {hasReplies && `(${msg.replies!.length})`}
              </button>
            )}
          </div>
        </div>
      </div>
      {showReplies && hasReplies && msg.replies!.map(r => <MessageBubble key={r.id} msg={r} depth={1} />)}
    </div>
  );
}

export default function DiscussionsPage() {
  const [activeId, setActiveId] = useState("c1");
  const [input, setInput] = useState("");
  const active = CHANNELS.find(c => c.id === activeId)!;

  return (
    <AppShell>
      <div className="flex h-full overflow-hidden bg-[#f7f7f7] font-display">

        {/* Channel list */}
        <aside className="w-[260px] shrink-0 bg-white border-r flex flex-col h-full overflow-hidden">
          <div className="px-4 py-4 border-b">
            <h2 className="font-extrabold text-lg">Discussions</h2>
            <div className="mt-3 flex items-center gap-2 bg-gray-50 border rounded-xl px-3 py-2">
              <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <input className="flex-1 bg-transparent outline-none text-xs placeholder:text-muted-foreground" placeholder="Search threads…" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1">
            {CHANNELS.map(c => (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={`flex items-start gap-3 p-3 rounded-xl text-left transition ${activeId === c.id ? "bg-coral/10 ring-1 ring-coral/30" : "hover:bg-gray-50"}`}
              >
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${activeId === c.id ? "bg-coral text-white" : "bg-gray-100 text-muted-foreground"}`}>
                  <MessagesSquare className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold truncate">{c.course}</span>
                    {c.unread > 0 && <span className="h-5 w-5 rounded-full bg-coral text-white text-[10px] font-bold flex items-center justify-center shrink-0">{c.unread}</span>}
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate"># {c.topic}</p>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Thread */}
        <main className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Thread header */}
          <div className="bg-white border-b px-6 py-4 flex items-center justify-between shrink-0">
            <div>
              <h3 className="font-extrabold">{active.course}</h3>
              <p className="text-xs text-muted-foreground"># {active.topic} · {active.messages.length} messages</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 text-sm border rounded-xl px-3 py-2 hover:bg-gray-50 transition font-medium">
                <BookOpen className="h-4 w-4 text-coral" /> Course Docs
              </button>
              <button className="flex items-center gap-2 text-sm border rounded-xl px-3 py-2 hover:bg-gray-50 transition font-medium">
                <Sparkles className="h-4 w-4 text-violet-500" /> Ask AI
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-1">
            {active.messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
          </div>

          {/* Composer */}
          <div className="bg-white border-t px-6 py-4 shrink-0">
            <div className="flex items-center gap-3 bg-gray-50 border rounded-2xl px-4 py-3 focus-within:border-coral transition">
              <AtSign className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && setInput("")}
                className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
                placeholder={`Message #${active.topic}…`}
              />
              <button
                onClick={() => setInput("")}
                className="h-8 w-8 rounded-xl bg-coral text-white flex items-center justify-center hover:opacity-90 transition shrink-0"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </main>
      </div>
    </AppShell>
  );
}
