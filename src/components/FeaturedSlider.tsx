import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { featuredNews } from "@/data/mockNews";
import type { NewsItem } from "@/data/mockNews";

const FeaturedSlider = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredNews.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const goTo = (index: number) => setCurrentIndex(index);
  const prev = () => setCurrentIndex((i) => (i - 1 + featuredNews.length) % featuredNews.length);
  const next = () => setCurrentIndex((i) => (i + 1) % featuredNews.length);

  const current = featuredNews[currentIndex];

  return (
    <div className="mb-6">
      {/* Main slider */}
      <div className="relative overflow-hidden rounded-sm">
        <div className="relative aspect-[16/9]">
          <img
            src={current.image}
            alt={current.title}
            className="w-full h-full object-cover"
            width={1200}
            height={600}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
            <span className="news-category-badge mb-2 inline-flex items-center gap-1">
              <Star className="h-3 w-3" />
              {current.category}
            </span>
            <h2 className="text-card text-lg md:text-2xl font-bold leading-snug mb-2">
              {current.title}
            </h2>
            <p className="text-card/80 text-sm line-clamp-2 hidden md:block">{current.excerpt}</p>
            <div className="flex items-center gap-2 mt-2">
              <a
                href={current.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-highlight text-xs hover:underline"
              >
                সূত্র: {current.source}
              </a>
              <span className="text-card/60 text-xs">| {current.date}</span>
            </div>
          </div>
        </div>

        {/* Nav arrows */}
        <button
          onClick={prev}
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-foreground/50 hover:bg-foreground/70 text-card rounded-full p-1.5 transition-colors"
          aria-label="আগের সংবাদ"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={next}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-foreground/50 hover:bg-foreground/70 text-card rounded-full p-1.5 transition-colors"
          aria-label="পরের সংবাদ"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Thumbnail strip */}
      <div className="flex gap-2 mt-2 overflow-x-auto">
        {featuredNews.map((item, i) => (
          <button
            key={item.id}
            onClick={() => goTo(i)}
            className={`shrink-0 w-24 h-16 rounded-sm overflow-hidden border-2 transition-all ${
              i === currentIndex ? "border-accent opacity-100" : "border-transparent opacity-60 hover:opacity-80"
            }`}
          >
            <img src={item.image} alt={item.title} className="w-full h-full object-cover" loading="lazy" width={96} height={64} />
          </button>
        ))}
      </div>
    </div>
  );
};

export default FeaturedSlider;
