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
  usePostsRealtime,
} from "@/hooks/usePosts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLayoutSettings, getSectionCount } from "@/hooks/useLayoutSettings";
import { ExternalLink } from "lucide-react";
import { cleanText } from "@/lib/content";
import type { Post } from "@/hooks/usePosts";

const useCategoryPosts = (slug: string, limit = 4, aliases: string[] = []) =>
  useQuery({
    queryKey: ["posts", "catSlug", slug, [...aliases].sort().join("|"), limit],
    queryFn: async () => {
      const slugOptions = Array.from(new Set([slug, ...aliases]));

      const { data: cats, error: categoryError } = await supabase
        .from("categories")
        .select("id")
        .in("slug", slugOptions);
      if (categoryError) throw categoryError;

      const rootCategoryIds = (cats || []).map((cat) => cat.id);

      // Get sub-category IDs too
      const { data: subCats, error: subCategoryError } = rootCategoryIds.length > 0
        ? await supabase
            .from("categories")
            .select("id")
            .in("parent_id", rootCategoryIds)
        : { data: [], error: null };
      if (subCategoryError) throw subCategoryError;

      const allCatIds = [...rootCategoryIds, ...(subCats || []).map((c) => c.id)];
      const ids = new Set<string>();
      const merged: Post[] = [];

      // First: posts with matching category_id
      if (allCatIds.length > 0) {
        const { data, error } = await supabase
          .from("posts")
          .select("*")
          .in("category_id", allCatIds)
          .eq("status", "published")
          .order("published_at", { ascending: false })
          .limit(limit);
        if (error) throw error;

        for (const post of data ?? []) {
          if (!ids.has(post.id) && merged.length < limit) {
            ids.add(post.id);
            merged.push(post);
          }
        }
      }

      if (merged.length >= limit) return merged;

      // Fallback: also match by source_category or tags
      const fallbackFilters = slugOptions
        .flatMap((candidate) => [`source_category.eq.${candidate}`, `tags.cs.{${candidate}}`])
        .join(",");

      const { data: fallback, error: fallbackError } = await supabase
        .from("posts")
        .select("*")
        .eq("status", "published")
        .or(fallbackFilters)
        .order("published_at", { ascending: false })
        .limit(limit);
      if (fallbackError) throw fallbackError;

      // Merge without duplicates
      for (const p of fallback ?? []) {
        if (!ids.has(p.id) && merged.length < limit) {
          merged.push(p);
          ids.add(p.id);
        }
      }
      return merged;
    },
    enabled: limit > 0,
  });

/* Pinterest-style masonry card with variable heights and animations */
const MasonryCard = ({ news, size = "normal", index = 0 }: { news: Post; size?: "large" | "normal" | "small" | "wide"; index?: number }) => {
  const postLink = `/post/${news.slug}`;
  const excerpt = cleanText(news.content || news.excerpt || "").substring(0, size === "large" ? 200 : size === "wide" ? 150 : 80);

  // Vary image aspect ratios for visual interest
  const imageAspect = size === "large" ? "aspect-[3/4]" : size === "wide" ? "aspect-[16/9]" : index % 3 === 0 ? "aspect-[4/3]" : index % 3 === 1 ? "aspect-square" : "aspect-[16/10]";

  if (size === "small") {
    return (
      <div className="masonry-card group break-inside-avoid mb-3 animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
        <div className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          {news.image_url && (
            <Link to={postLink} className="block overflow-hidden">
              <img src={news.image_url} alt={news.title} className="w-full aspect-[2/1] object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
            </Link>
          )}
          <div className="p-2.5">
            <Link to={postLink} className="text-xs font-bold leading-snug text-foreground hover:text-accent transition-colors line-clamp-2 block">
              {cleanText(news.title)}
            </Link>
            <div className="flex items-center gap-1 mt-1.5 text-[10px] text-muted-foreground">
              <span>{news.source_name || "নিজস্ব"}</span>
              {news.published_at && <span>• {new Date(news.published_at).toLocaleDateString("bn-BD")}</span>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="masonry-card group break-inside-avoid mb-3 animate-fade-in" style={{ animationDelay: `${index * 60}ms` }}>
      <div className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative">
        {news.image_url && (
          <Link to={postLink} className="block overflow-hidden relative">
            <img
              src={news.image_url}
              alt={news.title}
              className={`w-full object-cover transition-transform duration-700 group-hover:scale-110 ${imageAspect}`}
              loading="lazy"
            />
            {/* Gradient overlay on image */}
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </Link>
        )}
        {news.is_highlighted && (
          <span className="absolute top-2 left-2 bg-highlight text-foreground text-[10px] font-bold px-2 py-0.5 rounded-sm animate-pulse z-10">
            📌
          </span>
        )}
        {news.is_featured && (
          <span className="absolute top-2 right-2 bg-accent text-accent-foreground text-[9px] font-bold px-1.5 py-0.5 rounded z-10">
            ⭐
          </span>
        )}
        <div className={`p-2.5 ${size === "large" ? "p-3" : ""}`}>
          {news.source_category && (
            <span className="text-[9px] font-semibold bg-accent/10 text-accent px-1.5 py-0.5 rounded mb-1.5 inline-block uppercase tracking-wide">
              {news.source_category}
            </span>
          )}
          <Link to={postLink} className={`font-bold leading-snug text-foreground hover:text-accent transition-colors block mb-1.5 line-clamp-2 ${size === "large" ? "text-base sm:text-lg" : size === "wide" ? "text-sm sm:text-base" : "text-sm"}`}>
            {cleanText(news.title)}
          </Link>
          {excerpt && (
            <p className="text-[11px] text-muted-foreground line-clamp-2 mb-2 leading-relaxed">{excerpt}…</p>
          )}
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1">
              {news.source_url ? (
                <a href={news.source_url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline inline-flex items-center gap-0.5 font-medium">
                  {news.source_name || "সোর্স"} <ExternalLink className="h-2 w-2" />
                </a>
              ) : (
                <span>{news.source_name || "নিজস্ব"}</span>
              )}
            </div>
            {news.published_at && (
              <span className="text-[9px]">{new Date(news.published_at).toLocaleDateString("bn-BD")}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* Masonry column renderer with varied sizes */
const MasonryGrid = ({ posts, columns = 2 }: { posts: Post[]; columns?: number }) => {
  return (
    <div className="gap-3" style={{ columnCount: columns }}>
      {posts.map((news, i) => {
        const size = i === 0 ? "large" : i === 1 ? "wide" : i > 4 ? "small" : "normal";
        return <MasonryCard key={news.id} news={news} size={size} index={i} />;
      })}
    </div>
  );
};

const Index = () => {
  // Enable realtime updates for all post queries
  usePostsRealtime();

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
  const { data: internationalPosts } = useCategoryPosts("world", sc("international", 4), ["international"]);
  const { data: techPosts } = useCategoryPosts("technology", sc("technology", 3));
  const { data: healthPosts } = useCategoryPosts("health", sc("health", 4));
  const { data: lifestylePosts } = useCategoryPosts("lifestyle", sc("lifestyle", 4));
  const { data: religionPosts } = useCategoryPosts("religion", sc("religion", 4));
  const { data: travelPosts } = useCategoryPosts("travel", sc("travel", 4));
  const { data: peoplePosts } = useCategoryPosts("people", sc("people", 4));
  const { data: jobsPosts } = useCategoryPosts("jobs", sc("jobs", 4), ["chakri"]);

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
            <aside className="lg:col-span-3 order-3 lg:order-1 space-y-4">
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
          <div className="lg:col-span-6 order-2 lg:order-2">
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

            {sc("health") > 0 && (healthPosts ?? []).length > 0 && (
              <div className="mt-4">
                <SectionTitle title="স্বাস্থ্য" />
                <MasonryGrid posts={(healthPosts ?? []).slice(0, sc("health", 4))} columns={2} />
              </div>
            )}

            {sc("lifestyle") > 0 && (lifestylePosts ?? []).length > 0 && (
              <div className="mt-4">
                <SectionTitle title="লাইফস্টাইল" />
                <MasonryGrid posts={(lifestylePosts ?? []).slice(0, sc("lifestyle", 4))} columns={2} />
              </div>
            )}

            {sc("religion") > 0 && (religionPosts ?? []).length > 0 && (
              <div className="mt-4">
                <SectionTitle title="ধর্ম" />
                <MasonryGrid posts={(religionPosts ?? []).slice(0, sc("religion", 4))} columns={2} />
              </div>
            )}

            {sc("travel") > 0 && (travelPosts ?? []).length > 0 && (
              <div className="mt-4">
                <SectionTitle title="ভ্রমণ" />
                <MasonryGrid posts={(travelPosts ?? []).slice(0, sc("travel", 4))} columns={2} />
              </div>
            )}
          </div>

          {/* ========= RIGHT SIDEBAR - Division Sections (mobile first) ========= */}
          <aside className="lg:col-span-3 order-1 lg:order-3 space-y-4">
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
