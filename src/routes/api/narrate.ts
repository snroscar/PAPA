import { createFileRoute } from "@tanstack/react-router";

// Live OpenAI narration via the Lovable AI Gateway (OpenAI-compatible TTS).
// The browser POSTs { text, voice? } and gets back an mp3 stream it can play.
export const Route = createFileRoute("/api/narrate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) {
          return new Response("Narration unavailable", { status: 503 });
        }

        let body: { text?: unknown; voice?: unknown };
        try {
          body = await request.json();
        } catch {
          return new Response("Invalid body", { status: 400 });
        }

        const text = typeof body.text === "string" ? body.text.trim() : "";
        if (!text) return new Response("Missing text", { status: 400 });
        // Guard against oversized input for a single request.
        const input = text.slice(0, 1200);
        const voice = typeof body.voice === "string" ? body.voice : "onyx";

        try {
          const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "openai/gpt-4o-mini-tts",
              input,
              voice,
              instructions:
                "Speak like a warm, reverent cinematic movie narrator. Slow, emotional, dignified, with gravitas befitting a tribute to a man of God.",
              stream_format: "audio",
              response_format: "mp3",
            }),
          });

          if (!res.ok) {
            const detail = await res.text().catch(() => "");
            return new Response(detail || "Narration failed", { status: res.status });
          }

          return new Response(res.body, {
            headers: {
              "Content-Type": "audio/mpeg",
              "Cache-Control": "no-store",
            },
          });
        } catch {
          return new Response("Narration error", { status: 502 });
        }
      },
    },
  },
});