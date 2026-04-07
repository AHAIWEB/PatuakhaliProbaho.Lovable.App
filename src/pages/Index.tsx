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

/* Division slug to label map */
const divisionLabels: Record<string, string> = {
  dhaka: "ঢাকা বিভাগ", chattogram: "চট্টগ্রাম বিভাগ", sylhet: "সিলেট বিভাগ",
  rajshahi: "রাজশাহী বিভাগ", khulna: "খুলনা বিভাগ", rangpur: "রংপুর বিভাগ",
  mymensingh: "ময়মনসিংহ বিভাগ", barisal: "বরিশাল বিভাগ",
};

/* Dynamic section component that fetches its own posts */
const DynamicSection = ({ sectionKey, label, count, position }: { sectionKey: string; label: string; count: number; position: string }) => {
  // Special sections handled differently
  const isDivision = ["dhaka", "chattogram", "sylhet", "rajshahi", "khulna", "rangpur", "mymensingh"].includes(sectionKey);
  const { data: divPosts } = usePostsByDivision(isDivision ? sectionKey : "", isDivision ? count : 0);
  const isNational = sectionKey === "national";
  const { data: natPosts } = useNationalPosts(isNational ? count : 0);
  const isPopular = sectionKey === "popular";
  const { data: popPosts } = useMostViewedPosts(isPopular ? count : 0);
  const isHighlighted = sectionKey === "highlighted";
  const { data: hlPosts } = useHighlightedPosts();
  const isBarisal = sectionKey === "barisal";
  const { data: bslPosts } = usePostsByDivision(isBarisal ? "barisal" : "", isBarisal ? count : 0);
  
  // Category-based sections
  const isCatSection = !isDivision && !isNational && !isPopular && !isHighlighted && !isBarisal && sectionKey !== "gallery";
  const { data: catPosts } = useCategoryPosts(isCatSection ? sectionKey : "", isCatSection ? count : 0);

  // Gallery
  const isGallery = sectionKey === "gallery";
  const { data: galleryPosts } = useQuery({
    queryKey: ["posts", "galleryPreview", count],
    queryFn: async () => {
      const { data } = await supabase
        .from("posts")
        .select("id, title, image_url, slug")
        .eq("status", "published")
        .not("image_url", "is", null)
        .order("published_at", { ascending: false })
        .limit(count);
      return data || [];
    },
    enabled: isGallery && count > 0,
  });

  const posts = isNational ? natPosts : isDivision ? divPosts : isBarisal ? bslPosts : isPopular ? popPosts : isHighlighted ? hlPosts : isGallery ? galleryPosts : catPosts;

  if (!(posts ?? []).length) return null;

  // Popular section - numbered list
  if (isPopular) {
    return (
      <>
        <SectionTitle title={label} accent="red" />
        {(posts as Post[] ?? []).map((news: any, i: number) => (
          <div key={news.id} className="flex gap-2.5 py-2 border-b border-border last:border-0">
            <span className="popular-number text-lg">{i + 1}</span>
            <Link to={`/post/${news.slug}`} className="text-xs font-bold text-foreground hover:text-accent transition-colors flex-1 line-clamp-2">
              {cleanText(news.title)}
            </Link>
          </div>
        ))}
      </>
    );
  }

  // Gallery section
  if (isGallery) {
    return (
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <SectionTitle title={label} />
          <Link to="/gallery" className="text-xs text-accent hover:underline font-medium">সব দেখুন →</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {(posts ?? []).slice(0, count).map((post: any) => (
            <Link key={post.id} to="/gallery" className="group relative overflow-hidden rounded-lg bg-muted aspect-square">
              {post.image_url && (
                <img src={post.image_url} alt={cleanText(post.title)} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-0 left-0 right-0 p-1.5 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <p className="text-white text-[9px] sm:text-[10px] font-medium line-clamp-2">{cleanText(post.title)}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  // Highlighted - masonry 2 cols
  if (isHighlighted) {
    return (
      <div className="mt-4">
        <SectionTitle title={label} accent="red" />
        <MasonryGrid posts={(posts as Post[] ?? []).slice(0, count)} columns={2} />
      </div>
    );
  }

  // Division sections in sidebar
  if ((isDivision || isBarisal) && position === "right") {
    return (
      <div>
        <SectionTitle title={label} />
        <div className="columns-1 gap-3">
          {(posts as Post[] ?? []).slice(0, count).map((news: any, i: number) => (
            <MasonryCard key={news.id} news={news} size={i === 0 ? "normal" : "small"} />
          ))}
        </div>
        <Link to={`/category/${sectionKey}`} className="text-[11px] text-accent hover:underline block mt-1 font-medium">
          আরও পড়ুন →
        </Link>
      </div>
    );
  }

  // Left sidebar sections
  if (position === "left") {
    return (
      <>
        <SectionTitle title={label} accent={sectionKey === "national" ? "red" : undefined} />
        <div className="columns-1 gap-3">
          {(posts as Post[] ?? []).map((news: any, i: number) => (
            <MasonryCard key={news.id} news={news} size={i === 0 ? (sectionKey === "national" ? "large" : "normal") : "small"} />
          ))}
        </div>
      </>
    );
  }

  // Center/main masonry sections
  return (
    <div className="mt-4">
      <SectionTitle title={label} accent={sectionKey === "barisal" ? "red" : undefined} />
      <MasonryGrid posts={(posts as Post[] ?? []).slice(0, count)} columns={2} />
    </div>
  );
};

const Index = () => {
  usePostsRealtime();

  const { data: layoutSettings } = useLayoutSettings();
  const ls = layoutSettings ?? [];
  const sc = (key: string, fb = 5) => getSectionCount(ls, key, fb);

  // Group sections by position from database
  const sortedSettings = [...ls].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const leftSections = sortedSettings.filter(s => s.position === "left" && s.is_visible && s.post_count > 0);
  const centerSections = sortedSettings.filter(s => s.position === "center" && s.is_visible && s.post_count > 0);
  const rightSections = sortedSettings.filter(s => s.position === "right" && s.is_visible && s.post_count > 0);

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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">

          {/* ========= LEFT SIDEBAR - Dynamic ========= */}
          {leftSections.length > 0 && (
            <aside className="lg:col-span-3 order-3 lg:order-1 space-y-4">
              {leftSections.map((s, i) => (
                <DynamicSection key={s.id} sectionKey={s.section_key} label={s.section_label} count={s.post_count} position="left" />
              ))}
              <AdSpace size="sidebar" />
            </aside>
          )}

          {/* ========= MAIN - Dynamic ========= */}
          <div className={`${leftSections.length > 0 && rightSections.length > 0 ? "lg:col-span-6" : leftSections.length > 0 || rightSections.length > 0 ? "lg:col-span-9" : "lg:col-span-12"} order-2 lg:order-2`}>
            <FeaturedSlider />
            <PhotoCardCarousel />

            {centerSections.map((s, i) => (
              <DynamicSection key={s.id} sectionKey={s.section_key} label={s.section_label} count={s.post_count} position="center" />
            ))}

            {centerSections.length > 2 && <AdSpace size="banner" className="my-4" />}
          </div>

          {/* ========= RIGHT SIDEBAR - Dynamic ========= */}
          {rightSections.length > 0 && (
            <aside className="lg:col-span-3 order-1 lg:order-3 space-y-4">
              {rightSections.map((s) => (
                <DynamicSection key={s.id} sectionKey={s.section_key} label={s.section_label} count={s.post_count} position="right" />
              ))}
              <AdSpace size="sidebar" />
            </aside>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
