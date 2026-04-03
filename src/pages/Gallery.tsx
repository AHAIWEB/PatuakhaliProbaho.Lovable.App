import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import CategoryNav from "@/components/CategoryNav";
import Footer from "@/components/Footer";
import { X, ChevronLeft, ChevronRight, ExternalLink, Download } from "lucide-react";
import { cleanText } from "@/lib/content";

type GalleryPost = {
  id: string;
  title: string;
  image_url: string | null;
  source_name: string | null;
  source_url: string | null;
  published_at: string | null;
  slug: string;
};

const useGalleryPosts = (page: number, perPage = 30) =>
  useQuery({
    queryKey: ["gallery", page, perPage],
    queryFn: async () => {
      const from = page * perPage;
      const to = from + perPage - 1;

      // Get gallery category posts + any posts with images
      const { data: galleryCats } = await supabase
        .from("categories")
        .select("id")
        .in("slug", ["gallery", "photo-gallery", "photos"]);

      const catIds = (galleryCats || []).map((c) => c.id);

      let posts: GalleryPost[] = [];

      if (catIds.length > 0) {
        const { data } = await supabase
          .from("posts")
          .select("id, title, image_url, source_name, source_url, published_at, slug")
          .in("category_id", catIds)
          .eq("status", "published")
          .not("image_url", "is", null)
          .order("published_at", { ascending: false })
          .range(from, to);
        posts = data || [];
      }

      // If not enough gallery posts, fill with image-rich posts
      if (posts.length < perPage) {
        const existingIds = posts.map((p) => p.id);
        const remaining = perPage - posts.length;
        const { data: morePosts } = await supabase
          .from("posts")
          .select("id, title, image_url, source_name, source_url, published_at, slug")
          .eq("status", "published")
          .not("image_url", "is", null)
          .order("published_at", { ascending: false })
          .range(from, from + remaining + 20);

        for (const p of morePosts || []) {
          if (!existingIds.includes(p.id) && posts.length < perPage) {
            posts.push(p);
            existingIds.push(p.id);
          }
        }
      }

      return posts;
    },
  });

const Gallery = () => {
  const [page, setPage] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const { data: posts, isLoading } = useGalleryPosts(page);

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  const goNext = useCallback(() => {
    if (lightboxIndex !== null && posts) {
      setLightboxIndex((lightboxIndex + 1) % posts.length);
    }
  }, [lightboxIndex, posts]);

  const goPrev = useCallback(() => {
    if (lightboxIndex !== null && posts) {
      setLightboxIndex((lightboxIndex - 1 + posts.length) % posts.length);
    }
  }, [lightboxIndex, posts]);

  // Keyboard navigation
  useEffect(() => {
    if (lightboxIndex === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxIndex, goNext, goPrev]);

  // Prevent body scroll when lightbox open
  useEffect(() => {
    if (lightboxIndex !== null) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [lightboxIndex]);

  const currentPost = lightboxIndex !== null && posts ? posts[lightboxIndex] : null;

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Header />
      <CategoryNav />

      <main className="container mx-auto px-2 sm:px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            📸 ফটো গ্যালারি
          </h1>
          <span className="text-xs text-muted-foreground">
            {posts?.length || 0} ছবি
          </span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} className="aspect-square bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : (
          <>
            {/* Masonry-ish grid */}
            <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-2">
              {(posts || []).map((post, i) => (
                <div
                  key={post.id}
                  className="break-inside-avoid mb-2 group cursor-pointer"
                  onClick={() => openLightbox(i)}
                >
                  <div className="relative overflow-hidden rounded-lg bg-muted">
                    <img
                      src={post.image_url!}
                      alt={cleanText(post.title)}
                      className="w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                      style={{
                        aspectRatio: i % 5 === 0 ? "3/4" : i % 3 === 0 ? "4/3" : i % 2 === 0 ? "1/1" : "16/10",
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-0 left-0 right-0 p-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                      <p className="text-white text-[10px] sm:text-xs font-medium line-clamp-2 leading-snug">
                        {cleanText(post.title)}
                      </p>
                      {post.source_name && (
                        <span className="text-white/70 text-[9px]">{post.source_name}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center gap-3 mt-6">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="px-4 py-2 text-sm bg-card border border-border rounded-lg disabled:opacity-40 hover:bg-accent/10 transition-colors"
              >
                ← আগের পাতা
              </button>
              <span className="px-4 py-2 text-sm text-muted-foreground">
                পাতা {page + 1}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={(posts?.length || 0) < 30}
                className="px-4 py-2 text-sm bg-card border border-border rounded-lg disabled:opacity-40 hover:bg-accent/10 transition-colors"
              >
                পরের পাতা →
              </button>
            </div>
          </>
        )}
      </main>

      {/* Lightbox */}
      {lightboxIndex !== null && currentPost && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close */}
          <button
            className="absolute top-3 right-3 z-50 text-white/80 hover:text-white p-2"
            onClick={closeLightbox}
          >
            <X className="h-6 w-6" />
          </button>

          {/* Counter */}
          <div className="absolute top-3 left-3 text-white/60 text-sm">
            {lightboxIndex + 1} / {posts?.length}
          </div>

          {/* Prev */}
          <button
            className="absolute left-2 top-1/2 -translate-y-1/2 z-50 text-white/60 hover:text-white p-2 bg-black/40 rounded-full"
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          {/* Image */}
          <div
            className="max-w-[90vw] max-h-[80vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={currentPost.image_url!}
              alt={cleanText(currentPost.title)}
              className="max-w-full max-h-[70vh] object-contain rounded-lg"
            />
            <div className="mt-3 text-center px-4 max-w-2xl">
              <p className="text-white text-sm sm:text-base font-medium leading-snug">
                {cleanText(currentPost.title)}
              </p>
              <div className="flex items-center justify-center gap-3 mt-2 text-white/50 text-xs">
                {currentPost.source_name && <span>{currentPost.source_name}</span>}
                {currentPost.published_at && (
                  <span>{new Date(currentPost.published_at).toLocaleDateString("bn-BD")}</span>
                )}
                {currentPost.source_url && (
                  <a
                    href={currentPost.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-accent hover:underline"
                  >
                    সোর্স <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Next */}
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 z-50 text-white/60 hover:text-white p-2 bg-black/40 rounded-full"
            onClick={(e) => { e.stopPropagation(); goNext(); }}
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Gallery;
