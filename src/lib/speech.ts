// Web Speech API helpers (TTS + STT). Browser-only — guard with typeof window.
export function speak(text: string, opts?: { rate?: number; pitch?: number; voice?: string }) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return () => {};
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = opts?.rate ?? 1;
  u.pitch = opts?.pitch ?? 1;
  const v = synth.getVoices().find((x) => x.name === opts?.voice);
  if (v) u.voice = v;
  synth.speak(u);
  return () => synth.cancel();
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}

export function listen(onResult: (text: string) => void, onEnd?: () => void) {
  if (typeof window === "undefined") return () => {};
  const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SR) {
    onEnd?.();
    return () => {};
  }
  const rec = new SR();
  rec.lang = "en-US";
  rec.interimResults = false;
  rec.maxAlternatives = 1;
  rec.onresult = (e: any) => onResult(e.results[0][0].transcript as string);
  rec.onend = () => onEnd?.();
  rec.start();
  return () => rec.stop();
}
