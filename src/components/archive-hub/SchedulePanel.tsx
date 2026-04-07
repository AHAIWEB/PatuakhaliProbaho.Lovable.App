import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Clock, Plus, Trash2, Play, Pause } from "lucide-react";
import { toast } from "sonner";

const SchedulePanel = () => {
  const [newUrl, setNewUrl] = useState("");
  const [newInterval, setNewInterval] = useState("24h");
  const qc = useQueryClient();

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ["scrape-schedules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scrape_schedules")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("scrape_schedules").insert({
        url: newUrl.trim(),
        interval: newInterval,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["scrape-schedules"] });
      setNewUrl("");
      toast.success("শিডিউল যোগ হয়েছে");
    },
    onError: () => toast.error("যোগ করতে সমস্যা"),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("scrape_schedules")
        .update({ is_active: !is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["scrape-schedules"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("scrape_schedules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["scrape-schedules"] });
      toast.success("শিডিউল ডিলিট হয়েছে");
    },
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" />
          স্ক্র্যাপিং শিডিউল
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="https://example.com"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            className="flex-1"
          />
          <Select value={newInterval} onValueChange={setNewInterval}>
            <SelectTrigger className="w-full sm:w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">১ ঘণ্টা</SelectItem>
              <SelectItem value="6h">৬ ঘণ্টা</SelectItem>
              <SelectItem value="12h">১২ ঘণ্টা</SelectItem>
              <SelectItem value="24h">২৪ ঘণ্টা</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => addMutation.mutate()} disabled={!newUrl.trim()}>
            <Plus className="h-4 w-4 mr-1" />
            যোগ
          </Button>
        </div>

        {isLoading ? (
          <p className="text-center py-4 text-muted-foreground">লোড হচ্ছে...</p>
        ) : schedules.length === 0 ? (
          <p className="text-center py-4 text-muted-foreground">কোনো শিডিউল নেই</p>
        ) : (
          <div className="space-y-2">
            {schedules.map((s: any) => (
              <div key={s.id} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{s.url}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <Badge variant={s.is_active ? "default" : "secondary"} className="text-[10px]">
                      {s.is_active ? "সক্রিয়" : "নিষ্ক্রিয়"}
                    </Badge>
                    <span>প্রতি {s.interval}</span>
                    {s.last_run && (
                      <span>শেষ: {new Date(s.last_run).toLocaleDateString("bn-BD")}</span>
                    )}
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => toggleMutation.mutate({ id: s.id, is_active: s.is_active })}
                >
                  {s.is_active ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-destructive"
                  onClick={() => deleteMutation.mutate(s.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SchedulePanel;
