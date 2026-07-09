import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Phase =
  | "title"
  | "chapters"
  | "intro"
  | "playing"
  | "chapterComplete"
  | "gameover"
  | "celebration";

export interface GameAssets {
  pastorName: string;
  wifeName: string;
  churchName: string;
  churchLogo: string | null;
  birthdaySong: string | null; // data URL (audio)
  narration: string | null; // data URL (audio) optional global
  heroPhoto: string | null;
  galleryPhotos: string[]; // data URLs
  dedication: string;
}

interface GameState {
  phase: Phase;
  chapterIndex: number;
  // totals across the whole journey
  kingdomImpact: number;
  soulsRescued: number;
  crowns: string[];
  chapterSouls: Record<number, number>; // track souls per chapter (2-5)
  totalSoulsSaved: number; // (ch2 + ch3 + ch4 + ch5) * 1000
  // current run
  runImpact: number;
  runSouls: number;
  runCollectibles: number;
  runLives: number;
  runProgress: number;
  companionActive: boolean;
  hydrated: boolean;
  assets: GameAssets;
  finalCard: { title: string; lines: string[]; footer?: string } | null;

  setPhase: (p: Phase) => void;
  setFinalCard: (c: { title: string; lines: string[]; footer?: string } | null) => void;
  startJourney: () => void;
  openChapters: () => void;
  beginChapter: (index: number) => void;
  startRun: () => void;
  addImpact: (n: number) => void;
  rescueSoul: () => void;
  collect: () => void;
  loseLife: () => number;
  setRunProgress: (p: number) => void;
  activateCompanion: () => void;
  completeChapter: (crown: string) => void;
  advanceChapter: () => void;
  toCelebration: () => void;
  resetJourney: () => void;
  setHydrated: () => void;
  updateAssets: (a: Partial<GameAssets>) => void;
  addGalleryPhotos: (urls: string[]) => void;
  removeGalleryPhoto: (i: number) => void;
}

const defaultAssets: GameAssets = {
  pastorName: "The General",
  wifeName: "Mama Beatrice",
  churchName: "The Kingdom Assembly",
  churchLogo: null,
  birthdaySong: null,
  narration: null,
  heroPhoto: null,
  galleryPhotos: [],
  dedication:
    "Your labour has changed lives. Your faith has inspired generations. May God continue to strengthen you. Happy Birthday.",
};

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
      phase: "title",
      chapterIndex: 0,
      kingdomImpact: 0,
      soulsRescued: 0,
      crowns: [],
      chapterSouls: {},
      totalSoulsSaved: 0,
      runImpact: 0,
      runSouls: 0,
      runCollectibles: 0,
      runLives: 3,
      runProgress: 0,
      companionActive: false,
      hydrated: false,
      assets: defaultAssets,
      finalCard: null,

      setPhase: (p) => set({ phase: p }),
      startJourney: () => set({ phase: "chapters" }),
      openChapters: () => set({ phase: "chapters" }),
      beginChapter: (index) => set({ phase: "intro", chapterIndex: index }),
      startRun: () =>
        set({
          phase: "playing",
          runImpact: 0,
          runSouls: 0,
          runCollectibles: 0,
          runLives: 3,
          runProgress: 0,
          companionActive: false,
          finalCard: null,
        }),
      addImpact: (n) => set((s) => ({ runImpact: s.runImpact + n })),
      // Each rescued soul is worth 1000 Kingdom Impact.
      rescueSoul: () =>
        set((s) => ({ runSouls: s.runSouls + 1, runImpact: s.runImpact + 1000 })),
      // Each faith gem is worth 10 Kingdom Impact per count.
      collect: () =>
        set((s) => ({
          runCollectibles: s.runCollectibles + 1,
          runImpact: s.runImpact + 10,
        })),
      loseLife: () => {
        const remaining = get().runLives - 1;
        set({ runLives: remaining });
        if (remaining <= 0) set({ phase: "gameover" });
        return remaining;
      },
      setRunProgress: (p) => set({ runProgress: p }),
      activateCompanion: () => set({ companionActive: true }),
      completeChapter: (crown) => {
        const currentChapterId = 2 + get().chapterIndex;
        const newChapterSouls = { ...get().chapterSouls, [currentChapterId]: get().runSouls };
        
        let totalSoulsSaved = 0;
        if (currentChapterId === 5) {
          // On chapter 5, sum all souls from chapters 2-5 and multiply by 1000
          const ch2 = newChapterSouls[2] || 0;
          const ch3 = newChapterSouls[3] || 0;
          const ch4 = newChapterSouls[4] || 0;
          const ch5 = newChapterSouls[5] || 0;
          totalSoulsSaved = (ch2 + ch3 + ch4 + ch5) * 1000;
        }
        
        set((s) => ({
          phase: "chapterComplete",
          kingdomImpact: s.kingdomImpact + s.runImpact,
          soulsRescued: s.soulsRescued + s.runSouls,
          crowns: s.crowns.includes(crown) ? s.crowns : [...s.crowns, crown],
          chapterSouls: newChapterSouls,
          totalSoulsSaved: currentChapterId === 5 ? totalSoulsSaved : s.totalSoulsSaved,
        }));
      },
      advanceChapter: () => {
        const next = get().chapterIndex + 1;
        set({ phase: "intro", chapterIndex: next });
      },
      toCelebration: () => set({ phase: "celebration" }),
      resetJourney: () =>
        set({
          phase: "title",
          chapterIndex: 0,
          kingdomImpact: 0,
          soulsRescued: 0,
          crowns: [],
          chapterSouls: {},
          totalSoulsSaved: 0,
          runImpact: 0,
          runSouls: 0,
          runCollectibles: 0,
          companionActive: false,
        }),
      setHydrated: () => set({ hydrated: true }),
      setFinalCard: (c) => set({ finalCard: c }),
      updateAssets: (a) => set((s) => ({ assets: { ...s.assets, ...a } })),
      addGalleryPhotos: (urls) =>
        set((s) => ({
          assets: { ...s.assets, galleryPhotos: [...s.assets.galleryPhotos, ...urls] },
        })), 
      removeGalleryPhoto: (i) =>
        set((s) => ({
          assets: {
            ...s.assets,
            galleryPhotos: s.assets.galleryPhotos.filter((_, idx) => idx !== i),
          },
        })),
    }),
    {
      name: "generals-journey",
      partialize: (s) => ({
        assets: s.assets,
        kingdomImpact: s.kingdomImpact,
        soulsRescued: s.soulsRescued,
        crowns: s.crowns,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);

// Helper function to check if requirements are met for progression
export function checkChapterRequirements(chapterIndex: number, runSouls: number, runCollectibles: number): { met: boolean; required: number; actual: number } {
  const requirements: Record<number, number> = {
    0: 15, // Chapter 1: 15 prophecies
    1: 20, // Chapter 2: 20 souls
    2: 30, // Chapter 3: 30 souls
    3: 40, // Chapter 4: 40 souls
    4: 50, // Chapter 5: 50 souls
  };

  const required = requirements[chapterIndex] || 0;
  const actual = chapterIndex === 0 ? runCollectibles : runSouls;

  return {
    met: actual >= required,
    required,
    actual,
  };
}
