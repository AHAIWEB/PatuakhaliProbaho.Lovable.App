import { ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import type { Post } from "@/hooks/usePosts";
import { cleanText } from "@/lib/content";

interface NewsCardProps {
  news: Post;
  variant?: "default" | "compact" | "horizontal";
}

const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString("bn-BD") : "";

const NewsCard = ({ news, variant = "default" }: NewsCardProps) => {
  const postLink = `/post/${news.slug}`;

  if (variant === "compact") {
    return (
      <div className="flex gap-3 py-3 border-b border-border last:border-0">
        {news.image_url ? (
          <img src={news.image_url} alt={news.title} className="w-20 h-14 object-cover rounded-sm shrink-0" loading="lazy" />
        ) : (
          <div className="w-20 h-14 bg-muted rounded-sm shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <Link to={postLink} className="news-card-title text-sm">{cleanText(news.title)}</Link>
          <div className="news-card-meta mt-1 flex items-center gap-1">
            <span>{news.source_name || "নিজস্ব"}</span>
          </div>
        </div>
      </div>
    );
  }

  if (variant === "horizontal") {
    return (
      <div className="news-card flex gap-3 p-3">
        {news.image_url ? (
          <img src={news.image_url} alt={news.title} className="w-28 h-20 object-cover rounded-sm shrink-0" loading="lazy" />
        ) : (
          <div className="w-28 h-20 bg-muted rounded-sm shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <Link to={postLink} className="news-card-title text-sm">{cleanText(news.title)}</Link>
          <div className="news-card-meta mt-1 flex items-center gap-1">
            <span>{formatDate(news.published_at)}</span> • <span>{news.source_name || "নিজস্ব"}</span>
          </div>
        </div>
      </div>
    );
  }

  // Build 50% excerpt from content
  const excerpt50 = news.content ? cleanText(news.content).substring(0, Math.ceil(cleanText(news.content).length * 0.5)) : cleanText(news.excerpt || "");
  const displayExcerpt = excerpt50.length > 120 ? excerpt50.substring(0, 120) + "…" : excerpt50;

  return (
    <div className="news-card group">
      <div className="relative overflow-hidden">
        <Link to={postLink}>
          {news.image_url ? (
            <img src={news.image_url} alt={news.title} className="w-full aspect-[16/10] object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
          ) : (
            <div className="w-full aspect-[16/10] bg-gradient-to-br from-muted to-muted/60" />
          )}
        </Link>
        {news.is_highlighted && (
          <span className="absolute top-2 left-2 bg-highlight text-foreground text-[10px] font-bold px-2 py-0.5 rounded-sm animate-pulse">
            📌 হাইলাইটস
          </span>
        )}
        {news.source_category && (
          <span className="absolute top-2 right-2 bg-primary/90 text-primary-foreground text-[9px] px-1.5 py-0.5 rounded">
            {news.source_category}
          </span>
        )}
      </div>
      <div className="p-3">
        <Link to={postLink} className="news-card-title block mb-1.5 leading-snug">{cleanText(news.title)}</Link>
        {displayExcerpt && <p className="text-xs text-muted-foreground line-clamp-3 mb-2">{displayExcerpt}</p>}
        <div className="news-card-meta flex items-center gap-1 text-[10px]">
          <span>{formatDate(news.published_at)}</span> •{" "}
          {news.source_url ? (
            <a href={news.source_url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline inline-flex items-center gap-0.5">
              {news.source_name || "সোর্স"} <ExternalLink className="h-2.5 w-2.5" />
            </a>
          ) : (
            <span>{news.source_name || "নিজস্ব"}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewsCard;
