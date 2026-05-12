import { Router } from "express";
import { db, communityPostsTable, activityLogTable } from "@workspace/db";
import { eq, ilike, desc, sql } from "drizzle-orm";
import {
  CreateCommunityPostBody,
  ListCommunityPostsQueryParams,
  LikeCommunityPostParams,
} from "@workspace/api-zod";

const router = Router();

type NewsItem = {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: string;
};

const NEWS_FEEDS = [
  {
    source: "Food Supply",
    url: "https://www.food-supply.se/xml/rss2/articles?description=true",
  },
];

let newsCache: { expiresAt: number; items: NewsItem[] } | null = null;

router.get("/posts", async (req, res) => {
  const parsed = ListCommunityPostsQueryParams.safeParse(req.query);
  const search = parsed.success ? parsed.data.search : undefined;
  const rows = await db.select().from(communityPostsTable)
    .where(search ? ilike(communityPostsTable.recipeName, `%${search}%`) : undefined)
    .orderBy(desc(communityPostsTable.createdAt));
  return res.json(rows.map(formatPost));
});

router.get("/news", async (_req, res) => {
  try {
    if (newsCache && newsCache.expiresAt > Date.now()) {
      return res.json(newsCache.items);
    }

    const feedResults = await Promise.allSettled(NEWS_FEEDS.map(fetchFeed));
    const items = feedResults
      .flatMap((result) => result.status === "fulfilled" ? result.value : [])
      .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
      .slice(0, 8);

    newsCache = { expiresAt: Date.now() + 15 * 60 * 1000, items };
    return res.json(items);
  } catch {
    return res.json(newsCache?.items ?? []);
  }
});

router.post("/posts", async (req, res) => {
  const parsed = CreateCommunityPostBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body" });
  const [post] = await db.insert(communityPostsTable).values({
    recipeName: parsed.data.recipeName,
    chefName: parsed.data.chefName,
    description: parsed.data.description,
    category: parsed.data.category,
    costSek: String(parsed.data.costSek),
  }).returning();
  await db.insert(activityLogTable).values({
    type: "recipe_shared",
    title: `Recept delat: ${post.recipeName}`,
    subtitle: `av ${post.chefName} · ${post.category}`,
  });
  return res.status(201).json(formatPost(post));
});

router.post("/posts/:id/like", async (req, res) => {
  const parsed = LikeCommunityPostParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });
  const [post] = await db.update(communityPostsTable)
    .set({ likes: sql`likes + 1` })
    .where(eq(communityPostsTable.id, parsed.data.id))
    .returning();
  if (!post) return res.status(404).json({ error: "Not found" });
  return res.json(formatPost(post));
});

function formatPost(p: typeof communityPostsTable.$inferSelect) {
  return {
    id: p.id,
    recipeName: p.recipeName,
    chefName: p.chefName,
    description: p.description,
    category: p.category,
    costSek: parseFloat(String(p.costSek)),
    likes: p.likes,
    createdAt: p.createdAt.toISOString(),
  };
}

async function fetchFeed(feed: { source: string; url: string }): Promise<NewsItem[]> {
  const response = await fetch(feed.url, {
    headers: {
      "Accept": "application/rss+xml, application/xml, text/xml",
      "User-Agent": "Smakvarlden/1.0 (+https://github.com/msx9973/smakvarlden-course)",
    },
  });
  if (!response.ok) return [];
  const xml = await response.text();
  return parseRss(xml, feed.source);
}

function parseRss(xml: string, source: string): NewsItem[] {
  return [...xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)].map((match) => {
    const item = match[0];
    const title = decodeXml(readTag(item, "title"));
    const url = decodeXml(readTag(item, "link"));
    const summary = stripHtml(decodeXml(readTag(item, "description"))).slice(0, 220);
    const pubDate = readTag(item, "pubDate");
    const publishedAt = pubDate ? new Date(pubDate).toISOString() : new Date().toISOString();
    return {
      id: `${source}:${url || title}`,
      title,
      summary,
      source,
      url,
      publishedAt,
    };
  }).filter((item) => item.title && item.url);
}

function readTag(xml: string, tag: string) {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? match[1].replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "").trim() : "";
}

function decodeXml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export default router;
