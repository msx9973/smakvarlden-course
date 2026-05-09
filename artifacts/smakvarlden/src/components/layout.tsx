import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Calculator, Users, BookOpen, Leaf, Moon, Sun,
  Shield, LogOut, LogIn, ChefHat, HelpCircle, Trash2, Globe, Crown, Lock,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { AiChat } from "./AiChat";

function useNavItems() {
  const { t } = useI18n();
  return {
    main: [
      { href: "/",            label: t("Dashboard"),    icon: LayoutDashboard },
      { href: "/recipes",     label: t("Recept"),        icon: BookOpen },
      { href: "/ingredients", label: t("Ingredienser"),  icon: Leaf },
      { href: "/calculator",  label: t("Kalkylator"),    icon: Calculator },
      { href: "/market",      label: t("Marknadsdata"),  icon: Globe },
      { href: "/community",   label: t("Community"),     icon: Users },
    ],
    support: [
      { href: "/svinn",   label: t("Svinnanalys"),  icon: Trash2 },
      { href: "/help",    label: t("Hjälpcenter"),  icon: HelpCircle },
      { href: "/upgrade", label: t("Pro Chef"),     icon: Crown },
    ],
  };
}

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
        style={active ? { background: "rgba(201,168,76,.22)" } : { background: "var(--sv-muted)" }}>
        <Icon className="w-3.5 h-3.5 transition-colors"
          style={{ color: active ? "var(--sv-nav-active-icon)" : admin ? "hsl(350 55% 50%)" : "var(--sv-text-2)" }} />
      </div>
      <span>{label}</span>
      {active && <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: "var(--sv-nav-active-dot)" }} />}
    </Link>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const { user, logout } = useAuth();
  const { lang, setLang, t } = useI18n();
  const [location] = useLocation();
  const { main: NAV_MAIN, support: NAV_SUPPORT } = useNavItems();

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
            <div className="text-[10px] leading-none mt-0.5" style={{ color: "var(--sv-text-2)" }}>{t("Kockens verktyg")}</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] px-3 py-2 mb-1"
            style={{ color: "var(--sv-gold)" }}>
            {t("Verktyg")}
          </p>
          {NAV_MAIN.map((item) => <NavItem key={item.href} {...item} />)}

          {user?.role === "admin" && (
            <>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] px-3 py-2 mt-4 mb-1"
                style={{ color: "var(--sv-gold)" }}>
                {t("Administration")}
              </p>
              <NavItem href="/admin" label={t("Admin")} icon={Shield} admin />
            </>
          )}

          <p className="text-[10px] font-bold uppercase tracking-[0.1em] px-3 py-2 mt-4 mb-1"
            style={{ color: "var(--sv-gold)" }}>
            {t("Support")}
          </p>
          {NAV_SUPPORT.map((item) => <NavItem key={item.href} {...item} />)}
        </nav>

        {/* User footer */}
        <div className="px-3 pb-4 pt-2 shrink-0" style={{ borderTop: "1px solid var(--sv-border)" }}>
          {user ? (
            <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl" style={{ cursor: "default" }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-serif shrink-0"
                style={{ background: "var(--sv-brown)", color: "var(--sv-gold)" }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold truncate" style={{ color: "var(--sv-text)" }}>{user.name}</p>
                <p className="text-[11px]" style={{ color: "var(--sv-gold)" }}>
                  {user.role === "admin" ? t("Admin") : user.plan === "pro" ? t("Pro Chef") : t("Kock")}
                </p>
              </div>
              <button onClick={logout} title={t("Logga ut")}
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
              {t("Logga in")}
            </Link>
          )}
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header className="h-[60px] sticky top-0 z-20 flex items-center justify-between px-6"
          style={{ background: "var(--sv-sidebar)", borderBottom: "1px solid var(--sv-border)" }}>
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
                {t("Logga in")}
              </Link>
            )}
            {/* Language toggle */}
            <button
              onClick={() => setLang(lang === "sv" ? "en" : "sv")}
              className="h-9 px-3 rounded-xl flex items-center justify-center transition-colors text-[12px] font-bold"
              style={{ color: "var(--sv-text-2)", background: "var(--sv-muted)" }}
              title="Switch language"
            >
              {lang === "sv" ? "EN" : "SV"}
            </button>
            {/* Theme toggle */}
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
          {!user && (
            <div className="mb-6 flex items-center gap-3 px-5 py-3.5 rounded-2xl"
              style={{ background: "var(--sv-surface)", border: "1.5px solid var(--sv-border)", boxShadow: "0 2px 8px var(--sv-shadow)" }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "rgba(201,168,76,.15)" }}>
                <Lock className="w-4 h-4" style={{ color: "var(--sv-gold)" }} />
              </div>
              <p className="text-[13px] flex-1" style={{ color: "var(--sv-text-2)" }}>
                <span className="font-semibold" style={{ color: "var(--sv-text)" }}>{t("Du surfar som gäst")}</span>
                {" — "}{t("Logga in för att skapa recept, spara kalkyler och hålla koll på din kokbok.")}
              </p>
              <Link href="/login"
                className="shrink-0 px-4 py-1.5 rounded-full text-[12px] font-semibold transition-all hover:opacity-90"
                style={{ background: "var(--sv-brown)", color: "var(--sv-surface)" }}>
                {t("Logga in")}
              </Link>
            </div>
          )}
          {children}
        </main>
      </div>

      {/* ── Mobile bottom nav ── */}
      <div className="md:hidden fixed bottom-0 inset-x-0 h-16 flex items-center justify-around z-50"
        style={{ background: "var(--sv-sidebar)", borderTop: "1px solid var(--sv-border)" }}>
        {[...NAV_MAIN.slice(0, 4), { href: "/help", label: t("Hjälpcenter"), icon: HelpCircle }].map(({ href, label, icon: Icon }) => {
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
