import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/store/gameStore";
import type { Chapter } from "@/data/chapters";
import { Heart, Sparkles, Pause, Music, VolumeX } from "lucide-react";
import { setMusicMuted, isMusicMuted } from "@/lib/music";

export default function HUD({ chapter, onPause }: { chapter: Chapter; onPause: () => void }) {
  const runImpact = useGame((s) => s.runImpact);
  const runSouls = useGame((s) => s.runSouls);
  const runCollectibles = useGame((s) => s.runCollectibles);
  const runLives = useGame((s) => s.runLives);
  const runProgress = useGame((s) => s.runProgress);
  const companion = useGame((s) => s.companionActive);
  const [toast, setToast] = useState<string | null>(null);
  const [musicMuted, setMuted] = useState(false);

  useEffect(() => {
    setMuted(isMusicMuted());
  }, []);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const handler = (e: Event) => {
      const msg = (e as CustomEvent<string>).detail;
      setToast(msg);
      clearTimeout(t);
      t = setTimeout(() => setToast(null), 2600);
    };
    window.addEventListener("gj-toast", handler);
    return () => {
      window.removeEventListener("gj-toast", handler);
      clearTimeout(t);
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 z-10 select-none">
      {/* Top bar */}
      <div className="flex items-start justify-between p-4 md:p-6">
        <div className="rounded-xl border border-border/60 bg-background/40 px-4 py-2 backdrop-blur-md">
          <p className="font-display text-xs uppercase tracking-[0.25em] text-primary/80">
            Kingdom Impact
          </p>
          <p className="font-display text-2xl font-bold text-gold-gradient md:text-3xl">
            {runImpact.toLocaleString()}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <Heart
                key={i}
                className={`h-5 w-5 ${i < runLives ? "fill-accent text-accent" : "text-muted-foreground/40"}`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const next = !musicMuted;
                setMuted(next);
                setMusicMuted(next);
              }}
              className="pointer-events-auto flex items-center gap-1 rounded-lg border border-border/60 bg-background/40 p-2 text-sm backdrop-blur-md transition hover:bg-background/70"
              aria-label="Toggle music"
            >
              {musicMuted ? <VolumeX className="h-4 w-4" /> : <Music className="h-4 w-4" />}
            </button>
            <button
              onClick={onPause}
              className="pointer-events-auto flex items-center gap-1 rounded-lg border border-border/60 bg-background/40 px-3 py-1.5 text-sm backdrop-blur-md transition hover:bg-background/70"
            >
              <Pause className="h-4 w-4" /> Pause
            </button>
          </div>
        </div>
      </div>

      {/* Left stats */}
      <div className="absolute left-4 top-1/2 flex -translate-y-1/2 flex-col gap-3 md:left-6">
        <Stat 
          icon={<Sparkles className="h-4 w-4" />} 
          label={chapter.id === 1 ? "Prophecies" : "Souls"} 
          value={runSouls} 
        />
        <Stat icon={<span className="text-sm">💎</span>} label="Faith" value={runCollectibles} />
        {companion && (
          <div className="rounded-lg border border-accent/50 bg-accent/20 px-3 py-1.5 text-xs backdrop-blur-md">
            <span className="text-accent-foreground">💗 Mama's Blessing</span>
          </div>
        )}
      </div>

      {/* Progress */}
      <div className="absolute inset-x-0 bottom-6 mx-auto w-[86%] max-w-2xl">
        <div className="mb-1 flex justify-between text-xs uppercase tracking-widest text-primary/80">
          <span>{chapter.subtitle}</span>
          <span>{Math.round(runProgress * 100)}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full border border-border/60 bg-background/50 backdrop-blur">
          <div
            className="h-full bg-gradient-gold transition-[width] duration-150"
            style={{ width: `${runProgress * 100}%` }}
          />
        </div>
      </div>

      {/* Rescue toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute left-1/2 top-24 -translate-x-1/2 rounded-full border border-primary/40 bg-background/70 px-5 py-2 text-center font-body text-lg italic text-primary backdrop-blur-md"
          >
            "{toast}"
          </motion.div>
        )}
      </AnimatePresence>

      {/* mobile controls hint */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 text-center text-xs text-muted-foreground/70 md:hidden">
        Swipe to move • up to jump • down to slide
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/40 px-3 py-1.5 backdrop-blur-md">
      <span className="text-primary">{icon}</span>
      <div className="leading-tight">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="font-display text-lg font-bold text-foreground">{value}</p>
      </div>
    </div>
  );
}
