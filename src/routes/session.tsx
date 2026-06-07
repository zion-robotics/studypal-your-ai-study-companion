import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState, useCallback, type MutableRefObject } from "react";
import { AppShell } from "@/components/sp/AppShell";
import { groqStructured } from "@/lib/groq";
import { supabase } from "@/lib/supabase";
import { useProfile } from "@/hooks/useProfile";
import { requireAuth } from "@/lib/guards";
import {
  getAethexVoices,
  createStudyAgent,
  startAethexSession,
  sendSdpOffer,
} from "@/lib/aethex";
import {
  Play, Pause, ChevronRight, Zap, Loader2, Upload, FileText,
  BookOpen, Layers, ListChecks, ArrowRight, ArrowUp, Check,
  Paperclip, Sparkles, X, Mic, MicOff, PhoneOff, Wifi, WifiOff,
  RotateCcw, Volume2,
} from "lucide-react";

// ─── Route ──────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/session")({
  ssr: false,
  head: () => ({ meta: [{ title: "Session — StudyPal" }] }),
  beforeLoad: requireAuth,
  component: Session,
});

// ─── Types ───────────────────────────────────────────────────────────────────

type Question   = { q: string; opts: string[]; a: number; explanation?: string };
type Flashcard  = { term: string; definition: string };
type Phase      = "loading" | "workspace" | "quiz" | "done";
type ActiveTool = null | "summary" | "quiz" | "flashcards";
type VoicePhase = "idle" | "connecting" | "active" | "error";

type ChatMessage = { role: "user" | "assistant"; content: string };

type DocData = {
  name: string;
  size: string;
  extractedText: string;
  isImage: boolean;
  imageBase64?: string;
  imageMimeType?: string;
};

type LessonData = {
  subject: string;
  notes: string;
  topics: string[];
};

// ─── Fallbacks ────────────────────────────────────────────────────────────────

const FALLBACK_QUESTIONS: Question[] = [
  { q: "What is the main concept covered in this lesson?", opts: ["Concept A", "Concept B", "Concept C", "Concept D"], a: 0, explanation: "Review the first section of your notes." },
  { q: "Which best describes a key idea from the material?",  opts: ["Option A", "Option B", "Option C", "Option D"], a: 1, explanation: "Look for the bold terms in your notes." },
  { q: "What should you focus on when reviewing this topic?", opts: ["Detail A", "Detail B", "Detail C", "Detail D"], a: 2, explanation: "Focus on the summary sections." },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

async function extractPdfText(file: File): Promise<string> {
  if (!(window as any).pdfjsLib) {
    await new Promise<void>((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("Failed to load PDF.js"));
      document.head.appendChild(s);
    });
    (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  }
  const lib = (window as any).pdfjsLib;
  const pdf = await lib.getDocument({ data: await file.arrayBuffer() }).promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += `[Page ${i}]\n${content.items.map((x: any) => x.str).join(" ")}\n\n`;
  }
  return text.trim();
}

async function extractTxtText(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsText(file);
  });
}

async function imageToBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res((r.result as string).split(",")[1]);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

// ─── WebRTC Voice Session Hook ────────────────────────────────────────────────

function useAethexVoice(lesson: LessonData | null) {
  const [voicePhase, setVoicePhase]   = useState<VoicePhase>("idle");
  const [voiceError, setVoiceError]   = useState<string | null>(null);
  const [voices, setVoices]           = useState<{ id: string; name: string }[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [isMuted, setIsMuted]         = useState(false);
  const pcRef     = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef  = useRef<HTMLAudioElement | null>(null);

  const createAgent   = useServerFn(createStudyAgent);
  const startSession  = useServerFn(startAethexSession);
  const sendOffer     = useServerFn(sendSdpOffer);
  const fetchVoices   = useServerFn(getAethexVoices);

  useEffect(() => {
    fetchVoices().then((v) => {
      setVoices(v);
      if (v.length > 0) setSelectedVoice(v[0].id);
    }).catch(() => {});
  }, []);

  const startVoiceSession = useCallback(async () => {
    if (!lesson) return;
    setVoicePhase("connecting");
    setVoiceError(null);
    try {
      // 1. Create agent
      const { agentId } = await createAgent({ data: { subject: lesson.subject, voiceId: selectedVoice } });

      // 2. Start session → get ICE config
      const { sessionId, iceConfig } = await startSession({ data: { agentId } });

      // 3. Set up WebRTC
      const pc = new RTCPeerConnection({ iceServers: iceConfig?.ice_servers ?? [] });
      pcRef.current = pc;

      // Remote audio
      const audio = new Audio();
      audio.autoplay = true;
      audioRef.current = audio;
      pc.ontrack = (e) => { audio.srcObject = e.streams[0]; };

      // Local mic
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      // Create & send SDP offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const answer = await sendOffer({ data: { sessionId, sdp: offer.sdp!, type: offer.type } });
      await pc.setRemoteDescription(new RTCSessionDescription({ sdp: answer.sdp, type: answer.type as RTCSdpType }));

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") setVoicePhase("active");
        if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
          setVoicePhase("error");
          setVoiceError("Voice connection lost. Try again.");
        }
      };

      setVoicePhase("active");
    } catch (err: any) {
      setVoicePhase("error");
      setVoiceError(err?.message || "Failed to start voice session.");
    }
  }, [lesson, selectedVoice]);

  const endVoiceSession = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (audioRef.current) { audioRef.current.srcObject = null; audioRef.current = null; }
    setVoicePhase("idle");
    setVoiceError(null);
  }, []);

  const toggleMute = useCallback(() => {
    if (!streamRef.current) return;
    streamRef.current.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; });
    setIsMuted((m) => !m);
  }, []);

  return { voicePhase, voiceError, voices, selectedVoice, setSelectedVoice, isMuted, startVoiceSession, endVoiceSession, toggleMute };
}

// ─── Main Component ───────────────────────────────────────────────────────────

function Session() {
  const { profile }       = useProfile();
  const isTertiary        = profile?.user_type === "tertiary";
  const generateQuestions = useServerFn(groqStructured);

  // Online/offline detection
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on  = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener("online",  on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  // Core state
  const [phase, setPhase]           = useState<Phase>("loading");
  const [lesson, setLesson]         = useState<LessonData | null>(null);
  const [lessonId, setLessonId]     = useState<string | null>(null);
  const [currentTopic, setCurrentTopic] = useState("");
  const [error, setError]           = useState<string | null>(null);

  // Doc upload (optional override of Supabase lesson)
  const [docData, setDocData]       = useState<DocData | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef                = useRef<HTMLInputElement>(null);

  // Tools
  const [activeTool, setActiveTool] = useState<ActiveTool>(null);
  const [summary, setSummary]       = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [questions, setQuestions]   = useState<Question[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [flashcardsLoading, setFlashcardsLoading] = useState(false);

  // Quiz
  const [qi, setQi]     = useState(0);
  const [picks, setPicks] = useState<number[]>([]);

  // Chat
  const [messages, setMessages]   = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const chatScrollRef             = useRef<HTMLDivElement>(null);

  // Offline TTS
  const [ttsPlaying, setTtsPlaying] = useState(false);

  // Voice (Aethex)
  const voice = useAethexVoice(lesson);

  // ── Auto-scroll chat ──
  useEffect(() => {
    if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
  }, [messages, chatLoading]);

  // ── Cleanup on unmount ──
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
      voice.endVoiceSession();
    };
  }, []);

  // ── Load lesson from Supabase on mount ──
  useEffect(() => { loadLesson(); }, []);

  async function loadLesson() {
    setError(null);
    setPhase("loading");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError("Not logged in."); setPhase("workspace"); return; }

      const { data, error: err } = await supabase
        .from("lessons")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (err || !data) { setError("No lessons found. Upload your notes to get started."); setPhase("workspace"); return; }

      const l: LessonData = { subject: data.subject, notes: data.notes, topics: data.topics ?? [] };
      setLesson(l);
      setLessonId(data.id);
      setCurrentTopic(l.topics[0] ?? l.subject);
      setPhase("workspace");
    } catch {
      setError("Something went wrong loading your lesson.");
      setPhase("workspace");
    }
  }

  // ── File upload ──
  async function handleFileUpload(file: File) {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);
    const isPdf   = ext === "pdf";
    const isTxt   = ext === "txt";
    if (!isImage && !isPdf && !isTxt) { alert("Please upload a PDF, TXT, or image file."); return; }

    setIsUploading(true);
    setActiveTool(null); setSummary(""); setQuestions([]); setFlashcards([]);
    setMessages([]); setDocData(null); setError(null);

    try {
      let extractedText = "";
      let imageBase64: string | undefined;
      let imageMimeType: string | undefined;

      if (isPdf)        extractedText = await extractPdfText(file);
      else if (isTxt)   extractedText = await extractTxtText(file);
      else if (isImage) { imageBase64 = await imageToBase64(file); imageMimeType = file.type || `image/${ext}`; }

      const doc: DocData = { name: file.name, size: formatFileSize(file.size), extractedText, isImage, imageBase64, imageMimeType };
      setDocData(doc);

      // Mirror as lesson for Groq/voice
      setLesson((prev) => ({
        subject: prev?.subject ?? file.name,
        notes: extractedText,
        topics: prev?.topics ?? [],
      }));
    } catch (err: any) {
      alert("Failed to process document: " + (err.message ?? "Unknown error"));
    } finally {
      setIsUploading(false);
    }
  }

  // ── Tool selection ──
  async function handleToolSelect(tool: ActiveTool) {
    if (tool === activeTool) { setActiveTool(null); return; }
    setActiveTool(tool);

    const notes = docData?.extractedText || lesson?.notes || "";
    const topic = currentTopic || lesson?.subject || "";

    if (tool === "summary" && !summary) {
      setSummaryLoading(true);
      try {
        const result = await generateQuestions({
          data: {
            prompt: `Write a detailed, structured summary of the following study notes on "${topic}". Cover all key concepts clearly. Write in flowing paragraphs without markdown symbols.\n\nNotes:\n${notes.slice(0, 4000)}`,
            schemaHint: 'Return { summary: string }',
          },
        });
        setSummary((result as any)?.summary || "Could not generate summary.");
      } catch { setSummary("Failed to generate summary."); }
      finally { setSummaryLoading(false); }
    }

    if (tool === "quiz" && questions.length === 0) {
      setQuestionsLoading(true);
      try {
        const result = await generateQuestions({
          data: {
            prompt: `Based on these study notes, generate exactly 5 multiple choice questions about "${topic}".
Notes: ${notes.slice(0, 3000)}
Return JSON: { "questions": [{ "q": "question text", "opts": ["A","B","C","D"], "a": 0, "explanation": "why this answer is correct" }] }
- "a" is the index of the correct answer (0–3)
- Make questions specific to the content
- Include a brief explanation for each answer
- ${isTertiary ? "University level difficulty" : "JAMB/WAEC exam style"}`,
            schemaHint: 'Return { questions: Array<{ q: string, opts: string[4], a: number, explanation: string }> }',
          },
        });
        const qs = (result as any)?.questions;
        setQuestions(Array.isArray(qs) && qs.length > 0 ? qs : FALLBACK_QUESTIONS);
      } catch { setQuestions(FALLBACK_QUESTIONS); }
      finally { setQuestionsLoading(false); }
    }

    if (tool === "flashcards" && flashcards.length === 0) {
      setFlashcardsLoading(true);
      try {
        const result = await generateQuestions({
          data: {
            prompt: `Generate exactly 12 flashcards from these study notes on "${topic}".
Notes: ${notes.slice(0, 3000)}
Return JSON: { "flashcards": [{ "term": "key term or concept", "definition": "1-2 sentence definition" }] }`,
            schemaHint: 'Return { flashcards: Array<{ term: string, definition: string }> }',
          },
        });
        const fc = (result as any)?.flashcards;
        setFlashcards(Array.isArray(fc) && fc.length > 0 ? fc : []);
      } catch { setFlashcards([]); }
      finally { setFlashcardsLoading(false); }
    }

    if (tool === "quiz") { setQi(0); setPicks([]); setPhase("quiz"); }
  }

  // ── Quiz answer pick ──
  async function pick(i: number) {
    const next = [...picks, i];
    setPicks(next);
    if (next.length >= questions.length) {
      setTimeout(async () => {
        setPhase("done");
        const { data: { user } } = await supabase.auth.getUser();
        if (user && lessonId) {
          const score = next.reduce((s, p, idx) => s + (p === questions[idx]?.a ? 1 : 0), 0);
          await supabase.from("sessions").insert({
            user_id: user.id,
            lesson_id: lessonId,
            subject: lesson?.subject,
            topic: currentTopic,
            score,
            total: questions.length,
            completed: true,
          });
        }
      }, 400);
    } else {
      setTimeout(() => setQi((x) => x + 1), 400);
    }
  }

  // ── Chat ──
  async function sendChatMessage(text: string) {
    if (!text.trim() || chatLoading) return;
    const userMsg: ChatMessage = { role: "user", content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setChatInput("");
    setChatLoading(true);
    try {
      const notes = docData?.extractedText || lesson?.notes || "";
      const history = updated.map((m) => `${m.role === "user" ? "Student" : "StudyPal"}: ${m.content}`).join("\n");
      const result = await generateQuestions({
        data: {
          prompt: `You are StudyPal, a helpful academic assistant. Only answer questions related to academics, studying, and the document context below.
${notes ? `\nDocument context:\n${notes.slice(0, 2000)}\n` : ""}
Conversation so far:
${history}

Respond in plain text without markdown. Be educational and encouraging.`,
          schemaHint: 'Return { reply: string }',
        },
      });
      const reply = (result as any)?.reply || "I couldn't generate a response. Please try again.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Something went wrong. Please check your connection and try again." }]);
    } finally { setChatLoading(false); }
  }

  // ── Offline TTS ──
  function toggleOfflineTts() {
    if (ttsPlaying) { window.speechSynthesis?.cancel(); setTtsPlaying(false); return; }
    const text = `Topic: ${currentTopic}. ${lesson?.notes?.slice(0, 1500) || ""}`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.92;
    utterance.onend = () => setTtsPlaying(false);
    window.speechSynthesis.speak(utterance);
    setTtsPlaying(true);
  }

  // ── Scores ──
  const score = picks.reduce((s, p, i) => s + (p === questions[i]?.a ? 1 : 0), 0);
  const pct   = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  if (phase === "loading") return <LoadingScreen />;

  return (
    <AppShell>
      <input
        ref={fileInputRef} type="file" className="hidden"
        accept=".pdf,.txt,.jpg,.jpeg,.png,.gif,.webp"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); e.target.value = ""; }}
      />
      <div className="h-full overflow-hidden flex flex-col bg-background">

        {/* ── Top bar ── */}
        <header className="shrink-0 border-b border-border/60 bg-background/95 backdrop-blur-sm px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-accent/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-accent truncate max-w-[120px]">
                {lesson?.subject || "Session"}
              </span>
              {lesson && (
                <span className="rounded-full bg-muted px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hidden sm:inline">
                  {currentTopic}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Connectivity badge */}
            <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${isOnline ? "bg-green-500/10 text-green-600" : "bg-orange-500/10 text-orange-600"}`}>
              {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {isOnline ? "Online" : "Offline"}
            </div>
            <Link
              to="/dashboard"
              onClick={() => { window.speechSynthesis?.cancel(); voice.endVoiceSession(); }}
              className="rounded-xl border bg-card px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition"
            >
              Exit
            </Link>
          </div>
        </header>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto" ref={chatScrollRef}>
          <div className="mx-auto max-w-2xl px-5 py-6 space-y-6">
            <AnimatePresence mode="wait">

              {/* ──────────── WORKSPACE PHASE ──────────── */}
              {(phase === "workspace") && (
                <motion.div key="workspace" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="space-y-5">

                  {/* Error / no lesson */}
                  {error && !lesson && (
                    <div className="rounded-2xl bg-accent/5 border border-accent/20 p-6 flex flex-col items-center text-center gap-3">
                      <div className="h-14 w-14 rounded-2xl bg-accent/10 flex items-center justify-center">
                        <Zap className="h-7 w-7 text-accent" />
                      </div>
                      <p className="font-bold text-lg">{error}</p>
                      <Link to="/upload" className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground">
                        Upload Notes →
                      </Link>
                    </div>
                  )}

                  {/* Exam banner */}
                  {!isTertiary && lesson && (
                    <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      className="rounded-2xl bg-accent/10 border border-accent/20 px-4 py-3 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-accent shrink-0" />
                      <p className="text-sm font-semibold text-accent">High exam probability — commonly appears in JAMB and WAEC</p>
                    </motion.div>
                  )}

                  {/* Doc card / upload area */}
                  {docData ? (
                    <DocCard docData={docData} onRemove={() => { setDocData(null); setActiveTool(null); setSummary(""); setQuestions([]); setFlashcards([]); setMessages([]); }} />
                  ) : (
                    <UploadCard onClick={() => fileInputRef.current?.click()} isUploading={isUploading} />
                  )}

                  {/* Notes preview (from Supabase lesson) */}
                  {lesson && !docData && (
                    <div className="rounded-2xl bg-card border p-5">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                        Your notes · {currentTopic}
                      </div>
                      <p className="text-[15px] leading-relaxed text-foreground">
                        {lesson.notes?.slice(0, 800)}
                        {(lesson.notes?.length ?? 0) > 800 && (
                          <span className="text-muted-foreground"> … (continued)</span>
                        )}
                      </p>
                    </div>
                  )}

                  {/* Voice section */}
                  {lesson && (
                    <VoiceSection
                      isOnline={isOnline}
                      voicePhase={voice.voicePhase}
                      voiceError={voice.voiceError}
                      voices={voice.voices}
                      selectedVoice={voice.selectedVoice}
                      onVoiceChange={voice.setSelectedVoice}
                      isMuted={voice.isMuted}
                      onStart={voice.startVoiceSession}
                      onEnd={voice.endVoiceSession}
                      onToggleMute={voice.toggleMute}
                      ttsPlaying={ttsPlaying}
                      onToggleTts={toggleOfflineTts}
                    />
                  )}

                  {/* AI Tools */}
                  {(lesson || docData) && (
                    <ToolsSection
                      activeTool={activeTool}
                      onToolSelect={handleToolSelect}
                      summary={summary}
                      summaryLoading={summaryLoading}
                      flashcards={flashcards}
                      flashcardsLoading={flashcardsLoading}
                      questionsLoading={questionsLoading}
                      onStartQuiz={() => { if (questions.length > 0) { setQi(0); setPicks([]); setPhase("quiz"); } else handleToolSelect("quiz"); }}
                    />
                  )}

                  {/* Chat */}
                  {(lesson || docData) && (
                    <ChatSection
                      messages={messages}
                      isLoading={chatLoading}
                      input={chatInput}
                      onInputChange={setChatInput}
                      onSend={sendChatMessage}
                      hasDoc={!!docData || !!lesson}
                    />
                  )}
                </motion.div>
              )}

              {/* ──────────── QUIZ PHASE ──────────── */}
              {phase === "quiz" && questions.length > 0 && (
                <motion.div key={`quiz-${qi}`} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                  <div className="mb-4">
                    <div className="flex justify-between text-xs font-semibold text-muted-foreground mb-2">
                      <span>{isTertiary ? "Comprehension check" : "JAMB-style question"}</span>
                      <span>{qi + 1} / {questions.length}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <motion.div className="h-1.5 rounded-full bg-accent"
                        animate={{ width: `${((qi + 1) / questions.length) * 100}%` }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl bg-card border p-6">
                    <h2 className="text-xl font-extrabold leading-snug">{questions[qi]?.q}</h2>
                    {!isTertiary && (
                      <p className="mt-1 text-xs text-muted-foreground">Select the most correct answer — just like in the exam hall</p>
                    )}
                    <div className="mt-5 grid gap-3">
                      {questions[qi]?.opts.map((o, i) => {
                        const picked     = picks[qi] === i;
                        const isCorrect  = i === questions[qi].a;
                        const showResult = picks[qi] !== undefined;
                        return (
                          <motion.button key={i} whileTap={{ scale: 0.98 }}
                            onClick={() => !showResult && pick(i)}
                            className={`w-full rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition flex items-center gap-3 ${
                              showResult && isCorrect  ? "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400"
                              : showResult && picked   ? "border-destructive bg-destructive/10 text-destructive"
                              : "border-border bg-background hover:border-accent"
                            }`}>
                            <span className={`h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                              showResult && isCorrect  ? "bg-green-500/20 text-green-700 dark:text-green-400"
                              : showResult && picked   ? "bg-destructive/20 text-destructive"
                              : "bg-muted text-muted-foreground"
                            }`}>
                              {showResult && isCorrect ? <Check className="h-3.5 w-3.5" /> : String.fromCharCode(65 + i)}
                            </span>
                            {o}
                          </motion.button>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    <AnimatePresence>
                      {picks[qi] !== undefined && questions[qi]?.explanation && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                          className="mt-4 rounded-xl border-l-2 border-accent bg-accent/5 px-4 py-3 text-sm text-muted-foreground overflow-hidden">
                          <span className="font-semibold text-foreground">Why? </span>{questions[qi].explanation}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                      <button onClick={() => setPhase("workspace")} className="text-sm text-muted-foreground hover:text-foreground transition">
                        ← Back to notes
                      </button>
                      {picks[qi] !== undefined && (
                        <motion.button initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                          onClick={() => {
                            if (qi + 1 >= questions.length) { setTimeout(() => setPhase("done"), 200); }
                            else setQi((x) => x + 1);
                          }}
                          className="flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-accent-foreground">
                          {qi + 1 >= questions.length ? "See Results" : "Next"} <ArrowRight className="h-4 w-4" />
                        </motion.button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ──────────── DONE PHASE ──────────── */}
              {phase === "done" && (
                <motion.div key="done" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
                  <div className="rounded-2xl bg-card border p-8 text-center">
                    <ScoreRing pct={pct} />
                    <h2 className="mt-4 text-2xl font-extrabold">
                      {pct >= 70 ? "Great work! 🎯" : "Keep going! 📚"}
                    </h2>
                    <p className="mt-2 text-muted-foreground">
                      You got <span className="font-bold text-foreground">{score} of {questions.length}</span> correct
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {pct >= 70
                        ? "Solid session. Your progress has been saved."
                        : "Review the material and try again — consistency beats perfection."}
                    </p>

                    <div className="mt-6 grid grid-cols-3 gap-3">
                      <StatCard label="Correct"   value={score}                    accent />
                      <StatCard label="To review" value={questions.length - score} />
                      <StatCard label="Session"   value="+1"                       green />
                    </div>

                    <div className="mt-6 flex gap-3 justify-center">
                      <button onClick={() => { setPhase("workspace"); setActiveTool(null); }}
                        className="rounded-xl border bg-background px-5 py-3 text-sm font-semibold hover:shadow-sm transition flex items-center gap-2">
                        <RotateCcw className="h-4 w-4" /> Review Notes
                      </button>
                      <button
                        onClick={() => { setPicks([]); setQi(0); setPhase("quiz"); }}
                        className="rounded-xl bg-accent px-5 py-3 text-sm font-bold text-accent-foreground hover:opacity-95 transition">
                        Retry Quiz →
                      </button>
                    </div>
                    <div className="mt-3">
                      <Link to="/dashboard" className="text-xs text-muted-foreground hover:text-foreground transition">
                        ← Back to dashboard
                      </Link>
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <AppShell>
      <div className="flex h-full items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-accent mx-auto" />
          <p className="font-display text-lg font-semibold">Loading your lesson...</p>
          <p className="text-sm text-muted-foreground">Groq is preparing your questions</p>
        </div>
      </div>
    </AppShell>
  );
}

function UploadCard({ onClick, isUploading }: { onClick: () => void; isUploading: boolean }) {
  return (
    <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
      onClick={onClick} disabled={isUploading}
      className="group w-full rounded-2xl border-2 border-dashed border-border bg-card p-6 text-left transition hover:border-accent/50 hover:bg-accent/5 disabled:opacity-60">
      <div className="flex items-center gap-4">
        <div className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-background text-muted-foreground transition group-hover:text-accent">
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            {isUploading ? "Processing your document..." : "Upload additional notes"}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">PDF, TXT, or image up to 50 MB</p>
        </div>
      </div>
    </motion.button>
  );
}

function DocCard({ docData, onRemove }: { docData: DocData; onRemove: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent">
          <FileText className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{docData.name}</p>
          <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Analysed
            </span>
            <span>·</span>
            <span>{docData.size}</span>
          </p>
        </div>
      </div>
      <button onClick={onRemove}
        className="grid h-8 w-8 place-items-center rounded-xl border border-border bg-background text-muted-foreground transition hover:bg-muted hover:text-foreground">
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

// ── Voice Section ─────────────────────────────────────────────────────────────

function VoiceSection({
  isOnline, voicePhase, voiceError, voices, selectedVoice, onVoiceChange,
  isMuted, onStart, onEnd, onToggleMute, ttsPlaying, onToggleTts,
}: {
  isOnline: boolean;
  voicePhase: VoicePhase;
  voiceError: string | null;
  voices: { id: string; name: string }[];
  selectedVoice: string;
  onVoiceChange: (v: string) => void;
  isMuted: boolean;
  onStart: () => void;
  onEnd: () => void;
  onToggleMute: () => void;
  ttsPlaying: boolean;
  onToggleTts: () => void;
}) {
  return (
    <div className="rounded-2xl bg-muted/40 border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Volume2 className="h-4 w-4 text-accent" />
          <p className="text-sm font-bold">Voice Tutor</p>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
          isOnline ? "bg-green-500/10 text-green-600" : "bg-orange-500/10 text-orange-600"
        }`}>
          {isOnline ? "AI Voice" : "Offline TTS"}
        </span>
      </div>

      {isOnline ? (
        /* ── Aethex WebRTC ── */
        <div className="space-y-3">
          {voicePhase === "idle" || voicePhase === "error" ? (
            <>
              {voices.length > 0 && (
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground font-medium whitespace-nowrap">Voice:</label>
                  <select value={selectedVoice} onChange={(e) => onVoiceChange(e.target.value)}
                    className="flex-1 rounded-lg border border-border bg-background py-1.5 pl-2 pr-6 text-xs text-foreground focus:outline-none focus:border-accent/50 transition cursor-pointer">
                    {voices.map((v) => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>
              )}
              {voiceError && (
                <p className="text-xs text-destructive bg-destructive/5 rounded-lg px-3 py-2">{voiceError}</p>
              )}
              <button onClick={onStart}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-bold text-accent-foreground hover:opacity-90 transition">
                <Mic className="h-4 w-4" />
                Start AI Voice Session
              </button>
              <p className="text-[11px] text-muted-foreground text-center">
                Your AI tutor will read your notes and ask questions out loud
              </p>
            </>
          ) : voicePhase === "connecting" ? (
            <div className="flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Connecting to voice tutor...
            </div>
          ) : (
            /* Active */
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-green-600">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                Voice session active
              </div>
              <div className="flex gap-2">
                <button onClick={onToggleMute}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition ${
                    isMuted ? "border-accent bg-accent/10 text-accent" : "border-border bg-background hover:bg-muted"
                  }`}>
                  {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  {isMuted ? "Unmute" : "Mute"}
                </button>
                <button onClick={onEnd}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/10 transition">
                  <PhoneOff className="h-4 w-4" />
                  End Session
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ── Offline: Browser SpeechSynthesis ── */
        <div className="flex items-center gap-4">
          <button onClick={onToggleTts}
            className="h-12 w-12 rounded-xl bg-accent flex items-center justify-center text-accent-foreground shadow-md hover:opacity-90 transition shrink-0">
            {ttsPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold">
              {ttsPlaying ? "Reading your notes aloud..." : "Listen to your notes"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {ttsPlaying ? "Tap to pause" : "Works offline — great for commutes"}
            </p>
          </div>
          {ttsPlaying && (
            <div className="flex gap-0.5 items-end h-6 shrink-0">
              {[3, 5, 8, 5, 3, 6, 4].map((h, i) => (
                <motion.div key={i} animate={{ height: [h, h * 2.5, h] }}
                  transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                  className="w-1 rounded-full bg-accent" style={{ height: h }} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Tools Section ─────────────────────────────────────────────────────────────

function ToolsSection({
  activeTool, onToolSelect, summary, summaryLoading,
  flashcards, flashcardsLoading, questionsLoading, onStartQuiz,
}: {
  activeTool: ActiveTool;
  onToolSelect: (t: ActiveTool) => void;
  summary: string;
  summaryLoading: boolean;
  flashcards: Flashcard[];
  flashcardsLoading: boolean;
  questionsLoading: boolean;
  onStartQuiz: () => void;
}) {
  return (
    <div className="space-y-4">
      {/* Tool chips */}
      <div className="flex flex-wrap gap-2">
        <ToolChip icon={<BookOpen className="h-3.5 w-3.5" />}   label="Summary"    active={activeTool === "summary"}    onClick={() => onToolSelect("summary")} />
        <ToolChip icon={<ListChecks className="h-3.5 w-3.5" />} label="Quiz"       active={activeTool === "quiz"}       onClick={() => { onToolSelect("quiz"); onStartQuiz(); }} />
        <ToolChip icon={<Layers className="h-3.5 w-3.5" />}     label="Flashcards" active={activeTool === "flashcards"} onClick={() => onToolSelect("flashcards")} />
      </div>

      {/* Summary */}
      <AnimatePresence>
        {activeTool === "summary" && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="rounded-2xl border bg-card p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">AI Summary</p>
              {summaryLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Generating summary...
                </div>
              ) : (
                <p className="text-[15px] leading-relaxed text-foreground whitespace-pre-wrap">{summary}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quiz loading indicator */}
      <AnimatePresence>
        {activeTool === "quiz" && questionsLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="rounded-2xl border bg-card p-5 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Generating quiz questions...
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flashcards */}
      <AnimatePresence>
        {activeTool === "flashcards" && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            {flashcardsLoading ? (
              <div className="rounded-2xl border bg-card p-5 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Generating flashcards...
              </div>
            ) : flashcards.length > 0 ? (
              <FlashcardsPanel cards={flashcards} />
            ) : (
              <div className="rounded-2xl border bg-card p-5 text-sm text-muted-foreground">
                Could not generate flashcards. Please try again.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ToolChip({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <motion.button whileTap={{ scale: 0.96 }} onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
        active
          ? "border-accent bg-accent text-accent-foreground"
          : "border-border bg-card text-foreground hover:border-accent/50 hover:bg-accent/5"
      }`}>
      {icon}{label}
    </motion.button>
  );
}

// ── Flashcards Panel ──────────────────────────────────────────────────────────

function FlashcardsPanel({ cards }: { cards: Flashcard[] }) {
  const [flipped, setFlipped] = useState<Set<number>>(new Set());
  function toggle(i: number) {
    setFlipped((prev) => { const next = new Set(prev); if (next.has(i)) next.delete(i); else next.add(i); return next; });
  }
  return (
    <div className="rounded-2xl border bg-card p-5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
        Flashcards · {cards.length} cards
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {cards.map((c, i) => (
          <motion.button key={i} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
            onClick={() => toggle(i)}
            className="relative rounded-2xl border border-border bg-background p-4 text-left transition hover:border-accent/30 hover:shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Card {i + 1}</span>
              <span className="text-[10px] text-muted-foreground">{flipped.has(i) ? "Definition" : "Term"}</span>
            </div>
            <AnimatePresence mode="wait">
              {flipped.has(i) ? (
                <motion.p key="def" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-sm leading-relaxed text-muted-foreground">{c.definition}</motion.p>
              ) : (
                <motion.p key="term" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-lg font-extrabold leading-tight tracking-tight text-foreground">{c.term}</motion.p>
              )}
            </AnimatePresence>
            {!flipped.has(i) && (
              <p className="mt-3 border-t border-border pt-3 text-[11px] text-muted-foreground">Tap to reveal</p>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// ── Chat Section ──────────────────────────────────────────────────────────────

function ChatSection({
  messages, isLoading, input, onInputChange, onSend, hasDoc,
}: {
  messages: ChatMessage[];
  isLoading: boolean;
  input: string;
  onInputChange: (v: string) => void;
  onSend: (t: string) => void;
  hasDoc: boolean;
}) {
  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(input); }
  }

  return (
    <div className="space-y-4">
      {messages.length > 0 && (
        <div className="space-y-4">
          {messages.map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
              {m.role === "assistant" ? (
                <>
                  <div className="grid h-7 w-7 shrink-0 place-items-center rounded-xl border border-border bg-card text-muted-foreground">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-[15px] leading-relaxed text-foreground whitespace-pre-wrap">{m.content}</p>
                  </div>
                </>
              ) : (
                <div className="max-w-[80%] rounded-2xl bg-accent px-4 py-3">
                  <p className="text-[15px] leading-relaxed text-accent-foreground">{m.content}</p>
                </div>
              )}
            </motion.div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="grid h-7 w-7 shrink-0 place-items-center rounded-xl border border-border bg-card text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <div className="pt-2 flex items-center gap-1.5">
                {[0, 150, 300].map((delay) => (
                  <span key={delay} style={{ animationDelay: `${delay}ms` }}
                    className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Composer */}
      <div className="rounded-2xl border border-border bg-card p-2 focus-within:border-accent/40 transition">
        <div className="flex items-end gap-2">
          <button onClick={() => {}} className="grid h-9 w-9 place-items-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition">
            <Paperclip className="h-4 w-4" />
          </button>
          <textarea rows={1} value={input} onChange={(e) => onInputChange(e.target.value)} onKeyDown={handleKey}
            placeholder={hasDoc ? "Ask a question about your notes..." : "Ask anything academic..."}
            className="max-h-40 flex-1 resize-none bg-transparent px-1 py-2 text-[15px] leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none" />
          <button onClick={() => onSend(input)} disabled={isLoading || !input.trim()}
            className="grid h-9 w-9 place-items-center rounded-xl bg-accent text-accent-foreground hover:opacity-90 disabled:opacity-40 transition">
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
        <div className="px-1 pt-1">
          <p className="text-[11px] text-muted-foreground">
            StudyPal only answers academic questions. Responses may need verification.
          </p>
        </div>
      </div>

      {/* Quick prompts */}
      {messages.length === 0 && (
        <div className="flex flex-wrap gap-2">
          {["Summarise my notes", "Give me 3 key points", "Explain the main concept", "What might come in the exam?"].map((s) => (
            <button key={s} onClick={() => onSend(s)}
              className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:border-accent/40 hover:text-foreground transition">
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Score Ring ────────────────────────────────────────────────────────────────

function ScoreRing({ pct }: { pct: number }) {
  const r = 50;
  const circ = 2 * Math.PI * r;
  const color = pct >= 70 ? "oklch(0.65 0.16 145)" : "oklch(0.72 0.17 30)";
  return (
    <svg width="140" height="140" viewBox="0 0 120 120" className="mx-auto">
      <circle cx="60" cy="60" r={r} fill="none" stroke="currentColor" className="text-muted" strokeWidth="10" />
      <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)}
        style={{ transform: "rotate(-90deg)", transformOrigin: "center", transition: "stroke-dashoffset 1s ease" }} />
      <text x="60" y="55" textAnchor="middle" fontSize="24" fontWeight="800" fill={color}>{pct}%</text>
      <text x="60" y="72" textAnchor="middle" fontSize="11" fill="oklch(0.55 0.02 250)">score</text>
    </svg>
  );
}

function StatCard({ label, value, accent, green }: { label: string; value: number | string; accent?: boolean; green?: boolean }) {
  return (
    <div className="rounded-xl bg-muted/50 p-3">
      <p className={`text-2xl font-extrabold ${accent ? "text-accent" : green ? "text-green-600" : ""}`}>{value}</p>
      <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">{label}</p>
    </div>
  );
}

// ── Prevent "ChevronRight" unused import warning ──
void ChevronRight;
