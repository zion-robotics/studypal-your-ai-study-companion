import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  Book,
  Check,
  GraduationCap,
  Loader2,
  Mic,
  PencilLine,
  Shuffle,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/sp/Logo";
import { ThemeToggle } from "@/components/sp/ThemeToggle";
import { supabase } from "@/lib/supabase";
import { requireAuth } from "@/lib/guards";

export const Route = createFileRoute("/onboarding")({
  ssr: false,
  head: () => ({ meta: [{ title: "Onboarding — StudyPal" }] }),
  beforeLoad: requireAuth,
  component: Onboarding,
});

type UserType = "tertiary" | "secondary";
type LearningMode = "voice" | "text" | "mixed";

const EXAMS = ["JAMB", "WAEC", "NECO", "POST-UTME", "GCE", "NABTEB", "OTHERS"];
const LEVELS = ["100L", "200L", "300L", "400L", "500L", "HND 1", "HND 2", "Postgrad"];

function SelectableCard({
  selected,
  onClick,
  icon,
  badge,
  heading,
  description,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  badge: string;
  heading: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative w-full rounded-2xl border p-6 text-left transition-all duration-200 ${
        selected
          ? "border-accent bg-accent/10 shadow-[0_10px_40px_-20px_rgb(13_148_136_/_0.5)]"
          : "border-border bg-card hover:border-accent/50"
      }`}
    >
      {selected && (
        <span className="absolute right-4 top-4 grid h-6 w-6 place-items-center rounded-full bg-accent text-accent-foreground">
          <Check className="h-3.5 w-3.5" />
        </span>
      )}
      <div
        className={`mb-4 grid h-12 w-12 place-items-center rounded-xl ${
          selected ? "bg-accent text-accent-foreground" : "bg-muted text-foreground"
        }`}
      >
        {icon}
      </div>
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {badge}
      </div>
      <h3 className="mt-2 font-display text-xl leading-tight">{heading}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </button>
  );
}

function Toggle({
  checked,
  onChange,
  labelOn = "Yes",
  labelOff = "No",
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  labelOn?: string;
  labelOff?: string;
}) {
  return (
    <div className="inline-flex rounded-full border border-border bg-card p-1">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
          checked ? "bg-accent text-accent-foreground" : "text-muted-foreground"
        }`}
      >
        {labelOn}
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
          !checked ? "bg-accent text-accent-foreground" : "text-muted-foreground"
        }`}
      >
        {labelOff}
      </button>
    </div>
  );
}

function Pill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
        active
          ? "border-accent bg-accent text-accent-foreground"
          : "border-border bg-card text-foreground hover:border-accent/60"
      }`}
    >
      {label}
    </button>
  );
}

function Onboarding() {
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [saving, setSaving] = useState(false);

  // Common
  const [userType, setUserType] = useState<UserType | null>(null);
  const [examDate, setExamDate] = useState("");
  const [hours, setHours] = useState(1.5);
  const [learningMode, setLearningMode] = useState<LearningMode | null>(null);
  const [notifications, setNotifications] = useState(true);

  // Tertiary
  const [schoolName, setSchoolName] = useState("");
  const [course, setCourse] = useState("");
  const [level, setLevel] = useState("");
  const [working, setWorking] = useState(false);

  // Secondary
  const [examTypes, setExamTypes] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [subjectInput, setSubjectInput] = useState("");
  const [stillInSchool, setStillInSchool] = useState(true);

  const daysToExam = useMemo(() => {
    if (!examDate) return null;
    const d = new Date(examDate).getTime() - Date.now();
    return Math.max(0, Math.ceil(d / (1000 * 60 * 60 * 24)));
  }, [examDate]);

  function goNext() {
    setDir(1);
    setStep((s) => Math.min(3, s + 1));
  }
  function goBack() {
    setDir(-1);
    setStep((s) => Math.max(0, s - 1));
  }

  function canContinue(): boolean {
    if (step === 0) return userType !== null;
    if (step === 1) {
      if (userType === "tertiary")
        return schoolName.trim() !== "" && course.trim() !== "" && level !== "" && examDate !== "";
      return examTypes.length > 0 && subjects.length > 0 && examDate !== "";
    }
    if (step === 2) return learningMode !== null;
    return true;
  }

  function addSubject() {
    const v = subjectInput.trim();
    if (!v || subjects.includes(v) || subjects.length >= 9) {
      setSubjectInput("");
      return;
    }
    setSubjects([...subjects, v]);
    setSubjectInput("");
  }

  async function finish() {
    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) {
        toast.error("Your session expired. Please log in again.");
        nav({ to: "/login" });
        return;
      }

      const payload = {
        user_id: user.id,
        full_name: (user.user_metadata as any)?.full_name ?? null,
        user_type: userType,
        school_name: userType === "tertiary" ? schoolName : null,
        course: userType === "tertiary" ? course : null,
        level: userType === "tertiary" ? level : null,
        exam_types: userType === "secondary" ? examTypes : null,
        subjects: userType === "secondary" ? subjects : null,
        exam_date: examDate || null,
        hours_per_day: hours,
        learning_mode: learningMode,
        notifications_enabled: notifications,
        onboarding_completed: true,
      };

      const { error: profileErr } = await supabase
        .from("user_profiles")
        .upsert(payload, { onConflict: "user_id" });
      if (profileErr) {
        // Mirror to user_metadata as a safety net so the app still personalizes,
        // but surface the error so the user can retry.
        await supabase.auth.updateUser({ data: payload });
        toast.error("Failed to save your profile. Try again.");
        setSaving(false);
        return;
      }
      // Mirror onboarding flag onto user metadata for fast client checks.
      await supabase.auth.updateUser({ data: { onboarding_completed: true } });
      if (typeof window !== "undefined") {
        localStorage.setItem("studypal_profile", JSON.stringify(payload));
      }
      toast.success("Study plan saved. Let's go.");
      nav({ to: "/dashboard" });
    } catch (err: any) {
      toast.error("Failed to save your profile. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-background px-5 py-8">
      <div className="mx-auto flex max-w-3xl items-center justify-between">
        <Logo />
        <ThemeToggle />
      </div>

      <div className="mx-auto mt-10 max-w-2xl">
        <div className="mb-3 flex items-center justify-between">
          <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Step {step + 1} of 4
          </span>
          <span className="font-mono text-xs text-accent">{Math.round(((step + 1) / 4) * 100)}%</span>
        </div>
        <div className="mb-10 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full bg-accent"
            initial={false}
            animate={{ width: `${((step + 1) / 4) * 100}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>

        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            initial={{ opacity: 0, x: dir * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -40 }}
            transition={{ duration: 0.35 }}
            className="rounded-3xl border border-border bg-card p-6 md:p-8"
          >
            {step === 0 && (
              <>
                <h2 className="font-display text-3xl md:text-4xl">First things first.</h2>
                <p className="mt-2 text-muted-foreground">
                  Tell us who you are so we can build your perfect study plan.
                </p>
                <div className="mt-8 grid gap-4 md:grid-cols-2">
                  <SelectableCard
                    selected={userType === "tertiary"}
                    onClick={() => setUserType("tertiary")}
                    icon={<GraduationCap className="h-6 w-6" />}
                    badge="University · Polytechnic · College"
                    heading="I'm a tertiary student"
                    description="I have coursework, assignments, and exams at university or polytechnic. I may also be working or running a business on the side."
                  />
                  <SelectableCard
                    selected={userType === "secondary"}
                    onClick={() => setUserType("secondary")}
                    icon={<PencilLine className="h-6 w-6" />}
                    badge="JAMB · WAEC · NECO · POST-UTME · GCE"
                    heading="I'm preparing for an exam"
                    description="I'm in secondary school or a graduate preparing for a major exam. I need a structured revision plan fast."
                  />
                </div>
              </>
            )}

            {step === 1 && userType === "tertiary" && (
              <>
                <h2 className="font-display text-3xl md:text-4xl">Tell us about your studies.</h2>
                <div className="mt-6 space-y-5">
                  <Field label="School name">
                    <input
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      placeholder="e.g. University of Lagos, FUNAAB, Yaba Tech"
                      className={fieldInput}
                    />
                  </Field>
                  <Field label="Course of study">
                    <input
                      value={course}
                      onChange={(e) => setCourse(e.target.value)}
                      placeholder="e.g. Computer Science, Accounting, Nursing"
                      className={fieldInput}
                    />
                  </Field>
                  <Field label="Current level">
                    <select
                      value={level}
                      onChange={(e) => setLevel(e.target.value)}
                      className={fieldInput}
                    >
                      <option value="">Select your level</option>
                      {LEVELS.map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="When is your next exam or test?">
                    <input
                      type="date"
                      value={examDate}
                      onChange={(e) => setExamDate(e.target.value)}
                      className={fieldInput}
                    />
                  </Field>
                  <HoursSlider hours={hours} setHours={setHours} />
                  <div>
                    <div className="font-mono mb-2 block text-xs uppercase tracking-widest text-muted-foreground">
                      Working or running a business?
                    </div>
                    <Toggle checked={working} onChange={setWorking} />
                    {working && (
                      <p className="mt-2 text-xs text-accent">
                        We'll make your sessions even shorter.
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}

            {step === 1 && userType === "secondary" && (
              <>
                <h2 className="font-display text-3xl md:text-4xl">Tell us about your exam.</h2>
                <div className="mt-6 space-y-5">
                  <div>
                    <div className="font-mono mb-2 block text-xs uppercase tracking-widest text-muted-foreground">
                      Which exam are you preparing for?
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {EXAMS.map((ex) => (
                        <Pill
                          key={ex}
                          label={ex}
                          active={examTypes.includes(ex)}
                          onClick={() =>
                            setExamTypes((cur) =>
                              cur.includes(ex) ? cur.filter((x) => x !== ex) : [...cur, ex],
                            )
                          }
                        />
                      ))}
                    </div>
                  </div>
                  <Field label="When is your exam?">
                    <input
                      type="date"
                      value={examDate}
                      onChange={(e) => setExamDate(e.target.value)}
                      className={fieldInput}
                    />
                  </Field>
                  <div>
                    <div className="font-mono mb-2 block text-xs uppercase tracking-widest text-muted-foreground">
                      Subjects to cover ({subjects.length}/9)
                    </div>
                    <div className="mb-2 flex flex-wrap gap-2">
                      {subjects.map((s) => (
                        <span
                          key={s}
                          className="inline-flex items-center gap-1 rounded-full border border-accent bg-accent/10 px-3 py-1 text-sm"
                        >
                          {s}
                          <button
                            type="button"
                            onClick={() => setSubjects(subjects.filter((x) => x !== s))}
                            className="opacity-60 hover:opacity-100"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <input
                      value={subjectInput}
                      onChange={(e) => setSubjectInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addSubject();
                        }
                      }}
                      onBlur={addSubject}
                      disabled={subjects.length >= 9}
                      placeholder="e.g. Biology, Economics, Government — press Enter"
                      className={fieldInput}
                    />
                  </div>
                  <HoursSlider hours={hours} setHours={setHours} />
                  <div>
                    <div className="font-mono mb-2 block text-xs uppercase tracking-widest text-muted-foreground">
                      Are you still in school or self-studying?
                    </div>
                    <Toggle
                      checked={stillInSchool}
                      onChange={setStillInSchool}
                      labelOn="Still in school"
                      labelOff="Self-studying"
                    />
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="font-display text-3xl md:text-4xl">How do you learn best?</h2>
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <SelectableCard
                    selected={learningMode === "voice"}
                    onClick={() => setLearningMode("voice")}
                    icon={<Mic className="h-6 w-6" />}
                    badge="Voice mode"
                    heading="Read it to me"
                    description="StudyPal reads your lessons aloud. Perfect for commutes, cooking, or when your eyes are tired. Powered by Aethex voice AI."
                  />
                  <SelectableCard
                    selected={learningMode === "text"}
                    onClick={() => setLearningMode("text")}
                    icon={<Book className="h-6 w-6" />}
                    badge="Text mode"
                    heading="I'll read it myself"
                    description="Clean text lessons you read at your own pace. Quiet, focused, no audio needed."
                  />
                  <SelectableCard
                    selected={learningMode === "mixed"}
                    onClick={() => setLearningMode("mixed")}
                    icon={<Shuffle className="h-6 w-6" />}
                    badge="Mixed mode"
                    heading="Mix it up"
                    description="Sometimes voice, sometimes text. StudyPal adapts based on your session."
                  />
                </div>
                <div className="mt-8 flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3">
                  <span className="text-sm">Send me daily study reminders</span>
                  <Toggle checked={notifications} onChange={setNotifications} labelOn="On" labelOff="Off" />
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h2 className="font-display text-3xl md:text-4xl">Your study plan is ready.</h2>
                <div className="mt-6 rounded-2xl border border-accent/40 bg-accent/5 p-6">
                  {userType === "tertiary" ? (
                    <p className="text-sm md:text-base">
                      <span className="text-muted-foreground">Course:</span> {course || "—"}.{" "}
                      <span className="text-muted-foreground">Level:</span> {level || "—"}.{" "}
                      <span className="text-muted-foreground">Daily goal:</span> {hours} hrs.{" "}
                      <span className="text-muted-foreground">Exam in:</span>{" "}
                      {daysToExam !== null ? `${daysToExam} days` : "—"}.
                    </p>
                  ) : (
                    <div className="space-y-2 text-sm md:text-base">
                      <p>
                        <span className="text-muted-foreground">Exams:</span> {examTypes.join(", ")}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {subjects.map((s) => (
                          <span
                            key={s}
                            className="rounded-full border border-accent bg-accent/10 px-2.5 py-0.5 text-xs"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                      <p>
                        <span className="text-muted-foreground">Daily goal:</span> {hours} hrs ·{" "}
                        <span className="text-muted-foreground">Exam in:</span>{" "}
                        {daysToExam !== null ? `${daysToExam} days` : "—"}
                      </p>
                    </div>
                  )}
                  <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-accent bg-accent/10 px-3 py-1 text-xs">
                    {learningMode === "voice" && <Mic className="h-3 w-3" />}
                    {learningMode === "text" && <Book className="h-3 w-3" />}
                    {learningMode === "mixed" && <Shuffle className="h-3 w-3" />}
                    <span className="font-mono uppercase tracking-wider">
                      {learningMode} mode
                    </span>
                  </div>
                </div>

                <p className="mt-6 font-display text-xl md:text-2xl">
                  {userType === "tertiary"
                    ? `You've got ${daysToExam ?? "—"} days. Let's make every session count.`
                    : `JAMB/WAEC is in ${daysToExam ?? "—"} days. Students who start today score higher. Let's go.`}
                </p>

                <button
                  onClick={finish}
                  disabled={saving}
                  className="btn-press mt-8 w-full rounded-full bg-accent px-6 py-4 text-base font-semibold text-accent-foreground disabled:opacity-60"
                >
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                    </span>
                  ) : (
                    "Start Studying →"
                  )}
                </button>
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  You can update all of this later in Settings.
                </p>
              </>
            )}

            {step < 3 && (
              <div className="mt-10 flex items-center justify-between">
                <button
                  onClick={goBack}
                  disabled={step === 0}
                  className="rounded-full px-4 py-2 text-sm text-muted-foreground disabled:opacity-30"
                >
                  ← Back
                </button>
                <button
                  onClick={goNext}
                  disabled={!canContinue()}
                  className="btn-press rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Continue →
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

const fieldInput =
  "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-mono mb-2 block text-xs uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function HoursSlider({ hours, setHours }: { hours: number; setHours: (n: number) => void }) {
  return (
    <label className="block">
      <div className="font-mono mb-3 flex items-center justify-between text-xs uppercase tracking-widest text-muted-foreground">
        <span>How many hours can you study daily?</span>
        <span className="text-accent">{hours.toFixed(1)} h</span>
      </div>
      <input
        type="range"
        min={0.5}
        max={4}
        step={0.5}
        value={hours}
        onChange={(e) => setHours(parseFloat(e.target.value))}
        className="w-full accent-[oklch(0.62_0.11_184)]"
      />
    </label>
  );
}