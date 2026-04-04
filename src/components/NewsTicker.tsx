import { useTickerHeadlines } from "@/hooks/usePosts";
import { cleanText } from "@/lib/content";

const NewsTicker = () => {
  const { data: headlines } = useTickerHeadlines();

  const items = headlines ?? [];

  return (
    <div className="ticker-bar overflow-hidden py-1.5 sm:py-2">
      <div className="container mx-auto px-3 sm:px-4 flex items-center gap-2 sm:gap-3">
        <span className="bg-accent text-accent-foreground text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-sm shrink-0">
          সর্বশেষ
        </span>
        <div className="overflow-hidden flex-1">
          <div className="animate-ticker whitespace-nowrap text-xs sm:text-sm">
            {items.length > 0 ? items.map((h) => (
              <span key={h.id} className="mx-4 sm:mx-6">● {cleanText(h.title)}</span>
            )) : (
              <span className="mx-4">● সর্বশেষ সংবাদ লোড হচ্ছে...</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsTicker;
