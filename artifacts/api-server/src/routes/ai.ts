import { Router } from "express";
import Anthropic from "@anthropic-ai/sdk";

const router = Router();

function getClient() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  return new Anthropic({ apiKey: key });
}

const SYSTEM_PROMPT = `Du är Chef AI – en erfaren kockassistent på Smakvärlden, Sveriges ledande plattform för professionella kockar. Du hjälper kockar med:
- Receptidéer och matlagningstekniker
- Kostnadsberäkningar och prissättning av rätter
- Råvarusubstitutioner och allergianpassningar
- Menyplanering och säsongsbaserade recept
- Professionella köksråd på restaurangnivå

Svara alltid på svenska, kortfattat och professionellt. Var specifik och praktisk. Inkludera gärna ungefärliga kostnader i SEK när du föreslår ingredienser.`;

router.post("/ai/chat", async (req, res) => {
  const client = getClient();
  if (!client) {
    return res.status(503).json({ error: "AI-funktionen är inte konfigurerad. Lägg till ANTHROPIC_API_KEY i miljövariabler." });
  }

  const { message, history = [] } = req.body ?? {};
  if (!message?.trim()) return res.status(400).json({ error: "Meddelande saknas." });

  const messages: Anthropic.MessageParam[] = [
    ...history.slice(-10).map((h: { role: string; content: string }) => ({
      role: h.role as "user" | "assistant",
      content: h.content,
    })),
    { role: "user", content: message },
  ];

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
    });
    const reply = response.content[0]?.type === "text" ? response.content[0].text : "";
    return res.json({ reply, tokensUsed: response.usage?.output_tokens });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "AI-tjänsten svarade inte.";
    return res.status(502).json({ error: msg });
  }
});

router.post("/ai/suggest", async (req, res) => {
  const client = getClient();
  if (!client) {
    return res.status(503).json({ error: "AI-funktionen är inte konfigurerad." });
  }

  const { ingredients = [], budget, servings = 4 } = req.body ?? {};
  if (!ingredients.length) return res.status(400).json({ error: "Inga ingredienser angivna." });

  const prompt = `Jag har dessa ingredienser: ${ingredients.join(", ")}. 
${budget ? `Budget: ${budget} SEK.` : ""} 
Antal portioner: ${servings}.
Föreslå 3 konkreta recept med dessa ingredienser. För varje recept: ge namn, kategori, uppskattad kostnad per portion, och en kort beskrivning (max 2 meningar).`;

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });
    const reply = response.content[0]?.type === "text" ? response.content[0].text : "";
    return res.json({ reply });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "AI-tjänsten svarade inte.";
    return res.status(502).json({ error: msg });
  }
});

export default router;
