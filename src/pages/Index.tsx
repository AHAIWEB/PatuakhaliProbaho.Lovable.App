import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import CategoryNav from "@/components/CategoryNav";
import NewsTicker from "@/components/NewsTicker";
import FeaturedSlider from "@/components/FeaturedSlider";
import PhotoCardCarousel from "@/components/PhotoCardCarousel";
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
import type { Post } from "@/hooks/usePosts";

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

      // Get sub-category IDs too
      const { data: subCats } = await supabase
        .from("categories")
        .select("id")
        .eq("parent_id", cat.id);
      const allCatIds = [cat.id, ...(subCats || []).map((c) => c.id)];

      // First: posts with matching category_id
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .in("category_id", allCatIds)
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(limit);
      if (error) throw error;

      // If enough posts, return them
      if ((data ?? []).length >= limit) return data ?? [];

      // Fallback: also match by source_category or tags
      const { data: fallback } = await supabase
        .from("posts")
        .select("*")
        .eq("status", "published")
        .or(`source_category.eq.${slug},tags.cs.{${slug}}`)
        .order("published_at", { ascending: false })
        .limit(limit);

      // Merge without duplicates
      const ids = new Set((data ?? []).map((p) => p.id));
      const merged = [...(data ?? [])];
      for (const p of fallback ?? []) {
        if (!ids.has(p.id) && merged.length < limit) {
          merged.push(p);
          ids.add(p.id);
        }
      }
      return merged;
    },
  });

/* Pinterest-style masonry card with variable heights */
const MasonryCard = ({ news, size = "normal" }: { news: Post; size?: "large" | "normal" | "small" }) => {
  const postLink = `/post/${news.slug}`;
  const excerpt = cleanText(news.content || news.excerpt || "").substring(0, size === "large" ? 200 : 80);

  if (size === "small") {
    return (
      <div className="masonry-card group break-inside-avoid mb-3">
        <div className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
          <div className="p-3">
            <Link to={postLink} className="text-sm font-bold leading-snug text-foreground hover:text-accent transition-colors line-clamp-2 block">
              {cleanText(news.title)}
            </Link>
            <div className="flex items-center gap-1 mt-1.5 text-[10px] text-muted-foreground">
              <span>{news.source_name || "নিজস্ব"}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="masonry-card group break-inside-avoid mb-3">
      <div className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
        {news.image_url && (
          <Link to={postLink} className="block overflow-hidden">
            <img
              src={news.image_url}
              alt={news.title}
              className={`w-full object-cover transition-transform duration-500 group-hover:scale-105 ${size === "large" ? "aspect-[4/3]" : "aspect-[16/10]"}`}
              loading="lazy"
            />
          </Link>
        )}
        {news.is_highlighted && (
          <span className="absolute top-2 left-2 bg-highlight text-foreground text-[10px] font-bold px-2 py-0.5 rounded-sm animate-pulse z-10">
            📌
          </span>
        )}
        <div className="p-2.5">
          {news.source_category && (
            <span className="text-[9px] font-medium bg-accent/10 text-accent px-1.5 py-0.5 rounded mb-1 inline-block">
              {news.source_category}
            </span>
          )}
          <Link to={postLink} className={`font-bold leading-snug text-foreground hover:text-accent transition-colors block mb-1 line-clamp-2 ${size === "large" ? "text-base" : "text-sm"}`}>
            {cleanText(news.title)}
          </Link>
          {excerpt && (
            <p className="text-[11px] text-muted-foreground line-clamp-2 mb-1.5">{excerpt}…</p>
          )}
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            {news.source_url ? (
              <a href={news.source_url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline inline-flex items-center gap-0.5">
                {news.source_name || "সোর্স"} <ExternalLink className="h-2 w-2" />
              </a>
            ) : (
              <span>{news.source_name || "নিজস্ব"}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* Masonry column renderer */
const MasonryGrid = ({ posts, columns = 2 }: { posts: Post[]; columns?: number }) => {
  return (
    <div className={`gap-3`} style={{ columnCount: columns }}>
      {posts.map((news, i) => (
        <MasonryCard key={news.id} news={news} size={i === 0 ? "large" : (i > 3 ? "small" : "normal")} />
      ))}
    </div>
  );
};

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

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Header />
      <CategoryNav />
      <NewsTicker />

      <div className="container mx-auto px-2 sm:px-4 mt-3">
        <AdSpace size="leaderboard" />
      </div>

      <main className="container mx-auto px-2 sm:px-4 mt-4">
        {/* === Pinterest-Style Masonry Layout === */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">

          {/* ========= LEFT SIDEBAR - Pinterest Style ========= */}
          {sc("national") > 0 && (
            <aside className="lg:col-span-3 order-2 lg:order-1 space-y-4">
              <SectionTitle title="জাতীয় সংবাদ" accent="red" />
              <div className="columns-1 gap-3">
                {(nationalPosts ?? []).map((news, i) => (
                  <MasonryCard key={news.id} news={news} size={i === 0 ? "large" : i < 3 ? "normal" : "small"} />
                ))}
              </div>

              {sc("international") > 0 && (
                <>
                  <SectionTitle title="আন্তর্জাতিক" />
                  <div className="columns-1 gap-3">
                    {(internationalPosts ?? []).map((news) => (
                      <MasonryCard key={news.id} news={news} size="small" />
                    ))}
                  </div>
                </>
              )}

              <AdSpace size="sidebar" />

              {sc("politics") > 0 && (
                <>
                  <SectionTitle title="রাজনীতি" />
                  <div className="columns-1 gap-3">
                    {(politicsPosts ?? []).map((news, i) => (
                      <MasonryCard key={news.id} news={news} size={i === 0 ? "normal" : "small"} />
                    ))}
                  </div>
                </>
              )}

              {sc("technology") > 0 && (
                <>
                  <SectionTitle title="প্রযুক্তি" />
                  <div className="columns-1 gap-3">
                    {(techPosts ?? []).map((news) => (
                      <MasonryCard key={news.id} news={news} size="small" />
                    ))}
                  </div>
                </>
              )}
            </aside>
          )}

          {/* ========= MAIN - Pinterest Masonry ========= */}
          <div className="lg:col-span-6 order-1 lg:order-2">
            <FeaturedSlider />
            <PhotoCardCarousel />

            {/* Highlighted - masonry 2 cols */}
            {(highlightedPosts ?? []).length > 0 && sc("highlighted") > 0 && (
              <div className="mt-4">
                <SectionTitle title="📌 হাইলাইটস" accent="red" />
                <MasonryGrid posts={(highlightedPosts ?? []).slice(0, sc("highlighted", 4))} columns={2} />
              </div>
            )}

            {/* Barisal - Pinterest masonry */}
            {sc("barisal") > 0 && (barisalPosts ?? []).length > 0 && (
              <div className="mt-4">
                <SectionTitle title="বরিশাল বিভাগ" accent="red" />
                <MasonryGrid posts={(barisalPosts ?? []).slice(0, sc("barisal", 6))} columns={2} />
              </div>
            )}

            <AdSpace size="banner" className="my-4" />

            {/* Sports & Entertainment - masonry */}
            {sc("sports") > 0 && (
              <div className="mt-4">
                <SectionTitle title="খেলাধুলা" />
                <MasonryGrid posts={(sportsPosts ?? []).slice(0, sc("sports", 4))} columns={2} />
              </div>
            )}

            {sc("entertainment") > 0 && (
              <div className="mt-4">
                <SectionTitle title="বিনোদন" />
                <MasonryGrid posts={(entertainmentPosts ?? []).slice(0, sc("entertainment", 4))} columns={2} />
              </div>
            )}
          </div>

          {/* ========= RIGHT SIDEBAR - Pinterest Style ========= */}
          <aside className="lg:col-span-3 order-3 space-y-4">
            {divisionSections.map((section) => {
              const count = sc(section.slug, 3);
              if (count <= 0 || !(section.posts ?? []).length) return null;
              return (
                <div key={section.slug}>
                  <SectionTitle title={section.title} />
                  <div className="columns-1 gap-3">
                    {(section.posts ?? []).slice(0, count).map((news, i) => (
                      <MasonryCard key={news.id} news={news} size={i === 0 ? "normal" : "small"} />
                    ))}
                  </div>
                  <Link to={`/category/${section.slug}`} className="text-[11px] text-accent hover:underline block mt-1 font-medium">
                    আরও পড়ুন →
                  </Link>
                </div>
              );
            })}

            <AdSpace size="sidebar" />

            {/* Popular - numbered list */}
            {sc("popular") > 0 && (
              <>
                <SectionTitle title="জনপ্রিয় সংবাদ" accent="red" />
                {(popularPosts ?? []).map((news, i) => (
                  <div key={news.id} className="flex gap-2.5 py-2 border-b border-border last:border-0">
                    <span className="popular-number text-lg">{i + 1}</span>
                    <Link to={`/post/${news.slug}`} className="text-xs font-bold text-foreground hover:text-accent transition-colors flex-1 line-clamp-2">
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
