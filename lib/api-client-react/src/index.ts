import { useMutation, useQuery, type QueryKey, type UseMutationOptions, type UseQueryOptions } from "@tanstack/react-query";

type QueryOptions<TData> = {
  query?: Omit<UseQueryOptions<TData, Error, TData, QueryKey>, "queryKey" | "queryFn"> & {
    queryKey?: QueryKey;
  };
};

type MutationOptions<TData, TVariables> = {
  mutation?: UseMutationOptions<TData, Error, TVariables>;
};

export type Ingredient = {
  id: number;
  name: string;
  category: string;
  unit: string;
  currentPriceSek: number;
  priceChangePct: number;
  supplier?: string;
  updatedAt: string;
};

export type Recipe = {
  id: number;
  name: string;
  description?: string;
  category: string;
  dietaryTags?: string[];
  allergens?: string[];
  allergyVersions?: string[];
  languageVersions?: Record<string, { name: string; description: string }>;
  servings: number;
  totalCostSek: number;
  sellingPriceSek: number;
  profitMarginPct: number;
  isShared: boolean;
  createdAt: string;
  updatedAt: string;
};

export type RecipeDetail = Recipe & {
  ingredients?: Array<{
    ingredientId: number;
    ingredientName: string;
    quantity: number;
    unit: string;
    unitPriceSek: number;
    lineCostSek: number;
  }>;
};

export type RecipePerformance = Pick<Recipe, "id" | "name" | "category" | "totalCostSek" | "sellingPriceSek" | "profitMarginPct"> & {
  profitSek: number;
};

export type DashboardSummary = {
  totalRecipes: number;
  totalIngredients: number;
  avgProfitMarginPct: number;
  avgRecipeCostSek: number;
  priceAlerts: number;
  sharedRecipes: number;
};

export type Activity = {
  id: number;
  type: string;
  title: string;
  subtitle: string;
  timestamp: string;
};

export type IngredientCategoryBreakdown = {
  category: string;
  count: number;
  avgPriceSek: number;
  totalPriceSek: number;
};

export type IngredientPriceTrend = {
  ingredientId: number;
  ingredientName: string;
  date: string;
  priceSek: number;
};

export type CommunityPost = {
  id: number;
  recipeName: string;
  chefName: string;
  description: string;
  category: string;
  costSek: number;
  likes: number;
  createdAt: string;
};

type ListParams = {
  category?: string;
  search?: string;
};

const API_BASE = "/api";

function queryString(params?: Record<string, unknown>) {
  const search = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    credentials: "include",
    ...init,
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const getListRecipesQueryKey = (params?: ListParams) => ["listRecipes", params ?? {}] as const;
export const getGetRecipeQueryKey = (id: number) => ["getRecipe", id] as const;
export const getGetTopPerformingRecipesQueryKey = (params?: { limit?: number }) => ["getTopPerformingRecipes", params ?? {}] as const;
export const getListIngredientsQueryKey = (params?: ListParams) => ["listIngredients", params ?? {}] as const;
export const getGetIngredientPriceTrendsQueryKey = () => ["getIngredientPriceTrends"] as const;
export const getGetIngredientCategoryBreakdownQueryKey = () => ["getIngredientCategoryBreakdown"] as const;
export const getGetDashboardSummaryQueryKey = () => ["getDashboardSummary"] as const;
export const getGetDashboardRecentActivityQueryKey = (params?: { limit?: number }) => ["getDashboardRecentActivity", params ?? {}] as const;
export const getListCommunityPostsQueryKey = (params?: { search?: string }) => ["listCommunityPosts", params ?? {}] as const;

export function useListRecipes(params?: ListParams, options?: QueryOptions<Recipe[]>) {
  return useQuery({
    queryKey: options?.query?.queryKey ?? getListRecipesQueryKey(params),
    queryFn: () => request<Recipe[]>(`/recipes${queryString(params)}`),
    ...options?.query,
  });
}

export function useGetRecipe(id: number, options?: QueryOptions<RecipeDetail>) {
  return useQuery({
    queryKey: options?.query?.queryKey ?? getGetRecipeQueryKey(id),
    queryFn: () => request<RecipeDetail>(`/recipes/${id}`),
    ...options?.query,
  });
}

export function useCreateRecipe(options?: MutationOptions<Recipe, { data: Partial<Recipe> & { ingredients?: unknown[] } }>) {
  return useMutation({
    mutationFn: ({ data }) => request<Recipe>("/recipes", { method: "POST", body: JSON.stringify(data) }),
    ...options?.mutation,
  });
}

export function useDeleteRecipe(options?: MutationOptions<void, { id: number }>) {
  return useMutation({
    mutationFn: ({ id }) => request<void>(`/recipes/${id}`, { method: "DELETE" }),
    ...options?.mutation,
  });
}

export function useGetTopPerformingRecipes(params?: { limit?: number }, options?: QueryOptions<RecipePerformance[]>) {
  return useQuery({
    queryKey: options?.query?.queryKey ?? getGetTopPerformingRecipesQueryKey(params),
    queryFn: () => request<RecipePerformance[]>(`/recipes/top-performing${queryString(params)}`),
    ...options?.query,
  });
}

export function useListIngredients(params?: ListParams, options?: QueryOptions<Ingredient[]>) {
  return useQuery({
    queryKey: options?.query?.queryKey ?? getListIngredientsQueryKey(params),
    queryFn: () => request<Ingredient[]>(`/ingredients${queryString(params)}`),
    ...options?.query,
  });
}

export function useCreateIngredient(options?: MutationOptions<Ingredient, { data: Partial<Ingredient> }>) {
  return useMutation({
    mutationFn: ({ data }) => request<Ingredient>("/ingredients", { method: "POST", body: JSON.stringify(data) }),
    ...options?.mutation,
  });
}

export function useDeleteIngredient(options?: MutationOptions<void, { id: number }>) {
  return useMutation({
    mutationFn: ({ id }) => request<void>(`/ingredients/${id}`, { method: "DELETE" }),
    ...options?.mutation,
  });
}

export function useGetIngredientPriceTrends(options?: QueryOptions<IngredientPriceTrend[]>) {
  return useQuery({
    queryKey: options?.query?.queryKey ?? getGetIngredientPriceTrendsQueryKey(),
    queryFn: () => request<IngredientPriceTrend[]>("/ingredients/price-trends"),
    ...options?.query,
  });
}

export function useGetIngredientCategoryBreakdown(options?: QueryOptions<IngredientCategoryBreakdown[]>) {
  return useQuery({
    queryKey: options?.query?.queryKey ?? getGetIngredientCategoryBreakdownQueryKey(),
    queryFn: () => request<IngredientCategoryBreakdown[]>("/ingredients/category-breakdown"),
    ...options?.query,
  });
}

export function useGetDashboardSummary(options?: QueryOptions<DashboardSummary>) {
  return useQuery({
    queryKey: options?.query?.queryKey ?? getGetDashboardSummaryQueryKey(),
    queryFn: () => request<DashboardSummary>("/dashboard/summary"),
    ...options?.query,
  });
}

export function useGetDashboardRecentActivity(params?: { limit?: number }, options?: QueryOptions<Activity[]>) {
  return useQuery({
    queryKey: options?.query?.queryKey ?? getGetDashboardRecentActivityQueryKey(params),
    queryFn: () => request<Activity[]>(`/dashboard/recent-activity${queryString(params)}`),
    ...options?.query,
  });
}

export function useListCommunityPosts(params?: { search?: string }, options?: QueryOptions<CommunityPost[]>) {
  return useQuery({
    queryKey: options?.query?.queryKey ?? getListCommunityPostsQueryKey(params),
    queryFn: () => request<CommunityPost[]>(`/community/posts${queryString(params)}`),
    ...options?.query,
  });
}

export function useCreateCommunityPost(options?: MutationOptions<CommunityPost, { data: Partial<CommunityPost> }>) {
  return useMutation({
    mutationFn: ({ data }) => request<CommunityPost>("/community/posts", { method: "POST", body: JSON.stringify(data) }),
    ...options?.mutation,
  });
}

export function useLikeCommunityPost(options?: MutationOptions<CommunityPost, { id: number }>) {
  return useMutation({
    mutationFn: ({ id }) => request<CommunityPost>(`/community/posts/${id}/like`, { method: "POST" }),
    ...options?.mutation,
  });
}
