import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, FileText, Globe, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const DashboardPanel = () => {
  const { data: stats } = useQuery({
    queryKey: ["archive-stats"],
    queryFn: async () => {
      const [articles, schedules] = await Promise.all([
        supabase.from("archived_articles").select("id, category, scraped_at", { count: "exact" }),
        supabase.from("scrape_schedules").select("id, is_active", { count: "exact" }),
      ]);

      const categoryMap: Record<string, number> = {};
      articles.data?.forEach((a: any) => {
        const cat = a.category || "অন্যান্য";
        categoryMap[cat] = (categoryMap[cat] || 0) + 1;
      });

      const chartData = Object.entries(categoryMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

      return {
        totalArticles: articles.count || 0,
        totalSchedules: schedules.count || 0,
        activeSchedules: schedules.data?.filter((s: any) => s.is_active).length || 0,
        chartData,
      };
    },
  });

  const statCards = [
    { icon: FileText, label: "মোট আর্টিকেল", value: stats?.totalArticles || 0, color: "text-blue-500" },
    { icon: Globe, label: "মোট শিডিউল", value: stats?.totalSchedules || 0, color: "text-green-500" },
    { icon: Clock, label: "সক্রিয় শিডিউল", value: stats?.activeSchedules || 0, color: "text-orange-500" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 text-center">
              <s.icon className={`h-6 w-6 mx-auto mb-1 ${s.color}`} />
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {stats?.chartData && stats.chartData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              ক্যাটাগরি অনুযায়ী আর্টিকেল
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.chartData}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DashboardPanel;
