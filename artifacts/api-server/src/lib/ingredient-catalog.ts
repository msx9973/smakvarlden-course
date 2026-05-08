export type IngredientCatalogItem = {
  name: string;
  category: string;
  unit: string;
  priceSek: number;
  priceChangePct: number;
  supplier: string;
  source: "public_grossist_page" | "public_retail_market" | "market_estimate";
  confidence: "high" | "medium" | "low";
};

export const catalogUpdatedAt = new Date("2026-05-07T00:00:00.000Z");

export const ingredientCatalog: IngredientCatalogItem[] = [
  { name: "Kycklingfile", category: "Kott", unit: "kg", priceSek: 95, priceChangePct: 4.1, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Kycklinglarfile", category: "Kott", unit: "kg", priceSek: 82, priceChangePct: 3.4, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Hel kyckling", category: "Kott", unit: "kg", priceSek: 58, priceChangePct: 2.1, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Notfars", category: "Kott", unit: "kg", priceSek: 89, priceChangePct: -2.3, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Hogrevsfars", category: "Kott", unit: "kg", priceSek: 118, priceChangePct: 1.8, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Notfile", category: "Kott", unit: "kg", priceSek: 380, priceChangePct: 5.0, supplier: "Public market estimate", source: "market_estimate", confidence: "low" },
  { name: "Entrecote", category: "Kott", unit: "kg", priceSek: 295, priceChangePct: 4.2, supplier: "Public market estimate", source: "market_estimate", confidence: "low" },
  { name: "Flaskkarre", category: "Kott", unit: "kg", priceSek: 78, priceChangePct: 1.6, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Flaskfile", category: "Kott", unit: "kg", priceSek: 119, priceChangePct: 2.2, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Bacon", category: "Kott", unit: "kg", priceSek: 145, priceChangePct: 2.9, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Chorizo", category: "Kott", unit: "kg", priceSek: 125, priceChangePct: 2.4, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Lammstek", category: "Kott", unit: "kg", priceSek: 165, priceChangePct: 5.4, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },

  { name: "Laxfile", category: "Fisk & skaldjur", unit: "kg", priceSek: 185, priceChangePct: 8.4, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Torskfile", category: "Fisk & skaldjur", unit: "kg", priceSek: 145, priceChangePct: 3.2, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Sejfile", category: "Fisk & skaldjur", unit: "kg", priceSek: 95, priceChangePct: 2.8, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Rakskalade", category: "Fisk & skaldjur", unit: "kg", priceSek: 160, priceChangePct: 6.8, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Musslor", category: "Fisk & skaldjur", unit: "kg", priceSek: 64, priceChangePct: 2.0, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Pilgrimsmussla", category: "Fisk & skaldjur", unit: "kg", priceSek: 320, priceChangePct: 7.5, supplier: "Public market estimate", source: "market_estimate", confidence: "low" },
  { name: "Tonfisk", category: "Fisk & skaldjur", unit: "kg", priceSek: 210, priceChangePct: 4.8, supplier: "Public market estimate", source: "market_estimate", confidence: "low" },

  { name: "Smor", category: "Mejeri", unit: "kg", priceSek: 95, priceChangePct: 4.9, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Mjolk", category: "Mejeri", unit: "liter", priceSek: 12, priceChangePct: 2.6, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Vispgradde", category: "Mejeri", unit: "liter", priceSek: 35, priceChangePct: 2.0, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Creme fraiche", category: "Mejeri", unit: "kg", priceSek: 48, priceChangePct: 2.1, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Yoghurt naturell", category: "Mejeri", unit: "kg", priceSek: 28, priceChangePct: 1.9, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Parmesan", category: "Mejeri", unit: "kg", priceSek: 280, priceChangePct: 7.2, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Mozzarella", category: "Mejeri", unit: "kg", priceSek: 120, priceChangePct: 1.4, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Fetaost", category: "Mejeri", unit: "kg", priceSek: 125, priceChangePct: 2.6, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Agg", category: "Agg & mejeriprodukter", unit: "st", priceSek: 3.5, priceChangePct: 0.8, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },

  { name: "Potatis", category: "Gronsaker", unit: "kg", priceSek: 8, priceChangePct: -3.0, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Lok gul", category: "Gronsaker", unit: "kg", priceSek: 12, priceChangePct: -1.5, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Rodlok", category: "Gronsaker", unit: "kg", priceSek: 18, priceChangePct: -0.9, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Vitlok", category: "Gronsaker", unit: "kg", priceSek: 38, priceChangePct: 1.9, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Morot", category: "Gronsaker", unit: "kg", priceSek: 14, priceChangePct: -2.2, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Tomat", category: "Gronsaker", unit: "kg", priceSek: 25, priceChangePct: 6.2, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Gurka", category: "Gronsaker", unit: "kg", priceSek: 26, priceChangePct: 3.8, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Paprika rod", category: "Gronsaker", unit: "kg", priceSek: 45, priceChangePct: 5.7, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Broccoli", category: "Gronsaker", unit: "kg", priceSek: 28, priceChangePct: 3.7, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Spenat", category: "Gronsaker", unit: "kg", priceSek: 32, priceChangePct: 4.5, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Romansallat", category: "Gronsaker", unit: "kg", priceSek: 38, priceChangePct: 6.0, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Isbergssallad", category: "Gronsaker", unit: "kg", priceSek: 24, priceChangePct: 2.7, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Zucchini", category: "Gronsaker", unit: "kg", priceSek: 29, priceChangePct: 2.3, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Aubergine", category: "Gronsaker", unit: "kg", priceSek: 34, priceChangePct: 3.1, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Blomkal", category: "Gronsaker", unit: "kg", priceSek: 30, priceChangePct: 2.0, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Vitkal", category: "Gronsaker", unit: "kg", priceSek: 12, priceChangePct: -1.0, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Rodbeta", category: "Gronsaker", unit: "kg", priceSek: 16, priceChangePct: -1.4, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Avokado", category: "Gronsaker", unit: "st", priceSek: 11, priceChangePct: 4.4, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },

  { name: "Citron", category: "Frukt", unit: "kg", priceSek: 18, priceChangePct: 2.9, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Lime", category: "Frukt", unit: "kg", priceSek: 24, priceChangePct: 3.4, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Apple", category: "Frukt", unit: "kg", priceSek: 22, priceChangePct: 1.8, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Paron", category: "Frukt", unit: "kg", priceSek: 26, priceChangePct: 1.6, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Banan", category: "Frukt", unit: "kg", priceSek: 19, priceChangePct: 2.2, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Mango", category: "Frukt", unit: "st", priceSek: 18, priceChangePct: 3.9, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Jordgubbar", category: "Frukt", unit: "kg", priceSek: 95, priceChangePct: 8.0, supplier: "Public market estimate", source: "market_estimate", confidence: "low" },

  { name: "Champinjoner", category: "Svamp & vilt", unit: "kg", priceSek: 60, priceChangePct: 5.8, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Kantareller", category: "Svamp & vilt", unit: "kg", priceSek: 240, priceChangePct: 9.5, supplier: "Public market estimate", source: "market_estimate", confidence: "low" },
  { name: "Portabello", category: "Svamp & vilt", unit: "kg", priceSek: 90, priceChangePct: 4.8, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },

  { name: "Dill", category: "Orter", unit: "kg", priceSek: 160, priceChangePct: 8.7, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Persilja", category: "Orter", unit: "kg", priceSek: 130, priceChangePct: 6.1, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Basilika", category: "Orter", unit: "kg", priceSek: 180, priceChangePct: 11.5, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Koriander", category: "Orter", unit: "kg", priceSek: 150, priceChangePct: 7.4, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Timjan", category: "Orter", unit: "kg", priceSek: 170, priceChangePct: 5.1, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Rosmarin", category: "Orter", unit: "kg", priceSek: 165, priceChangePct: 4.6, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Mynta", category: "Orter", unit: "kg", priceSek: 145, priceChangePct: 5.8, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },

  { name: "Olivolja", category: "Oljor", unit: "liter", priceSek: 80, priceChangePct: 9.1, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Rapsolja", category: "Oljor", unit: "liter", priceSek: 28, priceChangePct: 2.4, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Sesamolja", category: "Oljor", unit: "liter", priceSek: 85, priceChangePct: 3.0, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Friteringsolja", category: "Oljor", unit: "liter", priceSek: 24, priceChangePct: 2.0, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },

  { name: "Vetemjol", category: "Spannmal", unit: "kg", priceSek: 8, priceChangePct: -0.4, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Ris jasmin", category: "Spannmal", unit: "kg", priceSek: 18, priceChangePct: 1.8, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Ris arborio", category: "Spannmal", unit: "kg", priceSek: 42, priceChangePct: 2.9, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Risnudlar", category: "Spannmal", unit: "kg", priceSek: 34, priceChangePct: 2.1, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Couscous", category: "Spannmal", unit: "kg", priceSek: 24, priceChangePct: 1.7, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Bulgur", category: "Spannmal", unit: "kg", priceSek: 23, priceChangePct: 1.5, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Quinoa", category: "Spannmal", unit: "kg", priceSek: 68, priceChangePct: 2.8, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Strobrod", category: "Spannmal", unit: "kg", priceSek: 15, priceChangePct: 0.9, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },

  { name: "Socker", category: "Torvaror", unit: "kg", priceSek: 10, priceChangePct: 0.6, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Honung", category: "Torvaror", unit: "kg", priceSek: 75, priceChangePct: 3.0, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Sirap", category: "Torvaror", unit: "kg", priceSek: 24, priceChangePct: 1.1, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Kakao", category: "Torvaror", unit: "kg", priceSek: 95, priceChangePct: 8.5, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Majsstarkelse", category: "Torvaror", unit: "kg", priceSek: 18, priceChangePct: 1.0, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },

  { name: "Salt", category: "Kryddor", unit: "kg", priceSek: 5, priceChangePct: 0.0, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Svartpeppar", category: "Kryddor", unit: "kg", priceSek: 120, priceChangePct: 4.0, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Paprikapulver", category: "Kryddor", unit: "kg", priceSek: 90, priceChangePct: 3.3, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Spiskummin", category: "Kryddor", unit: "kg", priceSek: 100, priceChangePct: 2.9, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Kanel", category: "Kryddor", unit: "kg", priceSek: 110, priceChangePct: 2.1, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Gurkmeja", category: "Kryddor", unit: "kg", priceSek: 95, priceChangePct: 2.4, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Chiliflakes", category: "Kryddor", unit: "kg", priceSek: 140, priceChangePct: 3.8, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Saffran", category: "Kryddor", unit: "g", priceSek: 18, priceChangePct: 5.2, supplier: "Public market estimate", source: "market_estimate", confidence: "low" },

  { name: "Sojasas", category: "Smaksattare", unit: "liter", priceSek: 45, priceChangePct: 1.2, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Fisksas", category: "Smaksattare", unit: "liter", priceSek: 55, priceChangePct: 2.4, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Kokosmjolk", category: "Smaksattare", unit: "liter", priceSek: 28, priceChangePct: 2.1, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Tomatpure", category: "Smaksattare", unit: "kg", priceSek: 38, priceChangePct: 2.2, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Dijonsenap", category: "Smaksattare", unit: "kg", priceSek: 65, priceChangePct: 1.8, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Majonnas", category: "Smaksattare", unit: "kg", priceSek: 42, priceChangePct: 1.3, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Sriracha", category: "Smaksattare", unit: "liter", priceSek: 68, priceChangePct: 2.8, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Gochujang", category: "Smaksattare", unit: "kg", priceSek: 88, priceChangePct: 3.2, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Miso", category: "Smaksattare", unit: "kg", priceSek: 105, priceChangePct: 2.5, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Vinager rodvin", category: "Smaksattare", unit: "liter", priceSek: 32, priceChangePct: 1.0, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Balsamvinager", category: "Smaksattare", unit: "liter", priceSek: 58, priceChangePct: 1.6, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },

  { name: "Kikartor", category: "Baljvaxter", unit: "kg", priceSek: 24, priceChangePct: 1.2, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Linser roda", category: "Baljvaxter", unit: "kg", priceSek: 28, priceChangePct: 1.4, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Svarta bonor", category: "Baljvaxter", unit: "kg", priceSek: 30, priceChangePct: 1.6, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Vita bonor", category: "Baljvaxter", unit: "kg", priceSek: 29, priceChangePct: 1.1, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Tofu", category: "Baljvaxter", unit: "kg", priceSek: 62, priceChangePct: 2.5, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },

  { name: "Mandel", category: "Notter & fron", unit: "kg", priceSek: 115, priceChangePct: 4.3, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Valnotter", category: "Notter & fron", unit: "kg", priceSek: 125, priceChangePct: 3.9, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Jordnotter", category: "Notter & fron", unit: "kg", priceSek: 48, priceChangePct: 2.2, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Sesamfron", category: "Notter & fron", unit: "kg", priceSek: 58, priceChangePct: 2.0, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Pinjenotter", category: "Notter & fron", unit: "kg", priceSek: 360, priceChangePct: 5.5, supplier: "Public market estimate", source: "market_estimate", confidence: "low" },

  { name: "Vitt vin matlagning", category: "Drycker", unit: "liter", priceSek: 90, priceChangePct: 1.0, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Rott vin matlagning", category: "Drycker", unit: "liter", priceSek: 95, priceChangePct: 1.0, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
  { name: "Appeljuice", category: "Drycker", unit: "liter", priceSek: 18, priceChangePct: 1.4, supplier: "Public market estimate", source: "market_estimate", confidence: "medium" },
];
