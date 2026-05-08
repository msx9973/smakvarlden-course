export type DemoIngredient = {
  id: number;
  name: string;
  category: string;
  unit: string;
  currentPriceSek: number;
  priceChangePct: number;
  supplier?: string;
  updatedAt: Date;
};

export type DemoRecipe = {
  id: number;
  name: string;
  description?: string;
  category: string;
  cuisine: string;
  servings: number;
  totalCostSek: number;
  sellingPriceSek: number;
  profitMarginPct: number;
  isShared: boolean;
  dietaryTags: string[];
  allergens: string[];
  allergyVersions: string[];
  languageVersions: Record<string, { name: string; description: string }>;
  createdAt: Date;
  updatedAt: Date;
  ingredients: Array<{
    ingredientId: number;
    ingredientName: string;
    quantity: number;
    unit: string;
    unitPriceSek: number;
    lineCostSek: number;
  }>;
};

const now = catalogUpdatedAt;

export const demoIngredients: DemoIngredient[] = ingredientCatalog.map((item, index) => ({
  id: index + 1,
  name: item.name,
  category: item.category,
  unit: item.unit,
  currentPriceSek: item.priceSek,
  priceChangePct: item.priceChangePct,
  supplier: `${item.supplier} (${item.confidence})`,
  updatedAt: now,
}));

const ingredientByName = new Map(demoIngredients.map((i) => [i.name, i]));
const ingredientAliases = new Map([
  ["Lok", "Lok gul"],
  ["Ris", "Ris jasmin"],
  ["Mjol", "Vetemjol"],
  ["Svamp", "Champinjoner"],
  ["Paprika", "Paprika rod"],
  ["Rakor", "Rakskalade"],
]);

function getIngredient(name: string) {
  return ingredientByName.get(name) ?? ingredientByName.get(ingredientAliases.get(name) ?? "");
}

function recipeCost(items: Array<[string, number, string]>) {
  return items.reduce((sum, [name, quantity, unit]) => {
    const ingredient = getIngredient(name);
    if (!ingredient) return sum;
    const factor = unit === "g" || unit === "ml" ? 0.001 : unit === "st" ? 1 : 1;
    return sum + ingredient.currentPriceSek * quantity * factor;
  }, 0);
}

function makeRecipe(
  id: number,
  name: string,
  cuisine: string,
  category: string,
  sellingPriceSek: number,
  items: Array<[string, number, string]>,
  description: string,
): DemoRecipe {
  const totalCostSek = Math.round(recipeCost(items) * 100) / 100;
  const profitMarginPct = sellingPriceSek > 0
    ? Math.round(((sellingPriceSek - totalCostSek) / sellingPriceSek) * 10000) / 100
    : 0;

  return {
    id,
    name,
    description,
    category,
    cuisine,
    servings: 4,
    totalCostSek,
    sellingPriceSek,
    profitMarginPct,
    isShared: id % 3 === 0,
    dietaryTags: getDietaryTags(category, items),
    allergens: getAllergens(items),
    allergyVersions: getAllergyVersions(items),
    languageVersions: getLanguageVersions(name, description),
    createdAt: new Date(now.getTime() - id * 86400000),
    updatedAt: new Date(now.getTime() - id * 3600000),
    ingredients: items.map(([ingredientName, quantity, unit]) => {
      const ingredient = getIngredient(ingredientName);
      const unitPriceSek = ingredient?.currentPriceSek ?? 0;
      const factor = unit === "g" || unit === "ml" ? 0.001 : unit === "st" ? 1 : 1;
      return {
        ingredientId: ingredient?.id ?? 0,
        ingredientName,
        quantity,
        unit,
        unitPriceSek,
        lineCostSek: Math.round(unitPriceSek * quantity * factor * 100) / 100,
      };
    }),
  };
}

const animalIngredients = new Set([
  "Agg", "Bacon", "Creme fraiche", "Fetaost", "Fisksas", "Flaskfile", "Flaskkarre", "Hel kyckling",
  "Honung", "Kycklingfile", "Kycklinglarfile", "Lammstek", "Laxfile", "Majonnas", "Mozzarella",
  "Notfars", "Notfile", "Parmesan", "Rakor", "Smor", "Torskfile", "Vispgradde", "Yoghurt naturell",
]);

function getDietaryTags(category: string, items: Array<[string, number, string]>) {
  const names = items.map(([name]) => name);
  const tags = new Set<string>();
  const isVegan = !names.some((name) => animalIngredients.has(name));
  const hasGluten = names.some((name) => ["Vetemjol", "Mjol", "Strobrod", "Couscous", "Bulgur"].includes(name));
  const hasDairy = names.some((name) => ["Smor", "Vispgradde", "Yoghurt naturell", "Parmesan", "Fetaost", "Mozzarella", "Creme fraiche"].includes(name));
  if (category === "Vegetariskt" || isVegan) tags.add("Vegetariskt");
  if (isVegan) tags.add("Veganskt");
  if (!hasGluten) tags.add("Glutenfri");
  if (!hasDairy) tags.add("Laktosfri");
  return [...tags];
}

function getAllergens(items: Array<[string, number, string]>) {
  const names = items.map(([name]) => name);
  const allergens = new Set<string>();
  if (names.some((name) => ["Agg", "Majonnas"].includes(name))) allergens.add("Agg");
  if (names.some((name) => ["Smor", "Vispgradde", "Yoghurt naturell", "Parmesan", "Fetaost", "Mozzarella", "Creme fraiche"].includes(name))) allergens.add("Mjolk");
  if (names.some((name) => ["Vetemjol", "Mjol", "Strobrod", "Couscous", "Bulgur"].includes(name))) allergens.add("Gluten");
  if (names.some((name) => ["Laxfile", "Torskfile", "Fisksas"].includes(name))) allergens.add("Fisk");
  if (names.some((name) => ["Rakor"].includes(name))) allergens.add("Skaldjur");
  if (names.some((name) => ["Sojasas", "Tofu", "Miso"].includes(name))) allergens.add("Soja");
  if (names.some((name) => ["Mandel", "Valnotter", "Jordnotter", "Pinjenotter"].includes(name))) allergens.add("Notter");
  if (names.some((name) => ["Sesamolja", "Sesamfron"].includes(name))) allergens.add("Sesam");
  return [...allergens];
}

function getAllergyVersions(items: Array<[string, number, string]>) {
  const allergens = getAllergens(items);
  const versions = new Set<string>();
  if (!allergens.includes("Gluten")) versions.add("Glutenfri");
  if (!allergens.includes("Mjolk")) versions.add("Mjolkfri");
  if (!allergens.includes("Agg")) versions.add("Aggfri");
  if (!allergens.includes("Notter")) versions.add("Notfri");
  if (!allergens.includes("Fisk") && !allergens.includes("Skaldjur")) versions.add("Fisk/skaldjursfri");
  if (versions.size === 0) versions.add("Kräver manuell allergianpassning");
  return [...versions];
}

function getLanguageVersions(name: string, description: string) {
  const translations: Record<string, Partial<Record<"en" | "es" | "de" | "fr" | "fi", { name: string; description: string }>>> = {
    "Pad Thai klassisk": {
      en: { name: "Classic Pad Thai", description: "Rice-noodle wok with prawns and lime." },
      es: { name: "Pad Thai clasico", description: "Salteado de fideos de arroz con gambas y lima." },
      de: { name: "Klassisches Pad Thai", description: "Reisnudel-Wok mit Garnelen und Limette." },
      fr: { name: "Pad Thai classique", description: "Nouilles de riz sautees aux crevettes et citron vert." },
      fi: { name: "Klassinen Pad Thai", description: "Riisinuudeliwok katkaravuilla ja limetilla." },
    },
    "Thai nudelsallad": {
      en: { name: "Thai Rice Noodle Salad", description: "Bright rice-noodle salad with prawns, cucumber and lime." },
      es: { name: "Ensalada thai de fideos de arroz", description: "Ensalada fresca con gambas, pepino y lima." },
      de: { name: "Thai-Reisnudelsalat", description: "Frischer Reisnudelsalat mit Garnelen, Gurke und Limette." },
      fr: { name: "Salade thai de nouilles de riz", description: "Salade fraiche aux crevettes, concombre et citron vert." },
      fi: { name: "Thai-riisinuudelisalaatti", description: "Raikas salaatti katkaravuilla, kurkulla ja limetilla." },
    },
    "Vegetarisk kikartsgryta": {
      en: { name: "Vegan Chickpea Stew", description: "Affordable plant-based stew with chickpeas, tomato and coconut milk." },
      es: { name: "Guiso vegano de garbanzos", description: "Guiso vegetal con garbanzos, tomate y leche de coco." },
      de: { name: "Veganer Kichererbseneintopf", description: "Preiswerter Eintopf mit Kichererbsen, Tomate und Kokosmilch." },
      fr: { name: "Ragout vegan de pois chiches", description: "Ragout vegetal aux pois chiches, tomate et lait de coco." },
      fi: { name: "Vegaaninen kikhernepata", description: "Edullinen kasvispata kikherneilla, tomaatilla ja kookosmaidolla." },
    },
    "Vegansk linsbolognese": {
      en: { name: "Vegan Lentil Ragout", description: "Hearty tomato ragout with red lentils, herbs and good menu margin." },
      es: { name: "Ragu vegano de lentejas", description: "Ragu de tomate con lentejas rojas, hierbas y buen margen." },
      de: { name: "Veganes Linsenragout", description: "Kraftiges Tomatenragout mit roten Linsen und Krautern." },
      fr: { name: "Ragout vegan aux lentilles", description: "Ragout tomate aux lentilles rouges, herbes et bonne marge." },
      fi: { name: "Vegaaninen linssiragu", description: "Taytelainen tomaattiragu punaisilla linsseilla ja yrteilla." },
    },
    "Tofu bowl med jordnotssas": {
      en: { name: "Tofu Bowl with Peanut Sauce", description: "Vegan bowl with tofu, rice, crunchy vegetables and peanut sauce." },
      es: { name: "Bowl de tofu con salsa de cacahuete", description: "Bowl vegano con tofu, arroz, verduras crujientes y salsa de cacahuete." },
      de: { name: "Tofu-Bowl mit Erdnusssauce", description: "Vegane Bowl mit Tofu, Reis, knackigem Gemuse und Erdnusssauce." },
      fr: { name: "Bol tofu sauce cacahuete", description: "Bol vegan avec tofu, riz, legumes croquants et sauce cacahuete." },
      fi: { name: "Tofukulho maapahkinakastikkeella", description: "Vegaaninen kulho tofulla, riisilla, kasviksilla ja maapahkinakastikkeella." },
    },
    "Blomkalssteak med chimichurri": {
      en: { name: "Cauliflower Steak with Chimichurri", description: "Vegan main course with roasted cauliflower, herbs and lemon." },
      es: { name: "Filete de coliflor con chimichurri", description: "Principal vegano con coliflor asada, hierbas y limon." },
      de: { name: "Blumenkohlsteak mit Chimichurri", description: "Veganes Hauptgericht mit gerostetem Blumenkohl, Krautern und Zitrone." },
      fr: { name: "Steak de chou-fleur au chimichurri", description: "Plat vegan avec chou-fleur roti, herbes et citron." },
      fi: { name: "Kukkakaalipihvi chimichurrilla", description: "Vegaaninen pa ruoka paahdetulla kukkakaalilla, yrteilla ja sitruunalla." },
    },
    "Svarta bonor taco bowl": {
      en: { name: "Black Bean Taco Bowl", description: "Vegan taco bowl with beans, rice, avocado and lime." },
      es: { name: "Bowl taco de frijoles negros", description: "Bowl vegano con frijoles, arroz, aguacate y lima." },
      de: { name: "Taco-Bowl mit schwarzen Bohnen", description: "Vegane Bowl mit Bohnen, Reis, Avocado und Limette." },
      fr: { name: "Bol taco aux haricots noirs", description: "Bol vegan avec haricots, riz, avocat et citron vert." },
      fi: { name: "Mustapapu-tacokulho", description: "Vegaaninen kulho pavuilla, riisilla, avokadolla ja limetilla." },
    },
  };
  return {
    sv: { name, description },
    en: translations[name]?.en ?? { name, description },
    es: translations[name]?.es ?? { name, description },
    de: translations[name]?.de ?? { name, description },
    fr: translations[name]?.fr ?? { name, description },
    fi: translations[name]?.fi ?? { name, description },
  };
}

export const demoRecipes: DemoRecipe[] = [
  makeRecipe(1, "Gravlax med dillsas", "Nordiskt", "Forratter", 145, [["Laxfile", 600, "g"], ["Dill", 50, "g"], ["Socker", 20, "g"], ["Salt", 30, "g"]], "Marinerad lax med klassisk dillprofil och hog marginal."),
  makeRecipe(2, "Svenska kottbullar", "Svenskt", "Huvudratter", 169, [["Notfars", 500, "g"], ["Strobrod", 60, "g"], ["Agg", 2, "st"], ["Vispgradde", 100, "ml"], ["Smor", 30, "g"]], "Husmansklassiker med tydlig portionskalkyl."),
  makeRecipe(3, "Risotto ai funghi", "Italienskt", "Huvudratter", 185, [["Ris", 320, "g"], ["Svamp", 300, "g"], ["Parmesan", 80, "g"], ["Smor", 40, "g"], ["Olivolja", 30, "ml"]], "Kramig svamprisotto med parmesan."),
  makeRecipe(4, "Smorkyckling", "Indiskt", "Huvudratter", 179, [["Kycklingfile", 600, "g"], ["Kokosmjolk", 200, "ml"], ["Tomat", 400, "g"], ["Smor", 50, "g"], ["Vispgradde", 100, "ml"]], "Mild currygryta med bra kostnadskontroll."),
  makeRecipe(5, "Creme brulee", "Franskt", "Desserter", 95, [["Vispgradde", 500, "ml"], ["Agg", 4, "st"], ["Socker", 100, "g"]], "Klassisk dessert med lag ravarukostnad."),
  makeRecipe(6, "Pad Thai klassisk", "Thai", "Huvudratter", 159, [["Risnudlar", 250, "g"], ["Rakor", 300, "g"], ["Agg", 2, "st"], ["Sojasas", 45, "ml"], ["Fisksas", 30, "ml"], ["Lime", 2, "st"]], "Wokad risnudelratt med rakor och lime."),
  makeRecipe(7, "Lax teriyaki", "Japanskt", "Huvudratter", 198, [["Laxfile", 600, "g"], ["Sojasas", 60, "ml"], ["Ris", 320, "g"], ["Lime", 1, "st"]], "Lax med teriyakikansla och ris."),
  makeRecipe(8, "Bouillabaisse", "Franskt", "Soppor", 215, [["Torskfile", 400, "g"], ["Rakor", 200, "g"], ["Tomat", 500, "g"], ["Olivolja", 60, "ml"]], "Fiskgryta inspirerad av Provence."),
  makeRecipe(9, "Shakshuka", "Medelhavskt", "Frukost", 125, [["Agg", 4, "st"], ["Tomat", 500, "g"], ["Lok", 150, "g"], ["Vitlok", 3, "st"], ["Olivolja", 30, "ml"]], "Tomatbaserad brunchratt med agg."),
  makeRecipe(10, "Kladdkaka", "Svenskt", "Desserter", 79, [["Smor", 150, "g"], ["Socker", 200, "g"], ["Agg", 2, "st"], ["Mjol", 80, "g"], ["Salt", 2, "g"]], "Snabb dessert med stabil marginal."),
  makeRecipe(11, "Tom Kha Gai", "Thai", "Soppor", 149, [["Kycklingfile", 400, "g"], ["Kokosmjolk", 400, "ml"], ["Svamp", 200, "g"], ["Fisksas", 40, "ml"], ["Lime", 2, "st"]], "Syrlig och rund thaisoppa."),
  makeRecipe(12, "Vegansk linsbolognese", "Italienskt", "Veganskt", 139, [["Linser roda", 420, "g"], ["Tomat", 650, "g"], ["Morot", 180, "g"], ["Lok", 120, "g"], ["Basilika", 20, "g"]], "Mustig vegansk tomatragu med roda linser och lag ravarukostnad."),
  makeRecipe(13, "Caesardressing", "Amerikanskt", "Dressingar", 39, [["Majonnas", 200, "g"], ["Dijonsenap", 30, "g"], ["Parmesan", 40, "g"], ["Citron", 80, "g"], ["Vitlok", 10, "g"]], "Krämig dressing for sallad, kyckling och mackor."),
  makeRecipe(14, "Ranchdressing", "Amerikanskt", "Dressingar", 35, [["Yoghurt naturell", 250, "g"], ["Majonnas", 120, "g"], ["Dill", 15, "g"], ["Persilja", 15, "g"], ["Vitlok", 8, "g"]], "Mild kall dressing med hog volym och lag kostnad."),
  makeRecipe(15, "Honung och dijonvinagrett", "Franskt", "Dressingar", 32, [["Dijonsenap", 40, "g"], ["Honung", 35, "g"], ["Olivolja", 180, "ml"], ["Vinager rodvin", 60, "ml"], ["Salt", 4, "g"]], "Blank vinagrett for sallad, rotfrukter och kyckling."),
  makeRecipe(16, "Lime korianderdressing", "Mexikanskt", "Dressingar", 36, [["Lime", 160, "g"], ["Koriander", 30, "g"], ["Yoghurt naturell", 220, "g"], ["Olivolja", 60, "ml"], ["Vitlok", 8, "g"]], "Frisk dressing for bowls, tacos och grillat."),
  makeRecipe(17, "Rodvinssas", "Franskt", "Saser", 59, [["Rott vin matlagning", 300, "ml"], ["Smor", 80, "g"], ["Lok", 120, "g"], ["Timjan", 8, "g"], ["Svartpeppar", 3, "g"]], "Klassisk reducerad sas till not, lamm och vilt."),
  makeRecipe(18, "Bearnaisesas", "Franskt", "Saser", 55, [["Smor", 300, "g"], ["Agg", 4, "st"], ["Vinager rodvin", 60, "ml"], ["Dijonsenap", 20, "g"], ["Persilja", 20, "g"]], "Restaurangklassiker med tydlig portionskostnad."),
  makeRecipe(19, "Pepparsas", "Svenskt", "Saser", 49, [["Vispgradde", 300, "ml"], ["Smor", 40, "g"], ["Svartpeppar", 12, "g"], ["Lok", 80, "g"], ["Rott vin matlagning", 120, "ml"]], "Krämig pepparsas till grillat och husmansratter."),
  makeRecipe(20, "Teriyakisås", "Japanskt", "Saser", 42, [["Sojasas", 180, "ml"], ["Honung", 90, "g"], ["Vitlok", 12, "g"], ["Sesamolja", 30, "ml"], ["Majsstarkelse", 12, "g"]], "Sot salt glaze for lax, kyckling och gronsaker."),
  makeRecipe(21, "Tomatsas basilika", "Italienskt", "Saser", 45, [["Tomat", 800, "g"], ["Tomatpure", 80, "g"], ["Basilika", 25, "g"], ["Olivolja", 60, "ml"], ["Vitlok", 15, "g"]], "Bas for pizza, gratanger och veganska varmratter."),
  makeRecipe(22, "Caesarsallad med kyckling", "Amerikanskt", "Sallader", 149, [["Romansallat", 450, "g"], ["Kycklingfile", 500, "g"], ["Parmesan", 80, "g"], ["Strobrod", 80, "g"], ["Majonnas", 80, "g"]], "Matig sallad med stark marginal och enkel prepp."),
  makeRecipe(23, "Grekisk sallad", "Grekiskt", "Sallader", 129, [["Tomat", 450, "g"], ["Gurka", 300, "g"], ["Rodlok", 100, "g"], ["Fetaost", 180, "g"], ["Olivolja", 60, "ml"]], "Frasch sallad med feta, tomat och gurka."),
  makeRecipe(24, "Quinoasallad med rodbeta", "Nordiskt", "Sallader", 135, [["Quinoa", 260, "g"], ["Rodbeta", 400, "g"], ["Fetaost", 150, "g"], ["Spenat", 120, "g"], ["Valnotter", 60, "g"]], "Modern vegetarisk sallad for lunchmeny."),
  makeRecipe(25, "Thai nudelsallad", "Thai", "Sallader", 139, [["Risnudlar", 260, "g"], ["Rakor", 220, "g"], ["Gurka", 200, "g"], ["Koriander", 35, "g"], ["Fisksas", 45, "ml"], ["Lime", 140, "g"]], "Syrlig risnudelsallad med rakor och lime."),
  makeRecipe(26, "Avokado och mangosallad", "Fusion", "Sallader", 145, [["Avokado", 4, "st"], ["Mango", 2, "st"], ["Romansallat", 300, "g"], ["Lime", 120, "g"], ["Koriander", 25, "g"]], "Fargstark sallad for sommar och brunch."),
  makeRecipe(27, "Chokladfondant", "Franskt", "Desserter", 99, [["Smor", 160, "g"], ["Kakao", 80, "g"], ["Socker", 140, "g"], ["Agg", 4, "st"], ["Vetemjol", 60, "g"]], "Varm dessert med premiumkansla och bra marginal."),
  makeRecipe(28, "Pannacotta med jordgubbar", "Italienskt", "Desserter", 89, [["Vispgradde", 500, "ml"], ["Socker", 70, "g"], ["Jordgubbar", 250, "g"], ["Citron", 40, "g"]], "Len dessert som ar latt att forbereda."),
  makeRecipe(29, "Apple crumble", "Brittiskt", "Desserter", 79, [["Apple", 600, "g"], ["Vetemjol", 140, "g"], ["Smor", 120, "g"], ["Socker", 120, "g"], ["Kanel", 8, "g"]], "Varm dessert med lag ravarukostnad."),
  makeRecipe(30, "Banankaka med kakao", "Cafe", "Desserter", 69, [["Banan", 450, "g"], ["Vetemjol", 180, "g"], ["Agg", 2, "st"], ["Socker", 120, "g"], ["Kakao", 30, "g"]], "Cafeprodukt med hog marginal och lite svinn."),
  makeRecipe(31, "Mango yoghurt dessert", "Fusion", "Desserter", 85, [["Mango", 3, "st"], ["Yoghurt naturell", 400, "g"], ["Honung", 60, "g"], ["Mynta", 12, "g"], ["Lime", 60, "g"]], "Frisk dessert for lunch och catering."),
  makeRecipe(32, "Kyckling med teriyaki och ris", "Japanskt", "Huvudratter", 169, [["Kycklinglarfile", 650, "g"], ["Sojasas", 90, "ml"], ["Honung", 60, "g"], ["Ris", 320, "g"], ["Sesamfron", 20, "g"]], "Snabb varmratt baserad pa samma saslogik."),
  makeRecipe(33, "Vegetarisk kikartsgryta", "Mellanostern", "Vegetariskt", 139, [["Kikartor", 500, "g"], ["Tomat", 500, "g"], ["Kokosmjolk", 300, "ml"], ["Spiskummin", 12, "g"], ["Ris", 280, "g"]], "Prisvard vegetarisk gryta med bra protein."),
  makeRecipe(34, "Portabello med parmesan", "Italienskt", "Vegetariskt", 155, [["Portabello", 600, "g"], ["Parmesan", 90, "g"], ["Spenat", 200, "g"], ["Vitlok", 12, "g"], ["Olivolja", 50, "ml"]], "Kottfri huvudratt med umami och premiumkansla."),
  makeRecipe(35, "Lamm med rosmarin och rodbeta", "Nordiskt", "Huvudratter", 229, [["Lammstek", 700, "g"], ["Rodbeta", 450, "g"], ["Rosmarin", 15, "g"], ["Smor", 60, "g"], ["Potatis", 600, "g"]], "Robust varmratt for helgmeny."),
  makeRecipe(36, "Torsk med dillsas och potatis", "Svenskt", "Huvudratter", 179, [["Torskfile", 650, "g"], ["Potatis", 700, "g"], ["Vispgradde", 250, "ml"], ["Dill", 35, "g"], ["Citron", 80, "g"]], "Klassisk fiskratt med kalkylerad sas."),
  makeRecipe(37, "Tofu bowl med jordnotssas", "Fusion", "Veganskt", 149, [["Tofu", 500, "g"], ["Ris", 320, "g"], ["Jordnotter", 80, "g"], ["Gurka", 220, "g"], ["Lime", 120, "g"]], "Vegansk bowl med tofu, ris, krispiga gronsaker och jordnotssas."),
  makeRecipe(38, "Blomkalssteak med chimichurri", "Nordiskt", "Veganskt", 145, [["Blomkal", 900, "g"], ["Persilja", 50, "g"], ["Vitlok", 15, "g"], ["Olivolja", 80, "ml"], ["Citron", 120, "g"]], "Vegansk huvudratt med rostad blomkal, orter och citron."),
  makeRecipe(39, "Svarta bonor taco bowl", "Mexikanskt", "Veganskt", 135, [["Svarta bonor", 520, "g"], ["Ris", 300, "g"], ["Avokado", 3, "st"], ["Tomat", 350, "g"], ["Lime", 120, "g"]], "Vegansk taco bowl med bonor, ris, avokado och lime."),
];

export const demoActivity = [
  { id: 1, type: "recipe_created", title: "Nytt recept: Gravlax med dillsas", subtitle: "Nordiskt - demoimport fran gamla appen", timestamp: new Date(now.getTime() - 15 * 60000) },
  { id: 2, type: "price_change", title: "Prisandring: Laxfile", subtitle: "+8.4% enligt demo grossistdata", timestamp: new Date(now.getTime() - 4 * 3600000) },
  { id: 3, type: "recipe_shared", title: "Recept delat: Pad Thai klassisk", subtitle: "Community demo", timestamp: new Date(now.getTime() - 9 * 3600000) },
  { id: 4, type: "recipe_updated", title: "Recept uppdaterat: Svenska kottbullar", subtitle: "Kostnad och portioner kontrollerade", timestamp: new Date(now.getTime() - 86400000) },
];

export function hasDemoFallbackError(error: unknown) {
  return error instanceof Error && /DATABASE_URL|ECONNREFUSED|ENOTFOUND|SASL|password|connect/i.test(error.message);
}
import { catalogUpdatedAt, ingredientCatalog } from "./ingredient-catalog";
