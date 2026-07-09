import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { useGame } from "@/store/gameStore";
import heroImg from "@/assets/hero1.jpeg";
import joystickImg from "@/assets/joystick.png";

export default function Title() {
  const startJourney = useGame((s) => s.startJourney);
  const assets = useGame((s) => s.assets);
  const kingdomImpact = useGame((s) => s.kingdomImpact);
  const crowns = useGame((s) => s.crowns);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div
        className="absolute inset-0 animate-slow-zoom bg-cover bg-center"
        style={{ backgroundImage: `url(${assets.heroPhoto || heroImg})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/30 to-background" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(0,0,0,0.6))]" />

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-3xl border border-primary/20 bg-background/70 shadow-soft backdrop-blur-lg"
        >
          <img src={joystickImg} alt="Page header icon" className="h-12 w-12 object-contain" />
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="font-display text-sm uppercase tracking-[0.5em] text-primary"
        >
          A Birthday Adventure
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.4 }}
          className="mt-4 font-display text-5xl font-extrabold leading-[1.05] text-gold-gradient drop-shadow-[0_6px_30px_rgba(0,0,0,0.7)] animate-shimmer md:text-8xl"
        >
          THE GENERAL'S
          <br />
          JOURNEY
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 1.2 }}
          className="mt-6 max-w-xl font-body text-xl italic text-foreground/90 md:text-2xl"
        >
          Celebrating a life of faith, sacrifice and legacy — run through five
          seasons of {assets.pastorName}'s calling, from his birth to his glory.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
        >
          <button
            onClick={startJourney}
            className="rounded-full bg-gradient-gold px-10 py-4 font-display text-base font-semibold uppercase tracking-widest text-primary-foreground shadow-gold transition hover:scale-105"
          >
            Begin the Journey
          </button>
          <Link
            to="/admin"
            className="rounded-full border border-border/70 bg-background/30 px-8 py-4 font-display text-sm uppercase tracking-widest text-foreground backdrop-blur-md transition hover:bg-background/60"
          >
            Admin Studio
          </Link>
        </motion.div>

        {(kingdomImpact > 0 || crowns.length > 0) && (
          <p className="mt-8 text-sm uppercase tracking-widest text-muted-foreground">
            Kingdom Impact {kingdomImpact.toLocaleString()} · {crowns.length} / 5 Crowns
          </p>
        )}
      </div>
    </div>
  );
}
