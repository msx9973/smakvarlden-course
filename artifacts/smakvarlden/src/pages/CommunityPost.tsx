import { useState } from "react";
import { Link } from "wouter";
import { useGetCommunityPost, useLikeCommunityPost, getGetCommunityPostQueryKey, getListCommunityPostsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Heart, Share2, Check, ChefHat } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { sv, enUS } from "date-fns/locale";
import { useI18n } from "@/lib/i18n";

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg,hsl(17 47% 13%),hsl(17 37% 22%))",
  "linear-gradient(135deg,#3b82f6,#1d4ed8)",
  "linear-gradient(135deg,#10b981,#065f46)",
  "linear-gradient(135deg,hsl(44 54% 50%),hsl(44 44% 36%))",
  "linear-gradient(135deg,#8b5cf6,#5b21b6)",
];

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function CommunityPost({ id }: { id: number }) {
  const { t, lang } = useI18n();
  const queryClient = useQueryClient();
  const dateLocale = lang === "en" ? enUS : sv;
  const [copied, setCopied] = useState(false);

  const post = useGetCommunityPost(id, { query: { queryKey: getGetCommunityPostQueryKey(id) } });
  const likePost = useLikeCommunityPost({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCommunityPostQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getListCommunityPostsQueryKey() });
      },
    },
  });

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (post.isLoading) {
    return (
      <div className="max-w-2xl flex flex-col gap-6">
        <Skeleton className="h-8 w-40 rounded-xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (!post.data) {
    return (
      <div className="text-center py-24">
        <ChefHat className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--sv-text-2)" }} />
        <p className="font-serif text-base font-semibold" style={{ color: "var(--sv-text)" }}>
          {lang === "en" ? "Post not found" : "Inlägget hittades inte"}
        </p>
        <Link href="/community"
          className="inline-block mt-4 px-5 py-2 rounded-full text-[13px] font-semibold"
          style={{ background: "var(--sv-brown)", color: "var(--sv-surface)" }}>
          {lang === "en" ? "Back to Community" : "Tillbaka till Community"}
        </Link>
      </div>
    );
  }

  const p = post.data;
  const avatarGrad = AVATAR_GRADIENTS[p.id % AVATAR_GRADIENTS.length];

  return (
    <div className="max-w-2xl flex flex-col gap-6">

      {/* Back */}
      <Link href="/community"
        className="flex items-center gap-2 w-fit text-[13px] font-medium transition-all hover:opacity-70"
        style={{ color: "var(--sv-text-2)" }}>
        <ArrowLeft className="w-4 h-4" />
        {lang === "en" ? "Back to Community" : "Tillbaka till Community"}
      </Link>

      {/* Card */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: "var(--sv-surface)", boxShadow: "0 4px 24px var(--sv-shadow)" }}>

        {/* Header strip */}
        <div className="h-2" style={{ background: "linear-gradient(90deg,hsl(17 47% 13%),hsl(44 54% 50%))" }} />

        <div className="p-8">
          {/* Chef row */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 text-[15px] font-bold text-white font-serif"
              style={{ background: avatarGrad }}>
              {initials(p.chefName)}
            </div>
            <div>
              <p className="font-serif font-bold text-[15px]" style={{ color: "var(--sv-text)" }}>{p.chefName}</p>
              <p className="text-[12px] mt-0.5" style={{ color: "var(--sv-text-2)" }}>
                {formatDistanceToNow(new Date(p.createdAt), { addSuffix: true, locale: dateLocale })}
              </p>
            </div>
            <span className="ml-auto text-[11px] font-semibold px-3 py-1.5 rounded-full"
              style={{ background: "var(--sv-muted)", color: "var(--sv-text-2)" }}>
              {t(p.category)}
            </span>
          </div>

          {/* Recipe name */}
          <h1 className="font-serif text-2xl font-bold tracking-tight mb-3"
            style={{ color: "var(--sv-text)" }}>
            {p.recipeName}
          </h1>

          {/* Description */}
          <p className="text-[14px] leading-relaxed mb-6"
            style={{ color: "var(--sv-text-2)" }}>
            {p.description}
          </p>

          {/* Cost */}
          <div className="flex items-center gap-2 mb-8 p-4 rounded-xl"
            style={{ background: "var(--sv-muted)" }}>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5"
                style={{ color: "var(--sv-text-2)" }}>
                {lang === "en" ? "Cost per dish" : "Kostnad per rätt"}
              </p>
              <p className="font-serif text-2xl font-bold" style={{ color: "var(--sv-text)" }}>
                {p.costSek.toFixed(0)} kr
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => likePost.mutate({ id: p.id })}
              disabled={likePost.isPending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-semibold transition-all hover:opacity-80"
              style={{ background: "rgba(239,68,68,.1)", color: "#ef4444" }}>
              <Heart className="w-4 h-4" />
              {p.likes} {lang === "en" ? "likes" : "gillningar"}
            </button>

            <button
              onClick={copyLink}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-semibold transition-all hover:opacity-80 ml-auto"
              style={{
                background: copied ? "rgba(16,185,129,.12)" : "var(--sv-muted)",
                color: copied ? "#10b981" : "var(--sv-text-2)",
              }}>
              {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
              {copied
                ? (lang === "en" ? "Link copied!" : "Länk kopierad!")
                : (lang === "en" ? "Copy link" : "Kopiera länk")}
            </button>
          </div>
        </div>
      </div>

      {/* Permanent URL box */}
      <div className="rounded-xl p-4 flex items-center gap-3"
        style={{ background: "var(--sv-surface)", border: "1.5px solid var(--sv-border)" }}>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--sv-text-2)" }}>
            {lang === "en" ? "Permanent link" : "Permanent länk"}
          </p>
          <p className="text-[12px] font-mono truncate" style={{ color: "var(--sv-gold)" }}>
            {window.location.href}
          </p>
        </div>
        <button
          onClick={copyLink}
          className="shrink-0 px-4 py-2 rounded-xl text-[12px] font-semibold transition-all"
          style={{ background: "var(--sv-brown)", color: "var(--sv-surface)" }}>
          {copied ? (lang === "en" ? "Copied!" : "Kopierat!") : (lang === "en" ? "Copy" : "Kopiera")}
        </button>
      </div>
    </div>
  );
}
