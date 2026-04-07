import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Star, Trash2, Edit, Plus, Rss, Newspaper, Tag, RefreshCw, Highlighter, Link2, Save, X, Search, Camera, Globe, ExternalLink, Share2, ArrowUp, ArrowDown, GripVertical, Settings2, Eye, EyeOff, Minus, Upload, Image, Send, Database, Archive, MapPin } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { useSiteSetting, useUpdateSiteSetting } from "@/hooks/useSiteSettings";
import type { Tables } from "@/integrations/supabase/types";
import { cleanText } from "@/lib/content";
import { useLayoutSettings, useUpdateLayoutSetting } from "@/hooks/useLayoutSettings";

type Post = Tables<"posts">;
type RSSFeed = Tables<"rss_feeds">;
type Category = Tables<"categories">;

const Admin = () => {
  const { user, userRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [feeds, setFeeds] = useState<RSSFeed[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [scrapeSources, setScrapeSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Quick post form
  const [quickUrl, setQuickUrl] = useState("");
  const [quickTitle, setQuickTitle] = useState("");
  const [quickContent, setQuickContent] = useState("");
  const [quickImage, setQuickImage] = useState("");
  const [quickCategory, setQuickCategory] = useState("");
  const [quickTags, setQuickTags] = useState("");
  const [urlFetching, setUrlFetching] = useState(false);
  const [quickSummary, setQuickSummary] = useState("");

  // RSS feed form
  const [feedUrl, setFeedUrl] = useState("");
  const [feedName, setFeedName] = useState("");
  const [feedDivision, setFeedDivision] = useState("");
  const [feedCategory, setFeedCategory] = useState("general");
  const [feedDistrict, setFeedDistrict] = useState("");
  const [feedUpazila, setFeedUpazila] = useState("");

  // Scrape source form
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [scrapeName, setScrapeName] = useState("");
  const [scrapeDivision, setScrapeDivision] = useState("");
  const [scrapeDistrict, setScrapeDistrict] = useState("");
  const [scrapeUpazila, setScrapeUpazila] = useState("");
  const [scrapeCategory, setScrapeCategory] = useState("general");
  const [scrapeInterval, setScrapeInterval] = useState("30");
  const [scrapeArticleSelector, setScrapeArticleSelector] = useState("");
  const [scrapeTitleSelector, setScrapeTitleSelector] = useState("");
  const [scrapeImageSelector, setScrapeImageSelector] = useState("");
  const [scrapeLinkSelector, setScrapeLinkSelector] = useState("");
  const [newCatName, setNewCatName] = useState("");
  const [newCatSlug, setNewCatSlug] = useState("");
  const [newCatParent, setNewCatParent] = useState("");

  // Edit post
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editDivision, setEditDivision] = useState("");
  const [editDistrict, setEditDistrict] = useState("");
  const [editUpazila, setEditUpazila] = useState("");
  const [editTags, setEditTags] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  // Manual post form states
  const [quickDivision, setQuickDivision] = useState("");
  const [quickDistrict, setQuickDistrict] = useState("");
  const [quickUpazila, setQuickUpazila] = useState("");

  // Edit category
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [editCatName, setEditCatName] = useState("");
  const [editCatSlug, setEditCatSlug] = useState("");
  const [editCatParent, setEditCatParent] = useState("");

  // Post search/filter
  const [postSearch, setPostSearch] = useState("");
  const [showMobileActions, setShowMobileActions] = useState(false);
  const [postPage, setPostPage] = useState(0);
  const [postDateFilter, setPostDateFilter] = useState("");
  const [postSourceFilter, setPostSourceFilter] = useState<"all" | "rss" | "scraper" | "manual">("all");
  const postsPerPage = 50;

  // RSS fetch progress
  const [fetchProgress, setFetchProgress] = useState("");

  useEffect(() => {
    if (!authLoading && (!user || !["admin", "editor", "reporter"].includes(userRole || ""))) {
      navigate("/auth");
      return;
    }
    if (user) fetchData();
  }, [user, userRole, authLoading]);

  const fetchData = async () => {
    const [postsRes, feedsRes, catsRes, scrapeRes] = await Promise.all([
      supabase.from("posts").select("*").order("published_at", { ascending: false }).limit(200),
      supabase.from("rss_feeds").select("*").order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("sort_order"),
      supabase.from("scrape_sources").select("*").order("created_at", { ascending: false }),
    ]);
    if (postsRes.data) setPosts(postsRes.data);
    if (feedsRes.data) setFeeds(feedsRes.data);
    if (catsRes.data) setCategories(catsRes.data);
    if (scrapeRes.data) setScrapeSources(scrapeRes.data);
  };

  const handleFetchUrl = async () => {
    if (!quickUrl) return;
    setUrlFetching(true);
    try {
      const { data, error } = await supabase.functions.invoke("scrape-url", { body: { url: quickUrl, fullContent: true } });
      if (error) throw error;
      if (data?.title) setQuickTitle(data.title);
      if (data?.content) setQuickContent(data.content);
      else if (data?.description) setQuickContent(data.description);
      if (data?.image) setQuickImage(data.image);
      if (data?.summary) setQuickSummary(data.summary);
      if (data?.category && !quickCategory) {
        const matchedCat = categories.find(c => c.slug.toLowerCase() === data.category.toLowerCase());
        if (matchedCat) setQuickCategory(matchedCat.id);
      }
      if (data?.tags?.length && !quickTags) setQuickTags(data.tags.join(", "));
      toast({ title: "সফল", description: `"${data?.siteName || 'সাইট'}" থেকে ফেচ হয়েছে` });
    } catch (e: any) {
      toast({ title: "ত্রুটি", description: e.message || "URL ফেচ ব্যর্থ", variant: "destructive" });
    }
    setUrlFetching(false);
  };

  const handleImageUpload = async (file: File): Promise<string | null> => {
    setUploadingImage(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `post-images/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
      const { error } = await supabase.storage.from("site-assets").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("site-assets").getPublicUrl(path);
      return urlData.publicUrl;
    } catch (err: any) {
      toast({ title: "ইমেজ আপলোড ব্যর্থ", description: err.message, variant: "destructive" });
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleQuickPost = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const slug = quickTitle.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, "").replace(/\s+/g, "-").substring(0, 100) + "-" + Date.now().toString(36);
    const { error } = await supabase.from("posts").insert({
      title: quickTitle, slug, content: quickContent, excerpt: (quickSummary || quickContent).substring(0, 200),
      image_url: quickImage || null, source_url: quickUrl || null, category_id: quickCategory || null,
      tags: quickTags ? quickTags.split(",").map((t) => t.trim()) : [], status: "published", author_id: user!.id,
      division: quickDivision || null, district: quickDistrict || null, upazila: quickUpazila || null,
    });
    if (error) {
      toast({ title: "ত্রুটি", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "সফল", description: "পোস্ট প্রকাশিত হয়েছে" });
      setQuickTitle(""); setQuickContent(""); setQuickImage(""); setQuickUrl(""); setQuickTags(""); setQuickCategory(""); setQuickSummary("");
      setQuickDivision(""); setQuickDistrict(""); setQuickUpazila("");
      fetchData();
    }
    setLoading(false);
  };

  const handleAddFeed = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("rss_feeds").insert({
      url: feedUrl, name: feedName, division: feedDivision || null, category: feedCategory,
      district: feedDistrict || null, upazila: feedUpazila || null,
    });
    if (error) {
      toast({ title: "ত্রুটি", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "সফল", description: "RSS ফিড যুক্ত হয়েছে" });
      setFeedUrl(""); setFeedName(""); setFeedDivision(""); setFeedDistrict(""); setFeedUpazila("");
      fetchData();
    }
  };

  const handleFetchRSS = async () => {
    setLoading(true);
    let totalFetched = 0;
    let offset = 0;
    const batchSize = 15;
    for (let batch = 0; batch < 15; batch++) {
      setFetchProgress(`ব্যাচ ${batch + 1} প্রসেসিং... (${totalFetched} নিউজ ফেচ হয়েছে)`);
      const { data, error } = await supabase.functions.invoke("fetch-rss", { body: { batchSize, offset } });
      if (error) { toast({ title: "ত্রুটি", description: error.message, variant: "destructive" }); break; }
      totalFetched += data?.fetched || 0;
      offset = data?.nextOffset || offset + batchSize;
      if ((data?.processedFeeds || 0) < batchSize) break;
    }
    setFetchProgress("");
    toast({ title: "সফল", description: `মোট ${totalFetched}টি নিউজ ফেচ হয়েছে` });
    fetchData();
    setLoading(false);
  };

  const [backfillProgress, setBackfillProgress] = useState("");
  const [backfillStats, setBackfillStats] = useState<{ updated: number; total: number; running: boolean }>({ updated: 0, total: 0, running: false });

  const handleBackfill = async () => {
    setLoading(true);
    setBackfillStats({ updated: 0, total: 0, running: true });
    setBackfillProgress("ব্যাকফিল শুরু হচ্ছে...");
    let totalUpdated = 0;
    let totalChecked = 0;
    try {
      // Run multiple batches
      for (let batch = 0; batch < 5; batch++) {
        setBackfillProgress(`ব্যাচ ${batch + 1}/5 প্রসেসিং...`);
        const { data, error } = await supabase.functions.invoke("backfill-content");
        if (error) throw error;
        totalUpdated += data?.updated || 0;
        totalChecked += data?.total_checked || 0;
        setBackfillStats({ updated: totalUpdated, total: totalChecked, running: true });
        if ((data?.updated || 0) === 0) break; // No more to process
      }
      setBackfillProgress("");
      setBackfillStats({ updated: totalUpdated, total: totalChecked, running: false });
      toast({
        title: "সফল",
        description: `${totalUpdated}টি পোস্ট আপডেট হয়েছে (${totalChecked}টি চেক করা হয়েছে)`,
      });
      fetchData();
    } catch (e: any) {
      toast({ title: "ত্রুটি", description: e.message, variant: "destructive" });
      setBackfillProgress("");
      setBackfillStats(prev => ({ ...prev, running: false }));
    }
    setLoading(false);
  };

  const toggleFeatured = async (post: Post) => {
    await supabase.from("posts").update({ is_featured: !post.is_featured }).eq("id", post.id);
    fetchData();
  };

  const toggleHighlighted = async (post: Post) => {
    const highlightExpires = !post.is_highlighted
      ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null;
    await supabase.from("posts").update({
      is_highlighted: !post.is_highlighted, highlight_expires_at: highlightExpires,
    }).eq("id", post.id);
    fetchData();
  };

  const deletePost = async (id: string) => {
    if (!confirm("এই পোস্ট মুছে ফেলতে চান?")) return;
    await supabase.from("posts").delete().eq("id", id);
    fetchData();
  };

  const deleteFeed = async (id: string) => {
    await supabase.from("rss_feeds").delete().eq("id", id);
    fetchData();
  };

  const handleAddScrapeSource = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("scrape_sources").insert({
      url: scrapeUrl, name: scrapeName, division: scrapeDivision || null,
      district: scrapeDistrict || null, upazila: scrapeUpazila || null,
      category: scrapeCategory, scrape_interval_minutes: parseInt(scrapeInterval) || 30,
      selector_config: (scrapeArticleSelector || scrapeTitleSelector || scrapeImageSelector || scrapeLinkSelector) ? {
        article: scrapeArticleSelector || null, title: scrapeTitleSelector || null,
        image: scrapeImageSelector || null, link: scrapeLinkSelector || null,
      } : {},
    } as any);
    if (error) {
      toast({ title: "ত্রুটি", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "সফল", description: "স্ক্র্যাপ সোর্স যুক্ত হয়েছে" });
      setScrapeUrl(""); setScrapeName(""); setScrapeDivision(""); setScrapeDistrict(""); setScrapeUpazila("");
      setScrapeArticleSelector(""); setScrapeTitleSelector(""); setScrapeImageSelector(""); setScrapeLinkSelector("");
      fetchData();
    }
  };

  const deleteScrapeSource = async (id: string) => {
    await supabase.from("scrape_sources").delete().eq("id", id);
    fetchData();
  };

  const handleManualScrape = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("auto-scrape");
    if (error) {
      toast({ title: "ত্রুটি", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "সফল", description: `${data?.scraped || 0}টি নিউজ স্ক্র্যাপ হয়েছে` });
      fetchData();
    }
    setLoading(false);
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const maxSort = categories.reduce((m, c) => Math.max(m, c.sort_order || 0), 0);
    const { error } = await supabase.from("categories").insert({
      name: newCatName, slug: newCatSlug, parent_id: newCatParent || null, sort_order: maxSort + 1,
    });
    if (error) {
      toast({ title: "ত্রুটি", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "সফল", description: "ক্যাটাগরি যুক্ত হয়েছে" });
      setNewCatName(""); setNewCatSlug(""); setNewCatParent("");
      fetchData();
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm("এই ক্যাটাগরি মুছে ফেলতে চান?")) return;
    await supabase.from("categories").delete().eq("id", id);
    fetchData();
  };

  const startEditCategory = (cat: Category) => {
    setEditingCat(cat);
    setEditCatName(cat.name);
    setEditCatSlug(cat.slug);
    setEditCatParent(cat.parent_id || "");
  };

  const saveEditCategory = async () => {
    if (!editingCat) return;
    const { error } = await supabase.from("categories").update({
      name: editCatName, slug: editCatSlug, parent_id: editCatParent || null,
    }).eq("id", editingCat.id);
    if (error) {
      toast({ title: "ত্রুটি", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "সফল", description: "ক্যাটাগরি আপডেট হয়েছে" });
      setEditingCat(null);
      fetchData();
    }
  };

  const moveCategoryOrder = async (cat: Category, direction: "up" | "down") => {
    const sameLevel = categories.filter(c => c.parent_id === cat.parent_id).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    const idx = sameLevel.findIndex(c => c.id === cat.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sameLevel.length) return;
    const other = sameLevel[swapIdx];
    await Promise.all([
      supabase.from("categories").update({ sort_order: other.sort_order }).eq("id", cat.id),
      supabase.from("categories").update({ sort_order: cat.sort_order }).eq("id", other.id),
    ]);
    fetchData();
  };

  const startEdit = (post: Post) => {
    setEditingPost(post);
    setEditTitle(post.title);
    setEditCategory(post.category_id || "");
    setEditContent(post.content || "");
    setEditImageUrl(post.image_url || "");
    setEditDivision(post.division || "");
    setEditDistrict(post.district || "");
    setEditUpazila(post.upazila || "");
    setEditTags((post.tags || []).join(", "));
  };

  const saveEdit = async () => {
    if (!editingPost) return;
    const { error } = await supabase.from("posts").update({
      title: editTitle, category_id: editCategory || null, content: editContent,
      excerpt: cleanText(editContent).substring(0, 200),
      image_url: editImageUrl || null,
      division: editDivision || null, district: editDistrict || null, upazila: editUpazila || null,
      tags: editTags ? editTags.split(",").map(t => t.trim()) : [],
    }).eq("id", editingPost.id);
    if (error) {
      toast({ title: "ত্রুটি", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "সফল", description: "পোস্ট আপডেট হয়েছে" });
      setEditingPost(null);
      fetchData();
    }
  };

  const quickAssignCategory = async (postId: string, categoryId: string) => {
    await supabase.from("posts").update({ category_id: categoryId || null }).eq("id", postId);
    fetchData();
  };

  // Share to Blogger with image + summary + source link
  const shareToBlogger = (post: Post) => {
    const sourceUrl = post.source_url || `${window.location.origin}/post/${post.slug}`;
    const summary = cleanText(post.content || post.excerpt || post.title).substring(0, 500);
    const blogContent = `${post.image_url ? `<div style="text-align:center;margin-bottom:16px"><img src="${post.image_url}" alt="${cleanText(post.title)}" style="max-width:100%;border-radius:8px" /></div>` : ""}
<p>${summary}...</p>
<p style="text-align:center;margin-top:20px"><a href="${sourceUrl}" target="_blank" style="background:#c0392b;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:bold">বিস্তারিত পড়ুন →</a></p>`;
    const bloggerUrl = `https://www.blogger.com/blog-this.g?n=${encodeURIComponent(cleanText(post.title))}&b=${encodeURIComponent(blogContent)}&t=${encodeURIComponent(cleanText(post.title))}&eurl=${encodeURIComponent(sourceUrl)}`;
    window.open(bloggerUrl, "_blank", "width=700,height=500");
  };

  // Share post link
  const sharePost = (post: Post) => {
    const url = `${window.location.origin}/post/${post.slug}`;
    if (navigator.share) {
      navigator.share({ title: post.title, url });
    } else {
      navigator.clipboard.writeText(url);
      toast({ title: "লিংক কপি হয়েছে" });
    }
  };

  // Share to Social Media (Telegram + Facebook)
  const shareToSocial = async (post: Post, platforms: string[]) => {
    const url = post.source_url || `${window.location.origin}/post/${post.slug}`;
    try {
      const { data, error } = await supabase.functions.invoke("social-post", {
        body: { title: post.title, url, image_url: post.image_url, platforms },
      });
      if (error) throw error;
      const results = data?.results || {};
      const msgs = Object.entries(results).map(([p, r]: [string, any]) => `${p}: ${r.success ? "✅" : "❌ " + r.error}`);
      toast({ title: "সোশাল শেয়ার", description: msgs.join("\n") });
    } catch (e: any) {
      toast({ title: "শেয়ার ব্যর্থ", description: e.message, variant: "destructive" });
    }
  };

  // Go to PhotoCard with post data
  const goToPhotoCard = (post: Post) => {
    const params = new URLSearchParams({
      title: post.title,
      image: post.image_url || "",
      quote: cleanText(post.content || post.excerpt || "").substring(0, 150),
      source: post.source_url || "",
    });
    navigate(`/photo-card?${params.toString()}`);
  };

  // Filter posts
  const filteredPosts = posts.filter((p) => {
    const matchSearch = !postSearch || p.title.toLowerCase().includes(postSearch.toLowerCase()) ||
      (p.source_name || "").toLowerCase().includes(postSearch.toLowerCase());
    const matchDate = !postDateFilter || (p.published_at && p.published_at.startsWith(postDateFilter));
    let matchSource = true;
    if (postSourceFilter === "rss") matchSource = !!p.rss_feed_id;
    else if (postSourceFilter === "scraper") matchSource = !p.rss_feed_id && !!p.source_name && !p.author_id;
    else if (postSourceFilter === "manual") matchSource = !!p.author_id;
    return matchSearch && matchDate && matchSource;
  });
  const pagedPosts = filteredPosts.slice(postPage * postsPerPage, (postPage + 1) * postsPerPage);

  // District/Upazila data
  const divisionDistricts: Record<string, { name: string; upazilas: string[] }[]> = {
    barisal: [
      { name: "বরিশাল", upazilas: ["বরিশাল সদর", "বাবুগঞ্জ", "বাকেরগঞ্জ", "বানারীপাড়া", "গৌরনদী", "আগৈলঝাড়া", "মেহেন্দিগঞ্জ", "মুলাদী", "হিজলা", "উজিরপুর"] },
      { name: "পটুয়াখালী", upazilas: ["পটুয়াখালী সদর", "বাউফল", "দশমিনা", "দুমকি", "গলাচিপা", "কলাপাড়া", "মির্জাগঞ্জ", "রাঙ্গাবালী"] },
      { name: "ভোলা", upazilas: ["ভোলা সদর", "বোরহানউদ্দিন", "চরফ্যাশন", "দৌলতখান", "লালমোহন", "মনপুরা", "তজুমুদ্দিন"] },
      { name: "পিরোজপুর", upazilas: ["পিরোজপুর সদর", "ভাণ্ডারিয়া", "কাউখালী", "মঠবাড়িয়া", "নাজিরপুর", "নেছারাবাদ", "ইন্দুরকানী"] },
      { name: "ঝালকাঠি", upazilas: ["ঝালকাঠি সদর", "কাঠালিয়া", "নলছিটি", "রাজাপুর"] },
      { name: "বরগুনা", upazilas: ["বরগুনা সদর", "আমতলী", "বামনা", "বেতাগী", "পাথরঘাটা", "তালতলী"] },
    ],
    dhaka: [
      { name: "ঢাকা", upazilas: ["ঢাকা সদর", "সাভার", "ধামরাই", "কেরানীগঞ্জ", "নবাবগঞ্জ", "দোহার"] },
      { name: "গাজীপুর", upazilas: ["গাজীপুর সদর", "কালীগঞ্জ", "কালিয়াকৈর", "কাপাসিয়া", "শ্রীপুর"] },
      { name: "নারায়ণগঞ্জ", upazilas: ["নারায়ণগঞ্জ সদর", "আড়াইহাজার", "বন্দর", "রূপগঞ্জ", "সোনারগাঁ"] },
      { name: "মানিকগঞ্জ", upazilas: ["মানিকগঞ্জ সদর", "ঘিওর", "হরিরামপুর", "সাটুরিয়া", "শিবালয়", "সিংগাইর", "দৌলতপুর"] },
    ],
    chittagong: [
      { name: "চট্টগ্রাম", upazilas: ["চট্টগ্রাম সদর", "সীতাকুণ্ড", "মিরসরাই", "পটিয়া", "সন্দ্বীপ", "বাঁশখালী", "আনোয়ারা"] },
      { name: "কক্সবাজার", upazilas: ["কক্সবাজার সদর", "চকরিয়া", "কুতুবদিয়া", "মহেশখালী", "রামু", "টেকনাফ", "উখিয়া", "পেকুয়া"] },
      { name: "কুমিল্লা", upazilas: ["কুমিল্লা সদর", "দেবিদ্বার", "বরুড়া", "চান্দিনা", "চৌদ্দগ্রাম", "দাউদকান্দি", "হোমনা", "লাকসাম"] },
    ],
    sylhet: [
      { name: "সিলেট", upazilas: ["সিলেট সদর", "বিশ্বনাথ", "গোলাপগঞ্জ", "জৈন্তাপুর", "কোম্পানীগঞ্জ"] },
      { name: "মৌলভীবাজার", upazilas: ["মৌলভীবাজার সদর", "কমলগঞ্জ", "কুলাউড়া", "রাজনগর", "শ্রীমঙ্গল", "বড়লেখা", "জুড়ী"] },
      { name: "হবিগঞ্জ", upazilas: ["হবিগঞ্জ সদর", "বাহুবল", "চুনারুঘাট", "লাখাই", "মাধবপুর", "নবীগঞ্জ"] },
    ],
    rajshahi: [
      { name: "রাজশাহী", upazilas: ["রাজশাহী সদর", "বাগমারা", "চারঘাট", "দুর্গাপুর", "গোদাগাড়ী", "মোহনপুর", "পবা", "পুঠিয়া", "তানোর"] },
      { name: "বগুড়া", upazilas: ["বগুড়া সদর", "আদমদিঘী", "দুপচাঁচিয়া", "গাবতলী", "কাহালু", "নন্দীগ্রাম", "সারিয়াকান্দি", "শাজাহানপুর", "শেরপুর", "শিবগঞ্জ", "সোনাতলা"] },
    ],
    rangpur: [
      { name: "রংপুর", upazilas: ["রংপুর সদর", "বদরগঞ্জ", "গঙ্গাচড়া", "কাউনিয়া", "মিঠাপুকুর", "পীরগঞ্জ", "পীরগাছা", "তারাগঞ্জ"] },
      { name: "দিনাজপুর", upazilas: ["দিনাজপুর সদর", "বিরামপুর", "বীরগঞ্জ", "বোচাগঞ্জ", "চিরিরবন্দর", "ফুলবাড়ী", "ঘোড়াঘাট", "হাকিমপুর"] },
    ],
    khulna: [
      { name: "খুলনা", upazilas: ["খুলনা সদর", "বটিয়াঘাটা", "ডুমুরিয়া", "দীঘলিয়া", "কয়রা", "পাইকগাছা", "ফুলতলা", "রূপসা", "তেরখাদা"] },
      { name: "যশোর", upazilas: ["যশোর সদর", "অভয়নগর", "বাঘারপাড়া", "চৌগাছা", "ঝিকরগাছা", "কেশবপুর", "মণিরামপুর", "শার্শা"] },
    ],
    mymensingh: [
      { name: "ময়মনসিংহ", upazilas: ["ময়মনসিংহ সদর", "ভালুকা", "ফুলবাড়ীয়া", "গফরগাঁও", "গৌরীপুর", "হালুয়াঘাট", "ঈশ্বরগঞ্জ", "মুক্তাগাছা", "নান্দাইল", "ত্রিশাল"] },
      { name: "জামালপুর", upazilas: ["জামালপুর সদর", "বকশীগঞ্জ", "দেওয়ানগঞ্জ", "ইসলামপুর", "মাদারগঞ্জ", "মেলান্দহ", "সরিষাবাড়ী"] },
    ],
  };

  const currentDistricts = feedDivision ? divisionDistricts[feedDivision] || [] : [];
  const currentUpazilas = feedDistrict ? currentDistricts.find((d) => d.name === feedDistrict)?.upazilas || [] : [];
  const scrapeDistricts = scrapeDivision ? divisionDistricts[scrapeDivision] || [] : [];
  const scrapeUpazilasList = scrapeDistrict ? scrapeDistricts.find((d) => d.name === scrapeDistrict)?.upazilas || [] : [];
  const quickDistricts = quickDivision ? divisionDistricts[quickDivision] || [] : [];
  const quickUpazilas = quickDistrict ? quickDistricts.find((d) => d.name === quickDistrict)?.upazilas || [] : [];
  const editDistricts = editDivision ? divisionDistricts[editDivision] || [] : [];
  const editUpazilas = editDistrict ? editDistricts.find((d) => d.name === editDistrict)?.upazilas || [] : [];

  if (authLoading) return <div className="flex items-center justify-center min-h-screen">লোড হচ্ছে...</div>;

  const rssPostCount = posts.filter(p => !!p.rss_feed_id).length;
  const scraperPostCount = posts.filter(p => !p.rss_feed_id && !!p.source_name && !p.author_id).length;
  const manualPostCount = posts.filter(p => !!p.author_id).length;

  // Sorted categories for display
  const parentCats = categories.filter(c => !c.parent_id).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const getSubCats = (pid: string) => categories.filter(c => c.parent_id === pid).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));



  return (
    <div className="min-h-screen bg-muted/30 pb-16 sm:pb-0">
      {/* Sticky header */}
      <div className="bg-primary text-primary-foreground p-3 sm:p-4 sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between gap-2">
          <h1 className="text-base sm:text-xl font-bold truncate">📋 এডমিন</h1>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <span className="text-[10px] sm:text-sm opacity-80 hidden sm:inline">{userRole}</span>
            <Button variant="secondary" size="sm" onClick={() => navigate("/archive")} className="h-7 sm:h-9 text-xs sm:text-sm px-2 sm:px-3">
              <Archive className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline ml-1">আর্কাইভ</span>
            </Button>
            <Button variant="secondary" size="sm" onClick={() => navigate("/photo-card")} className="h-7 sm:h-9 text-xs sm:text-sm px-2 sm:px-3">
              <Camera className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline ml-1">ফটোকার্ড</span>
            </Button>
            <Button variant="secondary" size="sm" onClick={() => navigate("/")} className="h-7 sm:h-9 text-xs sm:text-sm px-2 sm:px-3">
              🏠<span className="hidden sm:inline ml-1">হোম</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile floating bottom nav */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg">
        <div className="flex items-center justify-around py-1.5 px-2">
          <button onClick={() => { const el = document.querySelector('[data-value="quick-post"]') as HTMLElement; el?.click(); }} className="flex flex-col items-center gap-0.5 text-[9px] text-muted-foreground active:text-accent">
            <Plus className="w-4 h-4" /><span>পোস্ট</span>
          </button>
          <button onClick={() => { const el = document.querySelector('[data-value="posts"]') as HTMLElement; el?.click(); }} className="flex flex-col items-center gap-0.5 text-[9px] text-muted-foreground active:text-accent">
            <Newspaper className="w-4 h-4" /><span>সকল</span>
          </button>
          <button onClick={() => { const el = document.querySelector('[data-value="rss"]') as HTMLElement; el?.click(); }} className="flex flex-col items-center gap-0.5 text-[9px] text-muted-foreground active:text-accent">
            <Rss className="w-4 h-4" /><span>RSS</span>
          </button>
          <button onClick={() => navigate("/photo-card")} className="flex flex-col items-center gap-0.5 text-[9px] text-muted-foreground active:text-accent">
            <Camera className="w-4 h-4" /><span>কার্ড</span>
          </button>
          <button onClick={() => setShowMobileActions(!showMobileActions)} className="flex flex-col items-center gap-0.5 text-[9px] text-muted-foreground active:text-accent">
            <Settings2 className="w-4 h-4" /><span>আরও</span>
          </button>
        </div>
        {/* Expanded mobile actions */}
        {showMobileActions && (
          <div className="bg-card border-t border-border p-2 grid grid-cols-6 gap-2 animate-fade-in">
            <button onClick={() => { navigate("/archive"); setShowMobileActions(false); }} className="flex flex-col items-center gap-1 p-2 rounded-lg bg-muted text-[9px]">
              <Archive className="w-4 h-4" />আর্কাইভ
            </button>
            <button onClick={() => { const el = document.querySelector('[data-value="scraper"]') as HTMLElement; el?.click(); setShowMobileActions(false); }} className="flex flex-col items-center gap-1 p-2 rounded-lg bg-muted text-[9px]">
              <Globe className="w-4 h-4" />স্ক্র্যাপার
            </button>
            <button onClick={() => { const el = document.querySelector('[data-value="categories"]') as HTMLElement; el?.click(); setShowMobileActions(false); }} className="flex flex-col items-center gap-1 p-2 rounded-lg bg-muted text-[9px]">
              <Tag className="w-4 h-4" />ক্যাটাগরি
            </button>
            <button onClick={() => { const el = document.querySelector('[data-value="layout"]') as HTMLElement; el?.click(); setShowMobileActions(false); }} className="flex flex-col items-center gap-1 p-2 rounded-lg bg-muted text-[9px]">
              <Settings2 className="w-4 h-4" />লেআউট
            </button>
            <button onClick={() => { const el = document.querySelector('[data-value="site-settings"]') as HTMLElement; el?.click(); setShowMobileActions(false); }} className="flex flex-col items-center gap-1 p-2 rounded-lg bg-muted text-[9px]">
              <Image className="w-4 h-4" />সাইট
            </button>
            <button onClick={() => { const el = document.querySelector('[data-value="theme"]') as HTMLElement; el?.click(); setShowMobileActions(false); }} className="flex flex-col items-center gap-1 p-2 rounded-lg bg-muted text-[9px]">
              🎨 থিম
            </button>
          </div>
        )}
      </div>

      <div className="container mx-auto p-2 sm:p-4">
        <Tabs defaultValue="quick-post">
          <TabsList className="w-full flex-wrap h-auto gap-0.5 sm:gap-1 p-1">
            <TabsTrigger value="quick-post" className="text-[10px] sm:text-sm px-2 sm:px-3 h-7 sm:h-9">
              <Newspaper className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" />পোস্ট
            </TabsTrigger>
            <TabsTrigger value="posts" className="text-[10px] sm:text-sm px-2 sm:px-3 h-7 sm:h-9">
              <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" />সকল ({posts.length})
            </TabsTrigger>
            <TabsTrigger value="rss" className="text-[10px] sm:text-sm px-2 sm:px-3 h-7 sm:h-9">
              <Rss className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" />RSS
            </TabsTrigger>
            <TabsTrigger value="scraper" className="text-[10px] sm:text-sm px-2 sm:px-3 h-7 sm:h-9">
              <Globe className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" />স্ক্র্যাপার
            </TabsTrigger>
            <TabsTrigger value="categories" className="text-[10px] sm:text-sm px-2 sm:px-3 h-7 sm:h-9">
              <Tag className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" />ক্যাটাগরি
            </TabsTrigger>
            <TabsTrigger value="layout" className="text-[10px] sm:text-sm px-2 sm:px-3 h-7 sm:h-9">
              <Settings2 className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" />লেআউট
            </TabsTrigger>
            <TabsTrigger value="site-settings" className="text-[10px] sm:text-sm px-2 sm:px-3 h-7 sm:h-9">
              <Image className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" />সাইট
            </TabsTrigger>
            <TabsTrigger value="theme" className="text-[10px] sm:text-sm px-2 sm:px-3 h-7 sm:h-9">
              🎨 <span className="ml-0.5">থিম</span>
            </TabsTrigger>
          </TabsList>

          {/* Quick Post Tab */}
          <TabsContent value="quick-post">
            <Card>
              <CardHeader className="p-3 sm:p-6"><CardTitle className="text-base sm:text-lg">কুইক পোস্ট</CardTitle></CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
                <form onSubmit={handleQuickPost} className="space-y-3">
                  <div className="flex gap-2">
                    <Input placeholder="নিউজ URL পেস্ট করুন" value={quickUrl} onChange={(e) => setQuickUrl(e.target.value)} className="flex-1 text-sm h-9" />
                    <Button type="button" onClick={handleFetchUrl} disabled={urlFetching || !quickUrl} variant="outline" size="sm" className="h-9">
                      <Link2 className={`w-3.5 h-3.5 ${urlFetching ? "animate-spin" : ""}`} />
                      <span className="hidden sm:inline ml-1">ফেচ</span>
                    </Button>
                  </div>
                  {quickSummary && (
                    <div className="bg-accent/20 border border-accent/30 rounded p-2 text-xs">
                      <span className="font-medium text-accent-foreground">📝 অটো সারাংশ: </span>{quickSummary.substring(0, 200)}
                    </div>
                  )}
                  <Input placeholder="শিরোনাম *" value={quickTitle} onChange={(e) => setQuickTitle(e.target.value)} required className="text-sm h-9" />
                  <Textarea placeholder="কন্টেন্ট" value={quickContent} onChange={(e) => setQuickContent(e.target.value)} rows={4} className="text-sm" />
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Input placeholder="ইমেজ URL" value={quickImage} onChange={(e) => setQuickImage(e.target.value)} className="text-sm h-9" />
                    </div>
                    <label className="cursor-pointer">
                      <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) { const url = await handleImageUpload(file); if (url) setQuickImage(url); }
                      }} />
                      <Button type="button" variant="outline" size="sm" className="h-9" asChild disabled={uploadingImage}>
                        <span><Upload className="w-3.5 h-3.5 mr-1" />{uploadingImage ? "..." : "আপলোড"}</span>
                      </Button>
                    </label>
                  </div>
                  {quickImage && <img src={quickImage} alt="preview" className="h-16 object-cover rounded" />}
                  <select className="w-full border rounded-md p-2 bg-background text-sm" value={quickCategory} onChange={(e) => setQuickCategory(e.target.value)}>
                    <option value="">ক্যাটাগরি নির্বাচন করুন</option>
                    {parentCats.map((c) => (
                      <optgroup key={c.id} label={c.name}>
                        <option value={c.id}>{c.name}</option>
                        {getSubCats(c.id).map((sc) => (
                          <option key={sc.id} value={sc.id}>↳ {sc.name}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  {/* Division / District / Upazila */}
                  <div className="grid grid-cols-3 gap-2">
                    <select className="border rounded-md p-1.5 bg-background text-sm" value={quickDivision} onChange={(e) => { setQuickDivision(e.target.value); setQuickDistrict(""); setQuickUpazila(""); }}>
                      <option value="">বিভাগ</option>
                      {Object.entries({ barisal: "বরিশাল", dhaka: "ঢাকা", chittagong: "চট্টগ্রাম", sylhet: "সিলেট", rajshahi: "রাজশাহী", rangpur: "রংপুর", khulna: "খুলনা", mymensingh: "ময়মনসিংহ" }).map(([k, v]) =>
                        <option key={k} value={k}>{v}</option>
                      )}
                    </select>
                    <select className="border rounded-md p-1.5 bg-background text-sm" value={quickDistrict} onChange={(e) => { setQuickDistrict(e.target.value); setQuickUpazila(""); }} disabled={!quickDivision}>
                      <option value="">জেলা</option>
                      {quickDistricts.map((d) => <option key={d.name} value={d.name}>{d.name}</option>)}
                    </select>
                    <select className="border rounded-md p-1.5 bg-background text-sm" value={quickUpazila} onChange={(e) => setQuickUpazila(e.target.value)} disabled={!quickDistrict}>
                      <option value="">উপজেলা</option>
                      {quickUpazilas.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <Input placeholder="ট্যাগ (কমা দিয়ে আলাদা)" value={quickTags} onChange={(e) => setQuickTags(e.target.value)} className="text-sm h-9" />
                  <Button type="submit" disabled={loading} className="w-full h-9 text-sm">
                    <Plus className="w-3.5 h-3.5 mr-1" />পোস্ট করুন
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* All Posts Tab */}
          <TabsContent value="posts">
            {editingPost && (
              <Card className="mb-3 border-accent">
                <CardHeader className="p-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm">পোস্ট এডিট</CardTitle>
                    <Button variant="ghost" size="icon" onClick={() => setEditingPost(null)} className="h-7 w-7"><X className="h-3.5 w-3.5" /></Button>
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-0 space-y-2">
                  <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="শিরোনাম" className="text-sm h-8" />
                  <select className="w-full border rounded-md p-1.5 bg-background text-sm" value={editCategory} onChange={(e) => setEditCategory(e.target.value)}>
                    <option value="">ক্যাটাগরি নির্বাচন</option>
                    {parentCats.map((c) => (
                      <optgroup key={c.id} label={c.name}>
                        <option value={c.id}>{c.name}</option>
                        {getSubCats(c.id).map((sc) => (
                          <option key={sc.id} value={sc.id}>↳ {sc.name}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={3} placeholder="কন্টেন্ট" className="text-sm" />
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Input placeholder="ইমেজ URL" value={editImageUrl} onChange={(e) => setEditImageUrl(e.target.value)} className="text-sm h-8" />
                    </div>
                    <label className="cursor-pointer">
                      <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) { const url = await handleImageUpload(file); if (url) setEditImageUrl(url); }
                      }} />
                      <Button type="button" variant="outline" size="sm" className="h-8" asChild disabled={uploadingImage}>
                        <span><Upload className="w-3 h-3 mr-1" />{uploadingImage ? "..." : "আপলোড"}</span>
                      </Button>
                    </label>
                  </div>
                  {editImageUrl && <img src={editImageUrl} alt="preview" className="h-12 object-cover rounded" />}
                  <div className="grid grid-cols-3 gap-1.5">
                    <select className="border rounded-md p-1.5 bg-background text-xs" value={editDivision} onChange={(e) => { setEditDivision(e.target.value); setEditDistrict(""); setEditUpazila(""); }}>
                      <option value="">বিভাগ</option>
                      {Object.entries({ barisal: "বরিশাল", dhaka: "ঢাকা", chittagong: "চট্টগ্রাম", sylhet: "সিলেট", rajshahi: "রাজশাহী", rangpur: "রংপুর", khulna: "খুলনা", mymensingh: "ময়মনসিংহ" }).map(([k, v]) =>
                        <option key={k} value={k}>{v}</option>
                      )}
                    </select>
                    <select className="border rounded-md p-1.5 bg-background text-xs" value={editDistrict} onChange={(e) => { setEditDistrict(e.target.value); setEditUpazila(""); }} disabled={!editDivision}>
                      <option value="">জেলা</option>
                      {editDistricts.map((d) => <option key={d.name} value={d.name}>{d.name}</option>)}
                    </select>
                    <select className="border rounded-md p-1.5 bg-background text-xs" value={editUpazila} onChange={(e) => setEditUpazila(e.target.value)} disabled={!editDistrict}>
                      <option value="">উপজেলা</option>
                      {editUpazilas.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <Input value={editTags} onChange={(e) => setEditTags(e.target.value)} placeholder="ট্যাগ (কমা দিয়ে আলাদা)" className="text-sm h-8" />
                  <Button onClick={saveEdit} size="sm"><Save className="w-3.5 h-3.5 mr-1" />সেভ</Button>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="p-3 sm:p-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <CardTitle className="text-sm sm:text-base">সকল পোস্ট ({filteredPosts.length})</CardTitle>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {([
                      { key: "all" as const, label: "সকল", count: posts.length },
                      { key: "rss" as const, label: "📡 RSS", count: rssPostCount },
                      { key: "scraper" as const, label: "🌐 স্ক্র্যাপার", count: scraperPostCount },
                      { key: "manual" as const, label: "✍️ ম্যানুয়াল", count: manualPostCount },
                    ]).map(f => (
                      <button key={f.key} onClick={() => { setPostSourceFilter(f.key); setPostPage(0); }}
                        className={`text-[10px] sm:text-xs px-2 py-1 rounded-full border transition-colors ${postSourceFilter === f.key ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-accent"}`}>
                        {f.label} ({f.count})
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Input type="month" className="w-32 sm:w-40 h-8 text-xs" value={postDateFilter} onChange={(e) => { setPostDateFilter(e.target.value); setPostPage(0); }} />
                    <div className="relative flex-1 min-w-[120px]">
                      <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input placeholder="সার্চ..." className="pl-7 h-8 text-xs" value={postSearch} onChange={(e) => { setPostSearch(e.target.value); setPostPage(0); }} />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-2 sm:p-6 pt-0 overflow-x-auto">
                {/* Mobile card view - improved */}
                <div className="sm:hidden space-y-2">
                  {pagedPosts.map((post) => (
                    <div key={post.id} className="border rounded-lg bg-card overflow-hidden animate-fade-in">
                      <div className="p-2.5 space-y-1.5">
                        <div className="flex items-start gap-2">
                          {post.image_url && (
                            <img src={post.image_url} alt="" className="w-12 h-12 rounded object-cover flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium leading-tight line-clamp-2">{cleanText(post.title)}</p>
                            <div className="flex items-center gap-1.5 mt-1 text-[10px] text-muted-foreground">
                              {post.rss_feed_id ? <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded">RSS</span>
                                : post.author_id ? <span className="bg-accent/10 text-accent px-1.5 py-0.5 rounded">ম্যানুয়াল</span>
                                : post.source_name ? <span className="bg-muted text-muted-foreground px-1.5 py-0.5 rounded">স্ক্র্যাপ</span>
                                : null}
                              <span>{post.source_name || "নিজস্ব"}</span>
                              <span>•</span>
                              <span>{post.published_at ? new Date(post.published_at).toLocaleDateString("bn-BD") : ""}</span>
                            </div>
                          </div>
                        </div>
                        {/* Quick category assign */}
                        <select className="w-full text-[10px] border rounded p-1 bg-background" value={post.category_id || ""} onChange={(e) => quickAssignCategory(post.id, e.target.value)}>
                          <option value="">ক্যাটাগরি নির্বাচন</option>
                          {categories.map((c) => <option key={c.id} value={c.id}>{c.parent_id ? "↳ " : ""}{c.name}</option>)}
                        </select>
                        {/* Action bar - scrollable horizontally */}
                        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-hide">
                          <Button size="sm" variant={post.is_featured ? "default" : "outline"} onClick={() => toggleFeatured(post)} className="h-7 text-[10px] px-2 gap-1 flex-shrink-0">
                            <Star className="h-3 w-3" />{post.is_featured ? "ফিচার্ড ✓" : "ফিচার"}
                          </Button>
                          <Button size="sm" variant={post.is_highlighted ? "default" : "outline"} onClick={() => toggleHighlighted(post)} className="h-7 text-[10px] px-2 gap-1 flex-shrink-0">
                            <Highlighter className="h-3 w-3" />{post.is_highlighted ? "হাইলাইট ✓" : "হাইলাইট"}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => startEdit(post)} className="h-7 text-[10px] px-2 gap-1 flex-shrink-0">
                            <Edit className="h-3 w-3" />এডিট
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => goToPhotoCard(post)} className="h-7 text-[10px] px-2 gap-1 flex-shrink-0">
                            <Camera className="h-3 w-3" />কার্ড
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => shareToSocial(post, ["telegram", "facebook"])} className="h-7 text-[10px] px-2 gap-1 flex-shrink-0">
                            <Send className="h-3 w-3" />সোশাল
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => sharePost(post)} className="h-7 text-[10px] px-2 gap-1 flex-shrink-0">
                            <Share2 className="h-3 w-3" />শেয়ার
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => shareToBlogger(post)} className="h-7 text-[10px] px-2 gap-1 flex-shrink-0">
                            <ExternalLink className="h-3 w-3" />ব্লগার
                          </Button>
                          {userRole === "admin" && (
                            <Button size="sm" variant="outline" onClick={() => deletePost(post.id)} className="h-7 text-[10px] px-2 gap-1 flex-shrink-0 text-destructive border-destructive/30">
                              <Trash2 className="h-3 w-3" />ডিলিট
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop table view */}
                <Table className="hidden sm:table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>শিরোনাম</TableHead>
                      <TableHead>সোর্স</TableHead>
                      <TableHead>ক্যাটাগরি</TableHead>
                      <TableHead>তারিখ</TableHead>
                      <TableHead>অ্যাকশন</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedPosts.map((post) => (
                      <TableRow key={post.id}>
                        <TableCell className="max-w-[200px] truncate font-medium text-sm">{cleanText(post.title)}</TableCell>
                        <TableCell className="text-xs">
                          {post.rss_feed_id ? <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[10px]">📡 RSS</span>
                            : post.author_id ? <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-[10px]">✍️</span>
                            : <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded text-[10px]">🌐</span>}
                          <span className="ml-1 text-muted-foreground">{post.source_name || "নিজস্ব"}</span>
                        </TableCell>
                        <TableCell>
                          <select className="text-xs border rounded p-1 bg-background w-24" value={post.category_id || ""} onChange={(e) => quickAssignCategory(post.id, e.target.value)}>
                            <option value="">—</option>
                            {categories.map((c) => <option key={c.id} value={c.id}>{c.parent_id ? "↳ " : ""}{c.name}</option>)}
                          </select>
                        </TableCell>
                        <TableCell className="text-xs">{post.published_at ? new Date(post.published_at).toLocaleDateString("bn-BD") : ""}</TableCell>
                        <TableCell>
                          <div className="flex gap-0.5">
                            <Button size="icon" variant={post.is_featured ? "default" : "ghost"} onClick={() => toggleFeatured(post)} title="ফিচার্ড" className="h-7 w-7">
                              <Star className="h-3 w-3" />
                            </Button>
                            <Button size="icon" variant={post.is_highlighted ? "default" : "ghost"} onClick={() => toggleHighlighted(post)} title="হাইলাইট" className="h-7 w-7">
                              <Highlighter className="h-3 w-3" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => startEdit(post)} title="এডিট" className="h-7 w-7">
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => goToPhotoCard(post)} title="কার্ড" className="h-7 w-7">
                              <Camera className="h-3 w-3" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => shareToBlogger(post)} title="Blogger" className="h-7 w-7">
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => sharePost(post)} title="শেয়ার" className="h-7 w-7">
                              <Share2 className="h-3 w-3" />
                            </Button>
                            {userRole === "admin" && (
                              <Button size="icon" variant="ghost" onClick={() => deletePost(post.id)} className="text-destructive h-7 w-7">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredPosts.length > postsPerPage && (
                  <div className="flex gap-2 mt-3 justify-center">
                    <Button variant="outline" size="sm" disabled={postPage === 0} onClick={() => setPostPage((p) => p - 1)} className="h-7 text-xs">আগের</Button>
                    <span className="text-xs text-muted-foreground self-center">{postPage + 1}/{Math.ceil(filteredPosts.length / postsPerPage)}</span>
                    <Button variant="outline" size="sm" disabled={(postPage + 1) * postsPerPage >= filteredPosts.length} onClick={() => setPostPage((p) => p + 1)} className="h-7 text-xs">পরের</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* RSS Tab */}
          <TabsContent value="rss">
            <div className="space-y-3">
              <Card>
                <CardHeader className="p-3 sm:p-6">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle className="text-sm sm:text-base">RSS ম্যানেজার ({feeds.length})</CardTitle>
                    <div className="flex items-center gap-2">
                      {fetchProgress && <span className="text-[10px] text-muted-foreground">{fetchProgress}</span>}
                      {backfillProgress && (
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="text-[10px] text-muted-foreground">{backfillProgress}</span>
                          {backfillStats.running && (
                            <div className="flex items-center gap-1.5">
                              <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${backfillStats.total > 0 ? Math.min((backfillStats.updated / Math.max(backfillStats.total, 1)) * 100, 100) : 10}%` }} />
                              </div>
                              <span className="text-[9px] text-accent font-medium">{backfillStats.updated}/{backfillStats.total}</span>
                            </div>
                          )}
                        </div>
                      )}
                      <Button onClick={handleBackfill} disabled={loading} size="sm" variant="outline" className="h-8 text-xs">
                        <Database className={`w-3.5 h-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />ব্যাকফিল
                      </Button>
                      <Button onClick={handleFetchRSS} disabled={loading} size="sm" className="h-8 text-xs">
                        <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />ফেচ
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0">
                  <form onSubmit={handleAddFeed} className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                    <Input placeholder="RSS URL *" value={feedUrl} onChange={(e) => setFeedUrl(e.target.value)} required className="text-sm h-8" />
                    <Input placeholder="নাম *" value={feedName} onChange={(e) => setFeedName(e.target.value)} required className="text-sm h-8" />
                    <select className="border rounded-md p-1.5 bg-background text-sm" value={feedDivision} onChange={(e) => { setFeedDivision(e.target.value); setFeedDistrict(""); setFeedUpazila(""); }}>
                      <option value="">বিভাগ</option>
                      {Object.entries({ barisal: "বরিশাল", dhaka: "ঢাকা", chittagong: "চট্টগ্রাম", sylhet: "সিলেট", rajshahi: "রাজশাহী", rangpur: "রংপুর", khulna: "খুলনা", mymensingh: "ময়মনসিংহ" }).map(([k, v]) =>
                        <option key={k} value={k}>{v}</option>
                      )}
                    </select>
                    <select className="border rounded-md p-1.5 bg-background text-sm" value={feedDistrict} onChange={(e) => { setFeedDistrict(e.target.value); setFeedUpazila(""); }} disabled={!feedDivision}>
                      <option value="">জেলা</option>
                      {currentDistricts.map((d) => <option key={d.name} value={d.name}>{d.name}</option>)}
                    </select>
                    <select className="border rounded-md p-1.5 bg-background text-sm" value={feedUpazila} onChange={(e) => setFeedUpazila(e.target.value)} disabled={!feedDistrict}>
                      <option value="">উপজেলা</option>
                      {currentUpazilas.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                    <select className="border rounded-md p-1.5 bg-background text-sm" value={feedCategory} onChange={(e) => setFeedCategory(e.target.value)}>
                      {[
                        ["general", "সাধারণ"], ["national", "জাতীয়"], ["international", "আন্তর্জাতিক"], ["divisional", "বিভাগীয়"],
                        ["tv", "টিভি"], ["sports", "খেলা"], ["entertainment", "বিনোদন"], ["education", "শিক্ষা"],
                        ["technology", "প্রযুক্তি"], ["health", "স্বাস্থ্য"], ["economy", "অর্থনীতি"], ["lifestyle", "লাইফস্টাইল"],
                        ["politics", "রাজনীতি"], ["world", "বিশ্ব"], ["religion", "ধর্ম"], ["travel", "ভ্রমণ"],
                      ].map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <Button type="submit" className="sm:col-span-2 h-8 text-sm"><Plus className="w-3.5 h-3.5 mr-1" />ফিড যুক্ত</Button>
                  </form>

                  {/* Mobile feed list */}
                  <div className="sm:hidden space-y-2">
                    {feeds.map((feed) => (
                      <div key={feed.id} className="border rounded p-2 bg-card text-xs space-y-1">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium">{feed.name}</p>
                            <p className="text-muted-foreground truncate">{feed.url}</p>
                          </div>
                          <Button size="icon" variant="ghost" onClick={() => deleteFeed(feed.id)} className="text-destructive h-6 w-6 flex-shrink-0">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="flex gap-2 text-[10px] text-muted-foreground">
                          <span>{feed.division || "-"}</span>
                          <span>{feed.category || "-"}</span>
                          <span>{feed.last_fetched_at ? new Date(feed.last_fetched_at).toLocaleString("bn-BD") : "—"}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop table */}
                  <Table className="hidden sm:table">
                    <TableHeader>
                      <TableRow>
                        <TableHead>নাম</TableHead>
                        <TableHead>URL</TableHead>
                        <TableHead>বিভাগ</TableHead>
                        <TableHead>ক্যাটাগরি</TableHead>
                        <TableHead>শেষ ফেচ</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {feeds.map((feed) => (
                        <TableRow key={feed.id}>
                          <TableCell className="font-medium text-sm">{feed.name}</TableCell>
                          <TableCell className="max-w-[150px] truncate text-xs">{feed.url}</TableCell>
                          <TableCell className="text-xs">{feed.division || "-"}</TableCell>
                          <TableCell className="text-xs">{feed.category || "-"}</TableCell>
                          <TableCell className="text-xs">{feed.last_fetched_at ? new Date(feed.last_fetched_at).toLocaleString("bn-BD") : "—"}</TableCell>
                          <TableCell>
                            <Button size="icon" variant="ghost" onClick={() => deleteFeed(feed.id)} className="text-destructive h-7 w-7">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Web Scraper Tab */}
          <TabsContent value="scraper">
            <Card>
              <CardHeader className="p-3 sm:p-6">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-sm sm:text-base">🌐 স্ক্র্যাপার ({scrapeSources.length})</CardTitle>
                  <Button onClick={handleManualScrape} disabled={loading} size="sm" className="h-8 text-xs">
                    <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />স্ক্র্যাপ
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
                <form onSubmit={handleAddScrapeSource} className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                  <Input placeholder="সাইট URL *" value={scrapeUrl} onChange={(e) => setScrapeUrl(e.target.value)} required className="text-sm h-8" />
                  <Input placeholder="সোর্স নাম *" value={scrapeName} onChange={(e) => setScrapeName(e.target.value)} required className="text-sm h-8" />
                  <select className="border rounded-md p-1.5 bg-background text-sm" value={scrapeDivision} onChange={(e) => { setScrapeDivision(e.target.value); setScrapeDistrict(""); setScrapeUpazila(""); }}>
                    <option value="">বিভাগ</option>
                    {Object.entries({ barisal: "বরিশাল", dhaka: "ঢাকা", chittagong: "চট্টগ্রাম", sylhet: "সিলেট", rajshahi: "রাজশাহী", rangpur: "রংপুর", khulna: "খুলনা", mymensingh: "ময়মনসিংহ" }).map(([k, v]) =>
                      <option key={k} value={k}>{v}</option>
                    )}
                  </select>
                  <select className="border rounded-md p-1.5 bg-background text-sm" value={scrapeDistrict} onChange={(e) => { setScrapeDistrict(e.target.value); setScrapeUpazila(""); }} disabled={!scrapeDivision}>
                    <option value="">জেলা</option>
                    {scrapeDistricts.map((d) => <option key={d.name} value={d.name}>{d.name}</option>)}
                  </select>
                  <select className="border rounded-md p-1.5 bg-background text-sm" value={scrapeUpazila} onChange={(e) => setScrapeUpazila(e.target.value)} disabled={!scrapeDistrict}>
                    <option value="">উপজেলা</option>
                    {scrapeUpazilasList.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                  <select className="border rounded-md p-1.5 bg-background text-sm" value={scrapeCategory} onChange={(e) => setScrapeCategory(e.target.value)}>
                    {[
                      ["general", "সাধারণ"], ["national", "জাতীয়"], ["international", "আন্তর্জাতিক"], ["divisional", "বিভাগীয়"],
                      ["sports", "খেলা"], ["entertainment", "বিনোদন"], ["education", "শিক্ষা"], ["technology", "প্রযুক্তি"],
                      ["economy", "অর্থনীতি"], ["health", "স্বাস্থ্য"], ["lifestyle", "লাইফস্টাইল"], ["religion", "ধর্ম"],
                      ["travel", "ভ্রমণ"], ["people", "পিপল"], ["jobs", "চাকরি"], ["gallery", "গ্যালারি"],
                    ].map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                  <select className="border rounded-md p-1.5 bg-background text-sm" value={scrapeInterval} onChange={(e) => setScrapeInterval(e.target.value)}>
                    <option value="5">৫ মিনিট</option>
                    <option value="15">১৫ মিনিট</option>
                    <option value="30">৩০ মিনিট</option>
                    <option value="60">১ ঘণ্টা</option>
                  </select>
                  <div className="sm:col-span-2 border rounded-md p-2 bg-muted/30 space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">🎯 CSS সিলেক্টর (ঐচ্ছিক)</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      <Input placeholder="article সিলেক্টর" value={scrapeArticleSelector} onChange={(e) => setScrapeArticleSelector(e.target.value)} className="text-xs h-7" />
                      <Input placeholder="title সিলেক্টর" value={scrapeTitleSelector} onChange={(e) => setScrapeTitleSelector(e.target.value)} className="text-xs h-7" />
                      <Input placeholder="image সিলেক্টর" value={scrapeImageSelector} onChange={(e) => setScrapeImageSelector(e.target.value)} className="text-xs h-7" />
                      <Input placeholder="link সিলেক্টর" value={scrapeLinkSelector} onChange={(e) => setScrapeLinkSelector(e.target.value)} className="text-xs h-7" />
                    </div>
                  </div>
                  <Button type="submit" className="sm:col-span-2 h-8 text-sm"><Plus className="w-3.5 h-3.5 mr-1" />সোর্স যুক্ত</Button>
                </form>

                {/* Mobile scrape source list */}
                <div className="sm:hidden space-y-2">
                  {scrapeSources.map((src: any) => (
                    <div key={src.id} className="border rounded p-2 bg-card text-xs space-y-1">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{src.name}</p>
                          <p className="text-muted-foreground truncate">{src.url}</p>
                        </div>
                        <Button size="icon" variant="ghost" onClick={() => deleteScrapeSource(src.id)} className="text-destructive h-6 w-6 flex-shrink-0">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex gap-2 text-[10px]">
                        <span>{src.division || "-"}</span>
                        <span>{src.scrape_interval_minutes}মি</span>
                        {src.last_error ? <span className="text-destructive">❌</span> : <span className="text-green-600">✅</span>}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop table */}
                <Table className="hidden sm:table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>নাম</TableHead>
                      <TableHead>URL</TableHead>
                      <TableHead>বিভাগ</TableHead>
                      <TableHead>ইন্টারভাল</TableHead>
                      <TableHead>স্ট্যাটাস</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scrapeSources.map((src: any) => (
                      <TableRow key={src.id}>
                        <TableCell className="font-medium text-sm">{src.name}</TableCell>
                        <TableCell className="max-w-[150px] truncate text-xs">{src.url}</TableCell>
                        <TableCell className="text-xs">{src.division || "-"}</TableCell>
                        <TableCell className="text-xs">{src.scrape_interval_minutes}মি</TableCell>
                        <TableCell className="text-xs">
                          {src.last_error ? <span className="text-destructive" title={src.last_error}>❌</span> : <span className="text-green-600">✅</span>}
                        </TableCell>
                        <TableCell>
                          <Button size="icon" variant="ghost" onClick={() => deleteScrapeSource(src.id)} className="text-destructive h-7 w-7">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories Tab - Full CRUD + Reorder */}
          <TabsContent value="categories">
            <Card>
              <CardHeader className="p-3 sm:p-6"><CardTitle className="text-sm sm:text-base">ক্যাটাগরি ম্যানেজমেন্ট ({categories.length})</CardTitle></CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
                {/* Edit Category Modal */}
                {editingCat && (
                  <div className="mb-4 p-3 border border-accent rounded-lg bg-accent/5 space-y-2">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-medium">ক্যাটাগরি এডিট</p>
                      <Button variant="ghost" size="icon" onClick={() => setEditingCat(null)} className="h-6 w-6"><X className="h-3 w-3" /></Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <Input placeholder="নাম" value={editCatName} onChange={(e) => setEditCatName(e.target.value)} className="text-sm h-8" />
                      <Input placeholder="slug" value={editCatSlug} onChange={(e) => setEditCatSlug(e.target.value)} className="text-sm h-8" />
                      <select className="border rounded-md p-1.5 bg-background text-sm" value={editCatParent} onChange={(e) => setEditCatParent(e.target.value)}>
                        <option value="">প্যারেন্ট নেই</option>
                        {categories.filter(c => !c.parent_id && c.id !== editingCat.id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <Button onClick={saveEditCategory} size="sm" className="h-7 text-xs"><Save className="w-3 h-3 mr-1" />সেভ</Button>
                  </div>
                )}

                {/* Add New Category */}
                <form onSubmit={handleAddCategory} className="flex gap-2 mb-4 flex-wrap">
                  <Input placeholder="নাম" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} required className="flex-1 min-w-[100px] text-sm h-8" />
                  <Input placeholder="slug" value={newCatSlug} onChange={(e) => setNewCatSlug(e.target.value)} required className="flex-1 min-w-[80px] text-sm h-8" />
                  <select className="border rounded-md p-1.5 bg-background text-sm min-w-[100px]" value={newCatParent} onChange={(e) => setNewCatParent(e.target.value)}>
                    <option value="">প্যারেন্ট</option>
                    {parentCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <Button type="submit" size="sm" className="h-8"><Plus className="w-3.5 h-3.5" /></Button>
                </form>

                {/* Category List with Edit/Delete/Reorder */}
                <div className="space-y-1">
                  {parentCats.map((cat, idx) => (
                    <div key={cat.id}>
                      <div className="flex items-center gap-1 p-2 rounded border bg-card hover:bg-muted/50 transition-colors">
                        <GripVertical className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm font-medium flex-1">{cat.name} <span className="text-[10px] text-muted-foreground">({cat.slug})</span></span>
                        <span className="text-[10px] text-muted-foreground mr-1">#{cat.sort_order}</span>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => moveCategoryOrder(cat, "up")} disabled={idx === 0}>
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => moveCategoryOrder(cat, "down")} disabled={idx === parentCats.length - 1}>
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => startEditCategory(cat)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        {userRole === "admin" && (
                          <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => deleteCategory(cat.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      {/* Sub-categories */}
                      {getSubCats(cat.id).map((sub, si) => (
                        <div key={sub.id} className="flex items-center gap-1 p-1.5 ml-6 rounded border-l-2 border-primary/30 bg-muted/30 mt-0.5">
                          <span className="text-xs flex-1">↳ {sub.name} <span className="text-[10px] text-muted-foreground">({sub.slug})</span></span>
                          <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => moveCategoryOrder(sub, "up")} disabled={si === 0}>
                            <ArrowUp className="h-2.5 w-2.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => moveCategoryOrder(sub, "down")} disabled={si === getSubCats(cat.id).length - 1}>
                            <ArrowDown className="h-2.5 w-2.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => startEditCategory(sub)}>
                            <Edit className="h-2.5 w-2.5" />
                          </Button>
                          {userRole === "admin" && (
                            <Button size="icon" variant="ghost" className="h-5 w-5 text-destructive" onClick={() => deleteCategory(sub.id)}>
                              <Trash2 className="h-2.5 w-2.5" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          {/* Layout Settings Tab */}
          <TabsContent value="layout">
            <LayoutSettingsTab />
          </TabsContent>
          {/* Site Settings Tab */}
          <TabsContent value="site-settings">
            <SiteSettingsTab />
          </TabsContent>
          {/* Theme Customizer Tab */}
          <TabsContent value="theme">
            <ThemeCustomizerTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Section position map
const sectionPositionMap: Record<string, string> = {
  national: "বাম সাইডবার", international: "বাম সাইডবার", politics: "বাম সাইডবার", technology: "বাম সাইডবার",
  highlighted: "মূল কন্টেন্ট", barisal: "মূল কন্টেন্ট", sports: "মূল কন্টেন্ট", 
  entertainment: "মূল কন্টেন্ট", gallery: "মূল কন্টেন্ট", health: "মূল কন্টেন্ট",
  lifestyle: "মূল কন্টেন্ট", religion: "মূল কন্টেন্ট", travel: "মূল কন্টেন্ট",
  education: "মূল কন্টেন্ট", economy: "মূল কন্টেন্ট", crime: "মূল কন্টেন্ট",
  people: "মূল কন্টেন্ট", jobs: "মূল কন্টেন্ট",
  popular: "ডান সাইডবার", dhaka: "ডান সাইডবার", chattogram: "ডান সাইডবার",
  sylhet: "ডান সাইডবার", rajshahi: "ডান সাইডবার", khulna: "ডান সাইডবার",
  rangpur: "ডান সাইডবার", mymensingh: "ডান সাইডবার",
};

const LayoutSettingsTab = () => {
  const { data: settings, isLoading } = useLayoutSettings();
  const updateSetting = useUpdateLayoutSetting();
  const { toast } = useToast();
  const [newKey, setNewKey] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const sortedSettings = [...(settings ?? [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  const addSection = async () => {
    if (!newKey || !newLabel) return;
    const maxSort = (settings ?? []).reduce((m, s) => Math.max(m, s.sort_order || 0), 0);
    const { error } = await supabase.from("layout_settings").insert({
      section_key: newKey, section_label: newLabel, post_count: 5, is_visible: true, sort_order: maxSort + 1,
    });
    if (error) { toast({ title: "ত্রুটি", description: error.message, variant: "destructive" }); return; }
    toast({ title: "সেকশন যুক্ত হয়েছে" });
    setNewKey(""); setNewLabel("");
    updateSetting.mutate({ id: "refresh" } as any);
  };

  const deleteSection = async (id: string) => {
    if (!confirm("এই সেকশন মুছে ফেলতে চান?")) return;
    await supabase.from("layout_settings").delete().eq("id", id);
    toast({ title: "সেকশন মুছে ফেলা হয়েছে" });
    updateSetting.mutate({ id: "refresh" } as any);
  };

  const saveLabel = async (id: string) => {
    const { error } = await supabase.from("layout_settings").update({ section_label: editLabel }).eq("id", id);
    if (!error) toast({ title: "লেবেল আপডেট হয়েছে" });
    setEditingId(null);
    updateSetting.mutate({ id: "refresh" } as any);
  };

  const handleDrop = async (dropIdx: number) => {
    if (dragIdx === null || dragIdx === dropIdx) { setDragIdx(null); return; }
    const items = [...sortedSettings];
    const [moved] = items.splice(dragIdx, 1);
    items.splice(dropIdx, 0, moved);
    await Promise.all(items.map((item, i) => 
      supabase.from("layout_settings").update({ sort_order: i + 1 }).eq("id", item.id)
    ));
    setDragIdx(null);
    toast({ title: "ক্রম পরিবর্তন হয়েছে" });
    updateSetting.mutate({ id: "refresh" } as any);
  };

  if (isLoading) return <div className="p-4 text-center text-sm text-muted-foreground">লোড হচ্ছে...</div>;

  return (
    <Card>
      <CardHeader className="p-3 sm:p-6">
        <CardTitle className="text-sm sm:text-base flex items-center gap-2">
          <Settings2 className="w-4 h-4" /> হোমপেজ লেআউট সেটিংস
        </CardTitle>
        <p className="text-xs text-muted-foreground">☝️ ড্র্যাগ করে ক্রম পরিবর্তন করুন। রঙিন ব্যাজ দেখায় কোন সেকশন পেজের কোথায় আছে।</p>
      </CardHeader>
      <CardContent className="p-3 sm:p-6 pt-0 space-y-3">
        {/* Position legend */}
        <div className="flex flex-wrap gap-2 text-[10px] bg-muted/50 rounded p-2">
          <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">◀ বাম সাইডবার</span>
          <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded">▣ মূল কন্টেন্ট (মাঝে)</span>
          <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded">▶ ডান সাইডবার</span>
        </div>

        {/* Add new section */}
        <div className="flex gap-1.5 flex-wrap border-b pb-3 border-border">
          <Input placeholder="সেকশন key (e.g. sports)" value={newKey} onChange={(e) => setNewKey(e.target.value)} className="flex-1 min-w-[100px] h-8 text-xs" />
          <Input placeholder="লেবেল (যেমন: খেলাধুলা)" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} className="flex-1 min-w-[100px] h-8 text-xs" />
          <Button onClick={addSection} size="sm" className="h-8 text-xs"><Plus className="w-3 h-3 mr-1" />যুক্ত</Button>
        </div>

        {sortedSettings.map((s, idx) => {
          const pos = sectionPositionMap[s.section_key] || "কাস্টম";
          const posBg = pos.includes("বাম") ? "border-l-4 border-l-blue-400" 
            : pos.includes("মূল") ? "border-l-4 border-l-green-400"
            : "border-l-4 border-l-orange-400";
          return (
            <div
              key={s.id}
              draggable
              onDragStart={() => setDragIdx(idx)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(idx)}
              className={`flex items-center gap-2 p-2 rounded-lg border bg-card ${posBg} ${dragIdx === idx ? "opacity-50 scale-95" : ""} transition-all`}
            >
              <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab shrink-0" />
              <button onClick={() => { updateSetting.mutate({ id: s.id, is_visible: !s.is_visible }); }} className="shrink-0">
                {s.is_visible ? <Eye className="w-4 h-4 text-green-600" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
              </button>
              <div className="flex-1 min-w-0">
                {editingId === s.id ? (
                  <div className="flex gap-1">
                    <Input value={editLabel} onChange={(e) => setEditLabel(e.target.value)} className="h-7 text-xs flex-1" />
                    <Button size="sm" className="h-7 text-xs" onClick={() => saveLabel(s.id)}><Save className="w-3 h-3" /></Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingId(null)}><X className="w-3 h-3" /></Button>
                  </div>
                ) : (
                  <div onClick={() => { setEditingId(s.id); setEditLabel(s.section_label); }} className="cursor-pointer">
                    <span className={`text-xs sm:text-sm font-medium ${!s.is_visible ? "opacity-50 line-through" : ""}`}>
                      {s.section_label}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[9px] text-muted-foreground font-mono bg-muted px-1 rounded">{s.section_key}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                        pos.includes("বাম") ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600" 
                        : pos.includes("মূল") ? "bg-green-100 dark:bg-green-900/30 text-green-600"
                        : "bg-orange-100 dark:bg-orange-900/30 text-orange-600"
                      }`}>{pos}</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="outline" className="h-7 w-7" disabled={s.post_count <= 1}
                  onClick={() => updateSetting.mutate({ id: s.id, post_count: Math.max(1, s.post_count - 1) })}>
                  <Minus className="w-3 h-3" />
                </Button>
                <span className="w-7 text-center text-sm font-bold">{s.post_count}</span>
                <Button size="icon" variant="outline" className="h-7 w-7"
                  onClick={() => updateSetting.mutate({ id: s.id, post_count: s.post_count + 1 })}>
                  <Plus className="w-3 h-3" />
                </Button>
                <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => deleteSection(s.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

// Theme Customizer Tab
const ThemeCustomizerTab = () => {
  const { toast } = useToast();
  const updateSetting = useUpdateSiteSetting();
  
  const { data: primaryColor } = useSiteSetting("theme_primary");
  const { data: accentColor } = useSiteSetting("theme_accent");
  const { data: bgColor } = useSiteSetting("theme_background");
  const { data: headerBg } = useSiteSetting("theme_header_bg");
  const { data: topbarBg } = useSiteSetting("theme_topbar_bg");
  const { data: footerBg } = useSiteSetting("theme_footer_bg");
  const { data: fontFamily } = useSiteSetting("theme_font");

  const [colors, setColors] = useState({
    primary: "#1e3a5f", accent: "#c0392b", background: "#faf8f5",
    headerBg: "#1a2d47", topbarBg: "#c0392b", footerBg: "#1a2d47",
  });
  const [font, setFont] = useState("Hind Siliguri");

  useEffect(() => {
    if (primaryColor) setColors(c => ({ ...c, primary: primaryColor }));
    if (accentColor) setColors(c => ({ ...c, accent: accentColor }));
    if (bgColor) setColors(c => ({ ...c, background: bgColor }));
    if (headerBg) setColors(c => ({ ...c, headerBg }));
    if (topbarBg) setColors(c => ({ ...c, topbarBg }));
    if (footerBg) setColors(c => ({ ...c, footerBg }));
    if (fontFamily) setFont(fontFamily);
  }, [primaryColor, accentColor, bgColor, headerBg, topbarBg, footerBg, fontFamily]);

  const saveTheme = async () => {
    const entries = [
      { key: "theme_primary", value: colors.primary },
      { key: "theme_accent", value: colors.accent },
      { key: "theme_background", value: colors.background },
      { key: "theme_header_bg", value: colors.headerBg },
      { key: "theme_topbar_bg", value: colors.topbarBg },
      { key: "theme_footer_bg", value: colors.footerBg },
      { key: "theme_font", value: font },
    ];
    for (const { key, value } of entries) {
      await updateSetting.mutateAsync({ key, value });
    }
    toast({ title: "✅ থিম সেভ হয়েছে! পেজ রিলোড করুন।" });
  };

  const presets = [
    { name: "ডিফল্ট (নীল-লাল)", primary: "#1e3a5f", accent: "#c0392b", bg: "#faf8f5", header: "#1a2d47", topbar: "#c0392b", footer: "#1a2d47" },
    { name: "ডার্ক মোড", primary: "#3b82f6", accent: "#ef4444", bg: "#1a1a2e", header: "#0f0f23", topbar: "#ef4444", footer: "#0f0f23" },
    { name: "গ্রিন থিম", primary: "#166534", accent: "#15803d", bg: "#f0fdf4", header: "#14532d", topbar: "#166534", footer: "#14532d" },
    { name: "পার্পল এলিগ্যান্ট", primary: "#581c87", accent: "#9333ea", bg: "#faf5ff", header: "#3b0764", topbar: "#7c3aed", footer: "#3b0764" },
  ];

  const fontOptions = ["Hind Siliguri", "Noto Sans Bengali", "Kalpurush", "SolaimanLipi", "Bangla MN"];

  return (
    <Card>
      <CardHeader className="p-3 sm:p-6">
        <CardTitle className="text-sm sm:text-base flex items-center gap-2">
          🎨 থিম কাস্টমাইজার
        </CardTitle>
        <p className="text-xs text-muted-foreground">সাইটের রং, ফন্ট সবকিছু পরিবর্তন করুন</p>
      </CardHeader>
      <CardContent className="p-3 sm:p-6 pt-0 space-y-4">
        {/* Presets */}
        <div>
          <p className="text-xs font-medium mb-2">🎭 প্রিসেট থিম</p>
          <div className="grid grid-cols-2 gap-1.5">
            {presets.map((p) => (
              <button key={p.name} onClick={() => setColors({ primary: p.primary, accent: p.accent, background: p.bg, headerBg: p.header, topbarBg: p.topbar, footerBg: p.footer })}
                className="text-[11px] p-2 rounded border hover:bg-muted transition-colors text-left">
                <div className="flex gap-1 mb-1">
                  <span className="w-4 h-4 rounded-full border" style={{ background: p.primary }} />
                  <span className="w-4 h-4 rounded-full border" style={{ background: p.accent }} />
                  <span className="w-4 h-4 rounded-full border" style={{ background: p.bg }} />
                </div>
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Color pickers */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: "প্রাইমারি", key: "primary" as const },
            { label: "অ্যাক্সেন্ট", key: "accent" as const },
            { label: "ব্যাকগ্রাউন্ড", key: "background" as const },
            { label: "হেডার BG", key: "headerBg" as const },
            { label: "টপবার BG", key: "topbarBg" as const },
            { label: "ফুটার BG", key: "footerBg" as const },
          ].map(({ label, key }) => (
            <div key={key} className="space-y-1">
              <label className="text-[11px] font-medium">{label}</label>
              <div className="flex items-center gap-1.5">
                <input type="color" value={colors[key]} onChange={(e) => setColors({ ...colors, [key]: e.target.value })}
                  className="w-8 h-8 rounded cursor-pointer border-0" />
                <Input value={colors[key]} onChange={(e) => setColors({ ...colors, [key]: e.target.value })}
                  className="h-7 text-[10px] font-mono flex-1" />
              </div>
            </div>
          ))}
        </div>

        {/* Font */}
        <div className="space-y-1">
          <label className="text-[11px] font-medium">ফন্ট ফ্যামিলি</label>
          <select className="w-full border rounded-md p-2 bg-background text-sm h-9" value={font} onChange={(e) => setFont(e.target.value)}>
            {fontOptions.map((f) => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
          </select>
        </div>

        {/* Preview */}
        <div className="rounded-lg overflow-hidden border">
          <div className="p-1.5 text-[10px] text-center" style={{ background: colors.topbarBg, color: "#fff" }}>টপবার প্রিভিউ</div>
          <div className="p-2 text-center" style={{ background: colors.headerBg, color: "#fff", fontFamily: font }}>
            <span className="text-sm font-bold">হেডার প্রিভিউ</span>
          </div>
          <div className="p-3 text-center" style={{ background: colors.background, color: colors.primary, fontFamily: font }}>
            <span className="text-sm font-bold" style={{ color: colors.primary }}>প্রাইমারি টেক্সট</span>
            <span className="text-xs ml-2 px-2 py-0.5 rounded" style={{ background: colors.accent, color: "#fff" }}>অ্যাক্সেন্ট</span>
          </div>
          <div className="p-1.5 text-[10px] text-center" style={{ background: colors.footerBg, color: "#fff" }}>ফুটার প্রিভিউ</div>
        </div>

        <Button onClick={saveTheme} className="w-full">
          <Save className="w-4 h-4 mr-1" />থিম সেভ করুন
        </Button>
      </CardContent>
    </Card>
  );
};
const SiteSettingsTab = () => {
  const { data: logoUrl, isLoading: logoLoading } = useSiteSetting("site_logo");
  const { data: siteName } = useSiteSetting("site_name");
  const { data: faviconUrl } = useSiteSetting("site_favicon");
  const { data: logoSize } = useSiteSetting("header_logo_size");
  const { data: socialLinksRaw } = useSiteSetting("social_links");
  const updateSetting = useUpdateSiteSetting();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [localSiteName, setLocalSiteName] = useState("");
  const [localLogoSize, setLocalLogoSize] = useState("64");

  // Social links state
  const [socialLinks, setSocialLinks] = useState<{ platform: string; url: string }[]>([]);
  const [newPlatform, setNewPlatform] = useState("facebook");
  const [newSocialUrl, setNewSocialUrl] = useState("");

  useEffect(() => {
    if (siteName) setLocalSiteName(siteName);
  }, [siteName]);

  useEffect(() => {
    if (logoSize) setLocalLogoSize(logoSize);
  }, [logoSize]);

  useEffect(() => {
    if (socialLinksRaw) {
      try { setSocialLinks(JSON.parse(socialLinksRaw)); } catch { setSocialLinks([]); }
    }
  }, [socialLinksRaw]);

  const handleFileUploadToStorage = async (file: File, path: string, settingKey: string) => {
    setUploading(true);
    try {
      await supabase.storage.from("site-assets").remove([path]);
      const { error: uploadError } = await supabase.storage.from("site-assets").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("site-assets").getPublicUrl(path);
      await updateSetting.mutateAsync({ key: settingKey, value: urlData.publicUrl });
      toast({ title: "আপলোড সফল!" });
    } catch (err: any) {
      toast({ title: "আপলোড ব্যর্থ", description: err.message, variant: "destructive" });
    } finally { setUploading(false); }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUploadToStorage(file, `logo/site-logo.${file.name.split(".").pop()}`, "site_logo");
  };

  const handleFaviconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUploadToStorage(file, `favicon/favicon.${file.name.split(".").pop()}`, "site_favicon");
  };

  const saveSiteName = async () => {
    await updateSetting.mutateAsync({ key: "site_name", value: localSiteName });
    toast({ title: "সাইটের নাম আপডেট হয়েছে" });
  };

  const saveLogoSize = async () => {
    await updateSetting.mutateAsync({ key: "header_logo_size", value: localLogoSize });
    toast({ title: "লোগো সাইজ আপডেট হয়েছে" });
  };

  const addSocialLink = async () => {
    if (!newSocialUrl) return;
    const updated = [...socialLinks, { platform: newPlatform, url: newSocialUrl }];
    await updateSetting.mutateAsync({ key: "social_links", value: JSON.stringify(updated) });
    setSocialLinks(updated);
    setNewSocialUrl("");
    toast({ title: "সোশাল লিংক যুক্ত হয়েছে" });
  };

  const removeSocialLink = async (idx: number) => {
    const updated = socialLinks.filter((_, i) => i !== idx);
    await updateSetting.mutateAsync({ key: "social_links", value: JSON.stringify(updated) });
    setSocialLinks(updated);
    toast({ title: "সোশাল লিংক মুছে ফেলা হয়েছে" });
  };

  const platformOptions = [
    { value: "facebook", label: "Facebook" },
    { value: "youtube", label: "YouTube" },
    { value: "twitter", label: "Twitter/X" },
    { value: "telegram", label: "Telegram" },
    { value: "instagram", label: "Instagram" },
    { value: "tiktok", label: "TikTok" },
    { value: "whatsapp", label: "WhatsApp" },
  ];

  return (
    <Card>
      <CardHeader className="p-3 sm:p-6">
        <CardTitle className="text-sm sm:text-base flex items-center gap-2">
          <Image className="w-4 h-4" /> সাইট সেটিংস
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-6 pt-0 space-y-5">
        {/* Site Name */}
        <div className="space-y-2">
          <p className="text-sm font-medium">সাইটের নাম</p>
          <div className="flex gap-2">
            <Input placeholder="সাইটের নাম" value={localSiteName} onChange={(e) => setLocalSiteName(e.target.value)} className="flex-1 h-8 text-sm" />
            <Button onClick={saveSiteName} size="sm" className="h-8"><Save className="w-3 h-3 mr-1" />সেভ</Button>
          </div>
        </div>

        {/* Logo */}
        <div className="space-y-2">
          <p className="text-sm font-medium">সাইট লোগো</p>
          {logoLoading ? (
            <div className="w-32 h-16 bg-muted animate-pulse rounded" />
          ) : logoUrl ? (
            <img src={logoUrl} alt="সাইট লোগো" className="h-16 w-auto rounded border border-border p-1" />
          ) : (
            <p className="text-xs text-muted-foreground">ডিফল্ট লোগো ব্যবহার হচ্ছে</p>
          )}
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            <Button variant="outline" size="sm" disabled={uploading} asChild>
              <span><Upload className="w-3.5 h-3.5 mr-1" />{uploading ? "আপলোড হচ্ছে..." : "লোগো আপলোড"}</span>
            </Button>
          </label>
        </div>

        {/* Logo Size */}
        <div className="space-y-2">
          <p className="text-sm font-medium">হেডার লোগো সাইজ: {localLogoSize}px</p>
          <div className="flex items-center gap-2">
            <Slider value={[parseInt(localLogoSize) || 64]} onValueChange={([v]) => setLocalLogoSize(String(v))} min={24} max={120} step={4} className="flex-1" />
            <Button onClick={saveLogoSize} size="sm" className="h-7 text-xs"><Save className="w-3 h-3" /></Button>
          </div>
        </div>

        {/* Favicon */}
        <div className="space-y-2">
          <p className="text-sm font-medium">ফেভিকন</p>
          {faviconUrl ? (
            <img src={faviconUrl} alt="ফেভিকন" className="h-8 w-8 rounded border border-border" />
          ) : (
            <p className="text-xs text-muted-foreground">ডিফল্ট ফেভিকন ব্যবহার হচ্ছে</p>
          )}
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input type="file" accept="image/*" onChange={handleFaviconUpload} className="hidden" />
            <Button variant="outline" size="sm" disabled={uploading} asChild>
              <span><Upload className="w-3.5 h-3.5 mr-1" />ফেভিকন আপলোড</span>
            </Button>
          </label>
        </div>

        {/* Social Links */}
        <div className="space-y-2">
          <p className="text-sm font-medium">সোশাল মিডিয়া লিংক</p>
          <div className="space-y-1.5">
            {socialLinks.map((link, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2 rounded border bg-muted/30">
                <span className="text-xs font-medium capitalize w-20">{link.platform}</span>
                <span className="text-xs text-muted-foreground flex-1 truncate">{link.url}</span>
                <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => removeSocialLink(idx)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
          <div className="flex gap-1.5 flex-wrap">
            <select className="border rounded-md p-1.5 bg-background text-xs h-8" value={newPlatform} onChange={(e) => setNewPlatform(e.target.value)}>
              {platformOptions.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
            <Input placeholder="https://..." value={newSocialUrl} onChange={(e) => setNewSocialUrl(e.target.value)} className="flex-1 min-w-[120px] h-8 text-xs" />
            <Button onClick={addSocialLink} size="sm" className="h-8 text-xs"><Plus className="w-3 h-3 mr-1" />যুক্ত</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Admin;