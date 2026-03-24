import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LayoutSetting {
  id: string;
  section_key: string;
  section_label: string;
  post_count: number;
  is_visible: boolean;
  sort_order: number;
  updated_at: string;
}

export const useLayoutSettings = () =>
  useQuery({
    queryKey: ["layout_settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("layout_settings")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as LayoutSetting[];
    },
    staleTime: 60000,
  });

export const useUpdateLayoutSetting = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, post_count, is_visible }: { id: string; post_count?: number; is_visible?: boolean }) => {
      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (post_count !== undefined) updates.post_count = post_count;
      if (is_visible !== undefined) updates.is_visible = is_visible;
      const { error } = await supabase.from("layout_settings").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["layout_settings"] }),
  });
};

export const getSectionCount = (settings: LayoutSetting[], key: string, fallback = 5) => {
  const s = settings.find((s) => s.section_key === key);
  return s?.is_visible !== false ? (s?.post_count ?? fallback) : 0;
};
