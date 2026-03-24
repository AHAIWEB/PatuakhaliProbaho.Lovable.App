import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import CategoryNav from "@/components/CategoryNav";
import NewsCard from "@/components/NewsCard";
import SectionTitle from "@/components/SectionTitle";
import AdSpace from "@/components/AdSpace";
import Footer from "@/components/Footer";
import type { Post } from "@/hooks/usePosts";

const CategoryPage = () => {
  const { slug } = useParams<{ slug: string }>();

  // Find category by slug
  const { data: category } = useQuery({
    queryKey: ["category", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("slug", slug!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  // Get subcategory IDs too
  const { data: subCategories } = useQuery({
    queryKey: ["subcategories", category?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("categories")
        .select("id")
        .eq("parent_id", category!.id);
      return data?.map((c) => c.id) || [];
    },
    enabled: !!category?.id,
  });

  const categoryIds = category ? [category.id, ...(subCategories || [])] : [];

  const { data: posts, isLoading } = useQuery({
    queryKey: ["posts", "category-page", slug, categoryIds],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .in("category_id", categoryIds)
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as Post[];
    },
    enabled: categoryIds.length > 0,
  });

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Header />
      <CategoryNav />

      <main className="container mx-auto px-4 mt-6">
        <SectionTitle title={category?.name || slug || "ক্যাটাগরি"} />
        
        {isLoading && <p className="text-center text-muted-foreground py-8">লোড হচ্ছে...</p>}
        
        {!isLoading && (!posts || posts.length === 0) && (
          <p className="text-center text-muted-foreground py-8">এই ক্যাটাগরিতে কোনো পোস্ট নেই</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(posts || []).map((post) => (
            <NewsCard key={post.id} news={post} />
          ))}
        </div>

        <AdSpace size="banner" className="mt-6" />
      </main>

      <Footer />
    </div>
  );
};

export default CategoryPage;
