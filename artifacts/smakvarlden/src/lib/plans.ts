import {
  BarChart3,
  Bot,
  Calculator,
  ChefHat,
  Download,
  FileSpreadsheet,
  Infinity,
  Lock,
  RefreshCw,
  ShieldCheck,
  Users,
} from "lucide-react";

export const PLAN_LIMITS = {
  freeRecipes: 5,
  trialDays: 14,
  proPriceSek: 59,
  teamFromSek: 199,
  teamToSek: 599,
};

export const PLANS = [
  {
    id: "free",
    name: "Free",
    eyebrow: "Start gratis",
    price: "0 SEK",
    cadence: "alltid",
    description: "Kom igang med recepten och se om kalkylen passar ditt arbetssatt.",
    cta: "Starta gratis",
    tone: "muted",
    features: [
      "5 recept",
      "Basic calculator",
      "Basic dashboard",
      "Limited AI",
      "Ingen export",
    ],
  },
  {
    id: "trial",
    name: "Pro Trial",
    eyebrow: "Basta starten",
    price: "14 dagar",
    cadence: "gratis",
    description: "Testa Pro Chef i ett riktigt kokflode utan kreditkort i borjan.",
    cta: "Prova Pro gratis",
    tone: "featured",
    features: [
      "Full food-cost calculations",
      "AI chef assistant",
      "Profit analytics",
      "Supplier price sync",
      "PDF/Excel export preview",
    ],
  },
  {
    id: "pro",
    name: "Pro Chef",
    eyebrow: "Main plan",
    price: "59 SEK",
    cadence: "per manad",
    description: "For kockar och sma restauranger som vill prissatta menyer tryggt.",
    cta: "Uppgradera",
    tone: "dark",
    features: [
      "Obegransade recept",
      "AI chef assistant",
      "Supplier price sync",
      "PDF/Excel export",
      "Menu engineering",
    ],
  },
  {
    id: "team",
    name: "Restaurant Team",
    eyebrow: "Senare",
    price: "fran 199 SEK",
    cadence: "per manad",
    description: "For restauranger som vill samla flera Pro Chef-anvandare i samma team.",
    cta: "Kommer senare",
    tone: "muted",
    features: [
      "Flera staff accounts",
      "Inventory",
      "Permissions",
      "Chain management",
      "Reports",
    ],
  },
];

export const LOCKED_FEATURES = [
  { name: "Advanced AI", plan: "Pro Chef", icon: Bot },
  { name: "PDF/Excel export", plan: "Pro Chef", icon: FileSpreadsheet },
  { name: "Supplier sync", plan: "Pro Chef", icon: RefreshCw },
  { name: "Profit analytics", plan: "Pro Chef", icon: BarChart3 },
  { name: "Unlimited recipes", plan: "Pro Chef", icon: Infinity },
  { name: "Team permissions", plan: "Restaurant Team", icon: ShieldCheck },
];

export const FREE_FEATURES = [
  { name: "Recipe creation", detail: "5 recept ingar", icon: ChefHat },
  { name: "Basic calculator", detail: "Food-cost overview", icon: Calculator },
  { name: "Basic dashboard", detail: "Nyckeltal och aktivitet", icon: BarChart3 },
  { name: "Community", detail: "Inspiration och feedback", icon: Users },
];

export const FEATURE_LOCK_RULES = [
  {
    title: "Locka inte grundflodet",
    body: "Receptskapande, basic kalkyl och dashboard ska kannas anvandbara direkt.",
    icon: Lock,
  },
  {
    title: "Lagg betalvaggen pa avancerat varde",
    body: "Export, supplier sync, analytics, AI premium och obegransad lagring driver upgrade.",
    icon: Download,
  },
];
