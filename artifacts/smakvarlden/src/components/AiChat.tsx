import { useState, useRef, useEffect } from "react";
import { X, Send, Bot, Sparkles, ChefHat, Minimize2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function fetchAI(message: string, history: Message[], lang: string): Promise<string> {
  const token = localStorage.getItem("smakvarlden_token");
  const res = await fetch(`${BASE}/api/ai/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ message, history, lang }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "AI-tjänsten är inte tillgänglig.");
  return data.reply;
}

export function AiChat() {
  const { lang } = useI18n();
  const isEn = lang === "en";

  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: isEn
        ? "Hi! I'm your AI chef assistant. Ask me about recipes, techniques, pricing or food combinations! 🍽️"
        : "Hej! Jag är din AI-kockassistent. Fråga mig om recept, tekniker, prissättning eller matkombinationer! 🍽️",
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
      const reply = await fetchAI(msg, messages.slice(-10), lang);
      setMessages([...newMessages, { role: "assistant", content: reply }]);
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : isEn ? "An error occurred" : "Fel uppstod";
      setMessages([...newMessages, { role: "assistant", content: `⚠️ ${errMsg}` }]);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = isEn ? [
    { label: "💰 Cost Optimization", msg: "Help me reduce the cost of a recipe with salmon and vegetables without losing quality." },
    { label: "🧠 Recipe Idea", msg: "Give me a creative recipe idea for an autumn menu with Swedish ingredients." },
    { label: "✍️ Menu Description", msg: "Write an elegant menu description for a pan-fried salmon fillet with dill butter and root vegetables." },
    { label: "⚠️ Allergens", msg: "What common allergens are in a classic Caesar salad?" },
  ] : [
    { label: "💰 Kostnadsoptimering", msg: "Hjälp mig att minska kostnaden på ett recept med lax och grönsaker utan att tappa kvalitet." },
    { label: "🧠 Receptidé", msg: "Ge mig en kreativ receptidé för en höstmeny med svenska råvaror." },
    { label: "✍️ Menybeskrivning", msg: "Skriv en elegant menybeskrivning för en pannstekt laxfilé med dillsmör och rotfrukter." },
    { label: "⚠️ Allergener", msg: "Vilka vanliga allergener finns i en klassisk Caesar-sallad?" },
  ];

  return (
    <>
      {/* FAB button */}
      <div className="fixed bottom-20 md:bottom-6 right-4 z-50 flex flex-col items-end gap-2">
        {menuOpen && !open && (
          <div className="bg-card border border-border rounded-2xl shadow-xl p-2 flex flex-col gap-1 mb-1 w-56">
            <p className="text-xs font-semibold text-muted-foreground px-2 py-1">AI-verktyg</p>
            {quickActions.map((a) => (
              <button
                key={a.label}
                onClick={() => { setOpen(true); setMenuOpen(false); send(a.msg); }}
                className="text-left text-xs px-3 py-2 rounded-lg hover:bg-muted transition-colors text-foreground font-medium"
              >
                {a.label}
              </button>
            ))}
            <button
              onClick={() => { setOpen(true); setMenuOpen(false); }}
              className="text-left text-xs px-3 py-2 rounded-lg hover:bg-muted transition-colors text-foreground font-medium"
            >
              {isEn ? "👨‍🍳 Chef AI — Free question" : "👨‍🍳 Chef AI — Fri fråga"}
            </button>
          </div>
        )}
        <button
          onClick={() => { if (open) setOpen(false); else setMenuOpen(!menuOpen); }}
          className="w-13 h-13 rounded-full bg-primary text-white shadow-lg hover:bg-primary/90 transition-all flex items-center justify-center text-xl active:scale-95"
          style={{ width: 52, height: 52 }}
          title="AI-kockassistent"
        >
          {open ? <X className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
        </button>
      </div>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-24 md:bottom-20 right-4 z-50 w-80 md:w-96 bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{ maxHeight: "calc(100vh - 140px)", height: 500 }}>
          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border bg-primary text-white flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <ChefHat className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold leading-tight">Chef AI</p>
              <p className="text-xs text-white/70 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                Online · Powered by Claude
              </p>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white">
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "assistant" && (
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-3 h-3 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-primary text-white rounded-tr-sm"
                      : "bg-muted text-foreground rounded-tl-sm"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2 justify-start">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-3 h-3 text-primary" />
                </div>
                <div className="bg-muted px-3 py-2 rounded-2xl rounded-tl-sm flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick actions (only when minimal messages) */}
          {messages.length <= 1 && (
            <div className="px-3 pb-1 flex flex-wrap gap-1">
              {quickActions.slice(0, 2).map((a) => (
                <button key={a.label} onClick={() => send(a.msg)}
                  className="text-xs px-2.5 py-1 rounded-full border border-border hover:bg-muted transition-colors text-muted-foreground">
                  {a.label}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-border flex gap-2 flex-shrink-0">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
              placeholder={isEn ? "Ask a question…" : "Ställ en fråga…"}
              className="flex-1 text-xs px-3 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary/90 disabled:opacity-40 transition-colors flex-shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
