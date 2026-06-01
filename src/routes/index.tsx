import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { TopNav } from "@/components/sp/TopNav";
import { useCountUp } from "@/hooks/useCountUp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "StudyPal — The study pal every African student always needed" },
      { name: "description", content: "Upload your notes. StudyPal structures them, reads them aloud, quizzes you, and keeps you on track — even without internet." },
      { property: "og:title", content: "StudyPal — Built for African students who study while they work" },
      { property: "og:description", content: "AI-powered study accountability that works offline." },
      { property: "og:image", content: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&q=80" },
    ],
  }),
  component: Landing,
});

const HERO_IMG = "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1800&q=80";
const COLLAB_IMG = "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1400&q=80";
const PROBLEM_IMG = "https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=1400&q=80";
const COMMUNITY_IMG = "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1600&q=80";
const AV1 = "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&q=80";
const AV2 = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80";
const AV3 = "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=200&q=80";

function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const yBg = useTransform(scrollYProgress, [0, 1], [0, 180]);
  const yHead = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const yMock = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const fade = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section ref={ref} className="relative isolate overflow-hidden">
      {/* parallax bg */}
      <motion.div style={{ y: yBg }} className="absolute inset-0 -z-10">
        <img src={HERO_IMG} alt="" className="h-full w-full object-cover opacity-25 dark:opacity-15" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
      </motion.div>

      <div className="mx-auto grid max-w-7xl gap-12 px-5 pb-24 pt-20 md:grid-cols-12 md:pt-32">
        <motion.div style={{ y: yHead, opacity: fade }} className="md:col-span-7">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs">
            <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
            <span className="font-mono text-muted-foreground">YPIT HACKATHON 2026 · EDUCATION</span>
          </div>
          <h1 className="font-display text-5xl leading-[0.95] tracking-tight md:text-7xl">
            The study pal every <span className="text-accent">African student</span> always needed.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Upload your notes. StudyPal structures them, reads them aloud, quizzes you, and keeps
            you on track — even without internet.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link to="/signup" className="btn-press inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3.5 text-sm font-medium text-accent-foreground">
              Start Studying Free
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
            </Link>
            <a href="#how" className="btn-press inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3.5 text-sm font-medium">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              Watch Demo
            </a>
          </div>
          <div className="mt-10 flex items-center gap-6 text-xs text-muted-foreground">
            <div className="font-mono">★★★★★ 4.9 from 200 beta students</div>
            <div className="hidden h-4 w-px bg-border md:block" />
            <div>UNILAG · LASU · UI · Covenant · ABU</div>
          </div>
        </motion.div>

        {/* 3D Mockup */}
        <motion.div style={{ y: yMock }} className="perspective relative md:col-span-5">
          <div className="animate-float-rotate preserve-3d mx-auto w-full max-w-md">
            <div className="rounded-3xl border border-border bg-card p-5 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-accent" />
                  <div className="font-mono text-xs text-muted-foreground">DAY 12 / 38</div>
                </div>
                <div className="font-mono text-xs text-muted-foreground">JAMB BIO</div>
              </div>
              <div className="relative mx-auto my-2 grid h-44 w-44 place-items-center">
                <svg viewBox="0 0 200 200" className="absolute inset-0 -rotate-90">
                  <circle cx="100" cy="100" r="86" stroke="currentColor" className="text-muted" strokeWidth="14" fill="none" />
                  <circle cx="100" cy="100" r="86" stroke="currentColor" className="text-accent animate-heartbeat origin-center" strokeWidth="14" fill="none" strokeDasharray="540" strokeDashoffset="160" strokeLinecap="round" />
                </svg>
                <div className="text-center">
                  <div className="font-display text-4xl">70%</div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">today</div>
                </div>
              </div>
              <div className="mt-2 rounded-xl bg-muted p-3">
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Next up</div>
                <div className="mt-1 text-sm font-medium">Cellular Respiration · 12 min</div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                {["7 day", "92%", "26 left"].map((s, i) => (
                  <div key={i} className="rounded-lg border border-border p-2">
                    <div className="font-mono text-sm">{s}</div>
                    <div className="text-[10px] text-muted-foreground">{["streak","avg","days"][i]}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute -bottom-6 -right-6 rounded-2xl border border-border bg-accent px-4 py-3 text-accent-foreground shadow-xl rotate-3">
              <div className="font-mono text-[10px] uppercase tracking-wider">offline ready</div>
              <div className="font-display text-lg">No bars? No problem.</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function ProblemCard({ title, desc, n, delay }: { title: string; desc: string; n: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.6 }}
      className="tilt-card group rounded-3xl border border-border bg-card p-8"
    >
      <div className="mb-6 flex items-center justify-between">
        <div className="font-mono text-xs text-muted-foreground">PROBLEM / {n}</div>
        <div className="h-2 w-2 rounded-full bg-accent" />
      </div>
      <h3 className="font-display text-2xl">{title}</h3>
      <p className="mt-3 text-muted-foreground">{desc}</p>
    </motion.div>
  );
}

function Problem() {
  return (
    <section id="problem" className="relative overflow-hidden border-t border-border py-24">
      <div className="absolute inset-0 -z-10 opacity-[0.06]">
        <img src={PROBLEM_IMG} alt="" className="h-full w-full object-cover" />
      </div>
      <div className="mx-auto max-w-7xl px-5">
        <div className="mb-14 max-w-2xl">
          <div className="font-mono text-xs text-muted-foreground">01 / THE REALITY</div>
          <h2 className="mt-3 font-display text-4xl md:text-5xl">3 reasons African students fall behind.</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <ProblemCard n="01" delay={0} title="Inconsistent internet." desc="NEPA goes. Data finishes. Your study app shouldn't punish you for that." />
          <ProblemCard n="02" delay={0.1} title="No one checking on you." desc="Self-study is lonely. Without accountability, weeks blur into nothing." />
          <ProblemCard n="03" delay={0.2} title="Life gets in the way." desc="You work, you commute, you cook. Most planners weren't built for that." />
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { t: "Upload your notes or PDF", d: "Drop in lecture notes, JAMB past questions, or your tutor's deck." },
    { t: "AI structures your content", d: "Groq + Aethex turn raw text into ordered, bite-size lessons." },
    { t: "StudyPal reads it aloud", d: "Hands-free learning while you commute, cook or close the shop." },
    { t: "Voice comprehension check", d: "Three quick questions. Speak or tap. Real understanding." },
    { t: "Daily Pulse tracks progress", d: "Not motivation quotes — actual coverage data day by day." },
  ];
  return (
    <section id="how" className="border-t border-border bg-card py-24">
      <div className="mx-auto max-w-7xl px-5">
        <div className="mb-14 flex items-end justify-between gap-6">
          <div>
            <div className="font-mono text-xs text-muted-foreground">02 / THE FLOW</div>
            <h2 className="mt-3 font-display text-4xl md:text-5xl">How StudyPal works.</h2>
          </div>
          <div className="hidden font-mono text-xs text-muted-foreground md:block">— scroll to follow the steps</div>
        </div>

        <div className="relative">
          <div className="absolute left-0 right-0 top-7 hidden h-px bg-border md:block" />
          <div className="grid gap-6 md:grid-cols-5">
            {steps.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                className="relative"
              >
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-border bg-background font-mono text-sm">
                  0{i + 1}
                </div>
                <div className="font-display text-lg leading-tight">{s.t}</div>
                <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const items = [
    { t: "Voice Lessons", d: "AI reads your content aloud, hands-free.", s: "10–15 min sessions", icon: "M3 11v2a4 4 0 0 0 4 4h0M17 11v2a4 4 0 0 1-4 4h0M9 7h6v8H9z" },
    { t: "Smart Study Planner", d: "Personalized micro-sessions around your real schedule.", s: "Adapts daily", icon: "M8 2v4M16 2v4M3 10h18M5 6h14a2 2 0 0 1 2 2v12H3V8a2 2 0 0 1 2-2Z" },
    { t: "Comprehension Checks", d: "Three questions after every session, instant feedback.", s: "3 Q / lesson", icon: "M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" },
    { t: "Daily Pulse", d: "Real progress data, not motivational quotes.", s: "Heartbeat ring", icon: "M22 12h-4l-3 9L9 3l-3 9H2" },
    { t: "Offline Mode", d: "Works without internet after first load.", s: "0 MB / session", icon: "M5 12.55a11 11 0 0 1 14.08 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01" },
    { t: "Life Happened Mode", d: "Missed days? Plan adapts. Zero guilt-tripping.", s: "Replans in 1s", icon: "M3 12a9 9 0 1 0 9-9M3 3v6h6" },
  ];
  return (
    <section id="features" className="relative border-t border-border py-24">
      <div className="mx-auto max-w-7xl px-5">
        <div className="mb-14 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <div className="font-mono text-xs text-muted-foreground">03 / WHAT'S INSIDE</div>
            <h2 className="mt-3 font-display text-4xl md:text-5xl">Built for your reality.</h2>
          </div>
          <img src={COLLAB_IMG} alt="" className="h-28 w-44 rounded-2xl object-cover" />
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className="tilt-card group rounded-3xl border border-border bg-card p-7"
            >
              <div className="mb-6 grid h-12 w-12 place-items-center rounded-xl bg-accent text-accent-foreground">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={f.icon}/></svg>
              </div>
              <h3 className="font-display text-xl">{f.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.d}</p>
              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 font-mono text-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" /> {f.s}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Counter({ value, suffix = "", duration = 1400 }: { value: number; suffix?: string; duration?: number }) {
  const [start, setStart] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStart(true); }, { threshold: 0.4 });
    io.observe(el); return () => io.disconnect();
  }, []);
  const v = useCountUp(value, duration, start);
  return <span ref={ref} className="font-mono tabular-nums">{Math.round(v)}{suffix}</span>;
}

function Stats() {
  return (
    <section className="border-y border-border bg-[oklch(0.10_0_0)] py-20 text-[oklch(0.953_0.018_75)]">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-10 px-5 md:grid-cols-4">
        {[
          { n: 3, s: "", label: "problems we solve" },
          { n: 10, s: " min", label: "avg session length" },
          { n: 0, s: "", label: "internet required (after first load)" },
          { n: 1, s: "", label: "AI companion, always on" },
        ].map((s, i) => (
          <div key={i}>
            <div className="font-display text-6xl md:text-7xl">
              <Counter value={s.n} suffix={s.s} />
            </div>
            <div className="mt-3 font-mono text-xs uppercase tracking-widest text-white/60">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Testimonials() {
  const items = [
    { name: "Tunde", role: "LASU 300L", avatar: AV1, quote: "I work 6 days a week. StudyPal reads my notes while I'm on the bus. I'm finally caught up." },
    { name: "Amaka", role: "UNILAG Postgrad", avatar: AV2, quote: "The Daily Pulse is honest. It tells me when I'm slacking — no fake motivation." },
    { name: "Emeka", role: "Working + Studying", avatar: AV3, quote: "Internet here is unstable. StudyPal just works. That alone is everything." },
  ];
  return (
    <section id="testimonials" className="border-t border-border py-24">
      <div className="mx-auto max-w-7xl px-5">
        <div className="mb-14 max-w-2xl">
          <div className="font-mono text-xs text-muted-foreground">04 / IN THEIR WORDS</div>
          <h2 className="mt-3 font-display text-4xl md:text-5xl">What students are saying.</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {items.map((t, i) => (
            <motion.figure
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              className="tilt-card rounded-3xl border border-border bg-card p-8"
            >
              <blockquote className="font-display text-xl leading-snug">"{t.quote}"</blockquote>
              <figcaption className="mt-8 flex items-center gap-3">
                <img src={t.avatar} alt={t.name} className="h-11 w-11 rounded-full object-cover" />
                <div>
                  <div className="font-medium">{t.name}</div>
                  <div className="font-mono text-xs text-muted-foreground">{t.role}</div>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="relative isolate overflow-hidden border-t border-border py-32">
      <div className="absolute inset-0 -z-10">
        <img src={COMMUNITY_IMG} alt="" className="h-full w-full object-cover opacity-20 dark:opacity-15" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/70 to-background" />
      </div>
      <div className="mx-auto max-w-3xl px-5 text-center">
        <h2 className="font-display text-4xl md:text-6xl leading-[1.05]">
          Stop falling behind. Start building <span className="text-accent">consistency.</span>
        </h2>
        <p className="mt-6 text-lg text-muted-foreground">Join the first batch of students using StudyPal to actually finish what they started.</p>
        <Link to="/signup" className="btn-press mt-10 inline-flex items-center gap-2 rounded-full bg-accent px-8 py-4 text-base font-medium text-accent-foreground">
          Create Your Free Account
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
        </Link>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-card py-12">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="font-display text-2xl">StudyPal</div>
          <div className="mt-2 max-w-sm text-sm text-muted-foreground">The study pal every African student always needed.</div>
        </div>
        <nav className="flex flex-wrap gap-6 text-sm text-muted-foreground">
          <a href="#problem" className="hover:text-foreground">About</a>
          <a href="#features" className="hover:text-foreground">Features</a>
          <a href="#how" className="hover:text-foreground">Hackathon</a>
          <a href="mailto:hello@studypal.app" className="hover:text-foreground">Contact</a>
        </nav>
      </div>
      <div className="mx-auto mt-10 max-w-7xl border-t border-border px-5 pt-6 font-mono text-xs text-muted-foreground">
        BUILT FOR YPIT HACKATHON 2026 — EDUCATION TRACK · © STUDYPAL
      </div>
    </footer>
  );
}

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopNav />
      <Hero />
      <Problem />
      <HowItWorks />
      <Features />
      <Stats />
      <Testimonials />
      <FinalCTA />
      <Footer />
    </div>
  );
}
