import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Calculator, Users, BookOpen, Leaf, Moon, Sun,
  Shield, LogOut, LogIn, ChefHat, HelpCircle, Trash2, Globe, Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { AiChat } from "./AiChat";

const NAV_MAIN = [
  { href: "/",            label: "Dashboard",   icon: LayoutDashboard },
  { href: "/recipes",     label: "Recept",       icon: BookOpen },
  { href: "/ingredients", label: "Ingredienser", icon: Leaf },
  { href: "/calculator",  label: "Kalkylator",   icon: Calculator },
  { href: "/market",      label: "Marknadsdata", icon: Globe },
  { href: "/community",   label: "Community",    icon: Users },
];
const NAV_SUPPORT = [
  { href: "/plans", label: "Planer",       icon: Sparkles },
  { href: "/svinn", label: "Svinnanalys",  icon: Trash2 },
  { href: "/help",  label: "Hjälpcenter", icon: HelpCircle },
];

function NavItem({ href, label, icon: Icon, admin }: {
  href: string; label: string; icon: React.ElementType; admin?: boolean;
}) {
  const [location] = useLocation();
  const active = href === "/" ? location === "/" : location.startsWith(href);
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-150 select-none"
      style={active ? {
        background: "var(--sv-nav-active-bg)",
        color: "var(--sv-nav-active-text)",
        boxShadow: "0 4px 12px var(--sv-shadow)",
      } : {
        color: "var(--sv-nav-text)",
        background: "transparent",
      }}
    >
      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all"
        style={active ? {
          background: "rgba(201,168,76,.22)",
        } : {
          background: "var(--sv-muted)",
        }}>
        <Icon className="w-3.5 h-3.5 transition-colors"
          style={{ color: active ? "var(--sv-nav-active-icon)" : admin ? "hsl(350 55% 50%)" : "var(--sv-text-2)" }} />
      </div>
      <span>{label}</span>
      {active && (
        <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: "var(--sv-nav-active-dot)" }} />
      )}
    </Link>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const { user, logout } = useAuth();
  const [location] = useLocation();

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  return (
    <div className="flex min-h-screen w-full" style={{ background: "var(--sv-bg)" }}>

      {/* ── Sidebar ── */}
      <aside
        className="hidden md:flex w-60 flex-col shrink-0"
        style={{
          background: "var(--sv-sidebar)",
          borderRight: "1px solid var(--sv-border)",
          position: "sticky",
          top: 0,
          height: "100vh",
        }}
      >
        {/* Logo */}
        <div className="h-[60px] flex items-center px-4 gap-3 shrink-0"
          style={{ borderBottom: "1px solid var(--sv-border)" }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "var(--sv-brown)" }}>
            <ChefHat className="w-4 h-4" style={{ color: "var(--sv-gold)" }} />
          </div>
          <div>
            <span className="font-serif font-bold text-sm tracking-tight" style={{ color: "var(--sv-text)" }}>
              Smak<span style={{ color: "var(--sv-gold)", fontStyle: "italic" }}>världen</span>
            </span>
            <div className="text-[10px] leading-none mt-0.5" style={{ color: "var(--sv-text-2)" }}>Kockens verktyg</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] px-3 py-2 mb-1"
            style={{ color: "var(--sv-gold)" }}>
            Verktyg
          </p>
          {NAV_MAIN.map((item) => <NavItem key={item.href} {...item} />)}

          {user?.role === "admin" && (
            <>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] px-3 py-2 mt-4 mb-1"
                style={{ color: "var(--sv-gold)" }}>
                Administration
              </p>
              <NavItem href="/admin" label="Admin" icon={Shield} admin />
            </>
          )}

          <p className="text-[10px] font-bold uppercase tracking-[0.1em] px-3 py-2 mt-4 mb-1"
            style={{ color: "var(--sv-gold)" }}>
            Support
          </p>
          {NAV_SUPPORT.map((item) => <NavItem key={item.href} {...item} />)}
        </nav>

        {/* User footer */}
        <div className="px-3 pb-4 pt-2 shrink-0"
          style={{ borderTop: "1px solid var(--sv-border)" }}>
          {!user && (
            <Link href="/plans"
              className="mb-2 flex flex-col gap-1 px-3 py-3 rounded-xl transition-all"
              style={{ background: "var(--sv-accent)", border: "1px solid var(--sv-border)" }}>
              <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--sv-gold)" }}>
                14 dagar gratis
              </span>
              <span className="text-[12px] leading-snug" style={{ color: "var(--sv-text-2)" }}>
                Testa Pro Chef innan betalning.
              </span>
            </Link>
          )}
          {user ? (
            <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl transition-colors"
              style={{ cursor: "default" }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-serif shrink-0"
                style={{ background: "var(--sv-brown)", color: "var(--sv-gold)" }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold truncate" style={{ color: "var(--sv-text)" }}>{user.name}</p>
                <p className="text-[11px]" style={{ color: "var(--sv-gold)" }}>
                  {user.role === "admin" ? "Admin" : "Kock"}
                </p>
              </div>
              <button onClick={logout} title="Logga ut"
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:opacity-70"
                style={{ color: "var(--sv-text-2)" }}>
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <Link href="/login"
              className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-[13px] font-semibold transition-all"
              style={{ background: "var(--sv-muted)", color: "var(--sv-gold)" }}>
              <LogIn className="w-4 h-4" />
              Logga in
            </Link>
          )}
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header className="h-[60px] sticky top-0 z-20 flex items-center justify-between px-6"
          style={{
            background: "var(--sv-sidebar)",
            borderBottom: "1px solid var(--sv-border)",
          }}>
          {/* Mobile logo */}
          <div className="flex md:hidden items-center gap-2">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: "var(--sv-brown)" }}>
              <ChefHat className="w-3.5 h-3.5" style={{ color: "var(--sv-gold)" }} />
            </div>
            <span className="font-serif font-bold text-sm" style={{ color: "var(--sv-text)" }}>Smakvärlden</span>
          </div>
          <div className="hidden md:block" />

          <div className="flex items-center gap-2">
            {!user && (
              <Link href="/login"
                className="hidden md:flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all"
                style={{ background: "var(--sv-brown)", color: "var(--sv-surface)" }}>
                <LogIn className="w-3.5 h-3.5" />
                Logga in
              </Link>
            )}
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
              style={{ color: "var(--sv-text-2)", background: "var(--sv-muted)" }}
            >
              {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-auto p-6 pb-24 md:pb-8" style={{ background: "var(--sv-bg)" }}>
          {children}
        </main>
      </div>

      {/* ── Mobile bottom nav ── */}
      <div className="md:hidden fixed bottom-0 inset-x-0 h-16 flex items-center justify-around z-50"
        style={{ background: "var(--sv-sidebar)", borderTop: "1px solid var(--sv-border)" }}>
        {[...NAV_MAIN.slice(0, 4), { href: "/help", label: "Hälp", icon: HelpCircle }].map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? location === "/" : location.startsWith(href);
          return (
            <Link key={href} href={href}
              className="flex flex-col items-center gap-1 px-2 py-1 flex-1"
              style={{ color: active ? "var(--sv-gold)" : "var(--sv-text-2)" }}>
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>

      <AiChat />
    </div>
  );
}
