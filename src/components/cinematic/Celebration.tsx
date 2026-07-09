import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/store/gameStore";
import gateImg from "@/assets/promise-gate.jpg";
import heroImg from "@/assets/hero-title.jpg";
import birthdaySong from "@/assets/Happy Birthday PAPA _ POP Version 1 _ The Perfect Birthday Song for PAPA [cBVPmrWOvwc].mp3";
import { Volume2, VolumeX, RotateCcw } from "lucide-react";
import { stopMusic } from "@/lib/music";

const CONFETTI_COLORS = ["#ffd27a", "#ff8a5c", "#fff0b0", "#b5486a", "#cfe3ff", "#ffe9a8"];

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 80 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 4,
        dur: 4 + Math.random() * 4,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        size: 6 + Math.random() * 8,
      })),
    [],
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((p) => (
        <span
          key={p.id}
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 1.6,
            background: p.color,
            animation: `confetti-fall ${p.dur}s linear ${p.delay}s infinite`,
          }}
          className="absolute top-0 rounded-sm"
        />
      ))}
    </div>
  );
}

export default function Celebration() {
  const assets = useGame((s) => s.assets);
  const kingdomImpact = useGame((s) => s.kingdomImpact);
  const soulsRescued = useGame((s) => s.soulsRescued);
  const totalSoulsSaved = useGame((s) => s.totalSoulsSaved);
  const resetJourney = useGame((s) => s.resetJourney);
  const [muted, setMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const photos = assets.galleryPhotos.length ? assets.galleryPhotos : [heroImg, gateImg];
  const [slide, setSlide] = useState(0);

  // Stop chapter music and play birthday song
  useEffect(() => {
    stopMusic();
  }, []);

  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % photos.length), 3500);
    return () => clearInterval(t);
  }, [photos.length]);

  useEffect(() => {
    if (birthdaySong && audioRef.current) {
      audioRef.current.volume = 0.7;
      audioRef.current.play().catch(() => {});
    }
  }, []);

  return (
    <div className="relative h-full w-full overflow-y-auto bg-gradient-heaven">
      <audio ref={audioRef} src={birthdaySong} loop muted={muted} />
      <Confetti />

      <div className="relative z-10 flex min-h-full flex-col items-center px-6 py-16 text-center">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="font-display text-sm uppercase tracking-[0.5em] text-accent"
        >
          The Promise Fulfilled
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", duration: 1.2 }}
          className="mt-3 font-display text-5xl font-extrabold text-primary-foreground drop-shadow-[0_4px_20px_rgba(255,255,255,0.5)] md:text-8xl"
          style={{ color: "#6b3f10" }}
        >
          HAPPY BIRTHDAY
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-3 font-display text-2xl font-semibold md:text-4xl"
          style={{ color: "#8a5a1a" }}
        >
          {assets.pastorName}
        </motion.p>

        {/* gallery */}
        <div className="relative mt-10 aspect-video w-full max-w-3xl overflow-hidden rounded-3xl border-4 border-white/70 shadow-deep">
          <AnimatePresence mode="wait">
            <motion.img
              key={slide}
              src={photos[slide]}
              initial={{ opacity: 0, scale: 1.08 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="h-full w-full object-cover"
              alt="A cherished memory"
            />
          </AnimatePresence>
          <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1.5 p-3">
            {photos.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${i === slide ? "w-6 bg-white" : "w-1.5 bg-white/50"}`}
              />
            ))}
          </div>
        </div>

        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="mt-12 font-display text-3xl font-bold md:text-5xl"
          style={{ color: "#6b3f10" }}
        >
          Thank You, General
        </motion.h2>
        <p
          className="mt-4 max-w-2xl font-body text-xl italic md:text-2xl"
          style={{ color: "#5a4020" }}
        >
          {assets.dedication}
        </p>

        <div className="mt-10 flex gap-8 font-display" style={{ color: "#6b3f10" }}>
          <div>
            <p className="text-4xl font-bold">{(totalSoulsSaved ? totalSoulsSaved * 10 : soulsRescued * 10000).toLocaleString()}</p>
            <p className="text-xs uppercase tracking-widest">Souls Won for God</p>
          </div>
          <div>
            <p className="text-4xl font-bold">{kingdomImpact.toLocaleString()}</p>
            <p className="text-xs uppercase tracking-widest">Kingdom Impact</p>
          </div>
        </div>

        {/* credits */}
        <div className="mt-14 max-w-md text-sm leading-relaxed" style={{ color: "#6b3f10" }}>
          <p className="font-display uppercase tracking-[0.3em]">A Tribute</p>
          <p className="mt-2 italic">
            To a faithful servant of God, whose journey has inspired generations.
            {assets.wifeName ? ` Beside him, ${assets.wifeName}, his gift from God.` : ""}
          </p>
          <p className="mt-3">{assets.churchName}</p>
        </div>

        <div className="mt-10 flex gap-3">
          <button
            onClick={resetJourney}
            className="flex items-center gap-2 rounded-full bg-[#6b3f10] px-6 py-3 font-display text-sm uppercase tracking-widest text-white transition hover:scale-105"
          >
            <RotateCcw className="h-4 w-4" /> Journey Again
          </button>
          <button
            onClick={() => setMuted((m) => !m)}
            className="rounded-full border-2 border-[#6b3f10]/50 p-3 text-[#6b3f10] transition hover:bg-[#6b3f10]/10"
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
