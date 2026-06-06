import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { TopNav } from "@/components/sp/TopNav";
import { useCountUp } from "@/hooks/useCountUp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "StudyPal — The study pal every African student always needed" },
      {
        name: "description",
        content:
          "Upload your notes. StudyPal structures them, reads them aloud, quizzes you, and keeps you on track — even without internet.",
      },
      {
        property: "og:title",
        content: "StudyPal — Built for African students who study while they work",
      },
      {
        property: "og:description",
        content: "AI-powered study accountability that works offline.",
      },
      {
        property: "og:image",
        content: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&q=80",
      },
    ],
  }),
  component: Landing,
});

const HERO_IMG = "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1800&q=80";
const COLLAB_IMG = "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1400&q=80";
const PROBLEM_IMG = "https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=1400&q=80";
const COMMUNITY_IMG = "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1600&q=80";

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
        <img
          src={HERO_IMG}
          alt=""
          className="h-full w-full object-cover opacity-60 dark:opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/55 to-background" />
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
            Whether you're in university juggling work and school, or preparing for JAMB, WAEC, or
            NECO — StudyPal keeps you consistent, even without internet.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              to="/signup"
              className="btn-press inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3.5 text-sm font-medium text-accent-foreground"
            >
              Start Studying Free
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </Link>
            <a
              href="#how"
              className="btn-press inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3.5 text-sm font-medium"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
              Watch Demo
            </a>
          </div>
          <div className="mt-10 flex items-center gap-6 text-xs text-muted-foreground">
            <div className="font-mono">★★★★★ 4.9 from 200 beta students</div>
            <div className="hidden h-4 w-px bg-border md:block" />
            <div>UNILAG · LASU · UI · Covenant · ABU</div>
          </div>
        </motion.div>

        {/* Phone Mockup */}
        <motion.div
          style={{ y: yMock }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative flex items-center justify-center md:col-span-5"
        >
          <div className="relative mx-auto w-[260px]">
            {/* Glow behind phone */}
            <div className="absolute inset-0 -z-10 scale-110 rounded-[48px] bg-accent/20 blur-3xl" />

            {/* Phone frame */}
            <div className="relative rounded-[44px] border-[6px] border-border bg-background shadow-2xl overflow-hidden">
              {/* Notch */}
              <div className="absolute left-1/2 top-0 z-10 h-6 w-24 -translate-x-1/2 rounded-b-2xl bg-border" />

              {/* Screen content */}
              <div className="flex flex-col bg-background px-4 pb-6 pt-10 min-h-[520px]">

                {/* Status bar */}
                <div className="flex items-center justify-between mb-4">
                  <div className="font-mono text-[9px] text-muted-foreground">JAMB · BIO</div>
                  <div className="flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                    <div className="font-mono text-[9px] text-accent">LIVE</div>
                  </div>
                </div>

                {/* Voice waveform */}
                <div className="flex items-center justify-center gap-1 my-4">
                  {[3, 6, 10, 14, 10, 18, 10, 14, 10, 6, 3].map((h, i) => (
                    <motion.div
                      key={i}
                      className="w-1 rounded-full bg-accent"
                      animate={{ height: [h, h * 2.2, h] }}
                      transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        delay: i * 0.07,
                        ease: "easeInOut",
                      }}
                      style={{ height: h }}
                    />
                  ))}
                </div>

                {/* Now playing */}
                <div className="rounded-2xl border border-accent/30 bg-accent/5 p-3 mt-2">
                  <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Now reading</div>
                  <div className="mt-1 text-sm font-medium leading-snug">Cellular Respiration</div>
                  <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">JAMB Biology · Topic 6 of 14</div>
                </div>

                {/* Progress */}
                <div className="mt-4">
                  <div className="flex justify-between font-mono text-[9px] text-muted-foreground mb-1">
                    <span>Progress</span><span>42%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-accent"
                      initial={{ width: 0 }}
                      animate={{ width: "42%" }}
                      transition={{ duration: 1.4, ease: "easeOut", delay: 0.5 }}
                    />
                  </div>
                </div>

                {/* Comprehension check */}
                <div className="mt-4 rounded-2xl border border-border bg-card p-3">
                  <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Quick check</div>
                  <div className="mt-1 text-xs leading-snug">What is the main product of glycolysis?</div>
                  <div className="mt-2 flex flex-col gap-1.5">
                    {["ATP only", "Pyruvate + ATP", "CO₂ + Water"].map((opt, i) => (
                      <div
                        key={i}
                        className={`rounded-xl border px-2.5 py-1.5 text-[11px] font-medium ${
                          i === 1
                            ? "border-accent bg-accent/10 text-accent"
                            : "border-border text-muted-foreground"
                        }`}
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mic button */}
                <div className="mt-5 flex flex-col items-center gap-2">
                  <motion.div
                    animate={{
                      boxShadow: [
                        "0 0 0 0px rgb(13 148 136 / 0.4)",
                        "0 0 0 10px rgb(13 148 136 / 0)",
                        "0 0 0 0px rgb(13 148 136 / 0)",
                      ],
                    }}
                    transition={{ duration: 1.6, repeat: Infinity }}
                    className="grid h-12 w-12 place-items-center rounded-full bg-accent text-accent-foreground"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
                    </svg>
                  </motion.div>
                  <div className="font-mono text-[9px] text-muted-foreground">Tap to answer</div>
                </div>

              </div>
            </div>

            {/* Streak badge */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="absolute -right-12 top-16 rounded-2xl border border-border bg-card px-3 py-2 shadow-lg"
            >
              <div className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">streak</div>
              <div className="font-display text-lg text-accent">7 days 🔥</div>
            </motion.div>

            {/* Offline badge */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="absolute -left-12 bottom-24 rounded-2xl border border-border bg-card px-3 py-2 shadow-lg"
            >
              <div className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">offline</div>
              <div className="font-display text-sm">No bars? ✓</div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function ProblemCard({
  title,
  desc,
  n,
  delay,
}: {
  title: string;
  desc: string;
  n: string;
  delay: number;
}) {
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
          <h2 className="mt-3 font-display text-4xl md:text-5xl">
            3 reasons African students fall behind.
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <ProblemCard
            n="01"
            delay={0}
            title="Inconsistent internet."
            desc="NEPA goes. Data finishes. Your study app shouldn't punish you for that."
          />
          <ProblemCard
            n="02"
            delay={0.1}
            title="No one checking on you."
            desc="Self-study is lonely. Without accountability, weeks blur into nothing."
          />
          <ProblemCard
            n="03"
            delay={0.2}
            title="Life gets in the way."
            desc="You work, you commute, you cook. Most planners weren't built for that."
          />
        </div>
      </div>
    </section>
  );
}

const HOW_STEPS = [
  {
    t: "Upload your notes or PDF",
    d: "Drop in lecture notes, JAMB past questions, or your tutor's deck.",
  },
  {
    t: "AI structures your content",
    d: "Groq + Aethex turn raw text into ordered, bite-size lessons.",
  },
  {
    t: "StudyPal reads it aloud",
    d: "Hands-free learning while you commute, cook or close the shop.",
  },
  { t: "Voice comprehension check", d: "Three quick questions. Speak or tap. Real understanding." },
  {
    t: "Daily Pulse tracks progress",
    d: "Not motivation quotes — actual coverage data day by day.",
  },
];

function WhoFor() {
  const cards = [
    {
      badge: "University · Polytechnic · College",
      heading: "Studying while working?",
      desc: "You have lectures, assignments, and a job or business on the side. StudyPal breaks your coursework into 10-minute sessions you can do on your commute, lunch break, or before bed — and tracks your progress so nothing falls through the cracks.",
      points: [
        "Inconsistent internet? Works offline.",
        "No lecturer following up? AI tracks your progress.",
        "Too tired after work? Micro-sessions fit your life.",
      ],
      cta: "I'm a university student →",
    },
    {
      badge: "JAMB · WAEC · NECO · POST-UTME",
      heading: "Exam in weeks. Ready?",
      desc: "Upload your past questions, syllabus, or handwritten notes. StudyPal structures them into a revision plan, quizzes you by voice, and shows you exactly which topics need more attention.",
      points: [
        "Scattered past questions? Organized in seconds.",
        "Don't know what to prioritize? AI builds your plan.",
        "Need to practice recall? Voice comprehension checks.",
      ],
      cta: "I'm preparing for exams →",
    },
  ];
  return (
    <section id="who" className="border-t border-border py-24">
      <div className="mx-auto max-w-7xl px-5">
        <div className="mb-14 max-w-2xl">
          <div className="font-mono text-xs text-muted-foreground">01.5 / WHO IT'S FOR</div>
          <h2 className="mt-3 font-display text-4xl md:text-5xl">Who is StudyPal for?</h2>
          <p className="mt-3 text-muted-foreground">
            Two kinds of African students. One companion built for both.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {cards.map((c, i) => (
            <motion.div
              key={c.badge}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              className="tilt-card group relative overflow-hidden rounded-3xl border border-border bg-card p-8 transition-shadow hover:shadow-[0_30px_80px_-40px_rgb(13_148_136_/_0.55)]"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-accent">
                {c.badge}
              </div>
              <h3 className="mt-5 font-display text-3xl leading-tight">{c.heading}</h3>
              <p className="mt-3 text-muted-foreground">{c.desc}</p>
              <ul className="mt-6 space-y-3">
                {c.points.map((p) => (
                  <li key={p} className="flex items-start gap-3 text-sm">
                    <span className="mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-full bg-accent/15 text-accent">
                      <Check className="h-3 w-3" />
                    </span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/signup"
                className="btn-press mt-8 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-medium text-accent-foreground"
              >
                {c.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowStep({
  index,
  t,
  d,
  activeIndex,
  onEnter,
}: {
  index: number;
  t: string;
  d: string;
  activeIndex: number;
  onEnter: (i: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.55, margin: "-20% 0px -30% 0px" });
  useEffect(() => {
    if (inView) onEnter(index);
  }, [inView, index, onEnter]);

  const reached = index <= activeIndex;
  const isActive = index === activeIndex;
  const isPast = index < activeIndex;
  const cardOnRight = index % 2 === 0;

  const circle = (
    <motion.div
      initial={false}
      animate={{ scale: isActive ? 1.06 : 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className={`relative z-10 grid h-14 w-14 place-items-center rounded-full border font-mono text-sm transition-colors duration-500 md:h-[72px] md:w-[72px] md:text-base ${
        reached
          ? "border-accent bg-accent text-accent-foreground"
          : "border-border bg-background text-muted-foreground"
      } ${isActive ? "shadow-[0_0_0_6px_rgb(13_148_136_/_0.15)]" : ""}`}
    >
      0{index + 1}
    </motion.div>
  );

  const card = (
    <motion.div
      initial={{ opacity: 0, x: cardOnRight ? 40 : -40 }}
      animate={inView ? { opacity: 1, x: 0 } : { opacity: 0.35, x: cardOnRight ? 12 : -12 }}
      transition={{ duration: 0.55, ease: [0.2, 0.8, 0.2, 1] }}
      className={`rounded-2xl border bg-card/60 p-5 transition-all duration-500 md:p-6 ${
        isActive
          ? "border-accent shadow-[0_10px_40px_-20px_rgb(13_148_136_/_0.5)]"
          : isPast
            ? "border-border opacity-60"
            : "border-border/60 opacity-50"
      }`}
    >
      <h3
        className={`font-display text-xl leading-tight md:text-2xl ${reached ? "text-foreground" : "text-muted-foreground"}`}
      >
        {t}
      </h3>
      <p className="mt-2 text-sm text-muted-foreground md:text-base">{d}</p>
    </motion.div>
  );

  return (
    <div ref={ref} className="relative pb-16 last:pb-0">
      <div className="grid grid-cols-[56px_1fr] gap-5 md:hidden">
        {circle}
        {card}
      </div>
      <div className="hidden md:grid md:grid-cols-[1fr_72px_1fr] md:items-center md:gap-8">
        {cardOnRight ? (
          <>
            <div />
            <div className="flex items-center justify-center">
              <div
                className={`absolute left-1/2 ml-9 h-px w-8 transition-colors duration-500 ${reached ? "bg-accent" : "bg-border"}`}
              />
              {circle}
            </div>
            <div className="pl-8">{card}</div>
          </>
        ) : (
          <>
            <div className="flex justify-end pr-8">{card}</div>
            <div className="flex items-center justify-center">
              <div
                className={`absolute right-1/2 mr-9 h-px w-8 transition-colors duration-500 ${reached ? "bg-accent" : "bg-border"}`}
              />
              {circle}
            </div>
            <div />
          </>
        )}
      </div>
    </div>
  );
}

function HowItWorks() {
  const [activeIndex, setActiveIndex] = useState(0);
  const onEnter = (i: number) => setActiveIndex((cur) => (i > cur ? i : cur));
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"],
  });
  const lineScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section id="how" className="border-t border-border bg-card py-24">
      <div className="mx-auto max-w-5xl px-5">
        <div className="mb-16 text-center">
          <div className="font-mono text-xs text-muted-foreground">02 / THE FLOW</div>
          <h2 className="mt-3 font-display text-4xl md:text-5xl">How StudyPal works.</h2>
        </div>
        <div ref={containerRef} className="relative">
          <div className="absolute left-[27px] top-0 hidden h-full w-px bg-border md:left-1/2 md:block md:-translate-x-1/2" />
          <div className="absolute left-[27px] top-0 h-full w-px bg-border md:hidden" />
          <motion.div
            style={{ scaleY: lineScale, transformOrigin: "top" }}
            className="absolute left-[27px] top-0 h-full w-px bg-accent md:left-1/2 md:-translate-x-1/2"
          />
          {HOW_STEPS.map((s, i) => (
            <HowStep
              key={i}
              index={i}
              t={s.t}
              d={s.d}
              activeIndex={activeIndex}
              onEnter={onEnter}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  const items = [
    {
      t: "Voice Lessons",
      d: "AI reads your content aloud, hands-free.",
      s: "10–15 min sessions",
      icon: "M3 11v2a4 4 0 0 0 4 4h0M17 11v2a4 4 0 0 1-4 4h0M9 7h6v8H9z",
    },
    {
      t: "Smart Study Planner",
      d: "Personalized micro-sessions around your real schedule.",
      s: "Adapts daily",
      icon: "M8 2v4M16 2v4M3 10h18M5 6h14a2 2 0 0 1 2 2v12H3V8a2 2 0 0 1 2-2Z",
    },
    {
      t: "Comprehension Checks",
      d: "Three questions after every session, instant feedback.",
      s: "3 Q / lesson",
      icon: "M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11",
    },
    {
      t: "Daily Pulse",
      d: "Real progress data, not motivational quotes.",
      s: "Heartbeat ring",
      icon: "M22 12h-4l-3 9L9 3l-3 9H2",
    },
    {
      t: "Offline Mode",
      d: "Works without internet after first load.",
      s: "0 MB / session",
      icon: "M5 12.55a11 11 0 0 1 14.08 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01",
    },
    {
      t: "Life Happened Mode",
      d: "Missed days? Plan adapts. Zero guilt-tripping.",
      s: "Replans in 1s",
      icon: "M3 12a9 9 0 1 0 9-9M3 3v6h6",
    },
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
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={f.icon} />
                </svg>
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

function Counter({
  value,
  suffix = "",
  duration = 1400,
}: {
  value: number;
  suffix?: string;
  duration?: number;
}) {
  const [start, setStart] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setStart(true); },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const v = useCountUp(value, duration, start);
  return (
    <span ref={ref} className="font-mono tabular-nums">
      {Math.round(v)}{suffix}
    </span>
  );
}

function Stats() {
  return (
    <section className="border-y border-border bg-[oklch(0.10_0_0)] py-20 text-[oklch(0.953_0.018_75)]">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-10 px-5 md:grid-cols-4">
        {[
          { display: "2", label: "Who we serve — user types" },
          { display: "JAMB · WAEC · NECO", label: "Exams covered" },
          { display: "10 min", label: "Avg session length" },
          { display: "0 bars", label: "Internet needed offline" },
        ].map((s, i) => (
          <div key={i}>
            <div className="font-display text-4xl leading-tight md:text-6xl">{s.display}</div>
            <div className="mt-3 font-mono text-xs uppercase tracking-widest text-white/60">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Testimonials() {
  const items = [
    {
      name: "Tunde A.",
      role: "300L Engineering, LASU",
      avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&q=80",
      quote:
        "I work at a phone repair shop till 5pm. StudyPal gives me 10-minute sessions I can actually finish. My GPA went from 2.8 to 3.4 this semester.",
    },
    {
      name: "Chisom E.",
      role: "JAMB Candidate, Enugu",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
      quote:
        "I uploaded my Biology past questions and StudyPal turned them into daily quizzes. I scored 287 on my JAMB. I wasn't expecting that at all.",
    },
    {
      name: "Amaka O.",
      role: "HND Accounting, Yaba Tech",
      avatar: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=200&q=80",
      quote:
        "The voice lessons are everything. I listen while I'm cooking or on the bus. It actually asks me questions and waits for my answer. Nothing else does that.",
    },
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
        <img
          src={COMMUNITY_IMG}
          alt=""
          className="h-full w-full object-cover opacity-20 dark:opacity-15"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/70 to-background" />
      </div>
      <div className="mx-auto max-w-3xl px-5 text-center">
        <h2 className="font-display text-4xl md:text-6xl leading-[1.05]">
          Stop falling behind. Start building <span className="text-accent">consistency.</span>
        </h2>
        <p className="mt-6 text-lg text-muted-foreground">
          Join the first batch of students using StudyPal to actually finish what they started.
        </p>
        <Link
          to="/signup"
          className="btn-press mt-10 inline-flex items-center gap-2 rounded-full bg-accent px-8 py-4 text-base font-medium text-accent-foreground"
        >
          Create Your Free Account
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M13 5l7 7-7 7" />
          </svg>
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
          <div className="mt-2 max-w-sm text-sm text-muted-foreground">
            The study pal every African student always needed.
          </div>
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
      <WhoFor />
      <HowItWorks />
      <Features />
      <Stats />
      <Testimonials />
      <FinalCTA />
      <Footer />
    </div>
  );
}