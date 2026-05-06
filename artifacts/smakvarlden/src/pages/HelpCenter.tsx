import { useState } from "react";
import {
  ChevronDown, ChevronRight, BookOpen, Calculator, Leaf, Users, Sparkles,
  Mail, Search, HelpCircle, PlayCircle, LayoutDashboard, TrendingUp, Trash2, ChefHat,
} from "lucide-react";
import { Link } from "wouter";

interface FaqItem { q: string; a: string }
interface FaqSection { icon: React.ElementType; title: string; color: string; items: FaqItem[] }
interface GuideStep { num: string; title: string; desc: string }

const GUIDE_STEPS: GuideStep[] = [
  { num: "01", title: "Skapa ett konto", desc: "Klicka på Logga in i sidomenyn. Registrera dig med namn, e-post och lösenord. Ditt konto ger dig tillgång till din privata kokbok, kalkylatorn och community." },
  { num: "02", title: "Utforska receptbiblioteket", desc: "Bläddra bland 59+ recept filtrerade på kategori. Klicka på ett recept för att se ingredienser, kostnad per portion och marginal." },
  { num: "03", title: "Kalkylera ditt recept", desc: "Gå till Kalkylator. Välj ingredienser, ange mängder och portioner — kostnaden räknas ut automatiskt med aktuella grossistpriser från SCB." },
  { num: "04", title: "Analysera marginalen", desc: "Ange ditt försäljningspris och se vinstmarginalen i realtid. Justera markup tills du träffar din målmarginal på 60%+." },
  { num: "05", title: "Kontrollera svinnkostnaden", desc: "Gå till Svinnanalys för att se uppskattad matsvinnskostnad per kategori och tips för att minska spill." },
  { num: "06", title: "Fråga AI-assistenten", desc: "Klicka på glitterknappen (✦) nere till höger. Ställ frågor om recept, allergener, kostnadsoptimering och substitut på svenska." },
];

const FAQ_SECTIONS: FaqSection[] = [
  {
    icon: LayoutDashboard,
    title: "Kom igång",
    color: "#3b82f6",
    items: [
      { q: "Hur skapar jag ett konto?", a: "Klicka på 'Logga in' i sidomenyn och välj sedan 'Skapa konto'. Det är gratis och tar under en minut. Ange namn, e-postadress och välj ett lösenord." },
      { q: "Kan jag använda Smakvärlden utan att logga in?", a: "Ja! Du kan bläddra bland recept, se priser och läsa community-inlägg utan konto. För att skapa egna recept, spara kalkyler och delta i community behöver du registrera dig." },
      { q: "Hur byter jag lösenord?", a: "Kontakta support via support@smakvarlden.se. Stöd för automatisk lösenordsåterställning via e-post planeras i en kommande uppdatering." },
      { q: "Stöder Smakvärlden flera användare i samma restaurang?", a: "Ja! Varje kock skapar sitt eget konto. Recept kan delas via Community-fliken. En separat team-funktion med gemensam kokbok planeras framöver." },
    ],
  },
  {
    icon: BookOpen,
    title: "Recept",
    color: "#d97706",
    items: [
      { q: "Hur skapar jag ett nytt recept?", a: "Gå till Recept och klicka på '+ Nytt recept'. Du behöver vara inloggad. Fyll i namn, kategori, kök, portioner och välj ingredienser från databasen med angivna mängder." },
      { q: "Hur räknas kostnaden ut?", a: "Kostnaden beräknas automatiskt: ingrediensernas aktuella grossistpris (kr/kg eller enhet) × angiven mängd. Totalen delas sedan på antalet portioner för att ge kostnad per portion." },
      { q: "Varför visar exempelrecept 66.7% marginal?", a: "Seedade exempelrecept har standardpriser (kostnad × 3 = försäljningspris vilket ger 66.7% marginal). Dina egna recept med dina försäljningspriser visar verkliga siffror." },
      { q: "Kan jag filtrera recept på kategori?", a: "Ja! Klicka på kategoriknapparna (Alla, Kött, Fisk, Vegetariskt, osv.) i receptvyn. Du kan också söka fritt i sökrutan för att hitta specifika rätter." },
      { q: "Hur delar jag ett recept med communityn?", a: "Öppna receptet och klicka på dela-knappen. Receptet publiceras då i Community-fliken och syns för alla inloggade användare i hela Sverige." },
    ],
  },
  {
    icon: Calculator,
    title: "Kalkylator & marginaler",
    color: "#16a34a",
    items: [
      { q: "Hur fungerar kalkylatorn?", a: "Kalkylatorn visar dina topp 10 recept sorterade efter vinstmarginal, kategoriuppdelning av ingredienskostnader, och en detaljerad jämförelsetabell med kostnad, pris, vinst och marginal för varje recept." },
      { q: "Vad är skillnaden mellan markup och marginal?", a: "Markup är påslaget på råvarukostnaden (ex. 200% markup = pris är 3× kostnaden). Marginal är vinsten som andel av försäljningspriset. 200% markup ger 66.7% marginal. Restaurangbranschen siktar typiskt på 60–70% marginal." },
      { q: "Vilken marginal bör jag ha?", a: "En hälsosam restaurangmarginal är 60–70% på matvaror (food cost under 30–35%). Fisk och skaldjur kan vara svårare — sikta på minst 55%. Kolla kalkylatorn för att se dina nuvarande marginaler per recept." },
      { q: "Hur justerar jag ett recept som har för låg marginal?", a: "Tre alternativ: 1) Höj försäljningspriset, 2) Byt ut en dyr ingrediens mot ett billigare alternativ (fråga AI-assistenten om substitut), 3) Minska portionsstorleken eller ändra tillredningsmetoden för att minska svinn." },
      { q: "Kan jag spara en kalkyl?", a: "Ja — alla recept du skapar sparas automatiskt i din kokbok med kostnadsuppgifter. Uppdatera priset på ett recept och marginalen räknas om direkt." },
    ],
  },
  {
    icon: Leaf,
    title: "Ingredienser & priser",
    color: "#0891b2",
    items: [
      { q: "Var kommer prisdata ifrån?", a: "Prisdata hämtas från SCB (Statistikmyndigheten) via deras öppna API för livsmedelspriser. Data kompletteras med simulerade grossistpriser för de kategorier SCB inte täcker." },
      { q: "Hur ofta uppdateras priserna?", a: "SCB publicerar prisdata varje måndag, onsdag och fredag. Admin kan dessutom trigga en manuell synkronisering via Admin-panelen." },
      { q: "Vad betyder prisvarningar på dashboarden?", a: "En prisvarning visas när en ingrediens pris förändrats med mer än 5% sedan senaste uppdateringen. Dashboard visar antal aktiva prisvarningar — gå till Ingredienser-fliken och sortera på 'Förändring' för att se vilka råvaror som stigit mest." },
      { q: "Vilka råvaror brukar variera mest i pris?", a: "Fisk och skaldjur (+/- 15–25% säsongsvis), färska örter (+/- 20% beroende på väder), kött (+/- 10% beroende på tillgång). Håll extra koll på dessa kategorier inför menybyte." },
      { q: "Kan jag lägga till egna leverantörspriser?", a: "Ja! Gå till Ingredienser och klicka '+ Ny ingrediens'. Ange ditt eget avtalspris från din leverantör — det används sedan i alla dina receptkalkyler." },
    ],
  },
  {
    icon: Trash2,
    title: "Svinnanalys",
    color: "#dc2626",
    items: [
      { q: "Hur beräknas svinnsiffrorna?", a: "Svinn beräknas med branschstandardiserade frekvenser per kategori: örter 22%, fisk & skaldjur 18%, grönsaker 20%, kött 12%, mejeri 3%. Kostnaderna baseras på dina 148 spårade ingredienser multiplicerat med 40 dagliga portioner." },
      { q: "Min restaurang serverar färre än 40 portioner — stämmer siffrorna?", a: "Dela den visade veckovisa svinnsiffran med 40 och multiplicera med ditt faktiska portionsantal. Exempelvis: serverar du 20 portioner/dag är din uppskattade svinnskostnad ca hälften av det visade värdet." },
      { q: "Hur minskar jag svinn praktiskt?", a: "FIFO (First In, First Out) är den viktigaste principen — rotera alltid varor i kylen. Vakuumförvaring tredubblar köttets hållbarhet. Använd grönsaksrester till buljonger. Standardiserade portioner kan minska svinn med 10–15%." },
      { q: "Kan Smakvärlden spåra mitt faktiska svinn?", a: "Just nu visar systemet estimat baserade på branschsnitt. En funktion för att registrera faktiskt dagligt svinn per ingrediens/kategori planeras i kommande version." },
    ],
  },
  {
    icon: Sparkles,
    title: "AI-assistenten",
    color: "#8b5cf6",
    items: [
      { q: "Hur använder jag AI-chatten?", a: "Klicka på glitter-knappen (✦) nere till höger på skärmen. Skriv din fråga och tryck Enter eller klicka Skicka. Assistenten svarar alltid på svenska." },
      { q: "Vad kan AI-assistenten hjälpa med?", a: "Receptförslag och varianter, kostnadsoptimering ('vilket ingredienssubstitut är billigare?'), allergendetektion, tillagningstekniker, säsongsmenyer, portionsskalning och priskalkyler." },
      { q: "Varför fungerar inte AI-chatten?", a: "AI-chatten kräver en aktiv Anthropic API-nyckel. Kontakta administratören för att aktivera nyckeln. Utan aktivering visas ett vänligt felmeddelande." },
      { q: "Vad frågar kockar AI:n om mest?", a: "Vanligaste frågorna: 'Vad kan jag byta ut [dyr ingrediens] mot?', 'Hur skakar jag om det här receptet till glutenfritt?', 'Ge mig idéer för veckans meny med [ingredienser i kyl]' och 'Hur beräknar jag portion för 80 gäster?'" },
    ],
  },
  {
    icon: ChefHat,
    title: "För kockar",
    color: "#d97706",
    items: [
      { q: "Hur planerar jag en lönsam meny?", a: "Använd Kalkylatorn för att säkerställa att varje rätt har minst 60% marginal. Balansera menyn: ha 2–3 premiuminlägg (hög marginal trots hög råvarukostnad) och flera 'stjerndiskar' som är enkla och lönsamma. Kontrollera ingredienskategorierna i kalkylatorn för att hitta de dyraste kategorierna." },
      { q: "Hur hanterar jag råvaror med högt svinn?", a: "Gå till Svinnanalys för att se vilka kategorier har högst svinnfrekvens. Örter (22%) och fisk (18%) är vanligaste boven. Köp örter frysta eller som paste istället för färska. Trimma fisk direkt vid leverans och vakuumförpacka." },
      { q: "Hur följer jag prisändringar på råvaror i realtid?", a: "Dashboard visar 'Prisvarningar' — antal råvaror med >5% prisändring. Gå till Ingredienser och sortera på Förändring-kolumnen (röd pill = prishöjning). Uppdatera dina recept om en nyckelråvara stigit mer än 10%." },
      { q: "Hur beräknar jag rätt portionsstorlek?", a: "Sätt antalet portioner i receptet till ditt faktiska serveringsantal. Systemet räknar automatiskt om cost per portion. Som tumregel: förrätt 150–200g, varmrätt 300–400g, dessert 120–180g." },
      { q: "Hur använder jag AI för substitut?", a: "Fråga AI-assistenten: 'Vad kan jag ersätta [ingrediens] med i [recept]?' eller 'Ge billigare alternativ till tryffel som ger liknande umamismak'. AI:n föreslår substitut med hänsyn till smak, textur och allergener." },
    ],
  },
  {
    icon: TrendingUp,
    title: "För dig som ägare",
    color: "hsl(44 50% 46%)",
    items: [
      { q: "Hur läser jag dashboard-statistiken?", a: "De 4 övre korten visar nyckeltal: totalt antal recept i kokboken, spårade ingredienser (148 st), snittmarginal för alla recept, och aktiva prisvarningar. Aktivitetsflödet visar alla ändringar i realtid. Rättspanelen till höger visar dina topp 5 mest lönsamma recept — jämför med vad som faktiskt säljer bäst." },
      { q: "Hur analyserar jag mina mest lönsamma rätter?", a: "Gå till Kalkylator → 'Bäst vinstmarginal'. Det visar dina topp 10 recept sorterade efter marginal med visuella staplar. Jämförelsetabellen nedan visar exakt kostnad, pris, vinst och marginal. Exportera data och kombinera med din kassarapport för att se vilka rätter som är lönsamma OCH populära." },
      { q: "Hur använder jag Community som marknadsanalys?", a: "Community-fliken visar vad andra kockar i Sverige skapar och prissätter. Studera kostnaderna (ex. 'Smörkokt hummer 420 kr') för att förstå marknadspriser. Se vilka kategorier som är populärast (antal inlägg och likes) för att förstå vad gäster efterfrågar. Använd detta när du sätter priser på din meny." },
      { q: "Hur förstår jag om mina priser är konkurrenskraftiga?", a: "Jämför dina försäljningspriser med community-inlägg från andra kockar. Kalkylatorn visar om din marginal är bra (>60%), godkänd (45–60%) eller för låg (<45%). En bra regel: food cost (råvarukostnad) bör vara max 28–33% av försäljningspriset." },
      { q: "Hur tolkar jag svinnanalysen som investeringsunderlag?", a: "Svinnanalyssidan visar uppskattad svinnskostnad per år (baserat på branschsnitt). Om din restaurang tjänar 40% på den möjliga besparingen (15 054 kr/år) är kostnaden för att förbättra rutiner — som att köpa en vakuummaskin (ca 3 000 kr) — lönsam på 2–3 månader." },
      { q: "Hur vet jag vilka råvarukategorier som driver upp mina kostnader?", a: "Kalkylatorn har ett stapeldiagram 'Ingredienser per kategori' som visar snittpriset per kategori. Höga staplar = dyra kategorier. Svinnanalyssidan visar svinnskostnad per kategori — kombinera dessa insikter för att se var du kan göra besparingar med störst effekt." },
    ],
  },
  {
    icon: Users,
    title: "Community",
    color: "#06b6d4",
    items: [
      { q: "Hur delar jag ett recept?", a: "Klicka på '+ Dela recept' i Community-vyn. Fyll i receptnamn, ditt namn, kategori, kostnad och en beskrivning. Inlägget syns direkt för alla användare." },
      { q: "Kan jag se hur populärt mitt recept är?", a: "Ja — varje inlägg visar antal likes. Klicka på hjärtat för att gilla andras recept. Framtida versioner planerar notiser när någon gillar ditt recept." },
      { q: "Hur hittar jag inspiration för min nästa meny?", a: "Bläddra i Community och filtrera på kategori via sökrutan. Kolla kostnaderna som andra kockar anger — det ger en bild av vad som är rimligt att spendera på en rätt. Gillade inlägg indikerar vad marknaden uppskattar." },
    ],
  },
];

function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="space-y-1">
      {items.map((item, i) => (
        <div key={i} className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--sv-border)" }}>
          <button onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors"
            style={{ background: open === i ? "var(--sv-accent)" : "var(--sv-surface)", color: "var(--sv-text)" }}>
            <span className="text-sm font-semibold pr-4">{item.q}</span>
            <ChevronDown className="w-4 h-4 shrink-0 transition-transform"
              style={{ color: "var(--sv-gold)", transform: open === i ? "rotate(180deg)" : "rotate(0)" }} />
          </button>
          {open === i && (
            <div className="px-5 pb-4 pt-2 text-[13px] leading-relaxed"
              style={{ background: "var(--sv-accent)", color: "var(--sv-text-2)" }}>
              {item.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function SectionCard({ section, defaultOpen }: { section: FaqSection; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const Icon = section.icon;
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--sv-border)", background: "var(--sv-surface)", boxShadow: "0 2px 8px var(--sv-shadow)" }}>
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-6 py-5 text-left transition-colors"
        style={{ background: open ? "var(--sv-accent)" : "var(--sv-surface)" }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: open ? section.color : "var(--sv-muted)" }}>
          <Icon className="w-4 h-4" style={{ color: open ? "#fff" : section.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-base font-serif font-semibold" style={{ color: "var(--sv-text)" }}>{section.title}</span>
          <span className="ml-2 text-[11px] font-medium px-2 py-0.5 rounded-full"
            style={{ background: "var(--sv-muted)", color: "var(--sv-text-2)" }}>
            {section.items.length} frågor
          </span>
        </div>
        <ChevronRight className="w-4 h-4 transition-transform shrink-0"
          style={{ color: "var(--sv-gold)", transform: open ? "rotate(90deg)" : "rotate(0)" }} />
      </button>
      {open && (
        <div className="px-6 pb-6 pt-1">
          <FaqAccordion items={section.items} />
        </div>
      )}
    </div>
  );
}

export default function HelpCenter() {
  const [search, setSearch] = useState("");

  const filtered = search.trim().length > 1
    ? FAQ_SECTIONS.map((s) => ({
        ...s,
        items: s.items.filter((item) =>
          item.q.toLowerCase().includes(search.toLowerCase()) ||
          item.a.toLowerCase().includes(search.toLowerCase())
        ),
      })).filter((s) => s.items.length > 0)
    : FAQ_SECTIONS;

  return (
    <div className="max-w-4xl flex flex-col gap-8">

      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden px-8 py-12 text-center"
        style={{ background: "linear-gradient(135deg, hsl(17 47% 13%), hsl(17 37% 20%))", boxShadow: "0 16px 48px rgba(44,24,16,.22)" }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 30% 40%, hsl(44 54% 54%) 0%, transparent 55%), radial-gradient(circle at 75% 70%, hsl(44 54% 54%) 0%, transparent 50%)" }} />
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: "rgba(201,168,76,.15)", border: "1px solid rgba(201,168,76,.3)" }}>
            <HelpCircle className="w-7 h-7" style={{ color: "hsl(44 60% 70%)" }} />
          </div>
          <h1 className="font-serif text-3xl font-bold mb-3 text-white">Hjälpcenter</h1>
          <p className="text-sm leading-relaxed max-w-md mx-auto mb-8" style={{ color: "rgba(250,248,244,.65)" }}>
            Allt du behöver veta om Smakvärlden — för kockar och restaurangägare.
          </p>
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(250,248,244,.4)" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Sök i hjälpcentret…"
              className="w-full pl-11 pr-4 py-3 rounded-full text-sm outline-none transition-all"
              style={{
                background: "rgba(255,255,255,.09)",
                border: "1px solid rgba(255,255,255,.15)",
                color: "#fff",
                fontFamily: "'DM Sans', sans-serif",
              }}
              onFocus={(e) => { e.target.style.borderColor = "rgba(201,168,76,.5)"; }}
              onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,.15)"; }}
            />
          </div>
        </div>
      </div>

      {/* Quick links */}
      {!search && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Kom igång snabbt", desc: "6 steg guide",      icon: PlayCircle,  color: "#3b82f6" },
            { label: "Recept & kalkyl",  desc: "Skapa och räkna",   icon: Calculator,  color: "#d97706" },
            { label: "För kockar",       desc: "Dagliga tips",       icon: ChefHat,     color: "#16a34a" },
            { label: "För dig som ägare", desc: "Analysera & förstå", icon: TrendingUp, color: "hsl(44 50% 44%)" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label}
                className="flex items-start gap-3 p-4 rounded-xl transition-all hover:scale-[1.01] cursor-pointer"
                style={{ background: "var(--sv-surface)", border: "1px solid var(--sv-border)", boxShadow: "0 2px 8px var(--sv-shadow)" }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${item.color}18` }}>
                  <Icon className="w-4 h-4" style={{ color: item.color }} />
                </div>
                <div>
                  <div className="text-xs font-semibold" style={{ color: "var(--sv-text)" }}>{item.label}</div>
                  <div className="text-[11px] mt-0.5" style={{ color: "var(--sv-text-2)" }}>{item.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Getting started guide */}
      {!search && (
        <div>
          <div className="flex items-center gap-2 mb-5">
            <PlayCircle className="w-5 h-5" style={{ color: "var(--sv-gold)" }} />
            <h2 className="font-serif text-xl font-bold" style={{ color: "var(--sv-text)" }}>Kom igång på 6 steg</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {GUIDE_STEPS.map((step) => (
              <div key={step.num} className="flex gap-4 p-5 rounded-xl"
                style={{ background: "var(--sv-surface)", border: "1px solid var(--sv-border)", boxShadow: "0 2px 6px var(--sv-shadow)" }}>
                <div className="font-serif font-bold text-lg shrink-0 w-8 text-right" style={{ color: "var(--sv-gold)" }}>
                  {step.num}
                </div>
                <div>
                  <div className="text-sm font-semibold mb-1" style={{ color: "var(--sv-text)" }}>{step.title}</div>
                  <div className="text-xs leading-relaxed" style={{ color: "var(--sv-text-2)" }}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FAQ */}
      <div>
        <div className="flex items-center gap-2 mb-5">
          <HelpCircle className="w-5 h-5" style={{ color: "var(--sv-gold)" }} />
          <h2 className="font-serif text-xl font-bold" style={{ color: "var(--sv-text)" }}>
            {search ? `Sökresultat (${filtered.reduce((a, s) => a + s.items.length, 0)} träffar)` : "Vanliga frågor"}
          </h2>
        </div>
        {filtered.length === 0 ? (
          <div className="text-center py-12 rounded-2xl" style={{ background: "var(--sv-surface)", border: "1px solid var(--sv-border)" }}>
            <HelpCircle className="w-8 h-8 mx-auto mb-3" style={{ color: "var(--sv-text-2)" }} />
            <p className="text-sm font-semibold" style={{ color: "var(--sv-text)" }}>Inga träffar för "{search}"</p>
            <p className="text-xs mt-1" style={{ color: "var(--sv-text-2)" }}>Prova ett annat sökord eller kontakta oss nedan.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((section, i) => (
              <SectionCard key={section.title} section={section} defaultOpen={search.length > 0 || i === 0} />
            ))}
          </div>
        )}
      </div>

      {/* Contact */}
      <div className="rounded-2xl p-8 flex flex-col sm:flex-row items-center gap-6"
        style={{ background: "var(--sv-accent)", border: "1px solid var(--sv-border)" }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: "var(--sv-brown)" }}>
          <Mail className="w-6 h-6" style={{ color: "var(--sv-gold)" }} />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h3 className="font-serif text-lg font-bold mb-1" style={{ color: "var(--sv-text)" }}>Hittade du inte svaret?</h3>
          <p className="text-sm leading-relaxed" style={{ color: "var(--sv-text-2)" }}>
            Kontakta oss på <strong style={{ color: "var(--sv-gold)" }}>support@smakvarlden.se</strong> eller
            använd AI-assistenten (✦) för direkthjälp om recept och kalkyl.
          </p>
        </div>
        <Link href="/community"
          className="shrink-0 px-5 py-2.5 rounded-full text-sm font-semibold transition-all"
          style={{ background: "var(--sv-brown)", color: "var(--sv-surface)", boxShadow: "0 4px 12px var(--sv-shadow)" }}>
          Gå till Community
        </Link>
      </div>
    </div>
  );
}
