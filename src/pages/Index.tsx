import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import CategoryNav from "@/components/CategoryNav";
import NewsTicker from "@/components/NewsTicker";
import FeaturedSlider from "@/components/FeaturedSlider";
import NewsCard from "@/components/NewsCard";
import SectionTitle from "@/components/SectionTitle";
import AdSpace from "@/components/AdSpace";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import {
  useLatestPosts,
  usePostsByDivision,
  useNationalPosts,
  useMostViewedPosts,
  useHighlightedPosts,
} from "@/hooks/usePosts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const useDivisionPosts = (division: string, limit = 5) =>
  usePostsByDivision(division, limit);

const useCategoryPosts = (slug: string, limit = 4) =>
  useQuery({
    queryKey: ["posts", "catSlug", slug, limit],
    queryFn: async () => {
      const { data: cat } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      if (!cat) return [];
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("category_id", cat.id)
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },
  });

const Index = () => {
  const { data: nationalPosts } = useNationalPosts(8);
  const { data: barisalPosts } = usePostsByDivision("barisal", 6);
  const { data: dhakaPosts } = useDivisionPosts("dhaka", 5);
  const { data: chittagongPosts } = useDivisionPosts("chattogram", 5);
  const { data: sylhetPosts } = useDivisionPosts("sylhet", 5);
  const { data: rajshahiPosts } = useDivisionPosts("rajshahi", 5);
  const { data: khulnaPosts } = useDivisionPosts("khulna", 5);
  const { data: rangpurPosts } = useDivisionPosts("rangpur", 5);
  const { data: mymensinghPosts } = useDivisionPosts("mymensingh", 5);
  const { data: popularPosts } = useMostViewedPosts(8);
  const { data: highlightedPosts } = useHighlightedPosts();
  const { data: politicsPosts } = useCategoryPosts("politics", 4);
  const { data: sportsPosts } = useCategoryPosts("sports", 4);
  const { data: entertainmentPosts } = useCategoryPosts("entertainment", 4);
  const { data: internationalPosts } = useCategoryPosts("international", 4);
  const { data: techPosts } = useCategoryPosts("technology", 4);

  const divisionSections = [
    { title: "ঢাকা বিভাগ", posts: dhakaPosts, slug: "dhaka" },
    { title: "চট্টগ্রাম বিভাগ", posts: chittagongPosts, slug: "chattogram" },
    { title: "সিলেট বিভাগ", posts: sylhetPosts, slug: "sylhet" },
    { title: "রাজশাহী বিভাগ", posts: rajshahiPosts, slug: "rajshahi" },
    { title: "খুলনা বিভাগ", posts: khulnaPosts, slug: "khulna" },
    { title: "রংপুর বিভাগ", posts: rangpurPosts, slug: "rangpur" },
    { title: "ময়মনসিংহ বিভাগ", posts: mymensinghPosts, slug: "mymensingh" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Header />
      <CategoryNav />
      <NewsTicker />

      <div className="container mx-auto px-3 sm:px-4 mt-3 sm:mt-4">
        <AdSpace size="leaderboard" />
      </div>

      <main className="container mx-auto px-3 sm:px-4 mt-4 sm:mt-6">
        {/* === 3-Column Missionary Layout === */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">

          {/* ========= LEFT COLUMN - 25% ========= */}
          <aside className="lg:col-span-1 column-left order-2 lg:order-1 space-y-1">
            <SectionTitle title="জাতীয় সংবাদ" />
            {(nationalPosts ?? []).slice(0, 6).map((news) => (
              <NewsCard key={news.id} news={news} variant="compact" />
            ))}

            <AdSpace size="sidebar" className="mt-4" />

            <SectionTitle title="আন্তর্জাতিক" className="mt-6" />
            {(internationalPosts ?? []).slice(0, 4).map((news) => (
              <NewsCard key={news.id} news={news} variant="compact" />
            ))}

            <SectionTitle title="রাজনীতি" className="mt-6" />
            {(politicsPosts ?? []).slice(0, 4).map((news) => (
              <NewsCard key={news.id} news={news} variant="compact" />
            ))}

            <SectionTitle title="প্রযুক্তি" className="mt-6" />
            {(techPosts ?? []).slice(0, 3).map((news) => (
              <NewsCard key={news.id} news={news} variant="compact" />
            ))}

            <AdSpace size="sidebar" className="mt-4" />
          </aside>

          {/* ========= MAIN COLUMN - 50% ========= */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            {/* Featured Slider */}
            <FeaturedSlider />

            {/* Highlighted Posts */}
            {(highlightedPosts ?? []).length > 0 && (
              <>
                <SectionTitle title="📌 হাইলাইটস" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  {(highlightedPosts ?? []).slice(0, 4).map((news) => (
                    <NewsCard key={news.id} news={news} />
                  ))}
                </div>
              </>
            )}

            {/* Barisal Section */}
            <SectionTitle title="বরিশাল বিভাগ" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(barisalPosts ?? []).map((news) => (
                <NewsCard key={news.id} news={news} />
              ))}
            </div>

            <AdSpace size="banner" className="my-6" />

            {/* Category Sections in Main */}
            <SectionTitle title="খেলাধুলা" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {(sportsPosts ?? []).slice(0, 4).map((news) => (
                <NewsCard key={news.id} news={news} />
              ))}
            </div>

            <SectionTitle title="বিনোদন" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {(entertainmentPosts ?? []).slice(0, 4).map((news) => (
                <NewsCard key={news.id} news={news} />
              ))}
            </div>
          </div>

          {/* ========= RIGHT COLUMN - 25% ========= */}
          <aside className="lg:col-span-1 column-right order-3 space-y-1">
            {/* All Division Sections */}
            {divisionSections.map((section) => (
              <div key={section.slug}>
                <SectionTitle title={section.title} />
                {(section.posts ?? []).slice(0, 3).map((news) => (
                  <NewsCard key={news.id} news={news} variant="compact" />
                ))}
                <Link
                  to={`/category/${section.slug}`}
                  className="text-xs text-accent hover:underline block mt-1 mb-4"
                >
                  আরও পড়ুন →
                </Link>
              </div>
            ))}

            <AdSpace size="sidebar" className="mt-4" />

            {/* Popular Posts */}
            <SectionTitle title="জনপ্রিয় সংবাদ" className="mt-6" />
            {(popularPosts ?? []).map((news, i) => (
              <div key={news.id} className="flex gap-3 py-3 border-b border-border last:border-0">
                <span className="text-2xl font-bold text-accent shrink-0 w-8 text-center">{i + 1}</span>
                <Link to={`/post/${news.slug}`} className="news-card-title text-sm">
                  {news.title}
                </Link>
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
