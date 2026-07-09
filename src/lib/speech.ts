// Lightweight wrapper around the Web Speech API for cinematic narration.
let currentVoice: SpeechSynthesisVoice | null = null;

function pickVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const preferred =
    voices.find((v) => /en-GB/i.test(v.lang) && /male|daniel|arthur/i.test(v.name)) ||
    voices.find((v) => /en-GB/i.test(v.lang)) ||
    voices.find((v) => /en/i.test(v.lang)) ||
    voices[0];
  return preferred ?? null;
}

export function speak(text: string, opts?: { rate?: number; pitch?: number }) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const synth = window.speechSynthesis;
  if (!currentVoice) currentVoice = pickVoice();
  const u = new SpeechSynthesisUtterance(text);
  if (currentVoice) u.voice = currentVoice;
  u.rate = opts?.rate ?? 0.9;
  u.pitch = opts?.pitch ?? 0.95;
  u.volume = 1;
  synth.speak(u);
}

export function stopSpeaking() {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  stopAiAudio();
}

// ---- Live OpenAI narration ----
// Fetches cinematic voiceover from the /api/narrate route and plays it.
// Falls back to the browser Web Speech voice if the gateway is unavailable.
let currentAudio: HTMLAudioElement | null = null;

function stopAiAudio() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = "";
    currentAudio = null;
  }
}

async function speakAI(text: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    stopAiAudio();
    const res = await fetch("/api/narrate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) return false;
    const blob = await res.blob();
    if (!blob.size) return false;
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    currentAudio = audio;
    audio.onended = () => URL.revokeObjectURL(url);
    await audio.play();
    return true;
  } catch {
    return false;
  }
}

// Primary narration entry: try live OpenAI voice, otherwise Web Speech.
export async function narrate(text: string, opts?: { rate?: number; pitch?: number }) {
  if (typeof window === "undefined") return;
  window.speechSynthesis?.cancel();
  const ok = await speakAI(text);
  if (!ok) speak(text, opts);
}
