import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trash2, ExternalLink, Eye, Search, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const ArticleList = () => {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  const qc = useQueryClient();

  const { data: articles = [], isLoading, refetch } = useQuery({
    queryKey: ["archived-articles", search, categoryFilter],
    queryFn: async () => {
      let q = supabase
        .from("archived_articles")
        .select("*")
        .order("scraped_at", { ascending: false })
        .limit(100);

      if (search) q = q.ilike("title", `%${search}%`);
      if (categoryFilter && categoryFilter !== "all") q = q.eq("category", categoryFilter);

      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["archived-categories"],
    queryFn: async () => {
      const { data } = await supabase
        .from("archived_articles")
        .select("category")
        .not("category", "is", null);
      const unique = [...new Set(data?.map((d) => d.category).filter(Boolean))];
      return unique as string[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("archived_articles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["archived-articles"] });
      toast.success("আর্টিকেল ডিলিট হয়েছে");
    },
    onError: () => toast.error("ডিলিট করতে সমস্যা হয়েছে"),
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">আর্কাইভ করা আর্টিকেল ({articles.length})</CardTitle>
        <div className="flex flex-col sm:flex-row gap-2 mt-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="শিরোনাম খুঁজুন..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="ক্যাটাগরি" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সব ক্যাটাগরি</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-center py-8 text-muted-foreground">লোড হচ্ছে...</p>
        ) : articles.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">কোনো আর্টিকেল নেই</p>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {articles.map((article: any) => (
              <div
                key={article.id}
                className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                {article.featured_image && (
                  <img
                    src={article.featured_image}
                    alt=""
                    className="w-16 h-12 object-cover rounded flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm line-clamp-2">{article.title}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    {article.category && <Badge variant="secondary" className="text-[10px]">{article.category}</Badge>}
                    {article.author && <span>{article.author}</span>}
                    <span>{new Date(article.scraped_at).toLocaleDateString("bn-BD")}</span>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setSelectedArticle(article)}>
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  {article.source_url && (
                    <Button size="icon" variant="ghost" className="h-7 w-7" asChild>
                      <a href={article.source_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive"
                    onClick={() => deleteMutation.mutate(article.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={!!selectedArticle} onOpenChange={() => setSelectedArticle(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedArticle?.title}</DialogTitle>
          </DialogHeader>
          {selectedArticle?.featured_image && (
            <img src={selectedArticle.featured_image} alt="" className="w-full h-48 object-cover rounded" />
          )}
          <div
            className="prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: selectedArticle?.html_content || selectedArticle?.content || "কন্টেন্ট নেই" }}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ArticleList;
