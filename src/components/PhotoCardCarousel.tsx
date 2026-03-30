import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { cleanText } from "@/lib/content";
import SectionTitle from "./SectionTitle";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
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
    <div className="mt-4">
      <SectionTitle title="📸 ফটোকার্ড" accent="red" />
      <Carousel
        opts={{
          align: "start",
          loop: true,
          dragFree: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-3 sm:-ml-4">
          {cards.map((card) => (
            <CarouselItem
              key={card.id}
              className="pl-3 sm:pl-4 basis-[65%] sm:basis-[45%] md:basis-[35%] lg:basis-[28%]"
            >
              <Link to={`/post/${card.slug}`} className="group/card block">
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
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden sm:flex -left-3 h-7 w-7" />
        <CarouselNext className="hidden sm:flex -right-3 h-7 w-7" />
      </Carousel>
    </div>
  );
};

export default PhotoCardCarousel;
