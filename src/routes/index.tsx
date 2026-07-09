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
      <div className="flex h-[100dvh] w-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold text-gold-gradient animate-shimmer">
            THE GENERAL'S JOURNEY
          </h1>
          <p className="mt-3 text-sm uppercase tracking-[0.3em] text-muted-foreground">
            Loading the tribute…
          </p>
        </div>
      </div>
    );
  }
  return <Game />;
}
