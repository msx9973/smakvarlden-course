import { useState, useRef, useEffect } from "react";
import {
  AlertTriangle,
  BadgePercent,
  Bot,
  Calculator,
  ChefHat,
  Check,
  ClipboardList,
  Copy,
  Minimize2,
  RefreshCcw,
  Send,
  Sparkles,
  Wand2,
  X,
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

type QuickAction = {
  label: string;
  helper: string;
  prompt: string;
  icon: React.ElementType;
};

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: "Räkna food cost",
    helper: "Pris, kostnad, marginal",
    icon: Calculator,
    prompt: "Hjalp mig rakna food cost. Ratt: [namn]. Ingredienser med mangd och pris: [lista]. Forsaljningspris: [kr]. Visa total kostnad, kostnad per portion, food cost %, vinst och rekommenderat pris.",
  },
  {
    label: "Gör billigare",
    helper: "Byt dyr råvara smart",
    icon: BadgePercent,
    prompt: "Optimera kostnaden for detta recept utan att tappa kvalitet: [recept]. Dyraste ingredienser: [lista]. Ge 5 konkreta byten, uppskattad besparing i SEK och risk for smak/kvalitet.",
  },
  {
    label: "Skapa recept",
    helper: "Utifrån råvaror",
    icon: Wand2,
    prompt: "Skapa 3 professionella recept for restaurang med dessa ravaror: [lista]. For varje recept: kategori, portioner, ungefarlig kostnad, saljpris, allergener och kort metod.",
  },
  {
    label: "Menytext",
    helper: "Säljande beskrivning",
    icon: ClipboardList,
    prompt: "Skriv 5 premium menybeskrivningar pa svenska for: [ratt]. Ton: modern restaurang, kort, tydlig, inte for poetisk. Ta aven med allergenrad.",
  },
  {
    label: "Allergener",
    helper: "Risker och ersättning",
    icon: AlertTriangle,
    prompt: "Analysera allergener och specialkost for detta recept: [recept och ingredienser]. Lista allergener, vad som kan bytas ut, och hur jag markerar det pa menyn.",
  },
  {
    label: "Skala portioner",
    helper: "Från 4 till service",
    icon: RefreshCcw,
    prompt: "Skala detta recept fran [antal] portioner till [antal] portioner: [recept]. Visa ny mangd per ingrediens, prepp-rad, svinnrisk och serveringskontroll.",
  },
];

async function fetchAI(message: string, history: Message[], context: string): Promise<string> {
  const token = localStorage.getItem("smakvarlden_token");
  const res = await fetch(`${BASE}/api/ai/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ message, history, context }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "AI-tjansten ar inte tillganglig.");
  return data.reply;
}

function pageContext() {
  const path = window.location.pathname;
  if (path.includes("/recipes")) return "Anvandaren arbetar i receptbiblioteket. Prioritera recept, kategorier, ingrediensrader och marginal.";
  if (path.includes("/ingredients")) return "Anvandaren arbetar med ingredienser och leverantorspriser. Prioritera CSV-import, prislistor och ravarukostnad.";
  if (path.includes("/calculator")) return "Anvandaren arbetar i kalkylatorn. Prioritera food cost, marginal, saljpris och vinst.";
  if (path.includes("/plans")) return "Anvandaren tittar pa prenumerationer. Prioritera funktionslasning, trial och SaaS-upplagg.";
  return "Anvandaren arbetar i Smakvarlden, en SaaS for kockar, recept och food-cost.";
}

function localFallback(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("food cost") || lower.includes("marginal") || lower.includes("pris")) {
    return [
      "AI-nyckeln verkar inte vara aktiv, men har ar en snabb kalkylmall:",
      "",
      "1. Ravarukostnad = summa av alla ingredienser i SEK.",
      "2. Kostnad per portion = total ravarukostnad / antal portioner.",
      "3. Food cost % = kostnad per portion / saljpris x 100.",
      "4. Vinst per portion = saljpris - kostnad per portion.",
      "",
      "Bra restaurangmal: food cost 25-35%. Om rätten kostar 42 kr per portion bor priset ofta ligga runt 140-168 kr.",
    ].join("\n");
  }
  if (lower.includes("allergen")) {
    return [
      "AI-nyckeln verkar inte vara aktiv. Snabb allergenkoll:",
      "",
      "Kontrollera alltid: gluten, mjolk/laktos, agg, fisk, skaldjur, soja, selleri, senap, sesam, notter och jordnotter.",
      "Skriv allergener per recept och skapa ersattningar innan service, inte nar kunden redan bestallt.",
    ].join("\n");
  }
  return [
    "AI-nyckeln verkar inte vara aktiv annu. Du kan fortfarande anvanda knapparna som mallar.",
    "",
    "For riktig AI: lagg till ANTHROPIC_API_KEY i serverns miljovariabler och starta om API-servern.",
    "Tips: klistra in recept, ingredienspriser och saljpris sa kan assistenten rakna och foresla forbattringar.",
  ].join("\n");
}

export function AiChat() {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hej. Jag kan hjalpa dig med food cost, recept, allergener, menytexter, portionering och billigare ingrediensval. Valj ett verktyg nedan eller skriv fritt.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const send = async (text?: string) => {
    const msg = text ?? input.trim();
    if (!msg || loading) return;
    setInput("");
    setMenuOpen(false);
    const newMessages: Message[] = [...messages, { role: "user", content: msg }];
    setMessages(newMessages);
    setLoading(true);
    try {
      const reply = await fetchAI(msg, messages.slice(-8), pageContext());
      setMessages([...newMessages, { role: "assistant", content: reply }]);
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : "";
      setMessages([...newMessages, { role: "assistant", content: localFallback(`${msg}\n${errMsg}`) }]);
    } finally {
      setLoading(false);
    }
  };

  const copyMessage = async (content: string, index: number) => {
    await navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    window.setTimeout(() => setCopiedIndex(null), 1200);
  };

  return (
    <>
      <div className="fixed bottom-20 md:bottom-6 right-4 z-50 flex flex-col items-end gap-2">
        {menuOpen && !open && (
          <div className="w-72 rounded-2xl p-2 flex flex-col gap-1 shadow-xl"
            style={{ background: "var(--sv-surface)", border: "1px solid var(--sv-border)" }}>
            <div className="px-3 py-2">
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--sv-gold)" }}>AI-verktyg</p>
              <p className="text-[12px] mt-1" style={{ color: "var(--sv-text-2)" }}>Välj vad du vill göra snabbare.</p>
            </div>
            {QUICK_ACTIONS.slice(0, 4).map(({ label, helper, prompt, icon: Icon }) => (
              <button
                key={label}
                onClick={() => { setOpen(true); setMenuOpen(false); void send(prompt); }}
                className="flex items-center gap-3 text-left px-3 py-2.5 rounded-xl transition-colors hover:bg-black/[.04] dark:hover:bg-white/[.05]"
              >
                <Icon className="w-4 h-4 shrink-0" style={{ color: "var(--sv-gold)" }} />
                <span className="min-w-0">
                  <span className="block text-[13px] font-semibold" style={{ color: "var(--sv-text)" }}>{label}</span>
                  <span className="block text-[11px]" style={{ color: "var(--sv-text-2)" }}>{helper}</span>
                </span>
              </button>
            ))}
          </div>
        )}
        <button
          onClick={() => { if (open) setOpen(false); else setMenuOpen(!menuOpen); }}
          className="rounded-full shadow-lg transition-all flex items-center justify-center active:scale-95"
          style={{ width: 54, height: 54, background: "var(--sv-brown)", color: "var(--sv-gold)" }}
          title="Chef AI"
        >
          {open ? <X className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div className="fixed bottom-24 md:bottom-20 right-4 z-50 w-[calc(100vw-2rem)] sm:w-[440px] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{ maxHeight: "calc(100vh - 130px)", height: 640, background: "var(--sv-surface)", border: "1px solid var(--sv-border)" }}>
          <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
            style={{ background: "var(--sv-brown)", color: "var(--sv-surface)" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,.14)" }}>
              <ChefHat className="w-4 h-4" style={{ color: "var(--sv-gold)" }} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold leading-tight">Chef AI</p>
              <p className="text-xs opacity-75">Food cost, recept, allergener och meny</p>
            </div>
            <button onClick={() => setOpen(false)} className="opacity-75 hover:opacity-100">
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3 grid grid-cols-2 gap-2" style={{ borderBottom: "1px solid var(--sv-border)" }}>
            {QUICK_ACTIONS.map(({ label, helper, prompt, icon: Icon }) => (
              <button
                key={label}
                onClick={() => void send(prompt)}
                className="text-left rounded-xl p-3 transition-all hover:-translate-y-0.5"
                style={{ background: "var(--sv-muted)", border: "1px solid var(--sv-border)" }}
              >
                <Icon className="w-4 h-4 mb-2" style={{ color: "var(--sv-gold)" }} />
                <span className="block text-[12px] font-bold" style={{ color: "var(--sv-text)" }}>{label}</span>
                <span className="block text-[11px] leading-snug mt-0.5" style={{ color: "var(--sv-text-2)" }}>{helper}</span>
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: "var(--sv-muted)" }}>
                    <Bot className="w-3.5 h-3.5" style={{ color: "var(--sv-gold)" }} />
                  </div>
                )}
                <div className="group max-w-[86%]">
                  <div
                    className="px-3 py-2 rounded-2xl text-[12px] leading-relaxed whitespace-pre-wrap"
                    style={m.role === "user"
                      ? { background: "var(--sv-brown)", color: "var(--sv-surface)", borderTopRightRadius: 4 }
                      : { background: "var(--sv-muted)", color: "var(--sv-text)", borderTopLeftRadius: 4 }}
                  >
                    {m.content}
                  </div>
                  {m.role === "assistant" && (
                    <button
                      onClick={() => void copyMessage(m.content, i)}
                      className="mt-1 ml-1 inline-flex items-center gap-1 text-[11px] opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: "var(--sv-text-2)" }}
                    >
                      {copiedIndex === i ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedIndex === i ? "Kopierat" : "Kopiera"}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2 justify-start">
                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: "var(--sv-muted)" }}>
                  <Bot className="w-3.5 h-3.5" style={{ color: "var(--sv-gold)" }} />
                </div>
                <div className="px-3 py-2 rounded-2xl rounded-tl-sm flex gap-1 items-center" style={{ background: "var(--sv-muted)" }}>
                  <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "var(--sv-text-2)", animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "var(--sv-text-2)", animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "var(--sv-text-2)", animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="p-3 flex gap-2 flex-shrink-0" style={{ borderTop: "1px solid var(--sv-border)" }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              placeholder="Ex: Räkna marginal på Caesar med kostnad 42 kr och pris 149 kr"
              rows={2}
              className="flex-1 text-[12px] px-3 py-2 rounded-xl outline-none resize-none"
              style={{ background: "var(--sv-muted)", color: "var(--sv-text)", border: "1px solid var(--sv-border)" }}
            />
            <button
              onClick={() => void send()}
              disabled={!input.trim() || loading}
              className="w-10 rounded-xl flex items-center justify-center disabled:opacity-40 transition-colors flex-shrink-0"
              style={{ background: "var(--sv-brown)", color: "var(--sv-surface)" }}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
