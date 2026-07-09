import { createServerFn } from "@tanstack/react-start";

interface TestimonyInput {
  chapterTitle: string;
  chapterSubtitle: string;
  mission: string;
}

// Live OpenAI-powered dynamic testimonies + rescue lines for a chapter.
// Returns short, first-person exclamations shown as in-game toasts, so the
// dialogue never feels repetitive across runs.
export const generateTestimonies = createServerFn({ method: "POST" })
  .inputValidator((data: TestimonyInput) => data)
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) return { lines: [] as string[] };

    const prompt = `You are writing short in-game callouts for a cinematic Christian endless-runner honoring a faithful pastor ("The General").
Current chapter: "${data.chapterTitle}" (${data.chapterSubtitle}).
Mission: ${data.mission}

Write 14 short, emotional, first-person lines shouted by souls being rescued and believers being freed as the General runs past.
Rules:
- Each line under 60 characters.
- Varied: gratitude, freedom, hope, testimony, healing, encouragement.
- Christian in tone but not cheesy. No numbering, no quotes.
Return ONLY a JSON array of strings.`;

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-5-mini",
          messages: [
            {
              role: "system",
              content:
                "You generate concise, heartfelt game dialogue. Always reply with a valid JSON array of strings and nothing else.",
            },
            { role: "user", content: prompt },
          ],
        }),
      });

      if (!res.ok) return { lines: [] as string[] };
      const json = await res.json();
      const content: string = json?.choices?.[0]?.message?.content ?? "";
      const lines = parseLines(content);
      return { lines };
    } catch {
      return { lines: [] as string[] };
    }
  });

function parseLines(content: string): string[] {
  const cleaned = content.replace(/```json/gi, "").replace(/```/g, "").trim();
  try {
    const arr = JSON.parse(cleaned);
    if (Array.isArray(arr)) {
      return arr
        .filter((x): x is string => typeof x === "string")
        .map((x) => x.trim())
        .filter(Boolean)
        .slice(0, 20);
    }
  } catch {
    // Fall back to splitting by lines if the model added stray text.
    const fallback = cleaned
      .split("\n")
      .map((l) => l.replace(/^[-*\d.\s"]+/, "").replace(/"$/, "").trim())
      .filter((l) => l.length > 2 && l.length < 80);
    if (fallback.length) return fallback.slice(0, 20);
  }
  return [];
}