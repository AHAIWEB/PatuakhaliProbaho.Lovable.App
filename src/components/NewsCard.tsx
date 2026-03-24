import { ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import type { Post } from "@/hooks/usePosts";

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
          <Link to={postLink} className="news-card-title text-sm">{news.title}</Link>
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
          <Link to={postLink} className="news-card-title text-sm">{news.title}</Link>
          <div className="news-card-meta mt-1 flex items-center gap-1">
            <span>{formatDate(news.published_at)}</span> • <span>{news.source_name || "নিজস্ব"}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="news-card">
      <div className="relative">
        <Link to={postLink}>
          {news.image_url ? (
            <img src={news.image_url} alt={news.title} className="w-full aspect-[16/10] object-cover" loading="lazy" />
          ) : (
            <div className="w-full aspect-[16/10] bg-muted" />
          )}
        </Link>
        {news.is_highlighted && (
          <span className="absolute top-2 left-2 bg-highlight text-foreground text-[10px] font-bold px-2 py-0.5 rounded-sm">
            📌 হাইলাইটস
          </span>
        )}
      </div>
      <div className="p-3">
        <Link to={postLink} className="news-card-title block mb-2">{news.title}</Link>
        {news.excerpt && <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{news.excerpt}</p>}
        <div className="news-card-meta flex items-center gap-1">
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
