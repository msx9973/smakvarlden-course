import {
  useQuery,
  useMutation,
  useQueryClient,
  type QueryKey,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";

type QueryOptions<TData> = {
  query?: Omit<UseQueryOptions<TData, Error, TData, QueryKey>, "queryKey" | "queryFn"> & {
    queryKey?: QueryKey;
  };
};
type MutationOptions<TData, TVariables> = {
  mutation?: UseMutationOptions<TData, Error, TVariables>;
};

/* ── API base URL ─────────────────────────────────────── */

function apiBase(): string {
  if (typeof import.meta !== "undefined") {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const base = (import.meta as any).env?.BASE_URL as string | undefined;
      if (base) return base.replace(/\/$/, "");
    } catch {
      /* ignore */
    }
  }
  return "";
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${apiBase()}/api${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  if (res.status === 204) return undefined as T;
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

/* ── Types ────────────────────────────────────────────── */

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

export type RecipePerformance = Pick<
  Recipe,
  "id" | "name" | "category" | "totalCostSek" | "sellingPriceSek" | "profitMarginPct"
> & { profitSek: number };

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

type ListParams = { category?: string; search?: string };

/* ── Query keys ───────────────────────────────────────── */

export const getListRecipesQueryKey = (params?: ListParams) =>
  ["listRecipes", params ?? {}] as const;

export const getGetRecipeQueryKey = (id: number) => ["getRecipe", id] as const;

export const getGetTopPerformingRecipesQueryKey = (params?: { limit?: number }) =>
  ["getTopPerformingRecipes", params ?? {}] as const;

export const getListIngredientsQueryKey = (params?: ListParams) =>
  ["listIngredients", params ?? {}] as const;

export const getGetIngredientPriceTrendsQueryKey = () =>
  ["getIngredientPriceTrends"] as const;

export const getGetIngredientCategoryBreakdownQueryKey = () =>
  ["getIngredientCategoryBreakdown"] as const;

export const getGetDashboardSummaryQueryKey = () => ["getDashboardSummary"] as const;

export const getGetDashboardRecentActivityQueryKey = (params?: { limit?: number }) =>
  ["getDashboardRecentActivity", params ?? {}] as const;

export const getListCommunityPostsQueryKey = (params?: { search?: string }) =>
  ["listCommunityPosts", params ?? {}] as const;

/* ── Recipe hooks ─────────────────────────────────────── */

export function useListRecipes(params?: ListParams, options?: QueryOptions<Recipe[]>) {
  const qs = new URLSearchParams();
  if (params?.category) qs.set("category", params.category);
  if (params?.search) qs.set("search", params.search);
  const q = qs.toString();
  return useQuery({
    queryKey: options?.query?.queryKey ?? getListRecipesQueryKey(params),
    queryFn: () => apiFetch<Recipe[]>(`/recipes${q ? `?${q}` : ""}`),
    ...options?.query,
  });
}

export function useGetRecipe(id: number, options?: QueryOptions<RecipeDetail>) {
  return useQuery({
    queryKey: options?.query?.queryKey ?? getGetRecipeQueryKey(id),
    queryFn: () => apiFetch<RecipeDetail>(`/recipes/${id}`),
    ...options?.query,
  });
}

export function useCreateRecipe(
  options?: MutationOptions<Recipe, { data: Partial<Recipe> & { ingredients?: unknown[] } }>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ data }) =>
      apiFetch<Recipe>("/recipes", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["listRecipes"] }),
    ...options?.mutation,
  });
}

export function useDeleteRecipe(options?: MutationOptions<void, { id: number }>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }) => apiFetch<void>(`/recipes/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["listRecipes"] }),
    ...options?.mutation,
  });
}

export function useGetTopPerformingRecipes(
  params?: { limit?: number },
  options?: QueryOptions<RecipePerformance[]>,
) {
  const qs = new URLSearchParams();
  if (params?.limit) qs.set("limit", String(params.limit));
  const q = qs.toString();
  return useQuery({
    queryKey: options?.query?.queryKey ?? getGetTopPerformingRecipesQueryKey(params),
    queryFn: () => apiFetch<RecipePerformance[]>(`/recipes/top-performing${q ? `?${q}` : ""}`),
    ...options?.query,
  });
}

/* ── Ingredient hooks ─────────────────────────────────── */

export function useListIngredients(params?: ListParams, options?: QueryOptions<Ingredient[]>) {
  const qs = new URLSearchParams();
  if (params?.category) qs.set("category", params.category);
  if (params?.search) qs.set("search", params.search);
  const q = qs.toString();
  return useQuery({
    queryKey: options?.query?.queryKey ?? getListIngredientsQueryKey(params),
    queryFn: () => apiFetch<Ingredient[]>(`/ingredients${q ? `?${q}` : ""}`),
    ...options?.query,
  });
}

export function useCreateIngredient(
  options?: MutationOptions<Ingredient, { data: Partial<Ingredient> }>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ data }) =>
      apiFetch<Ingredient>("/ingredients", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["listIngredients"] }),
    ...options?.mutation,
  });
}

export function useDeleteIngredient(options?: MutationOptions<void, { id: number }>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }) => apiFetch<void>(`/ingredients/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["listIngredients"] }),
    ...options?.mutation,
  });
}

export function useGetIngredientPriceTrends(options?: QueryOptions<IngredientPriceTrend[]>) {
  return useQuery({
    queryKey: options?.query?.queryKey ?? getGetIngredientPriceTrendsQueryKey(),
    queryFn: () => apiFetch<IngredientPriceTrend[]>("/ingredients/price-trends"),
    ...options?.query,
  });
}

export function useGetIngredientCategoryBreakdown(
  options?: QueryOptions<IngredientCategoryBreakdown[]>,
) {
  return useQuery({
    queryKey: options?.query?.queryKey ?? getGetIngredientCategoryBreakdownQueryKey(),
    queryFn: () =>
      apiFetch<IngredientCategoryBreakdown[]>("/ingredients/category-breakdown"),
    ...options?.query,
  });
}

/* ── Dashboard hooks ──────────────────────────────────── */

export function useGetDashboardSummary(options?: QueryOptions<DashboardSummary>) {
  return useQuery({
    queryKey: options?.query?.queryKey ?? getGetDashboardSummaryQueryKey(),
    queryFn: () => apiFetch<DashboardSummary>("/dashboard/summary"),
    ...options?.query,
  });
}

export function useGetDashboardRecentActivity(
  params?: { limit?: number },
  options?: QueryOptions<Activity[]>,
) {
  const qs = new URLSearchParams();
  if (params?.limit) qs.set("limit", String(params.limit));
  const q = qs.toString();
  return useQuery({
    queryKey: options?.query?.queryKey ?? getGetDashboardRecentActivityQueryKey(params),
    queryFn: () => apiFetch<Activity[]>(`/dashboard/recent-activity${q ? `?${q}` : ""}`),
    ...options?.query,
  });
}

/* ── Community hooks ──────────────────────────────────── */

export function getGetCommunityPostQueryKey(id: number) { return ["getCommunityPost", id] as const; }

export function useGetCommunityPost(id: number, options?: QueryOptions<CommunityPost>) {
  return useQuery({
    queryKey: options?.query?.queryKey ?? getGetCommunityPostQueryKey(id),
    queryFn: () => apiFetch<CommunityPost>(`/community/posts/${id}`),
    enabled: !!id,
    ...options?.query,
  });
}

export function useListCommunityPosts(
  params?: { search?: string },
  options?: QueryOptions<CommunityPost[]>,
) {
  const qs = new URLSearchParams();
  if (params?.search) qs.set("search", params.search);
  const q = qs.toString();
  return useQuery({
    queryKey: options?.query?.queryKey ?? getListCommunityPostsQueryKey(params),
    queryFn: () => apiFetch<CommunityPost[]>(`/community/posts${q ? `?${q}` : ""}`),
    ...options?.query,
  });
}

export function useCreateCommunityPost(
  options?: MutationOptions<CommunityPost, { data: Partial<CommunityPost> }>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ data }) =>
      apiFetch<CommunityPost>("/community/posts", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["listCommunityPosts"] }),
    ...options?.mutation,
  });
}

export function useLikeCommunityPost(options?: MutationOptions<CommunityPost, { id: number }>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }) =>
      apiFetch<CommunityPost>(`/community/posts/${id}/like`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["listCommunityPosts"] }),
    ...options?.mutation,
  });
}
