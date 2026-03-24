import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import CategoryNav from "@/components/CategoryNav";
import Footer from "@/components/Footer";
import AdSpace from "@/components/AdSpace";
import { cleanText } from "@/lib/content";
import { ExternalLink, Share2, Facebook, Twitter, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const PostDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [copied, setCopied] = useState(false);

  const { data: post, isLoading } = useQuery({
    queryKey: ["post", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*, categories(name, slug)")
        .eq("slug", slug!)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        supabase.from("posts").update({ views: (data.views || 0) + 1 }).eq("id", data.id).then();
      }
      return data;
    },
    enabled: !!slug,
  });

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">লোড হচ্ছে...</div>;
  if (!post) return <div className="min-h-screen flex items-center justify-center">পোস্ট পাওয়া যায়নি</div>;

  const fullContent = cleanText(post.content || "");
  const halfLen = Math.ceil(fullContent.length * 0.5);
  const displayContent = fullContent.substring(0, halfLen);
  const hasMore = fullContent.length > halfLen;

  const postUrl = window.location.href;
  const encodedUrl = encodeURIComponent(postUrl);
  const encodedTitle = encodeURIComponent(post.title);

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    blogger: `https://www.blogger.com/blog-this.g?u=${encodedUrl}&n=${encodedTitle}&t=${encodeURIComponent(displayContent.substring(0, 200))}`,
  };

  const copyLink = () => {
    navigator.clipboard.writeText(postUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Header />
      <CategoryNav />

      <main className="container mx-auto px-4 mt-6 max-w-4xl">
        {(post as any).categories && (
          <a href={`/category/${(post as any).categories.slug}`} className="inline-block bg-primary text-primary-foreground text-xs px-2 py-1 rounded mb-3">
            {(post as any).categories.name}
          </a>
        )}

        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4 leading-tight">{cleanText(post.title)}</h1>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          {post.source_name && <span>সোর্স: {post.source_name}</span>}
          {post.published_at && <span>{new Date(post.published_at).toLocaleDateString("bn-BD", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>}
          {post.views !== null && <span>👁 {post.views}</span>}
        </div>

        {/* Share Buttons */}
        <div className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium text-muted-foreground mr-1"><Share2 className="inline h-4 w-4" /> শেয়ার:</span>
          <a href={shareLinks.facebook} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 bg-[hsl(221,44%,41%)] text-white text-xs rounded hover:opacity-90">
            <Facebook className="h-3.5 w-3.5" />Facebook
          </a>
          <a href={shareLinks.twitter} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 bg-foreground text-background text-xs rounded hover:opacity-90">
            <Twitter className="h-3.5 w-3.5" />𝕏
          </a>
          <a href={shareLinks.whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 bg-[hsl(142,70%,35%)] text-white text-xs rounded hover:opacity-90">
            💬 WhatsApp
          </a>
          <a href={shareLinks.blogger} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 bg-accent text-accent-foreground text-xs rounded hover:opacity-90">
            📝 Blogger
          </a>
          <a href={shareLinks.linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 bg-[hsl(210,50%,40%)] text-white text-xs rounded hover:opacity-90">
            LinkedIn
          </a>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={copyLink}>
            {copied ? <><Check className="h-3.5 w-3.5 mr-1" />কপি হয়েছে</> : <><Copy className="h-3.5 w-3.5 mr-1" />লিংক কপি</>}
          </Button>
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
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2 rounded-md font-medium hover:bg-primary/90 transition-colors"
            >
              বিস্তারিত পড়ুন <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        )}

        {/* Share again at bottom */}
        <div className="flex flex-wrap items-center gap-2 mt-6 p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium text-muted-foreground mr-1"><Share2 className="inline h-4 w-4" /> শেয়ার:</span>
          <a href={shareLinks.facebook} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 bg-[hsl(221,44%,41%)] text-white text-xs rounded hover:opacity-90">
            <Facebook className="h-3.5 w-3.5" />Facebook
          </a>
          <a href={shareLinks.whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 bg-[hsl(142,70%,35%)] text-white text-xs rounded hover:opacity-90">
            💬 WhatsApp
          </a>
          <a href={shareLinks.blogger} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 bg-accent text-accent-foreground text-xs rounded hover:opacity-90">
            📝 Blogger
          </a>
        </div>

        <AdSpace size="banner" className="mt-6" />
      </main>

      <Footer />
    </div>
  );
};

export default PostDetail;
