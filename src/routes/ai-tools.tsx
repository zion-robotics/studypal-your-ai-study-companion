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
import { AppShell } from "./-AppShell";

export const Route = createFileRoute("/ai-tools")({
  head: () => ({
    meta: [
      { title: "AI Tools | StudyAI" },
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

const AETHEX_KEY = "ae_live_50ce2a69ea030b5549aa087c7a8ce251";
// All TTS requests go through tts-proxy.js running on :3001.
// The proxy does submit → poll → S3 download entirely server-side,
// then streams raw audio bytes back — no CORS issues anywhere.
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
  // Stop any currently playing audio first
  if (audioRef.current) {
    audioRef.current.pause();
    audioRef.current = null;
  }

  onStateChange("loading");

  try {
    // Single request to proxy — it handles submit, poll, and S3 download
    // server-side, then returns raw audio bytes. No CORS anywhere.
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

    audio.onended = () => {
      URL.revokeObjectURL(objUrl);
      audioRef.current = null;
      onStateChange("idle");
    };
    audio.onerror = () => {
      URL.revokeObjectURL(objUrl);
      audioRef.current = null;
      onStateChange("error");
    };
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

If a user asks about anything outside these topics (e.g. entertainment gossip, sports scores, coding unrelated to academics, etc.), politely decline and redirect them to ask an academic or knowledge-based question instead.

Keep responses clear, educational, and encouraging. Format your answers in plain text without markdown symbols like **, ##, or bullet dashes. Use natural prose or numbered lists where needed.`;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

// Load PDF.js from CDN and extract text
async function extractPdfText(file: File): Promise<string> {
  // Dynamically load PDF.js if not already loaded
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

// Extract text from plain text file
async function extractTxtText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

// Convert image to base64
async function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Call OpenRouter API — supports both text and vision messages
async function callOpenRouter(
  messages: any[],
  systemPrompt?: string,
  useVision = false
): Promise<string> {
  const model = useVision ? VISION_MODEL : TEXT_MODEL;
  const body: any = {
    model,
    messages: systemPrompt
      ? [{ role: "system", content: systemPrompt }, ...messages]
      : messages,
  };

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API error ${res.status}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "No response received.";
}

// Build a user message that includes the document context
function buildDocMessage(docData: DocData, prompt: string): any {
  if (docData.isImage && docData.imageBase64 && docData.imageMimeType) {
    // Vision message with image
    return {
      role: "user",
      content: [
        {
          type: "image_url",
          image_url: {
            url: `data:${docData.imageMimeType};base64,${docData.imageBase64}`,
          },
        },
        { type: "text", text: prompt },
      ],
    };
  }

  // Text-based document — inject extracted text into the prompt
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
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
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
    setTool(null);
    setSummary("");
    setQuizData([]);
    setFlashcardData([]);
    setIntroMessage("");
    setMessages([]);
    setDocData(null);

    try {
      let extractedText = "";
      let imageBase64: string | undefined;
      let imageMimeType: string | undefined;

      if (isPdf) {
        extractedText = await extractPdfText(file);
        if (!extractedText || extractedText.length < 20) {
          throw new Error("Could not extract text from this PDF. It may be a scanned image-only PDF.");
        }
      } else if (isTxt) {
        extractedText = await extractTxtText(file);
      } else if (isDocx || isPptx) {
        // For DOCX/PPTX: read as text (basic extraction) — prompt user to convert to PDF/TXT for best results
        // We attempt a raw text read; it will contain some garbled chars but key words usually survive
        extractedText = await extractTxtText(file).catch(() => "");
        if (!extractedText || extractedText.length < 50) {
          throw new Error(
            `For best results with ${ext.toUpperCase()} files, please save/export as PDF or TXT first, then upload that.`
          );
        }
      } else if (isImage) {
        imageBase64 = await imageToBase64(file);
        imageMimeType = file.type || `image/${ext}`;
        extractedText = ""; // will use vision
      }

      const doc: DocData = {
        name: file.name,
        size: formatFileSize(file.size),
        extractedText,
        isImage,
        imageBase64,
        imageMimeType,
      };

      setDocData(doc);

      // Generate intro message from the document
      const introPrompt = `You have just received this document. In 2-3 sentences, tell the student what the document is about and what you can help them with (summarize it, quiz them, or create flashcards). Be conversational and encouraging. Do not use markdown.`;

      const introMsg = buildDocMessage(doc, introPrompt);
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
        const prompt = `Please provide a long, detailed summary of this document. Explain all key concepts in simple, clear language that a student can easily understand. Write in plain flowing paragraphs. Cover the main topics, key ideas, important facts or arguments, and any conclusions. Do not use markdown symbols like ** or ##.`;
        const msg = buildDocMessage(docData, prompt);
        const result = await callOpenRouter([msg], undefined, docData.isImage);
        setSummary(result);
      } catch (err: any) {
        setSummary("Failed to generate summary: " + (err.message || "Unknown error"));
      } finally {
        setToolLoading(false);
      }
    }

    if (newTool === "quiz" && quizData.length === 0) {
      setToolLoading(true);
      try {
        const prompt = `Based on this document, generate exactly 8 multiple-choice quiz questions. Return ONLY a valid JSON array, no markdown, no explanation, no backticks. Each item must have this exact shape: {"question":"...","options":[{"label":"A","text":"...","correct":false},{"label":"B","text":"...","correct":true},{"label":"C","text":"...","correct":false},{"label":"D","text":"...","correct":false}],"explanation":"..."}. Exactly one option per question must have "correct":true.`;
        const msg = buildDocMessage(docData, prompt);
        const result = await callOpenRouter([msg], undefined, docData.isImage);
        const clean = result.replace(/```json|```/g, "").trim();
        const parsed: QuizQuestion[] = JSON.parse(clean);
        setQuizData(parsed);
      } catch {
        setQuizData([]);
      } finally {
        setToolLoading(false);
      }
    }

    if (newTool === "flashcards" && flashcardData.length === 0) {
      setToolLoading(true);
      try {
        const prompt = `Based on this document, generate exactly 12 flashcards for the most important terms, concepts, and ideas. Return ONLY a valid JSON array, no markdown, no explanation, no backticks. Each item must have this exact shape: {"term":"...","definition":"..."}. Keep definitions clear and concise (1-2 sentences).`;
        const msg = buildDocMessage(docData, prompt);
        const result = await callOpenRouter([msg], undefined, docData.isImage);
        const clean = result.replace(/```json|```/g, "").trim();
        const parsed: Flashcard[] = JSON.parse(clean);
        setFlashcardData(parsed);
      } catch {
        setFlashcardData([]);
      } finally {
        setToolLoading(false);
      }
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
        // Build conversation with doc context injected into the first message
        const docContext = docData.isImage
          ? `The student has uploaded an image document called "${docData.name}".`
          : `The student has uploaded a document called "${docData.name}". Here is its content:\n\n${docData.extractedText}\n\n---`;

        const historyText = messages
          .map((m) => `${m.role === "user" ? "Student" : "Assistant"}: ${m.content}`)
          .join("\n");

        apiMessages = [
          {
            role: "user",
            content: docData.isImage && docData.imageBase64
              ? [
                  { type: "image_url", image_url: { url: `data:${docData.imageMimeType};base64,${docData.imageBase64}` } },
                  { type: "text", text: `${historyText ? historyText + "\n\n" : ""}Student: ${text}` },
                ]
              : `${docContext}\n\n${historyText ? historyText + "\n\n" : ""}Student: ${text}`,
          },
        ];
      } else {
        apiMessages = updatedMessages.map((m) => ({ role: m.role, content: m.content }));
      }

      const reply = await callOpenRouter(apiMessages, SYSTEM_PROMPT, docData?.isImage ?? false);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something went wrong. Please check your connection and try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleRemoveDoc() {
    setDocData(null);
    setTool(null);
    setSummary("");
    setQuizData([]);
    setFlashcardData([]);
    setIntroMessage("");
    setMessages([]);
  }

  return (
    <AppShell>
      <div className="flex h-full flex-col overflow-hidden bg-background text-foreground">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.txt,.jpg,.jpeg,.png,.gif,.webp"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file);
            e.target.value = "";
          }}
        />
        <div className="flex-1 overflow-y-auto" ref={scrollRef}>
          <div className="mx-auto w-full max-w-3xl px-5 pb-36 pt-10 sm:pt-16">
            {!docData && messages.length === 0 && !isUploading ? (
              <EmptyState
                onUpload={() => fileInputRef.current?.click()}
                onSuggest={sendMessage}
              />
            ) : isUploading ? (
              <UploadingState />
            ) : (
              <>
                {docData && (
                  <DocWorkspace
                    docData={docData}
                    tool={tool}
                    setTool={handleToolSelect}
                    onRemove={handleRemoveDoc}
                    summary={summary}
                    quizData={quizData}
                    flashcardData={flashcardData}
                    toolLoading={toolLoading}
                    introMessage={introMessage}
                  />
                )}
                <ChatThread messages={messages} isLoading={isLoading} ttsVoice={ttsVoice} ttsAudioRef={ttsAudioRef} />
              </>
            )}
          </div>
        </div>
        <Composer
          hasDoc={!!docData}
          onSend={sendMessage}
          isLoading={isLoading}
          onAttach={() => fileInputRef.current?.click()}
          ttsVoice={ttsVoice}
          onVoiceChange={setTtsVoice}
        />
      </div>
    </AppShell>
  );
}

/* ---- UPLOADING STATE ---- */

function UploadingState() {
  return (
    <div className="pt-6 sm:pt-12">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-md border border-border bg-surface">
          <Sparkles className="h-4 w-4 animate-pulse text-muted-foreground" />
        </div>
        <div>
          <p className="text-[15px] font-semibold text-foreground">Reading your document...</p>
          <p className="text-sm font-normal text-muted-foreground">This may take a moment</p>
        </div>
      </div>
    </div>
  );
}

/* ---- CHAT THREAD ---- */

function SpeakButton({
  text,
  ttsVoice,
  ttsAudioRef,
}: {
  text: string;
  ttsVoice: string;
  ttsAudioRef: MutableRefObject<HTMLAudioElement | null>;
}) {
  const [state, setState] = useState<TtsState>("idle");
  const lastClickRef = useRef(0);

  function handleClick() {
    if (state === "playing") {
      if (ttsAudioRef.current) {
        ttsAudioRef.current.pause();
        ttsAudioRef.current = null;
      }
      setState("idle");
      return;
    }
    // Debounce: ignore clicks within 2s of each other to avoid 429s
    const now = Date.now();
    if (now - lastClickRef.current < 2000) return;
    lastClickRef.current = now;
    aethexSpeak(text, ttsVoice, setState, ttsAudioRef);
  }

  return (
    <button
      onClick={handleClick}
      disabled={state === "loading"}
      title={state === "playing" ? "Stop" : "Listen"}
      className={
        "mt-2 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition " +
        (state === "playing"
          ? "border-foreground bg-foreground text-background"
          : state === "loading"
          ? "border-border text-muted-foreground opacity-60 cursor-not-allowed"
          : state === "error"
          ? "border-destructive text-destructive hover:bg-destructive/5"
          : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground")
      }
    >
      {state === "playing" ? (
        <>
          <VolumeX className="h-3 w-3" />
          Stop
        </>
      ) : state === "loading" ? (
        <>
          <span className="flex gap-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:0ms]" />
            <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:150ms]" />
            <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:300ms]" />
          </span>
          Loading…
        </>
      ) : state === "error" ? (
        <>
          <Volume2 className="h-3 w-3" />
          Retry
        </>
      ) : (
        <>
          <Volume2 className="h-3 w-3" />
          Listen
        </>
      )}
    </button>
  );
}

function ChatThread({
  messages,
  isLoading,
  ttsVoice,
  ttsAudioRef,
}: {
  messages: Message[];
  isLoading: boolean;
  ttsVoice: string;
  ttsAudioRef: MutableRefObject<HTMLAudioElement | null>;
}) {
  return (
    <div className="space-y-6 mt-6">
      {messages.map((m, i) => (
        <div key={i} className="flex gap-3">
          {m.role === "assistant" ? (
            <>
              <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-border bg-surface text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-[15px] font-normal leading-relaxed text-foreground whitespace-pre-wrap">
                  {m.content}
                </p>
                <SpeakButton text={m.content} ttsVoice={ttsVoice} ttsAudioRef={ttsAudioRef} />
              </div>
            </>
          ) : (
            <div className="ml-auto max-w-[80%] rounded-2xl bg-primary px-4 py-3">
              <p className="text-[15px] font-normal leading-relaxed text-primary-foreground">
                {m.content}
              </p>
            </div>
          )}
        </div>
      ))}
      {isLoading && (
        <div className="flex gap-3">
          <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-border bg-surface text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex items-center gap-1.5 pt-1">
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
      <p className="mt-3 text-[15px] font-normal text-muted-foreground">
        Upload a document, paste notes, or ask a question. I will take it from there.
      </p>

      <button
        onClick={onUpload}
        className="group mt-8 block w-full rounded-2xl border border-dashed border-border bg-surface p-8 text-left transition hover:border-foreground/40 hover:bg-muted/40"
      >
        <div className="flex items-start gap-4">
          <div className="grid h-10 w-10 place-items-center rounded-md border border-border bg-background text-muted-foreground transition group-hover:text-foreground">
            <Upload className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[15px] font-semibold text-foreground">Drop a file, or click to upload</p>
            <p className="mt-1 text-sm font-normal text-muted-foreground">
              PDF, TXT or image up to 50 MB
            </p>
          </div>
        </div>
      </button>

      <div className="mt-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Try</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            "Summarize my lecture notes",
            "Make 10 quiz questions",
            "Explain like I am new to this",
            "Build flashcards for key terms",
          ].map((s) => (
            <button
              key={s}
              onClick={() => onSuggest(s)}
              className="rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-normal text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---- DOC WORKSPACE ---- */

function DocWorkspace({
  docData,
  tool,
  setTool,
  onRemove,
  summary,
  quizData,
  flashcardData,
  toolLoading,
  introMessage,
}: {
  docData: DocData;
  tool: Tool;
  setTool: (t: Tool) => void;
  onRemove: () => void;
  summary: string;
  quizData: QuizQuestion[];
  flashcardData: Flashcard[];
  toolLoading: boolean;
  introMessage: string;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-xl border border-border bg-surface p-4 shadow-card">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
            <FileText className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{docData.name}</p>
            <p className="mt-0.5 flex items-center gap-2 text-xs font-normal text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-success" /> Analyzed
              </span>
              <span>&middot;</span>
              <span>{docData.size}</span>
            </p>
          </div>
        </div>
        <button
          onClick={onRemove}
          className="grid h-8 w-8 place-items-center rounded-md border border-border bg-background text-muted-foreground transition hover:bg-muted hover:text-foreground"
          aria-label="Remove document"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex gap-3">
        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-border bg-surface text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-[15px] font-normal leading-relaxed text-foreground whitespace-pre-wrap">
            {introMessage || "I have read through your document. Want me to summarize it, quiz you, or pull out flashcards?"}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <ToolChip
              icon={<BookOpen className="h-3.5 w-3.5" />}
              label="Summary"
              active={tool === "summary"}
              onClick={() => setTool("summary")}
            />
            <ToolChip
              icon={<ListChecks className="h-3.5 w-3.5" />}
              label="Quiz"
              active={tool === "quiz"}
              onClick={() => setTool("quiz")}
            />
            <ToolChip
              icon={<Layers className="h-3.5 w-3.5" />}
              label="Flashcards"
              active={tool === "flashcards"}
              onClick={() => setTool("flashcards")}
            />
          </div>

          {toolLoading && (
            <div className="mt-5 flex items-center gap-2 text-sm font-normal text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0ms]" />
              <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:150ms]" />
              <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:300ms]" />
              <span className="ml-1">Generating...</span>
            </div>
          )}

          {!toolLoading && tool === "summary" && summary && <SummaryPanel summary={summary} />}
          {!toolLoading && tool === "quiz" && quizData.length > 0 && <QuizPanel questions={quizData} />}
          {!toolLoading && tool === "quiz" && quizData.length === 0 && !toolLoading && tool && (
            <p className="mt-5 text-sm text-muted-foreground">Could not generate quiz. Please try again.</p>
          )}
          {!toolLoading && tool === "flashcards" && flashcardData.length > 0 && <FlashcardsPanel cards={flashcardData} />}
          {!toolLoading && tool === "flashcards" && flashcardData.length === 0 && !toolLoading && tool && (
            <p className="mt-5 text-sm text-muted-foreground">Could not generate flashcards. Please try again.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ToolChip({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition " +
        (active
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-surface text-foreground hover:bg-muted")
      }
    >
      {icon}
      {label}
    </button>
  );
}

/* ---- PANEL WRAPPER ---- */

function Panel({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-5 rounded-xl border border-border bg-surface p-5 shadow-card">
      <header className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[13px] font-semibold tracking-tight text-foreground">{title}</h2>
          {hint && <p className="mt-0.5 text-xs font-normal text-muted-foreground">{hint}</p>}
        </div>
      </header>
      {children}
    </section>
  );
}

/* ---- SUMMARY PANEL ---- */

function SummaryPanel({ summary }: { summary: string }) {
  return (
    <Panel title="Summary" hint="Generated from your document">
      <div className="space-y-3 text-[15px] font-normal leading-relaxed text-foreground">
        <p className="whitespace-pre-wrap">{summary}</p>
      </div>
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
    if (current + 1 >= questions.length) {
      setDone(true);
    } else {
      setCurrent((c) => c + 1);
      setSelected(null);
    }
  }

  if (done) {
    return (
      <Panel title="Practice quiz" hint={`${questions.length} questions`}>
        <div className="text-center py-4">
          <p className="text-2xl font-bold text-foreground">{score} / {questions.length}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {score === questions.length ? "Perfect score!" : score >= questions.length / 2 ? "Good effort!" : "Keep studying!"}
          </p>
          <button
            onClick={() => { setCurrent(0); setSelected(null); setScore(0); setDone(false); }}
            className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
          >
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
            <button
              key={o.label}
              onClick={() => handleSelect(o.label, o.correct)}
              className={
                "flex w-full items-center gap-3 rounded-md border px-3 py-2.5 text-left text-sm font-normal transition " +
                (revealed
                  ? o.correct
                    ? "border-foreground bg-foreground/[0.04]"
                    : isSelected
                    ? "border-destructive bg-destructive/5"
                    : "border-border bg-background opacity-60"
                  : "border-border bg-background hover:bg-muted")
              }
            >
              <span
                className={
                  "grid h-6 w-6 place-items-center rounded border text-[11px] font-semibold " +
                  (revealed && o.correct
                    ? "border-foreground bg-foreground text-background"
                    : revealed && isSelected && !o.correct
                    ? "border-destructive text-destructive"
                    : "border-border text-muted-foreground")
                }
              >
                {revealed && o.correct ? <Check className="h-3 w-3" /> : o.label}
              </span>
              <span className="font-normal text-foreground">{o.text}</span>
            </button>
          );
        })}
      </div>
      {selected && q.explanation && (
        <p className="mt-3 rounded-md border-l-2 border-foreground bg-muted/60 px-4 py-3 text-sm font-normal text-muted-foreground">
          <span className="font-semibold text-foreground">Explanation: </span>{q.explanation}
        </p>
      )}
      <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
        <button onClick={handleNext} className="text-sm font-normal text-muted-foreground transition hover:text-foreground">
          Skip
        </button>
        <button
          onClick={handleNext}
          disabled={!selected}
          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-40"
        >
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
    setFlipped((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  return (
    <Panel title="Flashcards" hint={`${cards.length} cards`}>
      <div className="grid gap-3 sm:grid-cols-2">
        {cards.map((c, i) => (
          <button
            key={i}
            onClick={() => toggleFlip(i)}
            className="relative rounded-lg border border-border bg-background p-4 text-left transition hover:-translate-y-0.5 hover:shadow-elevated"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Card {i + 1}
              </span>
              <span className="text-[10px] font-normal text-muted-foreground">
                {flipped.has(i) ? "Back" : "Front"}
              </span>
            </div>
            {flipped.has(i) ? (
              <p className="mt-4 text-sm font-normal leading-relaxed text-muted-foreground">{c.definition}</p>
            ) : (
              <p className="mt-4 font-display text-2xl font-bold leading-tight tracking-tight text-foreground">{c.term}</p>
            )}
            {!flipped.has(i) && (
              <p className="mt-4 border-t border-border pt-3 text-xs font-normal leading-relaxed text-muted-foreground">
                Tap to reveal definition
              </p>
            )}
          </button>
        ))}
      </div>
    </Panel>
  );
}

/* ---- COMPOSER ---- */

function Composer({
  hasDoc,
  onSend,
  isLoading,
  onAttach,
  ttsVoice,
  onVoiceChange,
}: {
  hasDoc: boolean;
  onSend: (text: string) => void;
  isLoading: boolean;
  onAttach: () => void;
  ttsVoice: string;
  onVoiceChange: (v: string) => void;
}) {
  const [value, setValue] = useState("");

  function handleSend() {
    if (!value.trim() || isLoading) return;
    onSend(value.trim());
    setValue("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="border-t border-border/60 bg-background/90 backdrop-blur shrink-0">
      <div className="mx-auto w-full max-w-3xl px-5 py-4">
        <div className="flex items-end gap-2 rounded-2xl border border-border bg-surface p-2 shadow-card focus-within:border-foreground/30">
          <button
            type="button"
            onClick={onAttach}
            className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label="Attach"
          >
            <Paperclip className="h-4 w-4" />
          </button>
          <textarea
            rows={1}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={hasDoc ? "Ask a follow-up, or request a quiz..." : "Ask anything, or attach a document"}
            className="max-h-40 flex-1 resize-none bg-transparent px-1 py-2 text-[15px] font-normal leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={isLoading || !value.trim()}
            className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
            aria-label="Send"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between px-1">
          <p className="text-[11px] font-normal text-muted-foreground">
            Noted reads your documents privately. Responses may need verification.
          </p>
          <div className="flex items-center gap-1.5 shrink-0">
            <Volume2 className="h-3 w-3 text-muted-foreground" />
            <select
              value={ttsVoice}
              onChange={(e) => onVoiceChange(e.target.value)}
              className="rounded-md border border-border bg-surface py-0.5 pl-2 pr-6 text-[11px] font-normal text-muted-foreground focus:outline-none focus:border-foreground/30 hover:border-foreground/30 transition cursor-pointer"
            >
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