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
import { useLayoutSettings, getSectionCount } from "@/hooks/useLayoutSettings";
import { ExternalLink } from "lucide-react";
import { cleanText } from "@/lib/content";

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
  const { data: layoutSettings } = useLayoutSettings();
  const ls = layoutSettings ?? [];
  const sc = (key: string, fb = 5) => getSectionCount(ls, key, fb);

  const { data: nationalPosts } = useNationalPosts(sc("national", 6));
  const { data: barisalPosts } = usePostsByDivision("barisal", sc("barisal", 6));
  const { data: dhakaPosts } = usePostsByDivision("dhaka", sc("dhaka", 3));
  const { data: chittagongPosts } = usePostsByDivision("chattogram", sc("chattogram", 3));
  const { data: sylhetPosts } = usePostsByDivision("sylhet", sc("sylhet", 3));
  const { data: rajshahiPosts } = usePostsByDivision("rajshahi", sc("rajshahi", 3));
  const { data: khulnaPosts } = usePostsByDivision("khulna", sc("khulna", 3));
  const { data: rangpurPosts } = usePostsByDivision("rangpur", sc("rangpur", 3));
  const { data: mymensinghPosts } = usePostsByDivision("mymensingh", sc("mymensingh", 3));
  const { data: popularPosts } = useMostViewedPosts(sc("popular", 8));
  const { data: highlightedPosts } = useHighlightedPosts();
  const { data: politicsPosts } = useCategoryPosts("politics", sc("politics", 4));
  const { data: sportsPosts } = useCategoryPosts("sports", sc("sports", 4));
  const { data: entertainmentPosts } = useCategoryPosts("entertainment", sc("entertainment", 4));
  const { data: internationalPosts } = useCategoryPosts("international", sc("international", 4));
  const { data: techPosts } = useCategoryPosts("technology", sc("technology", 3));

  const divisionSections = [
    { title: "ঢাকা বিভাগ", posts: dhakaPosts, slug: "dhaka" },
    { title: "চট্টগ্রাম বিভাগ", posts: chittagongPosts, slug: "chattogram" },
    { title: "সিলেট বিভাগ", posts: sylhetPosts, slug: "sylhet" },
    { title: "রাজশাহী বিভাগ", posts: rajshahiPosts, slug: "rajshahi" },
    { title: "খুলনা বিভাগ", posts: khulnaPosts, slug: "khulna" },
    { title: "রংপুর বিভাগ", posts: rangpurPosts, slug: "rangpur" },
    { title: "ময়মনসিংহ বিভাগ", posts: mymensinghPosts, slug: "mymensingh" },
  ];

  // Lead story: first national post displayed large
  const leadNational = (nationalPosts ?? [])[0];
  const restNational = (nationalPosts ?? []).slice(1);

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
          {sc("national") > 0 && (
            <aside className="lg:col-span-1 column-left order-2 lg:order-1">
              <SectionTitle title="জাতীয় সংবাদ" accent="red" />

              {/* Lead story */}
              {leadNational && (
                <div className="lead-story mb-3">
                  <div className="news-card group">
                    <Link to={`/post/${leadNational.slug}`} className="block">
                      {leadNational.image_url ? (
                        <img src={leadNational.image_url} alt={leadNational.title}
                          className="w-full aspect-[4/3] object-cover transition-transform group-hover:scale-105" loading="lazy" />
                      ) : (
                        <div className="w-full aspect-[4/3] bg-gradient-to-br from-muted to-muted/50" />
                      )}
                    </Link>
                    <div className="p-2.5">
                      <Link to={`/post/${leadNational.slug}`} className="news-card-title text-sm sm:text-base block mb-1">
                        {cleanText(leadNational.title)}
                      </Link>
                      <p className="text-[11px] text-muted-foreground line-clamp-2">
                        {cleanText(leadNational.excerpt || leadNational.content || "").substring(0, 100)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {restNational.map((news) => (
                <NewsCard key={news.id} news={news} variant="compact" />
              ))}

              <AdSpace size="sidebar" className="mt-4" />

              {sc("international") > 0 && (
                <>
                  <SectionTitle title="আন্তর্জাতিক" className="mt-5" />
                  {(internationalPosts ?? []).slice(0, sc("international", 4)).map((news) => (
                    <NewsCard key={news.id} news={news} variant="compact" />
                  ))}
                </>
              )}

              {sc("politics") > 0 && (
                <>
                  <SectionTitle title="রাজনীতি" className="mt-5" />
                  {(politicsPosts ?? []).slice(0, sc("politics", 4)).map((news) => (
                    <NewsCard key={news.id} news={news} variant="compact" />
                  ))}
                </>
              )}

              {sc("technology") > 0 && (
                <>
                  <SectionTitle title="প্রযুক্তি" className="mt-5" />
                  {(techPosts ?? []).slice(0, sc("technology", 3)).map((news) => (
                    <NewsCard key={news.id} news={news} variant="compact" />
                  ))}
                </>
              )}

              <AdSpace size="sidebar" className="mt-4" />
            </aside>
          )}

          {/* ========= MAIN COLUMN - 50% ========= */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            <FeaturedSlider />

            {/* Highlighted Posts */}
            {(highlightedPosts ?? []).length > 0 && sc("highlighted") > 0 && (
              <>
                <SectionTitle title="📌 হাইলাইটস" accent="red" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                  {(highlightedPosts ?? []).slice(0, sc("highlighted", 4)).map((news) => (
                    <NewsCard key={news.id} news={news} />
                  ))}
                </div>
              </>
            )}

            {/* Barisal Section - Lead + grid */}
            {sc("barisal") > 0 && (
              <>
                <SectionTitle title="বরিশাল বিভাগ" accent="red" />
                {(barisalPosts ?? []).length > 0 && (
                  <div className="mb-5">
                    {/* First post as lead */}
                    <div className="lead-story mb-3">
                      <div className="news-card group">
                        <div className="sm:flex">
                          <Link to={`/post/${(barisalPosts ?? [])[0]?.slug}`} className="block sm:w-1/2">
                            {(barisalPosts ?? [])[0]?.image_url ? (
                              <img src={(barisalPosts ?? [])[0]?.image_url!} alt=""
                                className="w-full aspect-[16/10] sm:h-full object-cover" loading="lazy" />
                            ) : (
                              <div className="w-full aspect-[16/10] sm:h-full bg-muted" />
                            )}
                          </Link>
                          <div className="p-3 sm:w-1/2 flex flex-col justify-center">
                            <Link to={`/post/${(barisalPosts ?? [])[0]?.slug}`} className="news-card-title text-base sm:text-lg block mb-2">
                              {cleanText((barisalPosts ?? [])[0]?.title || "")}
                            </Link>
                            <p className="text-xs text-muted-foreground line-clamp-3">
                              {cleanText((barisalPosts ?? [])[0]?.excerpt || (barisalPosts ?? [])[0]?.content || "").substring(0, 150)}
                            </p>
                            {(barisalPosts ?? [])[0]?.source_url && (
                              <a href={(barisalPosts ?? [])[0]?.source_url!} target="_blank" rel="noopener noreferrer"
                                className="text-accent text-[11px] mt-2 inline-flex items-center gap-1 hover:underline">
                                সূত্র <ExternalLink className="h-2.5 w-2.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Rest in grid */}
                    <div className="grid grid-cols-2 gap-3">
                      {(barisalPosts ?? []).slice(1).map((news) => (
                        <NewsCard key={news.id} news={news} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            <AdSpace size="banner" className="my-5" />

            {/* Category Sections */}
            {sc("sports") > 0 && (
              <>
                <SectionTitle title="খেলাধুলা" />
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {(sportsPosts ?? []).slice(0, sc("sports", 4)).map((news) => (
                    <NewsCard key={news.id} news={news} />
                  ))}
                </div>
              </>
            )}

            {sc("entertainment") > 0 && (
              <>
                <SectionTitle title="বিনোদন" />
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {(entertainmentPosts ?? []).slice(0, sc("entertainment", 4)).map((news) => (
                    <NewsCard key={news.id} news={news} />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* ========= RIGHT COLUMN - 25% ========= */}
          <aside className="lg:col-span-1 column-right order-3">
            {divisionSections.map((section) => {
              const count = sc(section.slug, 3);
              if (count <= 0) return null;
              return (
                <div key={section.slug} className="mb-4">
                  <SectionTitle title={section.title} />
                  {(section.posts ?? []).slice(0, count).map((news) => (
                    <NewsCard key={news.id} news={news} variant="compact" />
                  ))}
                  <Link
                    to={`/category/${section.slug}`}
                    className="text-[11px] text-accent hover:underline block mt-1.5 font-medium"
                  >
                    আরও পড়ুন →
                  </Link>
                </div>
              );
            })}

            <AdSpace size="sidebar" className="mt-3" />

            {/* Popular Posts */}
            {sc("popular") > 0 && (
              <>
                <SectionTitle title="জনপ্রিয় সংবাদ" className="mt-5" accent="red" />
                {(popularPosts ?? []).map((news, i) => (
                  <div key={news.id} className="flex gap-3 py-2.5 border-b border-border last:border-0">
                    <span className="popular-number">{i + 1}</span>
                    <Link to={`/post/${news.slug}`} className="news-card-title text-sm flex-1">
                      {cleanText(news.title)}
                    </Link>
                  </div>
                ))}
              </>
            )}
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
