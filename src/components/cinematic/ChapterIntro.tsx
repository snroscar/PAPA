import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Chapter } from "@/data/chapters";
import { narrate, stopSpeaking } from "@/lib/speech";
import { Play, Volume2, VolumeX } from "lucide-react";

export default function ChapterIntro({
  chapter,
  onBegin,
}: {
  chapter: Chapter;
  onBegin: () => void;
}) {
  const [line, setLine] = useState(-1);
  const [voice, setVoice] = useState(true);
  const [started, setStarted] = useState(false);

  const run = async (useVoice: boolean) => {
    setStarted(true);
    setLine(-1);
    stopSpeaking();

    for (const [index, text] of chapter.narration.entries()) {
      setLine(index);
      if (useVoice) {
        await narrate(text);
      } else {
        await new Promise((resolve) => window.setTimeout(resolve, Math.max(2200, text.length * 42)));
      }
    }
  };

  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  const bg = `linear-gradient(180deg, ${chapter.skyTop} 0%, ${chapter.skyBottom} 100%)`;

  return (
    <div className="relative h-full w-full overflow-hidden" style={{ background: bg }}>
      {/* atmospheric layers */}
      <div className="absolute inset-0 opacity-40 mix-blend-overlay animate-slow-zoom"
        style={{ backgroundImage: "radial-gradient(circle at 50% 20%, rgba(255,255,255,0.5), transparent 60%)" }} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_30%,rgba(0,0,0,0.55))]" />

      <div className="relative z-10 flex h-full flex-col items-center justify-center rounded-[2rem] border border-primary/20 bg-glass px-6 py-10 text-center shadow-deep backdrop-blur-xl">
        <div className="mb-6 rounded-[1.75rem] border border-primary/30 bg-background/70 px-6 py-4 shadow-gold">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-sm uppercase tracking-[0.55em] text-neon"
          >
            {chapter.subtitle}
          </motion.p>
        </div>
        <motion.h1
          initial={{ opacity: 0, y: 20, letterSpacing: "0.4em" }}
          animate={{ opacity: 1, y: 0, letterSpacing: "0.04em" }}
          transition={{ duration: 1.2 }}
          className="mt-3 font-display text-4xl font-bold text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.6)] md:text-6xl"
        >
          {chapter.title}
        </motion.h1>

        <motion.blockquote
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 1.2 }}
          className="mt-6 max-w-xl font-body text-lg italic text-white/90 md:text-2xl"
        >
          "{chapter.verse}"
          <footer className="mt-2 font-display text-sm not-italic tracking-widest text-white/70">
            — {chapter.verseRef}
          </footer>
        </motion.blockquote>

        {/* narration lines */}
        <div className="mt-8 flex min-h-[5rem] max-w-2xl items-center justify-center">
          <AnimatePresence mode="wait">
            {line >= 0 && (
              <motion.p
                key={line}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                className="font-body text-xl text-white/95 md:text-2xl"
              >
                {chapter.narration[line]}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-10 flex items-center gap-3">
          {!started ? (
            <>
              <button
                onClick={() => run(voice)}
                className="pointer-events-auto flex items-center gap-2 rounded-full bg-white/95 px-6 py-3 font-display text-sm font-semibold uppercase tracking-widest text-black transition hover:scale-105"
              >
                <Play className="h-4 w-4" /> Play Cinematic
              </button>
              <button
                onClick={onBegin}
                className="pointer-events-auto rounded-full border border-white/50 px-6 py-3 font-display text-sm uppercase tracking-widest text-white transition hover:bg-white/10"
              >
                Skip
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                stopSpeaking();
                onBegin();
              }}
              className="pointer-events-auto flex items-center gap-2 rounded-full bg-white/95 px-8 py-3 font-display text-sm font-semibold uppercase tracking-widest text-black transition hover:scale-105"
            >
              Begin Mission →
            </button>
          )}
          <button
            onClick={() => {
              setVoice((v) => {
                if (v) stopSpeaking();
                return !v;
              });
            }}
            className="pointer-events-auto rounded-full border border-white/40 p-3 text-white transition hover:bg-white/10"
            aria-label="Toggle narration"
          >
            {voice ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
        </div>

        <p className="mt-6 max-w-md text-sm text-white/70">{chapter.mission}</p>
      </div>
    </div>
  );
}
