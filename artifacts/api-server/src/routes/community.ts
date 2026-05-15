import { Router } from "express";
import { db, communityPostsTable, activityLogTable } from "@workspace/db";
import { eq, ilike, desc, sql } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";
import { requireAuth } from "../middleware/requireAuth";
import { CreateCommunityPostBody, ListCommunityPostsQueryParams, LikeCommunityPostParams } from "@workspace/api-zod";

const router = Router();

type NewsItem = { id: string; title: string; summary: string; source: string; url: string; publishedAt: string; language?: "sv" | "en"; translatedFrom?: "sv"; };
const NEWS_FEEDS = [{ source: "Food Supply", url: "https://www.food-supply.se/xml/rss2/articles?description=true" }];
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
// NOTE: In-memory cache works on long-running servers. On Netlify Functions (cold-start per request) it resets each invocation.
let newsCache: Record<string, { expiresAt: number; items: NewsItem[] }> = {};

function getAiClient() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  return new Anthropic({ apiKey: key });
}

router.get("/posts", async (req, res) => {
  const parsed = ListCommunityPostsQueryParams.safeParse(req.query);
  const search = parsed.success ? parsed.data.search : undefined;
  const rows = await db.select().from(communityPostsTable).where(search ? ilike(communityPostsTable.recipeName, `%${search}%`) : undefined).orderBy(desc(communityPostsTable.createdAt));
  return res.json(rows.map(formatPost));
});

router.get("/posts/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!id || !Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
  const [post] = await db.select().from(communityPostsTable).where(eq(communityPostsTable.id, id));
  if (!post) return res.status(404).json({ error: "Not found" });
  return res.json(formatPost(post));
});

router.get("/news", async (req, res) => {
  const lang = req.query.lang === "en" ? "en" : "sv";
  const cacheKey = `news:${lang}`;
  try {
    if (newsCache[cacheKey] && newsCache[cacheKey].expiresAt > Date.now()) {
      res.set("Cache-Control", "public, max-age=0, s-maxage=604800, stale-while-revalidate=86400");
      return res.json(newsCache[cacheKey].items);
    }
    const feedResults = await Promise.allSettled(NEWS_FEEDS.map(fetchFeed));
    const swedishItems = feedResults.flatMap((r) => r.status === "fulfilled" ? r.value : []).sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt)).slice(0, 8);
    newsCache["news:sv"] = { expiresAt: Date.now() + WEEK_MS, items: swedishItems };
    const items = lang === "en" ? await translateNewsToEnglish(swedishItems) : swedishItems;
    const fullyTranslated = lang === "sv" || items.every((i) => i.language === "en");
    newsCache[cacheKey] = { expiresAt: Date.now() + (fullyTranslated ? WEEK_MS : 10 * 60 * 1000), items };
    res.set("Cache-Control", fullyTranslated ? "public, max-age=0, s-maxage=604800, stale-while-revalidate=86400" : "no-store");
    return res.json(items);
  } catch {
    res.set("Cache-Control", "no-store");
    return res.json(newsCache[cacheKey]?.items ?? newsCache["news:sv"]?.items ?? []);
  }
});

router.post("/posts", requireAuth, async (req, res) => {
  const parsed = CreateCommunityPostBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body" });
  const [post] = await db.insert(communityPostsTable).values({ recipeName: parsed.data.recipeName, chefName: parsed.data.chefName, description: parsed.data.description, category: parsed.data.category, costSek: String(parsed.data.costSek) }).returning();
  await db.insert(activityLogTable).values({ type: "recipe_shared", title: `Recept delat: ${post.recipeName}`, subtitle: `av ${post.chefName} · ${post.category}` });
  return res.status(201).json(formatPost(post));
});

router.post("/posts/:id/like", requireAuth, async (req, res) => {
  const parsed = LikeCommunityPostParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });
  const [post] = await db.update(communityPostsTable).set({ likes: sql`likes + 1` }).where(eq(communityPostsTable.id, parsed.data.id)).returning();
  if (!post) return res.status(404).json({ error: "Not found" });
  return res.json(formatPost(post));
});

function formatPost(p: typeof communityPostsTable.$inferSelect) {
  return { id: p.id, recipeName: p.recipeName, chefName: p.chefName, description: p.description, category: p.category, costSek: parseFloat(String(p.costSek)), likes: p.likes, createdAt: p.createdAt.toISOString() };
}

async function translateNewsToEnglish(items: NewsItem[]) {
  if (!items.length) return items;
  const client = getAiClient();
  if (!client) return items.map((i) => ({ ...i, language: "sv" as const }));
  try {
    const response = await client.messages.create({ model: "claude-haiku-4-5", max_tokens: 4000, system: "Translate Swedish restaurant industry news into natural, concise English. Return only raw JSON with no markdown, no prose, and no code fences.", messages: [{ role: "user", content: JSON.stringify({ instruction: "Translate each title and summary to English. Preserve id, source, url, and publishedAt exactly. Return a JSON array.", items: items.map(({ id, title, summary, source, url, publishedAt }) => ({ id, title, summary, source, url, publishedAt })) }) }] });
    const raw = response.content[0]?.type === "text" ? response.content[0].text : "[]";
    const jsonText = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
    const match = jsonText.match(/\[[\s\S]*\]/);
    const parsed = JSON.parse(match?.[0] ?? jsonText) as Array<Partial<NewsItem>>;
    const byId = new Map(parsed.map((i) => [i.id, i]));
    return items.map((item) => { const t = byId.get(item.id); return { ...item, title: typeof t?.title === "string" && t.title.trim() ? t.title : item.title, summary: typeof t?.summary === "string" && t.summary.trim() ? t.summary : item.summary, language: "en" as const, translatedFrom: "sv" as const }; });
  } catch { return items.map((i) => ({ ...i, language: "sv" as const })); }
}

async function fetchFeed(feed: { source: string; url: string }): Promise<NewsItem[]> {
  const response = await fetch(feed.url, { headers: { Accept: "application/rss+xml, application/xml, text/xml", "User-Agent": "Smakvarlden/1.0 (+https://github.com/msx9973/smakvarlden-course)" } });
  if (!response.ok) return [];
  return parseRss(await response.text(), feed.source);
}

function parseRss(xml: string, source: string): NewsItem[] {
  return [...xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)].map((match) => {
    const item = match[0];
    const title = decodeXml(readTag(item, "title"));
    const url = decodeXml(readTag(item, "link"));
    const summary = stripHtml(decodeXml(readTag(item, "description"))).slice(0, 220);
    const pubDate = readTag(item, "pubDate");
    return { id: `${source}:${url || title}`, title, summary, source, url, publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(), language: "sv" };
  }).filter((i) => i.title && i.url);
}

function readTag(xml: string, tag: string) {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\/${tag}>`, "i"));
  return match ? match[1].replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "").trim() : "";
}

function decodeXml(v: string) { return v.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'"); }
function stripHtml(v: string) { return v.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(); }

export default router;
