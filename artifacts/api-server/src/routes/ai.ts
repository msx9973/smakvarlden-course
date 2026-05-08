import { Router } from "express";
import Anthropic from "@anthropic-ai/sdk";

const router = Router();

function getClient() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  return new Anthropic({ apiKey: key });
}

const SYSTEM_PROMPT = `Du ar Chef AI i Smakvarlden, en svensk SaaS for restauranger, kockar och food-cost.

Din uppgift:
- Hjalp anvandaren rakna food cost, marginal, saljpris, portionskostnad och vinst.
- Foresla recept, saser, dressingar, desserter, sallader och menyer pa restaurangniva.
- Ge ingredient-substitut som sanker kostnad utan att forstora smak eller kvalitet.
- Hjalp med allergener, specialkost, portionsskalning, svinn och prepp.
- Skriv menytexter som ar korta, saljande och professionella.

Svarsstil:
- Svara alltid pa svenska.
- Var konkret, praktisk och kort.
- Nar du raknar: visa formel, siffror och slutsats.
- Nar information saknas: gor rimlig uppskattning och sag vilken information som saknas.
- Anvand SEK och procent nar det handlar om priser.
- Hall svaret strukturerat med korta rubriker och punktlistor.
- Rekommendera food cost-mal 25-35 procent for manga ratter, men forklara nar fisk, premiumkott eller dessert kan avvika.`;

router.post("/ai/chat", async (req, res) => {
  const client = getClient();
  if (!client) {
    return res.status(503).json({ error: "AI-funktionen ar inte konfigurerad. Lagg till ANTHROPIC_API_KEY i miljoinstallningar." });
  }

  const { message, history = [], context = "" } = req.body ?? {};
  if (!message?.trim()) return res.status(400).json({ error: "Meddelande saknas." });

  const messages: Anthropic.MessageParam[] = [
    ...history.slice(-8).map((h: { role: string; content: string }) => ({
      role: h.role as "user" | "assistant",
      content: h.content,
    })),
    {
      role: "user",
      content: `${context ? `Aktuell appkontext: ${context}\n\n` : ""}${message}`,
    },
  ];

  const response = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 1200,
    system: SYSTEM_PROMPT,
    messages,
  });

  const reply = response.content[0]?.type === "text" ? response.content[0].text : "";
  return res.json({ reply, tokensUsed: response.usage?.output_tokens });
});

router.post("/ai/suggest", async (req, res) => {
  const client = getClient();
  if (!client) {
    return res.status(503).json({ error: "AI-funktionen ar inte konfigurerad." });
  }

  const { ingredients = [], budget, servings = 4 } = req.body ?? {};
  if (!ingredients.length) return res.status(400).json({ error: "Inga ingredienser angivna." });

  const prompt = `Jag har dessa ingredienser: ${ingredients.join(", ")}.
${budget ? `Budget: ${budget} SEK.` : ""}
Antal portioner: ${servings}.

Foresla 3 konkreta restaurangrecept. For varje recept: namn, kategori, uppskattad kostnad per portion, rekommenderat saljpris, food cost %, allergener och kort metod.`;

  const response = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 1200,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
  });

  const reply = response.content[0]?.type === "text" ? response.content[0].text : "";
  return res.json({ reply });
});

export default router;
