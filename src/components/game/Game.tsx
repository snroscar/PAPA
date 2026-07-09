import { Suspense, lazy, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/store/gameStore";
import { CHAPTERS } from "@/data/chapters";
import HUD from "./HUD";
import { stopMusic, resumeMusic } from "@/lib/music";
import Title from "@/components/cinematic/Title";
import Chapters from "@/components/cinematic/Chapters";
import ChapterIntro from "@/components/cinematic/ChapterIntro";
import Celebration from "@/components/cinematic/Celebration";
import { ChapterComplete, GameOver } from "@/components/cinematic/Screens";

const RunnerCanvas = lazy(() => import("./RunnerCanvas"));

function Loader() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-dawn">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="mt-4 font-display text-sm uppercase tracking-[0.3em] text-primary/80">
          Preparing the journey…
        </p>
      </div>
    </div>
  );
}

function PauseMenu({ onResume }: { onResume: () => void }) {
  const startRun = useGame((s) => s.startRun);
  const openChapters = useGame((s) => s.openChapters);
  const setPhase = useGame((s) => s.setPhase);
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/70 backdrop-blur-md">
      <div className="w-full max-w-xs rounded-3xl border border-primary/30 bg-card/80 p-8 text-center shadow-deep">
        <h3 className="font-display text-2xl font-bold text-gold-gradient">Paused</h3>
        <div className="mt-6 flex flex-col gap-3">
          <button onClick={onResume} className="rounded-full bg-gradient-gold px-6 py-3 font-display text-sm uppercase tracking-widest text-primary-foreground shadow-gold hover:scale-[1.02]">
            Resume
          </button>
          <button onClick={() => { startRun(); onResume(); }} className="rounded-full border border-border px-6 py-3 font-display text-sm uppercase tracking-widest hover:bg-secondary">
            Restart Chapter
          </button>
          <button onClick={() => openChapters()} className="rounded-full border border-border px-6 py-3 font-display text-sm uppercase tracking-widest hover:bg-secondary">
            Chapters
          </button>
          <button onClick={() => setPhase("title")} className="text-xs uppercase tracking-widest text-muted-foreground hover:text-primary">
            Quit to Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Game() {
  const phase = useGame((s) => s.phase);
  const chapterIndex = useGame((s) => s.chapterIndex);
  const startRun = useGame((s) => s.startRun);
  const [paused, setPaused] = useState(false);
  const chapter = CHAPTERS[Math.min(chapterIndex, CHAPTERS.length - 1)];
  const isFinalChapter = chapterIndex >= CHAPTERS.length - 1;

  // Duck the background score while the pause menu is open.
  useEffect(() => {
    if (phase !== "playing") return;
    if (paused) stopMusic();
    else resumeMusic();
  }, [paused, phase]);

  // Keep music playing after chapter 5 completes
  useEffect(() => {
    if (phase === "chapterComplete" && isFinalChapter) {
      resumeMusic();
    }
  }, [phase, isFinalChapter]);

  return (
    <div className="fixed inset-0 h-[100dvh] w-screen overflow-hidden bg-background">
      <AnimatePresence mode="wait">
        <motion.div
          key={phase}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="h-full w-full"
        >
          {phase === "title" && <Title />}
          {phase === "chapters" && <Chapters />}
          {phase === "intro" && (
            <ChapterIntro chapter={chapter} onBegin={() => startRun()} />
          )}
          {phase === "playing" && (
            <div className="relative h-full w-full">
              <Suspense fallback={<Loader />}>
                <RunnerCanvas chapter={chapter} />
              </Suspense>
              <HUD chapter={chapter} onPause={() => setPaused(true)} />
              {paused && <PauseMenu onResume={() => setPaused(false)} />}
            </div>
          )}
          {phase === "chapterComplete" && <ChapterComplete />}
          {phase === "gameover" && <GameOver />}
          {phase === "celebration" && <Celebration />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
