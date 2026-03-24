import { ExternalLink } from "lucide-react";
import type { Post } from "@/hooks/usePosts";

interface NewsCardProps {
  news: Post;
  variant?: "default" | "compact" | "horizontal";
}

const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString("bn-BD") : "";

const NewsCard = ({ news, variant = "default" }: NewsCardProps) => {
  if (variant === "compact") {
    return (
      <div className="flex gap-3 py-3 border-b border-border last:border-0">
        {news.image_url ? (
          <img src={news.image_url} alt={news.title} className="w-20 h-14 object-cover rounded-sm shrink-0" loading="lazy" />
        ) : (
          <div className="w-20 h-14 bg-muted rounded-sm shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <a href={news.source_url || "#"} target="_blank" rel="noopener noreferrer" className="news-card-title text-sm">
            {news.title}
          </a>
          <div className="news-card-meta mt-1 flex items-center gap-1">
            <span>{news.source_name || "নিজস্ব"}</span>
            <ExternalLink className="h-2.5 w-2.5" />
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
          <a href={news.source_url || "#"} target="_blank" rel="noopener noreferrer" className="news-card-title text-sm">
            {news.title}
          </a>
          <div className="news-card-meta mt-1 flex items-center gap-1">
            <span>{formatDate(news.published_at)}</span> • <span>{news.source_name || "নিজস্ব"}</span>
            <ExternalLink className="h-2.5 w-2.5" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="news-card">
      <div className="relative">
        {news.image_url ? (
          <img src={news.image_url} alt={news.title} className="w-full aspect-[16/10] object-cover" loading="lazy" />
        ) : (
          <div className="w-full aspect-[16/10] bg-muted" />
        )}
        {news.is_highlighted && (
          <span className="absolute top-2 left-2 bg-highlight text-foreground text-[10px] font-bold px-2 py-0.5 rounded-sm">
            📌 হাইলাইটস
          </span>
        )}
      </div>
      <div className="p-3">
        <a href={news.source_url || "#"} target="_blank" rel="noopener noreferrer" className="news-card-title block mb-2">
          {news.title}
        </a>
        {news.excerpt && <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{news.excerpt}</p>}
        <div className="news-card-meta flex items-center gap-1">
          <span>{formatDate(news.published_at)}</span> •{" "}
          <a href={news.source_url || "#"} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline inline-flex items-center gap-0.5">
            {news.source_name || "নিজস্ব"} <ExternalLink className="h-2.5 w-2.5" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default NewsCard;
