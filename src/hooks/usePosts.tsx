import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useEffect } from "react";

export type Post = Tables<"posts">;

const POSTS_REFRESH_MS = 60_000;

const mergeUniquePosts = (limit: number, ...groups: Array<Post[] | null | undefined>) => {
  const ids = new Set<string>();
  const merged: Post[] = [];

  for (const group of groups) {
    for (const post of group ?? []) {
      if (!ids.has(post.id) && merged.length < limit) {
        ids.add(post.id);
        merged.push(post);
      }
    }
  }

  return merged;
};

// Realtime hook - invalidates all post queries when posts change
export const usePostsRealtime = () => {
  const queryClient = useQueryClient();
  useEffect(() => {
    const refreshPosts = () => {
      queryClient.invalidateQueries({ queryKey: ["posts"], refetchType: "active" });
    };

    const channel = supabase
      .channel("posts-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, refreshPosts)
      .subscribe();

    const intervalId = window.setInterval(refreshPosts, POSTS_REFRESH_MS);

    return () => {
      window.clearInterval(intervalId);
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};

export const useFeaturedPosts = () =>
  useQuery({
    queryKey: ["posts", "featured"],
    queryFn: async () => {
      const { data: nationalLeadPosts, error: nationalLeadError } = await supabase
        .from("posts")
        .select("*")
        .eq("status", "published")
        .is("division", null)
        .not("image_url", "is", null)
        .order("published_at", { ascending: false })
        .limit(8);
      if (nationalLeadError) throw nationalLeadError;

      const { data: featuredPosts, error: featuredError } = await supabase
        .from("posts")
        .select("*")
        .eq("is_featured", true)
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(8);
      if (featuredError) throw featuredError;

      const { data: autoPosts, error: autoErr } = await supabase
        .from("posts")
        .select("*")
        .eq("status", "published")
        .not("image_url", "is", null)
        .order("published_at", { ascending: false })
        .limit(8);
      if (autoErr) throw autoErr;

      return mergeUniquePosts(8, nationalLeadPosts, featuredPosts, autoPosts);
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
    enabled: !!division && limit > 0,
  });

export const usePostsByCategory = (categoryId: string, limit = 10) =>
  useQuery({
    queryKey: ["posts", "category", categoryId, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("category_id", categoryId)
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data;
    },
    enabled: !!categoryId && limit > 0,
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
    enabled: limit > 0,
  });

export const useNationalPosts = (limit = 10) =>
  useQuery({
    queryKey: ["posts", "national", limit],
    queryFn: async () => {
      const { data: nationalCategory, error: categoryError } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", "national")
        .maybeSingle();
      if (categoryError) throw categoryError;

      let categoryPosts: Post[] = [];

      if (nationalCategory?.id) {
        const { data, error } = await supabase
          .from("posts")
          .select("*")
          .eq("status", "published")
          .is("division", null)
          .eq("category_id", nationalCategory.id)
          .order("published_at", { ascending: false })
          .limit(limit);

        if (error) throw error;
        categoryPosts = data ?? [];
      }

      if (categoryPosts.length >= limit) {
        return categoryPosts;
      }

      const { data: sourceCategoryPosts, error: sourceCategoryError } = await supabase
        .from("posts")
        .select("*")
        .eq("status", "published")
        .is("division", null)
        .in("source_category", ["national", "country", "Bangladesh", "bangladesh"])
        .order("published_at", { ascending: false })
        .limit(limit);
      if (sourceCategoryError) throw sourceCategoryError;

      const mergedNational = mergeUniquePosts(limit, categoryPosts, sourceCategoryPosts);
      if (mergedNational.length >= limit) {
        return mergedNational;
      }

      const { data: fallback, error: fallbackError } = await supabase
        .from("posts")
        .select("*")
        .eq("status", "published")
        .is("division", null)
        .order("published_at", { ascending: false })
        .limit(limit);
      if (fallbackError) throw fallbackError;

      return mergeUniquePosts(limit, mergedNational, fallback);
    },
    enabled: limit > 0,
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
    refetchInterval: POSTS_REFRESH_MS,
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
    enabled: limit > 0,
  });
