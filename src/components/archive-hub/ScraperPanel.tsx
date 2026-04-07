import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Globe, Loader2, Sparkles, Copy } from "lucide-react";
import { toast } from "sonner";

const ScraperPanel = () => {
  const [url, setUrl] = useState("");
  const [bulkUrls, setBulkUrls] = useState("");
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [progress, setProgress] = useState(0);
  const qc = useQueryClient();

  const scrapeMutation = useMutation({
    mutationFn: async (targetUrl: string) => {
      const { data, error } = await supabase.functions.invoke("scrape-url", {
        body: { url: targetUrl, save: true },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["archived-articles"] });
      toast.success(`স্ক্র্যাপ সফল: ${data?.title || "আর্টিকেল সেভ হয়েছে"}`);
    },
    onError: (err: any) => toast.error(err.message || "স্ক্র্যাপ ব্যর্থ"),
  });

  const handleSingleScrape = () => {
    if (!url.trim()) return toast.error("URL দিন");
    scrapeMutation.mutate(url.trim());
  };

  const handleBulkScrape = async () => {
    const urls = bulkUrls
      .split("\n")
      .map((u) => u.trim())
      .filter(Boolean);
    if (urls.length === 0) return toast.error("URL দিন");

    setProgress(0);
    for (let i = 0; i < urls.length; i++) {
      try {
        await supabase.functions.invoke("scrape-url", {
          body: { url: urls[i], save: true },
        });
      } catch {}
      setProgress(Math.round(((i + 1) / urls.length) * 100));
    }
    qc.invalidateQueries({ queryKey: ["archived-articles"] });
    toast.success(`${urls.length}টি URL স্ক্র্যাপ সম্পন্ন`);
    setProgress(0);
  };

  const aiProcessMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("ai-process", {
        body: { action: "process_recent" },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["archived-articles"] });
      toast.success("AI প্রসেসিং সম্পন্ন");
    },
    onError: () => toast.error("AI প্রসেসিং ব্যর্থ"),
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Globe className="h-5 w-5" />
          কন্টেন্ট স্ক্র্যাপার
        </CardTitle>
        <div className="flex gap-2 mt-2">
          <Button
            size="sm"
            variant={mode === "single" ? "default" : "outline"}
            onClick={() => setMode("single")}
          >
            একক URL
          </Button>
          <Button
            size="sm"
            variant={mode === "bulk" ? "default" : "outline"}
            onClick={() => setMode("bulk")}
          >
            <Copy className="h-3.5 w-3.5 mr-1" />
            বাল্ক
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => aiProcessMutation.mutate()}
            disabled={aiProcessMutation.isPending}
          >
            <Sparkles className="h-3.5 w-3.5 mr-1" />
            AI প্রসেস
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {mode === "single" ? (
          <div className="flex gap-2">
            <Input
              placeholder="https://example.com/article"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleSingleScrape} disabled={scrapeMutation.isPending}>
              {scrapeMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "স্ক্র্যাপ"
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Textarea
              placeholder="প্রতি লাইনে একটি করে URL দিন..."
              value={bulkUrls}
              onChange={(e) => setBulkUrls(e.target.value)}
              rows={5}
            />
            {progress > 0 && <Progress value={progress} className="h-2" />}
            <Button onClick={handleBulkScrape} disabled={progress > 0} className="w-full">
              {progress > 0 ? `${progress}% সম্পন্ন...` : "বাল্ক স্ক্র্যাপ শুরু"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ScraperPanel;
