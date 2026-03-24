import { useTickerHeadlines } from "@/hooks/usePosts";

const NewsTicker = () => {
  const { data: headlines } = useTickerHeadlines();

  const items = headlines ?? [];

  return (
    <div className="ticker-bar overflow-hidden py-2">
      <div className="container mx-auto px-4 flex items-center gap-3">
        <span className="bg-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded-sm shrink-0">
          সর্বশেষ
        </span>
        <div className="overflow-hidden flex-1">
          <div className="animate-ticker whitespace-nowrap text-sm">
            {items.length > 0 ? items.map((h) => (
              <span key={h.id} className="mx-6">● {h.title}</span>
            )) : (
              <span className="mx-6">● সর্বশেষ সংবাদ লোড হচ্ছে...</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsTicker;
