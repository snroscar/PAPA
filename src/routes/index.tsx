import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import Game from "@/components/game/Game";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="flex h-[100dvh] w-screen items-center justify-center bg-gradient-dawn px-4">
        <div className="w-full max-w-xl rounded-[2rem] border border-primary/25 bg-glass p-10 shadow-deep text-center backdrop-blur-xl">
          <h1 className="font-display text-4xl font-bold text-gold-gradient animate-shimmer">
            THE GENERAL'S JOURNEY
          </h1>
          <p className="mt-3 text-sm uppercase tracking-[0.4em] text-neon">
            Loading the tribute…
          </p>
          <div className="mx-auto mt-8 h-1 w-48 rounded-full bg-gradient-gold opacity-90 shadow-gold" />
        </div>
      </div>
    );
  }
  return <Game />;
}
