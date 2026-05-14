type ImageCandidate = {
  aliases: string[];
  url: string;
};

const FALLBACK_RECIPE =
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1000&q=82";
const FALLBACK_INGREDIENT =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=82";

const recipeImages: ImageCandidate[] = [
  {
    aliases: ["linguine rakor citron", "linguine med rakor", "shrimp pasta", "pasta rakor", "pasta seafood"],
    url: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=1000&q=82",
  },
  {
    aliases: ["langbakad hogrev", "hogrev rotfrukter", "beef stew", "slow cooked beef", "braised beef"],
    url: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1000&q=82",
  },
  {
    aliases: ["torskrygg brynt smor", "torsk", "cod", "cod fillet", "fish dish"],
    url: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=1000&q=82",
  },
  {
    aliases: ["svamprisotto", "risotto parmesan", "mushroom risotto", "risotto"],
    url: "https://images.unsplash.com/photo-1476124369491-e7addf5db371?auto=format&fit=crop&w=1000&q=82",
  },
  {
    aliases: ["kycklingsallad", "chicken salad", "sallad citron", "salad"],
    url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1000&q=82",
  },
  {
    aliases: ["pannkaka lingon gradde", "pancakes", "pannkaka", "dessert pancake"],
    url: "https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=1000&q=82",
  },
  {
    aliases: ["soppa", "soup", "tomatsoppa", "vegetable soup"],
    url: "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=1000&q=82",
  },
  {
    aliases: ["forratt", "starter", "tapas", "small plate"],
    url: "https://images.unsplash.com/photo-1541014741259-de529411b96a?auto=format&fit=crop&w=1000&q=82",
  },
  {
    aliases: ["vegetariskt", "vegetarian", "vegan", "gronsaksratt"],
    url: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1000&q=82",
  },
  {
    aliases: ["dessert", "desserter", "cake", "chocolate", "bakelse"],
    url: "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=1000&q=82",
  },
];

const ingredientImages: ImageCandidate[] = [
  {
    aliases: ["hogrev", "beef", "notkott", "oxkott", "meat"],
    url: "https://images.unsplash.com/photo-1603048297172-c92544798d5a?auto=format&fit=crop&w=800&q=82",
  },
  {
    aliases: ["kyckling", "kycklinglar", "chicken", "poultry"],
    url: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=800&q=82",
  },
  {
    aliases: ["torsk", "torskrygg", "cod", "white fish"],
    url: "https://images.unsplash.com/photo-1501595091296-3aa970afb3ff?auto=format&fit=crop&w=800&q=82",
  },
  {
    aliases: ["rakor", "skaldjur", "shrimp", "prawns"],
    url: "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=800&q=82",
  },
  {
    aliases: ["smor", "butter"],
    url: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=800&q=82",
  },
  {
    aliases: ["gradde", "vispgradde", "cream", "milk"],
    url: "https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=800&q=82",
  },
  {
    aliases: ["parmesan", "ost", "cheese"],
    url: "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=800&q=82",
  },
  {
    aliases: ["agg", "eggs", "egg"],
    url: "https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&w=800&q=82",
  },
  {
    aliases: ["potatis", "potato", "potatoes"],
    url: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=800&q=82",
  },
  {
    aliases: ["morot", "carrot", "carrots"],
    url: "https://images.unsplash.com/photo-1447175008436-054170c2e979?auto=format&fit=crop&w=800&q=82",
  },
  {
    aliases: ["lok", "gul lok", "onion", "onions"],
    url: "https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=800&q=82",
  },
  {
    aliases: ["tomat", "tomato", "tomatoes"],
    url: "https://images.unsplash.com/photo-1546470427-e26264be0b0d?auto=format&fit=crop&w=800&q=82",
  },
  {
    aliases: ["sallad", "blandad sallad", "lettuce", "greens"],
    url: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=82",
  },
  {
    aliases: ["champinjoner", "svamp", "mushroom", "mushrooms"],
    url: "https://images.unsplash.com/photo-1504545102780-26774c1bb073?auto=format&fit=crop&w=800&q=82",
  },
  {
    aliases: ["lingon", "berries", "berry", "cranberry"],
    url: "https://images.unsplash.com/photo-1563746924237-f81657b6ef72?auto=format&fit=crop&w=800&q=82",
  },
  {
    aliases: ["vetemjol", "mjol", "flour"],
    url: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=800&q=82",
  },
  {
    aliases: ["pasta", "linguine", "spaghetti"],
    url: "https://images.unsplash.com/photo-1556761223-4c4282c73f77?auto=format&fit=crop&w=800&q=82",
  },
  {
    aliases: ["ris", "arborioris", "rice"],
    url: "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&w=800&q=82",
  },
  {
    aliases: ["olja", "olivolja", "rapsolja", "oil", "olive oil"],
    url: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=800&q=82",
  },
  {
    aliases: ["dill", "timjan", "basilika", "orter", "herbs"],
    url: "https://images.unsplash.com/photo-1471193945509-9ad0617afabf?auto=format&fit=crop&w=800&q=82",
  },
  {
    aliases: ["citron", "lemon", "lime", "citrus"],
    url: "https://images.unsplash.com/photo-1590502593747-42a996133562?auto=format&fit=crop&w=800&q=82",
  },
  {
    aliases: ["vin", "vitt vin", "wine"],
    url: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=800&q=82",
  },
];

const categoryImages: ImageCandidate[] = [
  { aliases: ["huvudratter", "main", "mains"], url: FALLBACK_RECIPE },
  { aliases: ["sallader", "salad"], url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1000&q=82" },
  { aliases: ["saser", "dressingar", "sauce"], url: "https://images.unsplash.com/photo-1472476443507-c7a5948772fc?auto=format&fit=crop&w=1000&q=82" },
  { aliases: ["soppor", "soup"], url: "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=1000&q=82" },
  { aliases: ["forratter", "starter"], url: "https://images.unsplash.com/photo-1541014741259-de529411b96a?auto=format&fit=crop&w=1000&q=82" },
  { aliases: ["vegetariskt", "veganskt", "vegan"], url: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1000&q=82" },
  { aliases: ["desserter", "dessert"], url: "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=1000&q=82" },
  { aliases: ["kott", "meat"], url: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=82" },
  { aliases: ["fisk skaldjur", "fish seafood"], url: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=82" },
  { aliases: ["mejeri", "dairy"], url: "https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=800&q=82" },
  { aliases: ["gronsaker", "vegetables"], url: FALLBACK_INGREDIENT },
  { aliases: ["spannmal", "grains"], url: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=800&q=82" },
  { aliases: ["kryddor", "spices"], url: "https://images.unsplash.com/photo-1532336414038-cf19250c5757?auto=format&fit=crop&w=800&q=82" },
];

function normalize(value = "") {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function isUsableUrl(url?: string | null) {
  return !!url && /^https?:\/\//i.test(url);
}

function findImage(value: string, candidates: ImageCandidate[]) {
  const normalized = normalize(value);
  if (!normalized) return undefined;

  return candidates.find((candidate) =>
    candidate.aliases.some((alias) => {
      const normalizedAlias = normalize(alias);
      return normalized === normalizedAlias || normalized.includes(normalizedAlias) || normalizedAlias.includes(normalized);
    }),
  )?.url;
}

function findCategoryImage(category?: string) {
  return category ? findImage(category, categoryImages) : undefined;
}

export function getRecipeImage(name: string, category?: string, preferredUrl?: string | null) {
  if (isUsableUrl(preferredUrl)) return preferredUrl;
  return findImage(name, recipeImages) ?? findCategoryImage(category) ?? FALLBACK_RECIPE;
}

export function getIngredientImage(name: string, category?: string, preferredUrl?: string | null) {
  if (isUsableUrl(preferredUrl)) return preferredUrl;
  return findImage(name, ingredientImages) ?? findCategoryImage(category) ?? FALLBACK_INGREDIENT;
}

export function getFoodImageSourceLabel(preferredUrl?: string | null) {
  return isUsableUrl(preferredUrl) ? "Custom image" : "Curated stock image";
}
