import { useState } from "react";
import {
  useListCommunityPosts,
  useListCommunityNews,
  useLikeCommunityPost,
  useCreateCommunityPost,
  getListCommunityPostsQueryKey,
  getListCommunityNewsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Heart, Plus, Users, Lock, ExternalLink, Newspaper } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { sv, enUS } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Input as ShadInput } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { Link } from "wouter";

const CATEGORIES = ["Kött", "Fisk & skaldjur", "Vegetariskt", "Pasta", "Mejeri", "Svamp & vilt", "Kryddor", "Oljor"];

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg,hsl(17 47% 13%),hsl(17 37% 22%))",
  "linear-gradient(135deg,#3b82f6,#1d4ed8)",
  "linear-gradient(135deg,#10b981,#065f46)",
  "linear-gradient(135deg,hsl(44 54% 50%),hsl(44 44% 36%))",
  "linear-gradient(135deg,#8b5cf6,#5b21b6)",
];

function ShareDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const schema = z.object({
    recipeName:  z.string().min(1, t("Ange ett namn")),
    chefName:    z.string().min(1, t("Ange ett namn")),
    description: z.string().min(10),
    category:    z.string().min(1, t("Välj kategori")),
    costSek:     z.coerce.number().min(0),
  });

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { recipeName: "", chefName: "", description: "", category: "", costSek: 0 },
  });
  const create = useCreateCommunityPost({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCommunityPostsQueryKey() });
        toast({ title: t("Recept delat med communityn!") });
        onClose();
        form.reset();
      },
    },
  });
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg" style={{ color: "hsl(17 47% 13%)" }}>{t("Dela ett recept")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => create.mutate({ data }))} className="space-y-4">
            <FormField control={form.control} name="recipeName" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "hsl(20 20% 58%)" }}>{t("Receptnamn")}</FormLabel>
                <FormControl><ShadInput {...field} className="rounded-xl" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="chefName" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "hsl(20 20% 58%)" }}>{t("Ditt namn")}</FormLabel>
                <FormControl><ShadInput {...field} className="rounded-xl" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "hsl(20 20% 58%)" }}>{t("Kategori")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="rounded-xl"><SelectValue placeholder={t("Välj…")} /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{t(c)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="costSek" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "hsl(20 20% 58%)" }}>{t("Kostnad (kr)")}</FormLabel>
                  <FormControl><ShadInput type="number" step="0.01" {...field} className="rounded-xl" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "hsl(20 20% 58%)" }}>{t("Beskrivning")}</FormLabel>
                <FormControl><Textarea rows={3} {...field} className="rounded-xl resize-none" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={onClose} className="rounded-full">{t("Avbryt")}</Button>
              <Button type="submit" disabled={create.isPending} className="rounded-full">{t("Dela recept")}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function Community() {
  const { t, lang } = useI18n();
  const copy = {
    subtitle: lang === "en" ? "Recipes, ideas and Swedish restaurant news for working kitchens" : "Recept delade av kockar i Sverige",
    loginToShare: lang === "en" ? "Log in to share" : "Logga in f\u00f6r att dela",
    newsTitle: lang === "en" ? "Swedish restaurant news" : "Svenska matnyheter",
    newsSubtitle: lang === "en"
      ? "Automatically updated from Swedish industry sources. Article titles open at the original source."
      : "Uppdateras automatiskt fr\u00e5n svenska branschk\u00e4llor",
    sourceLanguage: lang === "en" ? "Swedish source" : "Svensk k\u00e4lla",
    openSource: lang === "en" ? "Open source" : "\u00d6ppna k\u00e4lla",
    newsError: lang === "en" ? "The news feed could not be loaded right now." : "Nyhetsfl\u00f6det kunde inte h\u00e4mtas just nu.",
    search: lang === "en" ? "Search community..." : "S\u00f6k i community...",
    emptyTitle: lang === "en" ? "No posts found" : "Inga inl\u00e4gg hittades",
    emptyDesc: lang === "en" ? "Be the first to share a recipe!" : "Var den f\u00f6rsta att dela ett recept!",
    by: lang === "en" ? "by" : "av",
    cost: lang === "en" ? "Cost" : "Kostnad",
  };
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [showShare, setShowShare] = useState(false);
  const queryClient = useQueryClient();
  const dateLocale = lang === "en" ? enUS : sv;

  const params = search ? { search } : {};
  const posts = useListCommunityPosts(params, { query: { queryKey: getListCommunityPostsQueryKey(params) } });
  const newsParams = { lang };
  const news = useListCommunityNews(newsParams, { query: { queryKey: getListCommunityNewsQueryKey(newsParams) } });
  const likePost = useLikeCommunityPost({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListCommunityPostsQueryKey() }),
    },
  });

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight" style={{ color: "hsl(17 47% 13%)" }}>{t("Community")}</h1>
          <p className="text-[13px] mt-1" style={{ color: "hsl(20 20% 58%)" }}>{copy.subtitle}</p>
        </div>
        {user ? (
          <button
            onClick={() => setShowShare(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px] font-semibold transition-all hover:opacity-90"
            style={{ background: "hsl(17 47% 13%)", color: "#FAF8F4", boxShadow: "0 4px 14px rgba(44,24,16,.22)" }}
          >
            <Plus className="w-4 h-4" /> {t("Dela recept")}
          </button>
        ) : (
          <Link href="/login"
            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px] font-semibold transition-all hover:opacity-90"
            style={{ background: "var(--sv-muted)", color: "var(--sv-text-2)", border: "1.5px solid var(--sv-border)" }}
          >
            <Lock className="w-4 h-4" /> {copy.loginToShare}
          </Link>
        )}
      </div>

      <div className="rounded-2xl p-5" style={{ background: "var(--sv-surface)", boxShadow: "0 2px 12px rgba(44,24,16,.07)" }}>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(59,130,246,.12)" }}>
              <Newspaper className="w-5 h-5" style={{ color: "#3b82f6" }} />
            </div>
            <div>
              <h2 className="font-serif text-base font-semibold" style={{ color: "var(--sv-text)" }}>{copy.newsTitle}</h2>
              <p className="text-[12px]" style={{ color: "var(--sv-text-2)" }}>{copy.newsSubtitle}</p>
            </div>
          </div>
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: "var(--sv-muted)", color: "var(--sv-text-2)" }}>
            {t("Live")}
          </span>
        </div>
        {news.isLoading ? (
          <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
        ) : news.data?.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {news.data.map((item) => (
              <a key={item.id} href={item.url} target="_blank" rel="noreferrer"
                className="rounded-xl p-4 transition-all hover:-translate-y-0.5"
                style={{ background: "var(--sv-muted)", border: "1px solid var(--sv-border)" }}>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--sv-gold)" }}>{item.source}</span>
                  <span className="text-[11px]" style={{ color: "var(--sv-text-2)" }}>
                    {formatDistanceToNow(new Date(item.publishedAt), { addSuffix: true, locale: dateLocale })}
                  </span>
                </div>
                <h3 className="text-[13px] font-semibold leading-snug" style={{ color: "var(--sv-text)" }}>{item.title}</h3>
                {item.summary && <p className="text-[12px] leading-relaxed mt-2 line-clamp-2" style={{ color: "var(--sv-text-2)" }}>{item.summary}</p>}
                <div className="mt-3 flex items-center justify-between gap-2 text-[11px] font-semibold" style={{ color: "var(--sv-text-2)" }}>
                  <span>{copy.sourceLanguage}</span>
                  <span>{copy.openSource}</span>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <p className="text-[13px]" style={{ color: "var(--sv-text-2)" }}>{copy.newsError}</p>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "hsl(20 20% 62%)" }} />
        <input
          placeholder={copy.search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-2xl text-[13px] outline-none transition-all"
          style={{
            background: "#fff",
            color: "hsl(17 47% 13%)",
            border: "1.5px solid hsl(33 28% 89%)",
            boxShadow: "0 2px 8px rgba(44,24,16,.06)",
            fontFamily: "'DM Sans', sans-serif",
          }}
        />
      </div>

      {posts.isLoading ? (
        <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}</div>
      ) : posts.data?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "hsl(36 27% 94%)" }}>
            <Users className="w-8 h-8" style={{ color: "hsl(20 20% 65%)" }} />
          </div>
          <p className="font-serif text-base font-semibold" style={{ color: "hsl(17 47% 13%)" }}>{copy.emptyTitle}</p>
          <p className="text-[13px] mt-1" style={{ color: "hsl(20 20% 60%)" }}>{copy.emptyDesc}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {(posts.data ?? []).map((post, i) => (
            <div key={post.id} className="bg-white rounded-2xl p-6 transition-all hover:-translate-y-0.5"
              style={{ boxShadow: "0 2px 12px rgba(44,24,16,.07)" }}>
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-[12px] font-bold text-white font-serif"
                  style={{ background: AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length] }}>
                  {initials(post.chefName)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div>
                      <h3 className="font-serif font-semibold text-[15px]" style={{ color: "hsl(17 47% 13%)" }}>{post.recipeName}</h3>
                      <p className="text-[12px] mt-0.5" style={{ color: "hsl(20 20% 60%)" }}>
                        {copy.by} <span className="font-semibold" style={{ color: "hsl(17 47% 20%)" }}>{post.chefName}</span>
                        {" · "}{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: dateLocale })}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "hsl(44 54% 50%)" }}>{copy.cost}</div>
                      <div className="text-[16px] font-serif font-bold" style={{ color: "hsl(17 47% 13%)" }}>{post.costSek.toFixed(0)} kr</div>
                    </div>
                  </div>
                  <p className="text-[13px] leading-relaxed mt-2 mb-3" style={{ color: "hsl(20 20% 50%)" }}>{post.description}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: "hsl(36 27% 94%)", color: "hsl(20 20% 52%)" }}>
                      {t(post.category)}
                    </span>
                    <div className="flex items-center gap-1.5 ml-auto">
                      <Link href={`/community/${post.id}`}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium transition-all"
                        style={{ background: "hsl(36 27% 94%)", color: "hsl(20 20% 52%)" }}>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => likePost.mutate({ id: post.id })}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium transition-all"
                        style={{ background: "rgba(239,68,68,.08)", color: "#ef4444" }}
                      >
                        <Heart className="w-3.5 h-3.5" />
                        <span className="font-semibold">{post.likes}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ShareDialog open={showShare} onClose={() => setShowShare(false)} />
    </div>
  );
}
