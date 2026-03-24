import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useFeaturedPosts } from "@/hooks/usePosts";

const FeaturedSlider = () => {
  const { data: posts, isLoading } = useFeaturedPosts();
  const [currentIndex, setCurrentIndex] = useState(0);

  const items = posts ?? [];

  useEffect(() => {
    if (items.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [items.length]);

  if (isLoading) {
    return (
      <div className="mb-6 aspect-[16/9] bg-muted animate-pulse rounded-sm" />
    );
  }

  if (items.length === 0) {
    return (
      <div className="mb-6 aspect-[16/9] bg-muted rounded-sm flex items-center justify-center text-muted-foreground">
        ফিচার্ড পোস্ট নেই — এডমিন প্যানেল থেকে ⭐ চিহ্ন দিয়ে ফিচার্ড করুন
      </div>
    );
  }

  const current = items[currentIndex % items.length];
  const goTo = (index: number) => setCurrentIndex(index);
  const prev = () => setCurrentIndex((i) => (i - 1 + items.length) % items.length);
  const next = () => setCurrentIndex((i) => (i + 1) % items.length);

  return (
    <div className="mb-6">
      <div className="relative overflow-hidden rounded-sm">
        <div className="relative aspect-[16/9]">
          {current.image_url ? (
            <img src={current.image_url} alt={current.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">ছবি নেই</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
            {current.tags && current.tags.length > 0 && (
              <span className="news-category-badge mb-2 inline-block">
                {current.tags[0]}
              </span>
            )}
            <h2 className="text-card text-lg md:text-2xl font-bold leading-snug mb-2">{current.title}</h2>
            {current.excerpt && <p className="text-card/80 text-sm line-clamp-2 hidden md:block">{current.excerpt}</p>}
            <div className="flex items-center gap-2 mt-2">
              {current.source_url && (
                <a href={current.source_url} target="_blank" rel="noopener noreferrer" className="text-highlight text-xs hover:underline">
                  সূত্র: {current.source_name || "সোর্স"}
                </a>
              )}
              <span className="text-card/60 text-xs">
                | {current.published_at ? new Date(current.published_at).toLocaleDateString("bn-BD") : ""}
              </span>
            </div>
          </div>
        </div>

        <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 bg-foreground/50 hover:bg-foreground/70 text-card rounded-full p-1.5 transition-colors" aria-label="আগের সংবাদ">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 bg-foreground/50 hover:bg-foreground/70 text-card rounded-full p-1.5 transition-colors" aria-label="পরের সংবাদ">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="flex gap-2 mt-2 overflow-x-auto">
        {items.map((item, i) => (
          <button
            key={item.id}
            onClick={() => goTo(i)}
            className={`shrink-0 w-24 h-16 rounded-sm overflow-hidden border-2 transition-all ${
              i === currentIndex ? "border-accent opacity-100" : "border-transparent opacity-60 hover:opacity-80"
            }`}
          >
            {item.image_url ? (
              <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <div className="w-full h-full bg-muted" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default FeaturedSlider;
