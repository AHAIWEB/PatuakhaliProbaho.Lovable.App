import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Post = Tables<"posts">;

export const useFeaturedPosts = () =>
  useQuery({
    queryKey: ["posts", "featured"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("is_featured", true)
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(8);
      if (error) throw error;
      return data;
    },
  });

export const useHighlightedPosts = () =>
  useQuery({
    queryKey: ["posts", "highlighted"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("is_highlighted", true)
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data;
    },
  });

export const usePostsByDivision = (division: string, limit = 10) =>
  useQuery({
    queryKey: ["posts", "division", division, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("division", division)
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data;
    },
  });

export const usePostsByCategory = (category: string, limit = 10) =>
  useQuery({
    queryKey: ["posts", "category", category, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data;
    },
  });

export const useLatestPosts = (limit = 20) =>
  useQuery({
    queryKey: ["posts", "latest", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data;
    },
  });

export const useNationalPosts = (limit = 10) =>
  useQuery({
    queryKey: ["posts", "national", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*, rss_feeds!posts_rss_feed_id_fkey(category)")
        .eq("status", "published")
        .not("division", "is", null)
        .is("division", null)
        .order("published_at", { ascending: false })
        .limit(limit);
      // Fallback: just get latest posts without division
      const { data: fallback, error: err2 } = await supabase
        .from("posts")
        .select("*")
        .eq("status", "published")
        .is("division", null)
        .order("published_at", { ascending: false })
        .limit(limit);
      if (err2) throw err2;
      return fallback;
    },
  });

export const useTickerHeadlines = () =>
  useQuery({
    queryKey: ["posts", "ticker"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("id, title, source_url")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    refetchInterval: 60000,
  });

export const useMostViewedPosts = (limit = 5) =>
  useQuery({
    queryKey: ["posts", "mostViewed", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("status", "published")
        .order("views", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data;
    },
  });
