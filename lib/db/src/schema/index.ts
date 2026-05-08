import { pgTable, serial, text, integer, numeric, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const activityTypeEnum = pgEnum("activity_type", [
  "recipe_created",
  "recipe_updated",
  "price_change",
  "recipe_shared",
]);

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("user"),
  plan: text("plan").notNull().default("free"),
  stripeCustomerId: text("stripe_customer_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const ingredientsTable = pgTable("ingredients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  unit: text("unit").notNull(),
  currentPriceSek: numeric("current_price_sek", { precision: 10, scale: 2 }).notNull(),
  priceChangePct: numeric("price_change_pct", { precision: 6, scale: 2 }).notNull().default("0"),
  supplier: text("supplier"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const recipesTable = pgTable("recipes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  cuisine: text("cuisine"),
  emoji: text("emoji"),
  servings: integer("servings").notNull().default(4),
  totalCostSek: numeric("total_cost_sek", { precision: 10, scale: 2 }).notNull().default("0"),
  sellingPriceSek: numeric("selling_price_sek", { precision: 10, scale: 2 }).notNull(),
  profitMarginPct: numeric("profit_margin_pct", { precision: 6, scale: 2 }).notNull().default("0"),
  isShared: boolean("is_shared").notNull().default(false),
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const recipeIngredientsTable = pgTable("recipe_ingredients", {
  id: serial("id").primaryKey(),
  recipeId: integer("recipe_id").notNull().references(() => recipesTable.id, { onDelete: "cascade" }),
  ingredientId: integer("ingredient_id").notNull().references(() => ingredientsTable.id, { onDelete: "cascade" }),
  quantity: numeric("quantity", { precision: 10, scale: 3 }).notNull(),
  unit: text("unit").notNull(),
});

export const activityLogTable = pgTable("activity_log", {
  id: serial("id").primaryKey(),
  type: activityTypeEnum("type").notNull(),
  title: text("title").notNull(),
  subtitle: text("subtitle").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const communityPostsTable = pgTable("community_posts", {
  id: serial("id").primaryKey(),
  recipeName: text("recipe_name").notNull(),
  chefName: text("chef_name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  costSek: numeric("cost_sek", { precision: 10, scale: 2 }).notNull(),
  likes: integer("likes").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertIngredientSchema = createInsertSchema(ingredientsTable).omit({ id: true, updatedAt: true });
export const insertRecipeSchema = createInsertSchema(recipesTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCommunityPostSchema = createInsertSchema(communityPostsTable).omit({ id: true, likes: true, createdAt: true });
export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, role: true });

export type InsertIngredient = z.infer<typeof insertIngredientSchema>;
export type Ingredient = typeof ingredientsTable.$inferSelect;
export type InsertRecipe = z.infer<typeof insertRecipeSchema>;
export type Recipe = typeof recipesTable.$inferSelect;
export type RecipeIngredient = typeof recipeIngredientsTable.$inferSelect;
export type InsertCommunityPost = z.infer<typeof insertCommunityPostSchema>;
export type CommunityPost = typeof communityPostsTable.$inferSelect;
export type ActivityLog = typeof activityLogTable.$inferSelect;
export type User = typeof usersTable.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
