import { motion } from "framer-motion";
import { useGame } from "@/store/gameStore";
import { CHAPTERS } from "@/data/chapters";
import { Lock } from "lucide-react";

export default function Chapters() {
  const crowns = useGame((s) => s.crowns);
  const beginChapter = useGame((s) => s.beginChapter);
  const setPhase = useGame((s) => s.setPhase);
  const unlocked = crowns.length;

  return (
    <div className="h-full w-full overflow-y-auto bg-gradient-dawn px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10 text-center">
          <button
            onClick={() => setPhase("title")}
            className="mb-4 text-xs uppercase tracking-widest text-muted-foreground hover:text-primary"
          >
            ← Home
          </button>
          <h1 className="font-display text-4xl font-bold text-gold-gradient md:text-5xl">
            The Five Seasons
          </h1>
          <p className="mt-2 font-body text-lg text-muted-foreground">
            Each chapter opens with a cinematic, then the running mission begins.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {CHAPTERS.map((c, i) => {
            const isUnlocked = i <= unlocked;
            const earned = crowns.includes(c.crown);
            return (
              <motion.button
                key={c.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                disabled={!isUnlocked}
                onClick={() => beginChapter(i)}
                className={`group relative overflow-hidden rounded-2xl border p-6 text-left transition ${
                  isUnlocked
                    ? "border-primary/30 bg-card/60 hover:border-primary/70 hover:shadow-gold"
                    : "cursor-not-allowed border-border/40 bg-card/30 opacity-60"
                } backdrop-blur-md`}
                style={{
                  backgroundImage: `linear-gradient(120deg, ${c.skyBottom}55, transparent)`,
                }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-display text-xs uppercase tracking-[0.3em] text-primary/80">
                      {c.subtitle}
                    </p>
                    <h3 className="mt-1 font-display text-2xl font-bold text-foreground">
                      {c.title}
                    </h3>
                  </div>
                  <span className="text-3xl">{earned ? c.crownIcon : isUnlocked ? "▶" : ""}</span>
                  {!isUnlocked && <Lock className="h-5 w-5 text-muted-foreground" />}
                </div>
                <p className="mt-3 line-clamp-2 font-body text-base italic text-muted-foreground">
                  "{c.verse}"
                </p>
                <p className="mt-3 text-sm text-foreground/80">{c.mission}</p>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
