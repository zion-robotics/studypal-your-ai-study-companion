import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect, type MutableRefObject } from "react";
import {
  ArrowRight,
  ArrowUp,
  BookOpen,
  Check,
  FileText,
  Layers,
  ListChecks,
  Paperclip,
  Sparkles,
  Upload,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { AppShell } from "@/components/sp/AppShell";

export const Route = createFileRoute("/ai-tools")({
  head: () => ({
    meta: [
      { title: "AI Tools | StudyPal" },
      { name: "description", content: "Upload a document and ask the AI to summarize, quiz, or revise it." },
    ],
  }),
  component: AiToolsPage,
});

type Tool = null | "summary" | "quiz" | "flashcards";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type QuizQuestion = {
  question: string;
  options: { label: string; text: string; correct: boolean }[];
  explanation: string;
};

type Flashcard = {
  term: string;
  definition: string;
};

type DocData = {
  name: string;
  size: string;
  extractedText: string;
  isImage: boolean;
  imageBase64?: string;
  imageMimeType?: string;
};

const API_KEY = "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";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const TEXT_MODEL = "openai/gpt-4o-mini";
const VISION_MODEL = "openai/gpt-4o";

const TTS_PROXY = "http://localhost:3001";

const AETHEX_VOICES = [
  { id: "default",                                label: "Default Voice" },
  { id: "8466fb57-9f6b-53ad-ba5a-9729617f761c",  label: "Kemi (NG Female)" },
  { id: "9ef397e0-8cc3-58b3-af79-0234f95a3801",  label: "Mary (NG Female)" },
  { id: "96b20f06-536a-55ef-82c3-4882b6547858",  label: "Tolu (NG Female)" },
  { id: "cb4ea7ea-027b-532a-b7de-356c6887a5f3",  label: "Deborah (NG Female)" },
  { id: "93c0d2e1-61b2-51d5-8d92-a8adfef1a4ea",  label: "Segun (NG Male)" },
  { id: "6cdade1e-41d3-52cd-bf99-7e6822758b10",  label: "Sunday (NG Male)" },
  { id: "5c34046a-ac9b-57d5-8c70-5a61e694be3f",  label: "Femi (NG Male)" },
  { id: "fdf12da6-fc5c-56d3-bdc5-9f3da0b65453",  label: "Chinedu (NG Male)" },
  { id: "37449a6f-a93c-583d-80da-d005cb0b542b",  label: "Fatima (NG Female)" },
  { id: "83210cdc-1274-5d8b-8494-d07338ba2348",  label: "Kemi Pidgin" },
  { id: "7096175e-5cb2-5685-975e-7e98941ed6bb",  label: "Segun Pidgin" },
  { id: "0d109a91-8d87-5d06-93f8-5f421bcaa76a",  label: "Musa Pidgin" },
];

type TtsState = "idle" | "loading" | "playing" | "error";

async function aethexSpeak(
  text: string,
  voiceId: string,
  onStateChange: (s: TtsState) => void,
  audioRef: MutableRefObject<HTMLAudioElement | null>
): Promise<void> {
  if (audioRef.current) {
    audioRef.current.pause();
    audioRef.current = null;
  }
  onStateChange("loading");
  try {
    const res = await fetch(`${TTS_PROXY}/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text.slice(0, 3000), voice_id: voiceId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error || `Proxy error (${res.status})`);
    }
    const blob = await res.blob();
    const objUrl = URL.createObjectURL(blob);
    const audio = new Audio(objUrl);
    audioRef.current = audio;
    onStateChange("playing");
    await audio.play();
    audio.onended = () => { URL.revokeObjectURL(objUrl); audioRef.current = null; onStateChange("idle"); };
    audio.onerror = () => { URL.revokeObjectURL(objUrl); audioRef.current = null; onStateChange("error"); };
  } catch (err) {
    console.error("[TTS]", err);
    audioRef.current = null;
    onStateChange("error");
  }
}

const SYSTEM_PROMPT = `You are StudyPal AI, a knowledgeable academic assistant. You ONLY answer questions strictly related to:
- Books, literature, and reading
- Academic subjects (mathematics, science, history, geography, languages, arts, etc.)
- Education, studying, learning strategies, and school
- Knowledge, facts, and intellectual topics
- Life skills, personal development, and career guidance

If a user asks about anything outside these topics, politely decline and redirect them to ask an academic question instead.
Keep responses clear, educational, and encouraging. Format your answers in plain text without markdown symbols like **, ##, or bullet dashes.`;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

async function extractPdfText(file: File): Promise<string> {
  if (!(window as any).pdfjsLib) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load PDF.js"));
      document.head.appendChild(script);
    });
    (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  }
  const pdfjsLib = (window as any).pdfjsLib;
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map((item: any) => item.str).join(" ");
    fullText += `[Page ${i}]\n${pageText}\n\n`;
  }
  return fullText.trim();
}

async function extractTxtText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

async function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => { const result = reader.result as string; resolve(result.split(",")[1]); };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function callOpenRouter(messages: any[], systemPrompt?: string, useVision = false): Promise<string> {
  const model = useVision ? VISION_MODEL : TEXT_MODEL;
  const body: any = {
    model,
    messages: systemPrompt ? [{ role: "system", content: systemPrompt }, ...messages] : messages,
  };
  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API error ${res.status}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "No response received.";
}

function buildDocMessage(docData: DocData, prompt: string): any {
  if (docData.isImage && docData.imageBase64 && docData.imageMimeType) {
    return {
      role: "user",
      content: [
        { type: "image_url", image_url: { url: `data:${docData.imageMimeType};base64,${docData.imageBase64}` } },
        { type: "text", text: prompt },
      ],
    };
  }
  return {
    role: "user",
    content: `Here is the content of the document "${docData.name}":\n\n${docData.extractedText}\n\n---\n\n${prompt}`,
  };
}

function AiToolsPage() {
  const [docData, setDocData] = useState<DocData | null>(null);
  const [tool, setTool] = useState<Tool>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [summary, setSummary] = useState<string>("");
  const [quizData, setQuizData] = useState<QuizQuestion[]>([]);
  const [flashcardData, setFlashcardData] = useState<Flashcard[]>([]);
  const [toolLoading, setToolLoading] = useState(false);
  const [introMessage, setIntroMessage] = useState<string>("");
  const [ttsVoice, setTtsVoice] = useState("default");
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading, toolLoading]);

  async function handleFileUpload(file: File) {
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);
    const isPdf = ext === "pdf";
    const isTxt = ext === "txt";
    const isDocx = ext === "docx";
    const isPptx = ext === "pptx";
    if (!isImage && !isPdf && !isTxt && !isDocx && !isPptx) {
      alert("Please upload a PDF, DOCX, PPTX, TXT, or image file.");
      return;
    }
    setIsUploading(true);
    setTool(null); setSummary(""); setQuizData([]); setFlashcardData([]);
    setIntroMessage(""); setMessages([]); setDocData(null);
    try {
      let extractedText = "";
      let imageBase64: string | undefined;
      let imageMimeType: string | undefined;
      if (isPdf) {
        extractedText = await extractPdfText(file);
        if (!extractedText || extractedText.length < 20) throw new Error("Could not extract text from this PDF.");
      } else if (isTxt) {
        extractedText = await extractTxtText(file);
      } else if (isDocx || isPptx) {
        extractedText = await extractTxtText(file).catch(() => "");
        if (!extractedText || extractedText.length < 50)
          throw new Error(`For best results with ${ext.toUpperCase()} files, please save as PDF or TXT first.`);
      } else if (isImage) {
        imageBase64 = await imageToBase64(file);
        imageMimeType = file.type || `image/${ext}`;
        extractedText = "";
      }
      const doc: DocData = { name: file.name, size: formatFileSize(file.size), extractedText, isImage, imageBase64, imageMimeType };
      setDocData(doc);
      const introMsg = buildDocMessage(doc, `In 2-3 sentences, tell the student what this document is about and what you can help them with. Be conversational and encouraging. No markdown.`);
      const intro = await callOpenRouter([introMsg], undefined, isImage);
      setIntroMessage(intro);
    } catch (err: any) {
      alert("Failed to process document: " + (err.message || "Unknown error"));
      setDocData(null);
    } finally {
      setIsUploading(false);
    }
  }

  async function handleToolSelect(newTool: Tool) {
    if (newTool === tool) { setTool(null); return; }
    setTool(newTool);
    if (!docData) return;
    if (newTool === "summary" && !summary) {
      setToolLoading(true);
      try {
        const msg = buildDocMessage(docData, `Provide a long, detailed summary of this document. Write in plain flowing paragraphs. Cover all key concepts clearly. No markdown.`);
        setSummary(await callOpenRouter([msg], undefined, docData.isImage));
      } catch (err: any) {
        setSummary("Failed to generate summary: " + (err.message || "Unknown error"));
      } finally { setToolLoading(false); }
    }
    if (newTool === "quiz" && quizData.length === 0) {
      setToolLoading(true);
      try {
        const msg = buildDocMessage(docData, `Generate exactly 8 multiple-choice quiz questions. Return ONLY a valid JSON array, no markdown, no backticks. Shape: {"question":"...","options":[{"label":"A","text":"...","correct":false}],"explanation":"..."}. Exactly one correct per question.`);
        const result = await callOpenRouter([msg], undefined, docData.isImage);
        setQuizData(JSON.parse(result.replace(/```json|```/g, "").trim()));
      } catch { setQuizData([]); } finally { setToolLoading(false); }
    }
    if (newTool === "flashcards" && flashcardData.length === 0) {
      setToolLoading(true);
      try {
        const msg = buildDocMessage(docData, `Generate exactly 12 flashcards. Return ONLY a valid JSON array, no markdown, no backticks. Shape: {"term":"...","definition":"..."}. Keep definitions 1-2 sentences.`);
        const result = await callOpenRouter([msg], undefined, docData.isImage);
        setFlashcardData(JSON.parse(result.replace(/```json|```/g, "").trim()));
      } catch { setFlashcardData([]); } finally { setToolLoading(false); }
    }
  }

  async function sendMessage(text: string) {
    if (!text.trim() || isLoading) return;
    const userMessage: Message = { role: "user", content: text };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);
    try {
      let apiMessages: any[];
      if (docData) {
        const docContext = docData.isImage
          ? `The student has uploaded an image called "${docData.name}".`
          : `The student has uploaded "${docData.name}". Content:\n\n${docData.extractedText}\n\n---`;
        const historyText = messages.map((m) => `${m.role === "user" ? "Student" : "Assistant"}: ${m.content}`).join("\n");
        apiMessages = [{
          role: "user",
          content: docData.isImage && docData.imageBase64
            ? [
                { type: "image_url", image_url: { url: `data:${docData.imageMimeType};base64,${docData.imageBase64}` } },
                { type: "text", text: `${historyText ? historyText + "\n\n" : ""}Student: ${text}` },
              ]
            : `${docContext}\n\n${historyText ? historyText + "\n\n" : ""}Student: ${text}`,
        }];
      } else {
        apiMessages = updatedMessages.map((m) => ({ role: m.role, content: m.content }));
      }
      const reply = await callOpenRouter(apiMessages, SYSTEM_PROMPT, docData?.isImage ?? false);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Something went wrong. Please check your connection and try again." }]);
    } finally { setIsLoading(false); }
  }

  function handleRemoveDoc() {
    setDocData(null); setTool(null); setSummary(""); setQuizData([]);
    setFlashcardData([]); setIntroMessage(""); setMessages([]);
  }

  return (
    <AppShell>
      <div className="flex h-full flex-col overflow-hidden bg-background text-foreground">
        <input
          ref={fileInputRef} type="file" className="hidden"
          accept=".pdf,.txt,.jpg,.jpeg,.png,.gif,.webp"
          onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileUpload(file); e.target.value = ""; }}
        />
        <div className="flex-1 overflow-y-auto" ref={scrollRef}>
          <div className="mx-auto w-full max-w-3xl px-5 pb-36 pt-10 sm:pt-16">
            {!docData && messages.length === 0 && !isUploading ? (
              <EmptyState onUpload={() => fileInputRef.current?.click()} onSuggest={sendMessage} />
            ) : isUploading ? (
              <UploadingState />
            ) : (
              <>
                {docData && (
                  <DocWorkspace
                    docData={docData} tool={tool} setTool={handleToolSelect} onRemove={handleRemoveDoc}
                    summary={summary} quizData={quizData} flashcardData={flashcardData}
                    toolLoading={toolLoading} introMessage={introMessage}
                  />
                )}
                <ChatThread messages={messages} isLoading={isLoading} ttsVoice={ttsVoice} ttsAudioRef={ttsAudioRef} />
              </>
            )}
          </div>
        </div>
        <Composer hasDoc={!!docData} onSend={sendMessage} isLoading={isLoading}
          onAttach={() => fileInputRef.current?.click()} ttsVoice={ttsVoice} onVoiceChange={setTtsVoice} />
      </div>
    </AppShell>
  );
}

/* ---- UPLOADING STATE ---- */
function UploadingState() {
  return (
    <div className="pt-6 sm:pt-12">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card">
          <Sparkles className="h-4 w-4 animate-pulse text-muted-foreground" />
        </div>
        <div>
          <p className="text-[15px] font-semibold text-foreground">Reading your document...</p>
          <p className="text-sm text-muted-foreground">This may take a moment</p>
        </div>
      </div>
    </div>
  );
}

/* ---- SPEAK BUTTON ---- */
function SpeakButton({ text, ttsVoice, ttsAudioRef }: { text: string; ttsVoice: string; ttsAudioRef: MutableRefObject<HTMLAudioElement | null> }) {
  const [state, setState] = useState<TtsState>("idle");
  const lastClickRef = useRef(0);

  function handleClick() {
    if (state === "playing") {
      if (ttsAudioRef.current) { ttsAudioRef.current.pause(); ttsAudioRef.current = null; }
      setState("idle"); return;
    }
    const now = Date.now();
    if (now - lastClickRef.current < 2000) return;
    lastClickRef.current = now;
    aethexSpeak(text, ttsVoice, setState, ttsAudioRef);
  }

  return (
    <button onClick={handleClick} disabled={state === "loading"} title={state === "playing" ? "Stop" : "Listen"}
      className={`mt-2 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
        state === "playing" ? "border-foreground bg-foreground text-background"
        : state === "loading" ? "border-border text-muted-foreground opacity-60 cursor-not-allowed"
        : state === "error" ? "border-destructive text-destructive hover:bg-destructive/5"
        : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
      }`}>
      {state === "playing" ? (<><VolumeX className="h-3 w-3" />Stop</>)
        : state === "loading" ? (<><span className="flex gap-0.5"><span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:0ms]" /><span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:150ms]" /><span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:300ms]" /></span>Loading…</>)
        : state === "error" ? (<><Volume2 className="h-3 w-3" />Retry</>)
        : (<><Volume2 className="h-3 w-3" />Listen</>)}
    </button>
  );
}

/* ---- CHAT THREAD ---- */
function ChatThread({ messages, isLoading, ttsVoice, ttsAudioRef }: { messages: Message[]; isLoading: boolean; ttsVoice: string; ttsAudioRef: MutableRefObject<HTMLAudioElement | null> }) {
  return (
    <div className="space-y-6 mt-6">
      {messages.map((m, i) => (
        <div key={i} className="flex gap-3">
          {m.role === "assistant" ? (
            <>
              <div className="grid h-7 w-7 shrink-0 place-items-center rounded-xl border border-border bg-card text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-[15px] leading-relaxed text-foreground whitespace-pre-wrap">{m.content}</p>
                <SpeakButton text={m.content} ttsVoice={ttsVoice} ttsAudioRef={ttsAudioRef} />
              </div>
            </>
          ) : (
            <div className="ml-auto max-w-[80%] rounded-2xl bg-coral px-4 py-3">
              <p className="text-[15px] leading-relaxed text-white">{m.content}</p>
            </div>
          )}
        </div>
      ))}
      {isLoading && (
        <div className="flex gap-3">
          <div className="grid h-7 w-7 shrink-0 place-items-center rounded-xl border border-border bg-card text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0 flex-1 pt-2">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0ms]" />
              <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:150ms]" />
              <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---- EMPTY STATE ---- */
function EmptyState({ onUpload, onSuggest }: { onUpload: () => void; onSuggest: (text: string) => void }) {
  return (
    <div className="pt-6 sm:pt-12">
      <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl">
        What are we studying today?
      </h1>
      <p className="mt-3 text-[15px] text-muted-foreground">
        Upload a document, paste notes, or ask a question. I will take it from there.
      </p>

      <button onClick={onUpload}
        className="group mt-8 block w-full rounded-3xl border-2 border-dashed border-border bg-card p-8 text-left transition hover:border-coral/50 hover:bg-sage-light/30">
        <div className="flex items-start gap-4">
          <div className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-background text-muted-foreground transition group-hover:text-coral">
            <Upload className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[15px] font-semibold text-foreground">Drop a file, or click to upload</p>
            <p className="mt-1 text-sm text-muted-foreground">PDF, TXT or image up to 50 MB</p>
          </div>
        </div>
      </button>

      <div className="mt-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Try asking</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {["Summarize my lecture notes", "Make 10 quiz questions", "Explain like I am new to this", "Build flashcards for key terms"].map((s) => (
            <button key={s} onClick={() => onSuggest(s)}
              className="rounded-full border border-border bg-card px-3.5 py-1.5 text-xs text-muted-foreground transition hover:border-coral/40 hover:bg-sage-light/40 hover:text-foreground">
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---- DOC WORKSPACE ---- */
function DocWorkspace({ docData, tool, setTool, onRemove, summary, quizData, flashcardData, toolLoading, introMessage }: {
  docData: DocData; tool: Tool; setTool: (t: Tool) => void; onRemove: () => void;
  summary: string; quizData: QuizQuestion[]; flashcardData: Flashcard[]; toolLoading: boolean; introMessage: string;
}) {
  return (
    <div className="space-y-6">
      {/* Doc card */}
      <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sage-light text-foreground">
            <FileText className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{docData.name}</p>
            <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-leaf" /> Analyzed
              </span>
              <span>&middot;</span>
              <span>{docData.size}</span>
            </p>
          </div>
        </div>
        <button onClick={onRemove}
          className="grid h-8 w-8 place-items-center rounded-xl border border-border bg-background text-muted-foreground transition hover:bg-muted hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Intro + tools */}
      <div className="flex gap-3">
        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-xl border border-border bg-card text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-[15px] leading-relaxed text-foreground whitespace-pre-wrap">
            {introMessage || "I have read through your document. Want me to summarize it, quiz you, or pull out flashcards?"}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <ToolChip icon={<BookOpen className="h-3.5 w-3.5" />} label="Summary" active={tool === "summary"} onClick={() => setTool("summary")} />
            <ToolChip icon={<ListChecks className="h-3.5 w-3.5" />} label="Quiz" active={tool === "quiz"} onClick={() => setTool("quiz")} />
            <ToolChip icon={<Layers className="h-3.5 w-3.5" />} label="Flashcards" active={tool === "flashcards"} onClick={() => setTool("flashcards")} />
          </div>

          {toolLoading && (
            <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0ms]" />
              <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:150ms]" />
              <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:300ms]" />
              <span className="ml-1">Generating...</span>
            </div>
          )}

          {!toolLoading && tool === "summary" && summary && <SummaryPanel summary={summary} />}
          {!toolLoading && tool === "quiz" && quizData.length > 0 && <QuizPanel questions={quizData} />}
          {!toolLoading && tool === "quiz" && quizData.length === 0 && tool && (
            <p className="mt-5 text-sm text-muted-foreground">Could not generate quiz. Please try again.</p>
          )}
          {!toolLoading && tool === "flashcards" && flashcardData.length > 0 && <FlashcardsPanel cards={flashcardData} />}
          {!toolLoading && tool === "flashcards" && flashcardData.length === 0 && tool && (
            <p className="mt-5 text-sm text-muted-foreground">Could not generate flashcards. Please try again.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ToolChip({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
        active ? "border-coral bg-coral text-white" : "border-border bg-card text-foreground hover:border-coral/40 hover:bg-sage-light/40"
      }`}>
      {icon}{label}
    </button>
  );
}

/* ---- PANEL WRAPPER ---- */
function Panel({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="mt-5 rounded-2xl border border-border bg-card p-5">
      <header className="mb-4">
        <h2 className="text-[13px] font-semibold tracking-tight text-foreground">{title}</h2>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </header>
      {children}
    </section>
  );
}

/* ---- SUMMARY PANEL ---- */
function SummaryPanel({ summary }: { summary: string }) {
  return (
    <Panel title="Summary" hint="Generated from your document">
      <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground">{summary}</p>
    </Panel>
  );
}

/* ---- QUIZ PANEL ---- */
function QuizPanel({ questions }: { questions: QuizQuestion[] }) {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const q = questions[current];

  function handleSelect(label: string, correct: boolean) {
    if (selected) return;
    setSelected(label);
    if (correct) setScore((s) => s + 1);
  }

  function handleNext() {
    if (current + 1 >= questions.length) { setDone(true); }
    else { setCurrent((c) => c + 1); setSelected(null); }
  }

  if (done) {
    return (
      <Panel title="Practice quiz" hint={`${questions.length} questions`}>
        <div className="text-center py-4">
          <p className="text-2xl font-bold text-foreground">{score} / {questions.length}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {score === questions.length ? "Perfect score!" : score >= questions.length / 2 ? "Good effort!" : "Keep studying!"}
          </p>
          <button onClick={() => { setCurrent(0); setSelected(null); setScore(0); setDone(false); }}
            className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-xl bg-coral px-4 text-sm font-semibold text-white">
            Retake quiz
          </button>
        </div>
      </Panel>
    );
  }

  return (
    <Panel title="Practice quiz" hint={`Question ${current + 1} of ${questions.length}`}>
      <p className="text-[15px] font-semibold text-foreground">{q.question}</p>
      <div className="mt-4 space-y-2">
        {q.options.map((o) => {
          const isSelected = selected === o.label;
          const revealed = !!selected;
          return (
            <button key={o.label} onClick={() => handleSelect(o.label, o.correct)}
              className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                revealed
                  ? o.correct ? "border-leaf bg-leaf/10" : isSelected ? "border-destructive bg-destructive/5" : "border-border bg-background opacity-60"
                  : "border-border bg-background hover:border-coral/40 hover:bg-sage-light/30"
              }`}>
              <span className={`grid h-6 w-6 place-items-center rounded border text-[11px] font-semibold ${
                revealed && o.correct ? "border-leaf bg-leaf text-white"
                : revealed && isSelected && !o.correct ? "border-destructive text-destructive"
                : "border-border text-muted-foreground"
              }`}>
                {revealed && o.correct ? <Check className="h-3 w-3" /> : o.label}
              </span>
              <span className="text-foreground">{o.text}</span>
            </button>
          );
        })}
      </div>
      {selected && q.explanation && (
        <p className="mt-3 rounded-xl border-l-2 border-coral bg-cream px-4 py-3 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Explanation: </span>{q.explanation}
        </p>
      )}
      <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
        <button onClick={handleNext} className="text-sm text-muted-foreground transition hover:text-foreground">Skip</button>
        <button onClick={handleNext} disabled={!selected}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-coral px-4 text-sm font-semibold text-white disabled:opacity-40">
          {current + 1 >= questions.length ? "Finish" : "Next"} <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </Panel>
  );
}

/* ---- FLASHCARDS PANEL ---- */
function FlashcardsPanel({ cards }: { cards: Flashcard[] }) {
  const [flipped, setFlipped] = useState<Set<number>>(new Set());
  function toggleFlip(i: number) {
    setFlipped((prev) => { const next = new Set(prev); if (next.has(i)) next.delete(i); else next.add(i); return next; });
  }
  return (
    <Panel title="Flashcards" hint={`${cards.length} cards`}>
      <div className="grid gap-3 sm:grid-cols-2">
        {cards.map((c, i) => (
          <button key={i} onClick={() => toggleFlip(i)}
            className="relative rounded-2xl border border-border bg-background p-4 text-left transition hover:-translate-y-0.5 hover:border-coral/30 hover:shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Card {i + 1}</span>
              <span className="text-[10px] text-muted-foreground">{flipped.has(i) ? "Back" : "Front"}</span>
            </div>
            {flipped.has(i) ? (
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{c.definition}</p>
            ) : (
              <p className="mt-4 font-display text-2xl font-bold leading-tight tracking-tight text-foreground">{c.term}</p>
            )}
            {!flipped.has(i) && (
              <p className="mt-4 border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">Tap to reveal definition</p>
            )}
          </button>
        ))}
      </div>
    </Panel>
  );
}

/* ---- COMPOSER ---- */
function Composer({ hasDoc, onSend, isLoading, onAttach, ttsVoice, onVoiceChange }: {
  hasDoc: boolean; onSend: (text: string) => void; isLoading: boolean;
  onAttach: () => void; ttsVoice: string; onVoiceChange: (v: string) => void;
}) {
  const [value, setValue] = useState("");

  function handleSend() {
    if (!value.trim() || isLoading) return;
    onSend(value.trim()); setValue("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  return (
    <div className="border-t border-border bg-background/90 backdrop-blur shrink-0">
      <div className="mx-auto w-full max-w-3xl px-5 py-4">
        <div className="flex items-end gap-2 rounded-2xl border border-border bg-card p-2 focus-within:border-coral/40">
          <button type="button" onClick={onAttach}
            className="grid h-9 w-9 place-items-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground">
            <Paperclip className="h-4 w-4" />
          </button>
          <textarea rows={1} value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={handleKeyDown}
            placeholder={hasDoc ? "Ask a follow-up, or request a quiz..." : "Ask anything, or attach a document"}
            className="max-h-40 flex-1 resize-none bg-transparent px-1 py-2 text-[15px] leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none" />
          <button type="button" onClick={handleSend} disabled={isLoading || !value.trim()}
            className="grid h-9 w-9 place-items-center rounded-xl bg-coral text-white transition hover:opacity-90 disabled:opacity-40">
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between px-1">
          <p className="text-[11px] text-muted-foreground">StudyPal reads your documents privately. Responses may need verification.</p>
          <div className="flex items-center gap-1.5 shrink-0">
            <Volume2 className="h-3 w-3 text-muted-foreground" />
            <select value={ttsVoice} onChange={(e) => onVoiceChange(e.target.value)}
              className="rounded-lg border border-border bg-card py-0.5 pl-2 pr-6 text-[11px] text-muted-foreground focus:outline-none focus:border-coral/40 hover:border-coral/30 transition cursor-pointer">
              {AETHEX_VOICES.map((v) => (
                <option key={v.id} value={v.id}>{v.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
