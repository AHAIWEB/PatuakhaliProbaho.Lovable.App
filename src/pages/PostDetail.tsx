import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import CategoryNav from "@/components/CategoryNav";
import Footer from "@/components/Footer";
import AdSpace from "@/components/AdSpace";

const PostDetail = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: post, isLoading } = useQuery({
    queryKey: ["post", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*, categories(name, slug)")
        .eq("slug", slug!)
        .maybeSingle();
      if (error) throw error;
      // Increment views
      if (data) {
        supabase.from("posts").update({ views: (data.views || 0) + 1 }).eq("id", data.id).then();
      }
      return data;
    },
    enabled: !!slug,
  });

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">লোড হচ্ছে...</div>;
  if (!post) return <div className="min-h-screen flex items-center justify-center">পোস্ট পাওয়া যায়নি</div>;

  // Show ~50% content
  const fullContent = post.content || "";
  const halfLen = Math.ceil(fullContent.length * 0.5);
  const displayContent = fullContent.substring(0, halfLen);
  const hasMore = fullContent.length > halfLen;

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Header />
      <CategoryNav />

      <main className="container mx-auto px-4 mt-6 max-w-4xl">
        {/* Category badge */}
        {(post as any).categories && (
          <a href={`/category/${(post as any).categories.slug}`} className="inline-block bg-primary text-primary-foreground text-xs px-2 py-1 rounded mb-3">
            {(post as any).categories.name}
          </a>
        )}

        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4 leading-tight">{post.title}</h1>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          {post.source_name && <span>সোর্স: {post.source_name}</span>}
          {post.published_at && <span>{new Date(post.published_at).toLocaleDateString("bn-BD")}</span>}
          {post.views !== null && <span>👁 {post.views}</span>}
        </div>

        {post.image_url && (
          <img src={post.image_url} alt={post.title} className="w-full max-h-[400px] object-cover rounded-lg mb-6" />
        )}

        <AdSpace size="banner" className="mb-4" />

        <article className="prose prose-lg max-w-none text-foreground">
          <p className="whitespace-pre-line">{displayContent}</p>
        </article>

        {hasMore && post.source_url && (
          <div className="mt-6 p-4 bg-muted rounded-lg text-center">
            <p className="text-muted-foreground mb-3">বিস্তারিত পড়তে মূল সোর্সে যান</p>
            <a
              href={post.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-primary text-primary-foreground px-6 py-2 rounded-md font-medium hover:bg-primary/90 transition-colors"
            >
              বিস্তারিত পড়ুন →
            </a>
          </div>
        )}

        <AdSpace size="banner" className="mt-6" />
      </main>

      <Footer />
    </div>
  );
};

export default PostDetail;
