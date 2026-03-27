import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { cleanText } from "@/lib/content";
import SectionTitle from "./SectionTitle";

const usePhotoCardPosts = (limit = 20) =>
  useQuery({
    queryKey: ["posts", "photocard", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("status", "published")
        .contains("tags", ["ফটোকার্ড"])
        .order("published_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data;
    },
    refetchInterval: 60000,
  });

const PhotoCardCarousel = () => {
  const { data: cards, isLoading } = usePhotoCardPosts();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) el.addEventListener("scroll", checkScroll, { passive: true });
    return () => el?.removeEventListener("scroll", checkScroll);
  }, [cards]);

  // Auto-scroll
  useEffect(() => {
    if (!cards || cards.length <= 1) return;
    const el = scrollRef.current;
    if (!el) return;
    const timer = setInterval(() => {
      if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 2) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: 220, behavior: "smooth" });
      }
    }, 4000);
    return () => clearInterval(timer);
  }, [cards]);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({
      left: dir === "left" ? -280 : 280,
      behavior: "smooth",
    });
  };

  if (isLoading) {
    return (
      <div className="mt-4">
        <SectionTitle title="📸 ফটোকার্ড" />
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="shrink-0 w-52 h-52 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!cards || cards.length === 0) return null;

  return (
    <div className="mt-4">
      <SectionTitle title="📸 ফটোকার্ড" accent="red" />
      <div className="relative group">
        {/* Scroll buttons */}
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-foreground/60 hover:bg-foreground/80 text-background rounded-full p-1.5 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="আগে"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-foreground/60 hover:bg-foreground/80 text-background rounded-full p-1.5 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="পরে"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}

        {/* Cards container */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {cards.map((card) => (
            <Link
              key={card.id}
              to={`/post/${card.slug}`}
              className="shrink-0 w-48 sm:w-52 snap-start group/card"
            >
              <div className="relative overflow-hidden rounded-lg border border-border bg-card shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
                {card.image_url ? (
                  <img
                    src={card.image_url}
                    alt={card.title}
                    className="w-full aspect-square object-cover transition-transform duration-500 group-hover/card:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full aspect-square bg-muted flex items-center justify-center text-muted-foreground text-3xl">
                    📸
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/80 via-foreground/30 to-transparent p-2.5 pt-8">
                  <span className="text-[9px] bg-accent text-accent-foreground px-1.5 py-0.5 rounded font-medium">
                    ফটোকার্ড
                  </span>
                  <h3 className="text-card text-xs font-bold leading-snug mt-1 line-clamp-2">
                    {cleanText(card.title)}
                  </h3>
                  {card.published_at && (
                    <span className="text-card/60 text-[10px]">
                      {new Date(card.published_at).toLocaleDateString("bn-BD")}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PhotoCardCarousel;
