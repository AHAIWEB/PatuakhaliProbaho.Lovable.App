import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Archive, Globe, Clock, BarChart3 } from "lucide-react";
import ArticleList from "./ArticleList";
import ScraperPanel from "./ScraperPanel";
import SchedulePanel from "./SchedulePanel";
import DashboardPanel from "./DashboardPanel";

interface ArchiveHubProps {
  showHeader?: boolean;
  showDashboard?: boolean;
  showScraper?: boolean;
  showSchedule?: boolean;
  className?: string;
}

const ArchiveHub = ({
  showHeader = true,
  showDashboard = true,
  showScraper = true,
  showSchedule = true,
  className = "",
}: ArchiveHubProps) => {
  const [activeTab, setActiveTab] = useState("articles");

  return (
    <div className={`space-y-4 ${className}`}>
      {showHeader && (
        <div className="flex items-center gap-2 mb-4">
          <Archive className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">আর্কাইভ হাব</h2>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="articles" className="flex items-center gap-1 text-xs">
            <Archive className="h-3.5 w-3.5" />
            আর্টিকেল
          </TabsTrigger>
          {showScraper && (
            <TabsTrigger value="scraper" className="flex items-center gap-1 text-xs">
              <Globe className="h-3.5 w-3.5" />
              স্ক্র্যাপার
            </TabsTrigger>
          )}
          {showSchedule && (
            <TabsTrigger value="schedule" className="flex items-center gap-1 text-xs">
              <Clock className="h-3.5 w-3.5" />
              শিডিউল
            </TabsTrigger>
          )}
          {showDashboard && (
            <TabsTrigger value="dashboard" className="flex items-center gap-1 text-xs">
              <BarChart3 className="h-3.5 w-3.5" />
              ড্যাশবোর্ড
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="articles">
          <ArticleList />
        </TabsContent>
        {showScraper && (
          <TabsContent value="scraper">
            <ScraperPanel />
          </TabsContent>
        )}
        {showSchedule && (
          <TabsContent value="schedule">
            <SchedulePanel />
          </TabsContent>
        )}
        {showDashboard && (
          <TabsContent value="dashboard">
            <DashboardPanel />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default ArchiveHub;
