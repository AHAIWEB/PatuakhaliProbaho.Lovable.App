import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import CategoryNav from "@/components/CategoryNav";
import NewsTicker from "@/components/NewsTicker";
import FeaturedSlider from "@/components/FeaturedSlider";
import NewsCard from "@/components/NewsCard";
import SectionTitle from "@/components/SectionTitle";
import AdSpace from "@/components/AdSpace";
import Footer from "@/components/Footer";
import { useLatestPosts, usePostsByDivision, useNationalPosts, useMostViewedPosts } from "@/hooks/usePosts";

const Index = () => {
  const { data: nationalPosts } = useNationalPosts(6);
  const { data: barisalPosts } = usePostsByDivision("barisal", 6);
  const { data: divisionalPosts } = useLatestPosts(8);
  const { data: popularPosts } = useMostViewedPosts(5);

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Header />
      <CategoryNav />
      <NewsTicker />

      <div className="container mx-auto px-4 mt-4">
        <AdSpace size="leaderboard" />
      </div>

      <main className="container mx-auto px-4 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column - 25% */}
          <aside className="lg:col-span-1 column-left order-2 lg:order-1">
            <SectionTitle title="জাতীয় সংবাদ" />
            {(nationalPosts ?? []).map((news) => (
              <NewsCard key={news.id} news={news} variant="compact" />
            ))}
            <AdSpace size="sidebar" className="mt-4" />

            <SectionTitle title="আন্তর্জাতিক" className="mt-6" />
            {(divisionalPosts ?? []).slice(0, 3).map((news) => (
              <NewsCard key={news.id} news={news} variant="compact" />
            ))}
          </aside>

          {/* Main Column - 50% */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            <FeaturedSlider />

            <SectionTitle title="বরিশাল বিভাগ" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(barisalPosts ?? []).map((news) => (
                <NewsCard key={news.id} news={news} />
              ))}
            </div>

            <AdSpace size="banner" className="mt-6" />

            <SectionTitle title="বিভাগীয় সংবাদ" className="mt-6" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(divisionalPosts ?? []).map((news) => (
                <NewsCard key={news.id} news={news} />
              ))}
            </div>
          </div>

          {/* Right Column - 25% */}
          <aside className="lg:col-span-1 column-right order-3">
            <SectionTitle title="বিভাগীয় সংবাদ" />
            {(divisionalPosts ?? []).slice(0, 5).map((news) => (
              <NewsCard key={news.id} news={news} variant="compact" />
            ))}
            <AdSpace size="sidebar" className="mt-4" />

            <SectionTitle title="জনপ্রিয় সংবাদ" className="mt-6" />
            {(popularPosts ?? []).map((news, i) => (
              <div key={news.id} className="flex gap-3 py-3 border-b border-border last:border-0">
                <span className="text-2xl font-bold text-accent shrink-0 w-8 text-center">{i + 1}</span>
                <a href={news.source_url || "#"} target="_blank" rel="noopener noreferrer" className="news-card-title text-sm">
                  {news.title}
                </a>
              </div>
            ))}
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
