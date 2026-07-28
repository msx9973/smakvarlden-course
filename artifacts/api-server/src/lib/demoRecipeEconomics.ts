/**
 * Starter catalog prices are menu prices per portion.
 * Persisted recipes (and Calculator saves) store batch totals:
 *   sellingPriceSek = perPortion * servings
 *   totalCostSek    = sum(unitPrice * quantity) over the full batch
 * Margin must compare those same units.
 */
export function computeDemoRecipeEconomics(input: {
  perPortionSellingPriceSek: number;
  servings: number;
  totalCostSek: number;
}): {
  totalSellingPriceSek: number;
  profitMarginPct: number;
} {
  const servings = input.servings > 0 ? input.servings : 1;
  const totalSellingPriceSek =
    Math.round(input.perPortionSellingPriceSek * servings * 100) / 100;
  const profitMarginPct =
    totalSellingPriceSek > 0
      ? Math.round(
          ((totalSellingPriceSek - input.totalCostSek) / totalSellingPriceSek) *
            100 *
            100,
        ) / 100
      : 0;
  return { totalSellingPriceSek, profitMarginPct };
}
