import { motion } from "framer-motion";
import { useGame } from "@/store/gameStore";
import { CHAPTERS } from "@/data/chapters";
import { nextTestimony } from "@/lib/dialogue";
import { useMemo } from "react";
import bgVideo from "@/assets/The Promise Still Stands_ The Christian Song That’s Making People Cry.mp4";

export function ChapterComplete() {
  const chapterIndex = useGame((s) => s.chapterIndex);
  const runImpact = useGame((s) => s.runImpact);
  const runSouls = useGame((s) => s.runSouls);
  const runCollectibles = useGame((s) => s.runCollectibles);
  const advanceChapter = useGame((s) => s.advanceChapter);
  const toCelebration = useGame((s) => s.toCelebration);
  const chapter = CHAPTERS[chapterIndex];
  const isLast = chapterIndex >= CHAPTERS.length - 1;
  const testimony = useMemo(() => nextTestimony(), []);

  const finalCard = useGame((s) => s.finalCard);

  return (
    <div className="relative flex h-full w-full items-center justify-center bg-black px-6">
      {finalCard && chapter.id === 5 && (
        <video
          src={bgVideo}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 z-0 w-full h-full object-cover"
        />
      )}

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-lg rounded-3xl border border-primary/30 bg-card/70 p-8 text-center shadow-deep backdrop-blur-xl"
      >
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="mx-auto mb-4 text-7xl"
        >
          {chapter.crownIcon}
        </motion.div>

        <p className="font-display text-xs uppercase tracking-[0.4em] text-primary/80">
          {finalCard && chapter.id === 5 ? "The Testimonies" : "Chapter Complete"}
        </p>

        <h2 className="mt-2 font-display text-3xl font-bold text-gold-gradient">
          {finalCard && chapter.id === 5 ? finalCard.title : chapter.crown}
        </h2>

        {finalCard && chapter.id === 5 ? (
          <div className="mt-4 space-y-3">
            {finalCard.lines.map((l, i) => (
              <p key={i} className="font-body text-md italic text-muted-foreground">“{l}”</p>
            ))}
            {finalCard.footer && (
              <p className="mt-2 text-sm uppercase tracking-widest text-primary/80">{finalCard.footer}</p>
            )}
          </div>
        ) : (
          <p className="mt-4 font-body text-lg italic text-muted-foreground">"{testimony}"</p>
        )}

        <div className="mt-6 grid grid-cols-2 gap-4">
          {chapter.id === 5 ? (
            <>
              <Stat label="Souls Won for God" value={runSouls * 10000} />
              <Stat label="Kingdom Impact" value={runImpact} />
            </>
          ) : (
            <>
              <Stat label={chapterIndex === 0 ? "Prophecies Recorded" : "Souls Rescued"} value={chapterIndex === 0 ? runCollectibles : runSouls} />
              <Stat label="Kingdom Impact" value={runImpact} />
            </>
          )}
        </div>

        <button
          onClick={isLast ? toCelebration : advanceChapter}
          className="mt-8 w-full rounded-full bg-gradient-gold px-6 py-3 font-display text-sm font-semibold uppercase tracking-widest text-primary-foreground transition hover:scale-[1.02] shadow-gold"
        >
          {isLast ? "Enter the Promise →" : "Continue the Journey →"}
        </button>
      </motion.div>
    </div>
  );
}

export function GameOver() {
  const chapterIndex = useGame((s) => s.chapterIndex);
  const beginChapter = useGame((s) => s.beginChapter);
  const startRun = useGame((s) => s.startRun);
  const openChapters = useGame((s) => s.openChapters);
  const chapter = CHAPTERS[chapterIndex];

  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-dawn px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-3xl border border-border/60 bg-card/70 p-8 text-center shadow-deep backdrop-blur-xl"
      >
        <p className="font-display text-xs uppercase tracking-[0.4em] text-accent">
          The journey pauses
        </p>
        <h2 className="mt-3 font-display text-3xl font-bold text-foreground">
          Rise and run again
        </h2>
        <p className="mt-4 font-body text-lg italic text-muted-foreground">
          "Though he fall, he shall not be utterly cast down: for the Lord upholdeth him with his hand."
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <button
            onClick={() => startRun()}
            className="w-full rounded-full bg-gradient-gold px-6 py-3 font-display text-sm font-semibold uppercase tracking-widest text-primary-foreground transition hover:scale-[1.02] shadow-gold"
          >
            Retry — {chapter.title}
          </button>
          <button
            onClick={() => openChapters()}
            className="w-full rounded-full border border-border px-6 py-3 font-display text-sm uppercase tracking-widest text-foreground transition hover:bg-secondary"
          >
            Choose Chapter
          </button>
        </div>
        <button
          onClick={() => beginChapter(chapterIndex)}
          className="mt-4 text-xs uppercase tracking-widest text-muted-foreground hover:text-primary"
        >
          Replay cinematic
        </button>
      </motion.div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border/50 bg-background/40 p-4">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="font-display text-2xl font-bold text-foreground">{value.toLocaleString()}</p>
    </div>
  );
}
