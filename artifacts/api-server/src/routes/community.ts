import { Router } from "express";
import { db, communityPostsTable, activityLogTable } from "@workspace/db";
import { eq, ilike, desc, sql } from "drizzle-orm";
import { demoRecipes, hasDemoFallbackError } from "../lib/demo-data";
import {
  CreateCommunityPostBody,
  ListCommunityPostsQueryParams,
  LikeCommunityPostParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/posts", async (req, res) => {
  const parsed = ListCommunityPostsQueryParams.safeParse(req.query);
  const search = parsed.success ? parsed.data.search : undefined;
  try {
    const rows = await db.select().from(communityPostsTable)
      .where(search ? ilike(communityPostsTable.recipeName, `%${search}%`) : undefined)
      .orderBy(desc(communityPostsTable.createdAt));
    if (rows.length > 0) return res.json(rows.map(formatPost));
  } catch (error) {
    if (!hasDemoFallbackError(error)) throw error;
  }
  const normalizedSearch = search?.toLowerCase();
  return res.json(demoRecipes
    .filter((recipe) => recipe.isShared)
    .filter((recipe) => !normalizedSearch || recipe.name.toLowerCase().includes(normalizedSearch))
    .map((recipe, index) => ({
      id: recipe.id,
      recipeName: recipe.name,
      chefName: ["Chef Erik", "Chef Sofia", "Chef Marco", "Chef Priya"][index % 4],
      description: recipe.description ?? "",
      category: recipe.category,
      costSek: recipe.totalCostSek,
      likes: 12 + index * 7,
      createdAt: recipe.createdAt.toISOString(),
    })));
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

export default router;
