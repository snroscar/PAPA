import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/store/gameStore";
import gateImg from "@/assets/promise-gate.jpg";
import heroImg from "@/assets/hero-title.jpg";
import birthdaySong from "@/assets/Happy Birthday PAPA _ POP Version 1 _ The Perfect Birthday Song for PAPA [cBVPmrWOvwc].mp3";
import { Volume2, VolumeX, RotateCcw } from "lucide-react";
import { stopMusic } from "@/lib/music";

const CONFETTI_COLORS = ["#ffd27a", "#ff8a5c", "#fff0b0", "#b5486a", "#cfe3ff", "#ffe9a8"];

const highlightImages = import.meta.glob("../../assets/{c*,d*}.{png,jpg,jpeg}", { eager: true }) as Record<string, { default: string }>;
const highlightPhotos = Object.entries(highlightImages)
  .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
  .map(([, module]) => module.default);
const CELEBRATION_RUNTIME_MS = 600_000;

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

  const photos =
    assets.galleryPhotos.length || highlightPhotos.length
      ? assets.galleryPhotos.length
        ? assets.galleryPhotos
        : highlightPhotos
      : [heroImg, gateImg];
  const [slide, setSlide] = useState(0);

  // Stop chapter music and play birthday song
  useEffect(() => {
    stopMusic();
  }, []);

  useEffect(() => {
    const interval = 3_000;
    const t = setInterval(() => setSlide((s) => (s + 1) % photos.length), interval);
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
          className="font-display text-sm uppercase tracking-[0.6em] text-neon"
        >
          The Promise Fulfilled
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", duration: 1.2 }}
          className="mt-3 font-display text-5xl font-extrabold text-gold-gradient drop-shadow-[0_4px_20px_rgba(255,255,255,0.5)] md:text-8xl"
        >
          HAPPY BIRTHDAY
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-3 font-display text-2xl font-semibold text-white md:text-4xl"
        >
          {assets.pastorName}
        </motion.p>

        <div className="relative mt-10 aspect-video w-full max-w-3xl overflow-hidden rounded-[2rem] border border-primary/25 bg-card/20 shadow-deep backdrop-blur-xl">
          <AnimatePresence mode="wait">
            <motion.img
              key={slide}
              src={photos[slide]}
              initial={{ opacity: 0, scale: 1.08 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              style={{ objectPosition: "center middle" }}
              className="h-full w-full object-cover"
              alt="A cherished memory"
            />
          </AnimatePresence>
          <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1.5 p-3">
            {photos.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${i === slide ? "w-6 bg-primary" : "w-1.5 bg-white/50"}`}
              />
            ))}
          </div>
        </div>

        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="mt-12 font-display text-3xl font-bold text-white md:text-5xl"
        >
          Thank You, General
        </motion.h2>
        <p className="mt-4 max-w-2xl font-body text-xl italic text-muted-foreground md:text-2xl">
          {assets.dedication}
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <StatBlock label="Souls Won for God" value={(totalSoulsSaved ? totalSoulsSaved * 10 : soulsRescued * 10000).toLocaleString()} />
          <StatBlock label="Kingdom Impact" value={kingdomImpact.toLocaleString()} />
        </div>

        <div className="mt-14 max-w-md rounded-[1.75rem] border border-primary/20 bg-glass p-6 text-left shadow-deep">
          <p className="font-display uppercase tracking-[0.3em] text-neon">A Tribute</p>
          <p className="mt-3 italic text-sm leading-relaxed text-muted-foreground">
            To a faithful servant of God, whose journey has inspired generations.
            {assets.wifeName ? ` Beside him, ${assets.wifeName}, his gift from God.` : ""}
          </p>
          <p className="mt-4 text-sm text-muted-foreground">{assets.churchName}</p>
        </div>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <button
            onClick={resetJourney}
            className="flex items-center gap-2 rounded-full bg-gradient-gold px-6 py-3 font-display text-sm uppercase tracking-widest text-primary-foreground shadow-gold transition hover:scale-[1.02]"
          >
            <RotateCcw className="h-4 w-4" /> Journey Again
          </button>
          <button
            onClick={() => setMuted((m) => !m)}
            className="rounded-full border border-primary/35 bg-glass px-3 py-3 text-primary transition hover:bg-primary/10"
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.75rem] border border-primary/20 bg-glass p-5 text-left">
      <p className="text-sm uppercase tracking-[0.35em] text-neon">{label}</p>
      <p className="mt-3 text-4xl font-display font-bold text-white">{value}</p>
    </div>
  );
}
