import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeDemoRecipeEconomics } from "./demoRecipeEconomics.ts";

describe("computeDemoRecipeEconomics", () => {
  it("stores batch revenue and margin for högrev (not per-portion vs batch cost)", () => {
    // Ingredient prices/qty from demo seed for "Långbakad högrev med rotfrukter"
    const totalCostSek =
      159 * 1.15 + // Högrev
      18 * 0.9 + // Potatis
      16 * 0.45 + // Morot
      15 * 0.22 + // Gul lök
      248 * 0.02; // Timjan
    assert.equal(Math.round(totalCostSek * 100) / 100, 214.51);

    const brokenMargin =
      Math.round(((225 - totalCostSek) / 225) * 100 * 100) / 100;
    assert.equal(brokenMargin, 4.66);

    const { totalSellingPriceSek, profitMarginPct } = computeDemoRecipeEconomics({
      perPortionSellingPriceSek: 225,
      servings: 6,
      totalCostSek,
    });

    assert.equal(totalSellingPriceSek, 1350);
    assert.equal(profitMarginPct, 84.11);
  });

  it("returns zero margin when selling price is zero", () => {
    const result = computeDemoRecipeEconomics({
      perPortionSellingPriceSek: 0,
      servings: 4,
      totalCostSek: 40,
    });
    assert.equal(result.totalSellingPriceSek, 0);
    assert.equal(result.profitMarginPct, 0);
  });
});
