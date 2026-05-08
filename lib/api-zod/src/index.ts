import { z } from "zod";

const IdParam = z.object({ id: z.coerce.number().int().positive() });

export const HealthCheckResponse = z.object({
  status: z.string(),
  uptime: z.number().optional(),
});

export const ListRecipesQueryParams = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
});

export const RecipeIngredientInput = z.object({
  ingredientId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().positive(),
  unit: z.string().min(1),
});

export const CreateRecipeBody = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().min(1),
  servings: z.coerce.number().int().positive().default(4),
  sellingPriceSek: z.coerce.number().min(0),
  isShared: z.boolean().optional(),
  ingredients: z.array(RecipeIngredientInput).optional(),
});

export const UpdateRecipeBody = CreateRecipeBody.partial();
export const GetRecipeParams = IdParam;
export const UpdateRecipeParams = IdParam;
export const DeleteRecipeParams = IdParam;
export const GetTopPerformingRecipesQueryParams = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const ListIngredientsQueryParams = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
});

export const CreateIngredientBody = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  unit: z.string().min(1),
  currentPriceSek: z.coerce.number().min(0),
  supplier: z.string().optional(),
});

export const UpdateIngredientBody = CreateIngredientBody.partial();
export const GetIngredientParams = IdParam;
export const UpdateIngredientParams = IdParam;
export const DeleteIngredientParams = IdParam;

export const ListCommunityPostsQueryParams = z.object({
  search: z.string().optional(),
});

export const CreateCommunityPostBody = z.object({
  recipeName: z.string().min(1),
  chefName: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1),
  costSek: z.coerce.number().min(0),
});

export const LikeCommunityPostParams = IdParam;

export const GetDashboardRecentActivityQueryParams = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export type HealthCheckResponse = z.infer<typeof HealthCheckResponse>;
