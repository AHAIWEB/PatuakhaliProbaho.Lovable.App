import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cleanText } from "@/lib/content";
import SectionTitle from "./SectionTitle";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";

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
  const [api, setApi] = useState<CarouselApi>();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Autoplay
  useEffect(() => {
    if (!api) return;
    const interval = setInterval(() => {
      api.scrollNext();
    }, 4000);
    return () => clearInterval(interval);
  }, [api]);

  // Lightbox keyboard nav
  useEffect(() => {
    if (lightboxIndex === null || !cards) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowRight") setLightboxIndex((i) => Math.min((i ?? 0) + 1, cards.length - 1));
      if (e.key === "ArrowLeft") setLightboxIndex((i) => Math.max((i ?? 0) - 1, 0));
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handler);
    };
  }, [lightboxIndex, cards]);

  if (isLoading) {
    return (
      <div className="mt-4">
        <SectionTitle title="📸 ফটোকার্ড" />
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="shrink-0 w-36 h-36 sm:w-52 sm:h-52 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!cards || cards.length === 0) return null;

  return (
    <>
      <div className="mt-4">
        <SectionTitle title="📸 ফটোকার্ড" accent="red" />
        <Carousel
          setApi={setApi}
          opts={{
            align: "start",
            loop: true,
            dragFree: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-3 sm:-ml-4">
            {cards.map((card, idx) => (
              <CarouselItem
                key={card.id}
                className="pl-3 sm:pl-4 basis-[65%] sm:basis-[45%] md:basis-[35%] lg:basis-[28%]"
              >
                <button
                  onClick={() => setLightboxIndex(idx)}
                  className="group/card block w-full text-left"
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
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/80 via-foreground/30 to-transparent p-2 pt-6 sm:p-2.5 sm:pt-8">
                      <span className="text-[8px] sm:text-[9px] bg-accent text-accent-foreground px-1 sm:px-1.5 py-0.5 rounded font-medium">
                        ফটোকার্ড
                      </span>
                      <h3 className="text-card text-[10px] sm:text-xs font-bold leading-snug mt-1 line-clamp-2">
                        {cleanText(card.title)}
                      </h3>
                      {card.published_at && (
                        <span className="text-card/60 text-[9px] sm:text-[10px]">
                          {new Date(card.published_at).toLocaleDateString("bn-BD")}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden sm:flex -left-3 h-7 w-7" />
          <CarouselNext className="hidden sm:flex -right-3 h-7 w-7" />
        </Carousel>
      </div>

      {/* Fullscreen Lightbox */}
      {lightboxIndex !== null && cards[lightboxIndex] && (
        <div
          className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white z-10"
            onClick={() => setLightboxIndex(null)}
          >
            <X className="h-8 w-8" />
          </button>
          {lightboxIndex > 0 && (
            <button
              className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 text-white/70 hover:text-white z-10"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1); }}
            >
              <ChevronLeft className="h-10 w-10" />
            </button>
          )}
          {lightboxIndex < cards.length - 1 && (
            <button
              className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 text-white/70 hover:text-white z-10"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1); }}
            >
              <ChevronRight className="h-10 w-10" />
            </button>
          )}
          <div className="max-w-[95vw] max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={cards[lightboxIndex].image_url || ""}
              alt={cards[lightboxIndex].title}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
            <p className="text-white text-sm sm:text-base mt-3 text-center px-4 max-w-xl">
              {cleanText(cards[lightboxIndex].title)}
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default PhotoCardCarousel;
