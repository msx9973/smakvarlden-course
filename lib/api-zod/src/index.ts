import { z } from "zod";

/* ── Health ─────────────────────────────────────────── */

export const HealthCheckResponse = z.object({ status: z.string() });

/* ── Shared ─────────────────────────────────────────── */

const ListQueryParams = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
});

const IdParam = z.object({ id: z.number().int().positive() });

/* ── Ingredients ────────────────────────────────────── */

export const ListIngredientsQueryParams = ListQueryParams;

export const GetIngredientParams = IdParam;

export const CreateIngredientBody = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  unit: z.string().min(1),
  currentPriceSek: z.number().nonnegative(),
  supplier: z.string().optional(),
});

export const UpdateIngredientBody = CreateIngredientBody.partial();

export const UpdateIngredientParams = IdParam;

export const DeleteIngredientParams = IdParam;

/* ── Recipes ────────────────────────────────────────── */

export const ListRecipesQueryParams = ListQueryParams;

export const GetRecipeParams = IdParam;

export const CreateRecipeBody = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().min(1),
  servings: z.number().int().min(1).default(4),
  sellingPriceSek: z.number().nonnegative(),
  isShared: z.boolean().optional(),
  ingredients: z
    .array(
      z.object({
        ingredientId: z.number().int().positive(),
        quantity: z.number().positive(),
        unit: z.string().min(1),
      }),
    )
    .optional(),
});

export const UpdateRecipeBody = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.string().min(1).optional(),
  servings: z.number().int().min(1).optional(),
  sellingPriceSek: z.number().nonnegative().optional(),
  isShared: z.boolean().optional(),
});

export const UpdateRecipeParams = IdParam;

export const DeleteRecipeParams = IdParam;

export const GetTopPerformingRecipesQueryParams = z.object({
  limit: z.coerce.number().int().positive().max(50).optional(),
});

/* ── Community ──────────────────────────────────────── */

export const ListCommunityPostsQueryParams = z.object({
  search: z.string().optional(),
});

export const CreateCommunityPostBody = z.object({
  recipeName: z.string().min(1),
  chefName: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1),
  costSek: z.number().nonnegative(),
});

export const LikeCommunityPostParams = IdParam;

/* ── Dashboard ──────────────────────────────────────── */

export const GetDashboardRecentActivityQueryParams = z.object({
  limit: z.coerce.number().int().positive().max(50).optional(),
});
