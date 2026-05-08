import { createContext, useContext, useState, ReactNode } from "react";

export type Lang = "sv" | "en";

const T: Record<string, { en: string }> = {
  // ── Navigation ──────────────────────────────────────────────
  "Dashboard":          { en: "Dashboard" },
  "Recept":             { en: "Recipes" },
  "Ingredienser":       { en: "Ingredients" },
  "Kalkylator":         { en: "Calculator" },
  "Marknadsdata":       { en: "Market Data" },
  "Community":          { en: "Community" },
  "Svinnanalys":        { en: "Waste Analysis" },
  "Hjälpcenter":        { en: "Help Center" },
  "Pro Chef":           { en: "Pro Chef" },
  "Admin":              { en: "Admin" },
  "Kock":               { en: "Chef" },
  "Logga ut":           { en: "Log out" },
  "Logga in":           { en: "Log in" },
  "Verktyg":            { en: "Tools" },
  "Support":            { en: "Support" },
  "Administration":     { en: "Administration" },
  "Kockens verktyg":    { en: "Chef's Toolkit" },

  // ── Common actions ───────────────────────────────────────────
  "Spara":              { en: "Save" },
  "Avbryt":             { en: "Cancel" },
  "Ta bort":            { en: "Delete" },
  "Stäng":              { en: "Close" },
  "Lägg till":          { en: "Add" },
  "Skapa":              { en: "Create" },
  "Redigera":           { en: "Edit" },
  "Importera":          { en: "Import" },
  "Exportera":          { en: "Export" },
  "Sök":                { en: "Search" },
  "Välj":               { en: "Select" },
  "Valfritt":           { en: "Optional" },
  "Ja":                 { en: "Yes" },
  "Nej":                { en: "No" },

  // ── Recipes page ─────────────────────────────────────────────
  "Nytt recept":        { en: "New recipe" },
  "Mina recept":        { en: "My recipes" },
  "Hitta recept":       { en: "Discover recipes" },
  "Din privata kokbok med kostnadskalkyl": { en: "Your private cookbook with cost calculator" },
  "Sök bland miljoner recept från hela världen": { en: "Search millions of recipes from around the world" },
  "Sök recept...":      { en: "Search recipes..." },
  "Sök recept på engelska, t.ex. pasta, chicken, salad...": { en: "Search recipes, e.g. pasta, chicken, salad..." },
  "Inga recept hittades": { en: "No recipes found" },
  "Lägg till ditt första recept ovan": { en: "Add your first recipe above" },
  "Försök med ett annat sökord": { en: "Try a different search term" },
  "Sök bland miljoner recept": { en: "Search millions of recipes" },
  "Skriv något i sökfältet ovan": { en: "Type something in the search field above" },
  "Recept borttaget":   { en: "Recipe deleted" },
  "Recept skapat!":     { en: "Recipe created!" },
  "Receptnamn":         { en: "Recipe name" },
  "Beskrivning (valfritt)": { en: "Description (optional)" },
  "Nytt recept (titel)":{ en: "New recipe" },
  "Skapa recept":       { en: "Create recipe" },
  "Delat":              { en: "Shared" },
  "Kostnad":            { en: "Cost" },
  "Marginal":           { en: "Margin" },

  // ── Ingredients page ─────────────────────────────────────────
  "Ny ingrediens":      { en: "New ingredient" },
  "Ingrediens tillagd!":{ en: "Ingredient added!" },
  "Ingrediens borttagen": { en: "Ingredient deleted" },
  "Råvarupriser uppdateras 3× per vecka": { en: "Raw material prices updated 3× per week" },
  "Sök ingrediens...":  { en: "Search ingredients..." },
  "Inga ingredienser hittades": { en: "No ingredients found" },
  "Prisutveckling · 7 veckor": { en: "Price trends · 7 weeks" },
  "Ingrediens":         { en: "Ingredient" },
  "Leverantör":         { en: "Supplier" },
  "Pris":               { en: "Price" },
  "Förändring":         { en: "Change" },
  "Pris (kr per enhet)":{ en: "Price (SEK per unit)" },
  "Leverantör (valfritt)": { en: "Supplier (optional)" },

  // ── Forms (shared) ───────────────────────────────────────────
  "Namn":               { en: "Name" },
  "Kategori":           { en: "Category" },
  "Enhet":              { en: "Unit" },
  "Portioner":          { en: "Servings" },
  "Beskrivning":        { en: "Description" },
  "Försäljningspris (kr)": { en: "Selling price (SEK)" },
  "Ange ett namn":      { en: "Enter a name" },
  "Välj kategori":      { en: "Select category" },
  "Ange enhet":         { en: "Enter unit" },
  "Dela recept i community": { en: "Share recipe in community" },

  // ── Recipe categories (filter) ───────────────────────────────
  "Alla":              { en: "All" },
  "Recepttyp":         { en: "Type" },
  "Kost":              { en: "Diet" },
  "Allergi":           { en: "Allergy" },
  "Huvudrätter":       { en: "Main Courses" },
  "Sallader":          { en: "Salads" },
  "Såser":             { en: "Sauces" },
  "Dressingar":        { en: "Dressings" },
  "Desserter":         { en: "Desserts" },
  "Veganskt":          { en: "Vegan" },
  "Vegetariskt":       { en: "Vegetarian" },
  "Soppor":            { en: "Soups" },
  "Förrätter":         { en: "Starters" },
  "Specialkost":       { en: "Special Diet" },
  "Glutenfri":         { en: "Gluten-free" },
  "Laktosfri":         { en: "Lactose-free" },
  "Mjölkfri":          { en: "Milk-free" },
  "Äggfri":            { en: "Egg-free" },
  "Nötfri":            { en: "Nut-free" },
  "Fisk/skaldjursfri": { en: "Fish/Shellfish-free" },
  "Tillbehör":         { en: "Side Dishes" },
  "Snacks":            { en: "Snacks" },
  "Bröd":              { en: "Bread" },
  "Frukt":             { en: "Fruit" },

  // ── Ingredient categories ────────────────────────────────────
  "Kött":              { en: "Meat" },
  "Fisk & skaldjur":   { en: "Fish & Seafood" },
  "Mejeri":            { en: "Dairy" },
  "Svamp & vilt":      { en: "Mushroom & Game" },
  "Kryddor":           { en: "Spices" },
  "Ägg & mejeriprodukter": { en: "Eggs & Dairy" },
  "Spannmål":          { en: "Grains" },
  "Grönsaker":         { en: "Vegetables" },
  "Oljor":             { en: "Oils" },
  "Drycker":           { en: "Beverages" },

  // ── Dashboard ────────────────────────────────────────────────
  "Välkommen":                  { en: "Welcome" },
  "Senaste aktivitet":          { en: "Recent activity" },
  "Topp-recept":                { en: "Top recipes" },
  "Sammanfattning":             { en: "Summary" },
  "Totala recept":              { en: "Total recipes" },
  "Aktiva ingredienser":        { en: "Active ingredients" },
  "Snittmarginal":              { en: "Avg. margin" },
  "Delad recept":               { en: "Shared recipes" },
  "Inga aktiviteter än":        { en: "No activity yet" },

  // ── Community ────────────────────────────────────────────────
  "Community-recept":           { en: "Community recipes" },
  "Utforska recept från andra kockar": { en: "Explore recipes from other chefs" },
  "Dela ditt recept":           { en: "Share your recipe" },
  "Gillningar":                 { en: "Likes" },
  "Inga inlägg ännu":          { en: "No posts yet" },
  "Var den första att dela ett recept!": { en: "Be the first to share a recipe!" },

  // ── Calculator ───────────────────────────────────────────────
  "Kalkylator":                 { en: "Calculator" },
  "Räkna ut rätt pris":         { en: "Calculate the right price" },
  "Råvarukostnad":              { en: "Raw material cost" },
  "Tillägg":                    { en: "Add-ons" },
  "Rekommenderat pris":         { en: "Recommended price" },

  // ── Market Insights ──────────────────────────────────────────
  "Marknadsinsikter":           { en: "Market Insights" },
  "Pristrender för råvaror":    { en: "Raw material price trends" },

  // ── Upgrade page ─────────────────────────────────────────────
  "Uppgradera till Pro":        { en: "Upgrade to Pro" },
  "Du är redan Pro-kock!":      { en: "You're already a Pro Chef!" },
  "Avsluta när som helst · Inga bindningstider": { en: "Cancel anytime · No commitment" },
  "Obegränsade AI-förslag":     { en: "Unlimited AI suggestions" },
  "Receptsök från hela världen":{ en: "Recipe search worldwide" },
  "Avancerad analytics":        { en: "Advanced analytics" },
  "Prioriterad support":        { en: "Priority support" },
  "Gratis plan inkluderar":     { en: "Free plan includes" },
  "Hanterar...":                { en: "Processing..." },

  // ── Auth ─────────────────────────────────────────────────────
  "E-post":             { en: "Email" },
  "Lösenord":           { en: "Password" },
  "Skapa konto":        { en: "Create account" },
  "Har du redan ett konto?": { en: "Already have an account?" },
  "Inget konto?":       { en: "No account?" },
  "Logga in på Smakvärlden": { en: "Sign in to Smakvärlden" },

  // ── Import dialog ────────────────────────────────────────────
  "Importera ingredienser":     { en: "Import ingredients" },
  "Importera recept":           { en: "Import recipes" },
  "Dra CSV-fil hit eller klicka": { en: "Drag CSV file here or click" },
  "UTF-8, kommaseparerad":      { en: "UTF-8, comma-separated" },
  "Exempelformat":              { en: "Example format" },
  "rader":                      { en: "rows" },
  "rader importerade":          { en: "rows imported" },
  "Fel vid import":             { en: "Import error" },
  "och":                        { en: "and" },
  "rader till":                 { en: "more rows" },
  "Byt fil":                    { en: "Change file" },
  "Importerar...":              { en: "Importing..." },

  // ── Help ─────────────────────────────────────────────────────
  "Hjälp & guide":              { en: "Help & guide" },
  "Hur använder du Smakvärlden?": { en: "How do you use Smakvärlden?" },

  // ── Waste analysis ───────────────────────────────────────────
  "Svinnkalkylator":            { en: "Waste calculator" },
  "Beräkna din svinnkostnad":   { en: "Calculate your waste cost" },
};

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nCtx>({ lang: "sv", setLang: () => {}, t: (k) => k });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem("sv_lang") as Lang) ?? "sv");
  const persist = (l: Lang) => { setLang(l); localStorage.setItem("sv_lang", l); };
  const t = (key: string): string => lang === "en" ? (T[key]?.en ?? key) : key;
  return <I18nContext.Provider value={{ lang, setLang: persist, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() { return useContext(I18nContext); }

// Category arrays — Swedish = DB storage value, translate display only
export const RECIPE_CATEGORIES  = ["Huvudrätter", "Sallader", "Såser", "Dressingar", "Desserter", "Soppor", "Förrätter", "Specialkost", "Tillbehör", "Snacks", "Bröd"];
export const DIET_CATEGORIES    = ["Veganskt", "Vegetariskt", "Glutenfri", "Laktosfri"];
export const ALLERGY_CATEGORIES = ["Glutenfri", "Mjölkfri", "Äggfri", "Nötfri", "Fisk/skaldjursfri"];
export const ALL_RECIPE_CATEGORIES = [...RECIPE_CATEGORIES, ...DIET_CATEGORIES, ...ALLERGY_CATEGORIES];
export const INGREDIENT_CATEGORIES = ["Kött", "Fisk & skaldjur", "Mejeri", "Svamp & vilt", "Kryddor", "Ägg & mejeriprodukter", "Spannmål", "Grönsaker", "Frukt", "Oljor", "Drycker"];
