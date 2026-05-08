import { type QueryKey, type UseMutationOptions, type UseQueryOptions } from "@tanstack/react-query";
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
    languageVersions?: Record<string, {
        name: string;
        description: string;
    }>;
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
export declare const getListRecipesQueryKey: (params?: ListParams) => readonly ["listRecipes", ListParams];
export declare const getGetRecipeQueryKey: (id: number) => readonly ["getRecipe", number];
export declare const getGetTopPerformingRecipesQueryKey: (params?: {
    limit?: number;
}) => readonly ["getTopPerformingRecipes", {
    limit?: number;
}];
export declare const getListIngredientsQueryKey: (params?: ListParams) => readonly ["listIngredients", ListParams];
export declare const getGetIngredientPriceTrendsQueryKey: () => readonly ["getIngredientPriceTrends"];
export declare const getGetIngredientCategoryBreakdownQueryKey: () => readonly ["getIngredientCategoryBreakdown"];
export declare const getGetDashboardSummaryQueryKey: () => readonly ["getDashboardSummary"];
export declare const getGetDashboardRecentActivityQueryKey: (params?: {
    limit?: number;
}) => readonly ["getDashboardRecentActivity", {
    limit?: number;
}];
export declare const getListCommunityPostsQueryKey: (params?: {
    search?: string;
}) => readonly ["listCommunityPosts", {
    search?: string;
}];
export declare function useListRecipes(params?: ListParams, options?: QueryOptions<Recipe[]>): import("@tanstack/react-query").UseQueryResult<Recipe[], Error>;
export declare function useGetRecipe(id: number, options?: QueryOptions<RecipeDetail>): import("@tanstack/react-query").UseQueryResult<RecipeDetail, Error>;
export declare function useCreateRecipe(options?: MutationOptions<Recipe, {
    data: Partial<Recipe> & {
        ingredients?: unknown[];
    };
}>): import("@tanstack/react-query").UseMutationResult<Recipe, Error, {
    data: Partial<Recipe> & {
        ingredients?: unknown[];
    };
}, unknown>;
export declare function useDeleteRecipe(options?: MutationOptions<void, {
    id: number;
}>): import("@tanstack/react-query").UseMutationResult<void, Error, {
    id: number;
}, unknown>;
export declare function useGetTopPerformingRecipes(params?: {
    limit?: number;
}, options?: QueryOptions<RecipePerformance[]>): import("@tanstack/react-query").UseQueryResult<RecipePerformance[], Error>;
export declare function useListIngredients(params?: ListParams, options?: QueryOptions<Ingredient[]>): import("@tanstack/react-query").UseQueryResult<Ingredient[], Error>;
export declare function useCreateIngredient(options?: MutationOptions<Ingredient, {
    data: Partial<Ingredient>;
}>): import("@tanstack/react-query").UseMutationResult<Ingredient, Error, {
    data: Partial<Ingredient>;
}, unknown>;
export declare function useDeleteIngredient(options?: MutationOptions<void, {
    id: number;
}>): import("@tanstack/react-query").UseMutationResult<void, Error, {
    id: number;
}, unknown>;
export declare function useGetIngredientPriceTrends(options?: QueryOptions<IngredientPriceTrend[]>): import("@tanstack/react-query").UseQueryResult<IngredientPriceTrend[], Error>;
export declare function useGetIngredientCategoryBreakdown(options?: QueryOptions<IngredientCategoryBreakdown[]>): import("@tanstack/react-query").UseQueryResult<IngredientCategoryBreakdown[], Error>;
export declare function useGetDashboardSummary(options?: QueryOptions<DashboardSummary>): import("@tanstack/react-query").UseQueryResult<DashboardSummary, Error>;
export declare function useGetDashboardRecentActivity(params?: {
    limit?: number;
}, options?: QueryOptions<Activity[]>): import("@tanstack/react-query").UseQueryResult<Activity[], Error>;
export declare function useListCommunityPosts(params?: {
    search?: string;
}, options?: QueryOptions<CommunityPost[]>): import("@tanstack/react-query").UseQueryResult<CommunityPost[], Error>;
export declare function useCreateCommunityPost(options?: MutationOptions<CommunityPost, {
    data: Partial<CommunityPost>;
}>): import("@tanstack/react-query").UseMutationResult<CommunityPost, Error, {
    data: Partial<CommunityPost>;
}, unknown>;
export declare function useLikeCommunityPost(options?: MutationOptions<CommunityPost, {
    id: number;
}>): import("@tanstack/react-query").UseMutationResult<CommunityPost, Error, {
    id: number;
}, unknown>;
export {};
//# sourceMappingURL=index.d.ts.map