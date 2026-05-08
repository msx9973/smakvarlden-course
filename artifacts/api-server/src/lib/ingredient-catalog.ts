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

const baseIngredientCatalog: IngredientCatalogItem[] = [
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

const expandedCategorySeeds: Record<string, { unit: string; basePrice: number; names: string[] }> = {
  "Kott": {
    unit: "kg",
    basePrice: 110,
    names: ["Ankbrost", "Kalkonfile", "Kalvbog", "Kalvfile", "Lammytterfile", "Lammrack", "Oxkind", "Oxsvans", "Flasksida", "Flasklagg", "Vildsvin", "Reninnanlar", "Algstek", "Radjursadel", "Kaninkott", "Guanciale", "Pancetta", "Salsiccia", "Iberico secreto", "Wagyu trim"],
  },
  "Fisk & skaldjur": {
    unit: "kg",
    basePrice: 150,
    names: ["Halleflundra", "Roding", "Makrill", "Sillfile", "Havsabborre", "Dorade", "Gos", "Kolja", "Hummer", "Krabba", "Kungskrabba", "Krabbkott", "Kammusslor", "Blamusslor", "Hjartmusslor", "Ostron", "Sjogurka", "Bläckfisk", "Calamari", "Langoustine"],
  },
  "Mejeri": {
    unit: "kg",
    basePrice: 55,
    names: ["Getost", "Chevre", "Halloumi", "Ricotta", "Mascarpone", "Gorgonzola", "Gruyere", "Comte", "Vasterbottensost", "Brie", "Camembert", "Keso", "Kvarg", "Laktosfri gradde", "Laktosfri mjolk", "Havregrädde", "Soyayoghurt", "Kokosyoghurt", "Vegansk ost", "Brynt smor"],
  },
  "Gronsaker": {
    unit: "kg",
    basePrice: 26,
    names: ["Sotpotatis", "Palsternacka", "Rotselleri", "Stjalkselleri", "Fankal", "Purjolok", "Sparris", "Sugar snaps", "Haricots verts", "Pak choi", "Mangold", "Grönkål", "Savoykål", "Romanesco", "Kronartskocka", "Okra", "Cassava", "Jordärtskocka", "Daikon", "Lotusrot"],
  },
  "Frukt": {
    unit: "kg",
    basePrice: 32,
    names: ["Apelsin", "Blodapelsin", "Grapefrukt", "Kiwi", "Ananas", "Papaya", "Passionsfrukt", "Granatapple", "Fikon", "Dadlar", "Aprikos", "Persika", "Nektarin", "Plommon", "Körsbär", "Hallon", "Blabar", "Björnbär", "Hjortron", "Litchi"],
  },
  "Svamp & vilt": {
    unit: "kg",
    basePrice: 95,
    names: ["Shiitake", "Enoki", "Ostronskivling", "Karljohan", "Murklor", "Tryffel svart", "Tryffel vit", "Torkad porcini", "Skogschampinjon", "Nameko", "Hjortinnanlar", "Fasan", "Ripa", "Vaktel", "Duvbrost", "Hare", "Viltfond", "Renfile", "Algfars", "Vildandsbrost"],
  },
  "Orter": {
    unit: "kg",
    basePrice: 140,
    names: ["Dragon", "Salvia", "Oregano", "Mejram", "Gräslök", "Körvel", "Citronmeliss", "Ramslök", "Shiso", "Thaibasilika", "Curryblad", "Limeblad", "Dillkronor", "Lavendel", "Rosmarinblomma", "Ängssyra", "Vattenkrasse", "Mizuna", "Krasse", "Fänkålsdill"],
  },
  "Oljor": {
    unit: "liter",
    basePrice: 70,
    names: ["Avokadoolja", "Druvkärneolja", "Valnotsolja", "Hasselnötsolja", "Pumpakärnolja", "Chiliolja", "Tryffelolja", "Vitlöksolja", "Citronolja", "Basilikaolja", "Kallpressad rapsolja", "Jordnötsolja", "Kokosolja", "Ghee", "Ankfett", "Nötfett", "Sojaolja", "Majsolja", "Solrosolja", "Arganolja"],
  },
  "Spannmal": {
    unit: "kg",
    basePrice: 28,
    names: ["Havreris", "Matvete", "Korn", "Dinkel", "Rågkross", "Hirs", "Amarant", "Teff", "Bovete", "Freekeh", "Farro", "Polenta", "Maizena", "Potatismjöl", "Rismjöl", "Mandelmjöl", "Kikärtsmjöl", "Panko", "Glasnudlar", "Sobanudlar"],
  },
  "Torvaror": {
    unit: "kg",
    basePrice: 35,
    names: ["Muscovadosocker", "Florsocker", "Kokossocker", "Agavesirap", "Lönnsirap", "Melass", "Gelatin", "Agar agar", "Pektin", "Bakpulver", "Bikarbonat", "Torrjäst", "Vaniljsocker", "Vaniljstång", "Mörk choklad", "Vit choklad", "Kakaonibs", "Torkad mango", "Torkade tranbär", "Russin"],
  },
  "Kryddor": {
    unit: "kg",
    basePrice: 120,
    names: ["Kardemumma", "Korianderfrö", "Fänkålsfrö", "Senapsfrö", "Stjärnanis", "Kryddnejlika", "Muskot", "Mace", "Sumak", "Za'atar", "Ras el hanout", "Garam masala", "Berbere", "Aleppopeppar", "Chipotle", "Cayenne", "Vitpeppar", "Grönpeppar", "Sanshopeppar", "Asafoetida"],
  },
  "Smaksattare": {
    unit: "kg",
    basePrice: 65,
    names: ["Tamari", "Ponzu", "Hoisinsås", "Ostronsås", "Worcestersås", "Harissa", "Tahini", "Pesto", "Tapenade", "Kimchi", "Surkål", "Yuzu juice", "Tamarindpasta", "Räksås", "Anchovispasta", "Kapris", "Cornichons", "Svart vitlök", "Marmite", "Nutritional yeast"],
  },
  "Baljvaxter": {
    unit: "kg",
    basePrice: 30,
    names: ["Belugalinser", "Gröna linser", "Gula ärtor", "Kidneybönor", "Borlottibönor", "Cannellinibönor", "Edamame", "Tempeh", "Seitan", "Sojafärs", "Mungbönor", "Adzukibönor", "Lupinbönor", "Favabönor", "Black eyed peas", "Puy linser", "Urid dal", "Toor dal", "Chana dal", "Miso tofu"],
  },
  "Notter & fron": {
    unit: "kg",
    basePrice: 90,
    names: ["Cashew", "Hasselnötter", "Pistage", "Macadamia", "Pekannötter", "Solrosfrön", "Pumpakärnor", "Chiafrön", "Linfrön", "Hampafrön", "Nigellafrön", "Vallmofrön", "Pinjekärnor", "Kokosflingor", "Kokoschips", "Rostad mandel", "Saltrostade jordnötter", "Tahini sesam", "Mandelmassa", "Nötmix"],
  },
  "Drycker": {
    unit: "liter",
    basePrice: 35,
    names: ["Rödvinsvinäger", "Vitvinsvinäger", "Sherryvinäger", "Risvinäger", "Mirin", "Sake", "Kombucha", "Kokosvatten", "Granatäppeljuice", "Tranbärsjuice", "Tomatjuice", "Mandelmjölk", "Havremjölk", "Sojamjölk", "Kaffebrygd", "Espresso", "Grönt te", "Svart te", "Matcha dryck", "Fläderdryck"],
  },
  "Exotiskt & rare": {
    unit: "kg",
    basePrice: 180,
    names: ["Yuzu skal", "Buddhas hand", "Finger lime", "Rambutan", "Mangostan", "Durian", "Jackfruit", "Soursop", "Dragon fruit", "Kaktusfikon", "Bananblomma", "Galangal", "Färsk gurkmeja", "Wasabirot", "Umeboshi", "Katsuobushi", "Kombu", "Wakame", "Dulse", "Samphire"],
  },
  "Blommor & mikrogront": {
    unit: "ask",
    basePrice: 38,
    names: ["Ätbara violer", "Krasseblommor", "Ringblomma", "Gurkörtsblomma", "Tagetes", "Röd oxalis", "Grön oxalis", "Mizuna micro", "Rödbetsgroddar", "Ärtgroddar", "Solrosskott", "Broccoligroddar", "Shisokrasse", "Senapskrasse", "Korianderkrasse", "Basilikakrasse", "Rädisskott", "Lökkrasse", "Amarant micro", "Fänkålsskott"],
  },
  "Fermenterat": {
    unit: "kg",
    basePrice: 58,
    names: ["Kombu ferment", "Fermenterad chili", "Fermenterad vitlök", "Mjölksyrad gurka", "Picklad rödlök", "Picklad senap", "Miso ljus", "Miso mörk", "Natto", "Tempeh starter", "Koji ris", "Koji korn", "Fermenterad svamp", "Fermenterad citron", "Saltad lime", "Syrad morot", "Syrad kål", "Fermenterad tomat", "Fermenterad plommon", "Fermenterad rabarber"],
  },
  "Bageri": {
    unit: "kg",
    basePrice: 45,
    names: ["Surdeg", "Brioche", "Focaccia", "Ciabatta", "Baguette", "Rågbröd", "Knäckebröd", "Tortilla", "Pita", "Naan", "Filodeg", "Smördeg", "Mördeg", "Kataifi", "Bao buns", "Slider buns", "Pretzel", "Lavash", "Injera", "Arepa"],
  },
  "Chark & konserver": {
    unit: "kg",
    basePrice: 85,
    names: ["Salami", "Prosciutto", "Bresaola", "Mortadella", "Nduja", "Anklever mousse", "Corned beef", "Sardeller", "Sardiner", "Tonfisk konserv", "Confiterad anka", "Tomater konserverade", "Kronärtskocka konserv", "Grillad paprika konserv", "Oliver gröna", "Oliver kalamata", "Kaprisbär", "Majskorn", "Bambuskott", "Vattenkastanj"],
  },
  "Saser & fonder": {
    unit: "liter",
    basePrice: 55,
    names: ["Kycklingfond", "Kalvfond", "Fiskfond", "Grönsaksfond", "Svampfond", "Dashi", "Demi glace", "Tomatsås", "Bechamel", "Hollandaisesås", "Bearnaisebas", "Currysås", "Jus", "Rödvinssky", "Äppelgastrique", "Balsamicoreduktion", "Chiliglaze", "Mangosås", "Sataysås", "Tahinisås"],
  },
  "Dessert & glass": {
    unit: "kg",
    basePrice: 62,
    names: ["Vaniljglass", "Sorbet mango", "Sorbet hallon", "Gelato pistage", "Mascarponekräm", "Lemon curd", "Dulce de leche", "Karamellsås", "Chokladganache", "Maräng", "Macaron skal", "Pralinmassa", "Nougat", "Marsipan", "Kanderad apelsin", "Kanderad ingefära", "Fruktpure passion", "Fruktpure hallon", "Kaksmulor", "Crumble"],
  },
  "Alkoholfria barvaror": {
    unit: "liter",
    basePrice: 28,
    names: ["Tonic", "Ginger beer", "Sodavatten", "Alkoholfri gin", "Alkoholfri aperitif", "Grenadine", "Sockerlag", "Myntasyrup", "Vaniljsyrup", "Kaffesyrup", "Bitter alkoholfri", "Citronmix", "Lime cordial", "Passion cordial", "Rabarbersaft", "Lingondricka", "Blåbärsdryck", "Äppelmust", "Päronmust", "Is-te koncentrat"],
  },
  "Specialkost": {
    unit: "kg",
    basePrice: 52,
    names: ["Glutenfri mjölmix", "Glutenfri panko", "Laktosfri creme fraiche", "Vegansk majonnäs", "Aquafaba", "Äggersättning", "Kokosgrädde", "Havrefraiche", "Sojagrädde", "Ärtprotein", "Risprotein", "Quorn", "Jackfruit konserv", "Vegansk färs", "Vegansk kyckling", "Vegansk bacon", "Vegansk choklad", "Sockerfri sirap", "Stevia", "Erytritol"],
  },
  "Asiatiskt skafferi": {
    unit: "kg",
    basePrice: 48,
    names: ["Gochugaru", "Doenjang", "Doubanjiang", "Shaoxingvin", "Svart bönsås", "Fermenterade svarta bönor", "Kecap manis", "Sambal oelek", "Laksa paste", "Röd curry paste", "Grön curry paste", "Massaman curry paste", "Panang curry paste", "Rice paper", "Nori", "Furikake", "Bamburis", "Lotusfrön", "Tapiokapärlor", "Palm sugar"],
  },
  "Latinamerikanskt": {
    unit: "kg",
    basePrice: 42,
    names: ["Masa harina", "Torkad ancho", "Torkad guajillo", "Torkad pasilla", "Achiote", "Tomatillo", "Poblano", "Jalapeno", "Habanero", "Chipotle in adobo", "Queso fresco", "Cotija", "Plantain", "Yucca", "Hominy", "Svarta bönor kokta", "Refried beans", "Mole paste", "Tajin", "Epazote"],
  },
  "Mellanostern": {
    unit: "kg",
    basePrice: 46,
    names: ["Bulgur fin", "Bulgur grov", "Freekeh rostad", "Tahini premium", "Granatäppelsirap", "Rosenvatten", "Apelsinblomsvatten", "Labneh", "Halloumi grill", "Sumac hel", "Dukkah", "Baharat", "Molokhia", "Okra fryst", "Kataifi deg", "Filodeg ark", "Pistagekross", "Dadelsirap", "Torkad lime", "Za'atar premium"],
  },
};

function buildExpandedCatalog() {
  const supplier = "Expanded restaurant catalog";
  return Object.entries(expandedCategorySeeds).flatMap(([category, seed], categoryIndex) =>
    seed.names.map((name, itemIndex) => ({
      name,
      category,
      unit: seed.unit,
      priceSek: Math.round((seed.basePrice + itemIndex * 3.7 + categoryIndex * 1.9) * 100) / 100,
      priceChangePct: Math.round((((itemIndex % 9) - 4) * 0.9 + categoryIndex * 0.03) * 10) / 10,
      supplier,
      source: "market_estimate" as const,
      confidence: category.includes("rare") || category.includes("Exotiskt") ? "low" as const : "medium" as const,
    })),
  );
}

const expandedIngredientCatalog = buildExpandedCatalog().filter(
  (item) => !baseIngredientCatalog.some((base) => base.name.toLowerCase() === item.name.toLowerCase()),
);

export const ingredientCatalog: IngredientCatalogItem[] = [
  ...baseIngredientCatalog,
  ...expandedIngredientCatalog,
];
