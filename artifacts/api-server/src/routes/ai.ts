import { Router } from "express";
import Anthropic from "@anthropic-ai/sdk";

const router = Router();

function getClient() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  return new Anthropic({ apiKey: key });
}

function buildSystemPrompt(lang: string) {
  if (lang === "en") {
    return `You are Chef AI – an experienced chef assistant on Smakvärlden, Sweden's leading platform for professional chefs. You help chefs with:
- Recipe ideas and cooking techniques
- Cost calculations and dish pricing
- Ingredient substitutions and allergy adaptations
- Menu planning and seasonal recipes
- Professional restaurant-level kitchen advice

Always respond in English, concisely and professionally. Be specific and practical. Include approximate costs in SEK when suggesting ingredients.`;
  }
  return `Du är Chef AI – en erfaren kockassistent på Smakvärlden, Sveriges ledande plattform för professionella kockar. Du hjälper kockar med:
- Receptidéer och matlagningstekniker
- Kostnadsberäkningar och prissättning av rätter
- Råvarusubstitutioner och allergianpassningar
- Menyplanering och säsongsbaserade recept
- Professionella köksråd på restaurangnivå

Svara alltid på svenska, kortfattat och professionellt. Var specifik och praktisk. Inkludera gärna ungefärliga kostnader i SEK när du föreslår ingredienser.`;
}

router.post("/ai/chat", async (req, res) => {
  const client = getClient();
  if (!client) {
    return res.status(503).json({ error: "AI-funktionen är inte konfigurerad. Lägg till ANTHROPIC_API_KEY i miljövariabler." });
  }

  const { message, history = [], lang = "sv" } = req.body ?? {};
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
      system: buildSystemPrompt(lang),
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

  const { ingredients = [], budget, servings = 4, lang = "sv" } = req.body ?? {};
  if (!ingredients.length) return res.status(400).json({ error: "Inga ingredienser angivna." });

  const prompt = lang === "en"
    ? `I have these ingredients: ${ingredients.join(", ")}.
${budget ? `Budget: ${budget} SEK.` : ""}
Number of servings: ${servings}.
Suggest 3 specific recipes using these ingredients. For each recipe: give name, category, estimated cost per serving, and a short description (max 2 sentences).`
    : `Jag har dessa ingredienser: ${ingredients.join(", ")}.
${budget ? `Budget: ${budget} SEK.` : ""}
Antal portioner: ${servings}.
Föreslå 3 konkreta recept med dessa ingredienser. För varje recept: ge namn, kategori, uppskattad kostnad per portion, och en kort beskrivning (max 2 meningar).`;

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1024,
      system: buildSystemPrompt(lang),
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
