import { ExternalLink } from "lucide-react";
import type { NewsItem } from "@/data/mockNews";

interface NewsCardProps {
  news: NewsItem;
  variant?: "default" | "compact" | "horizontal";
}

const NewsCard = ({ news, variant = "default" }: NewsCardProps) => {
  if (variant === "compact") {
    return (
      <div className="flex gap-3 py-3 border-b border-border last:border-0">
        <img
          src={news.image}
          alt={news.title}
          className="w-20 h-14 object-cover rounded-sm shrink-0"
          loading="lazy"
          width={80}
          height={56}
        />
        <div className="flex-1 min-w-0">
          <a
            href={news.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="news-card-title text-sm"
          >
            {news.title}
          </a>
          <div className="news-card-meta mt-1 flex items-center gap-1">
            <span>{news.source}</span>
            <ExternalLink className="h-2.5 w-2.5" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === "horizontal") {
    return (
      <div className="news-card flex gap-3 p-3">
        <img
          src={news.image}
          alt={news.title}
          className="w-28 h-20 object-cover rounded-sm shrink-0"
          loading="lazy"
          width={112}
          height={80}
        />
        <div className="flex-1 min-w-0">
          <span className="news-category-badge text-[10px] mb-1 inline-block">{news.category}</span>
          <a
            href={news.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="news-card-title text-sm"
          >
            {news.title}
          </a>
          <div className="news-card-meta mt-1 flex items-center gap-1">
            <span>{news.date}</span> • <span>{news.source}</span>
            <ExternalLink className="h-2.5 w-2.5" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="news-card">
      <div className="relative">
        <img
          src={news.image}
          alt={news.title}
          className="w-full aspect-[16/10] object-cover"
          loading="lazy"
          width={400}
          height={250}
        />
        {news.isHighlighted && (
          <span className="absolute top-2 left-2 bg-highlight text-foreground text-[10px] font-bold px-2 py-0.5 rounded-sm">
            📌 হাইলাইটস
          </span>
        )}
      </div>
      <div className="p-3">
        <span className="news-category-badge text-[10px] mb-2 inline-block">{news.category}</span>
        <a
          href={news.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="news-card-title block mb-2"
        >
          {news.title}
        </a>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{news.excerpt}</p>
        <div className="news-card-meta flex items-center gap-1">
          <span>{news.date}</span> •{" "}
          <a
            href={news.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline inline-flex items-center gap-0.5"
          >
            {news.source} <ExternalLink className="h-2.5 w-2.5" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default NewsCard;
