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
import { Star, Trash2, Edit, Plus, Rss, Newspaper, Tag, RefreshCw, Highlighter, Link2, Save, X, Search, Camera, Globe, ExternalLink, Share2, ArrowUp, ArrowDown, GripVertical, Settings2, Eye, EyeOff, Minus, Upload, Image } from "lucide-react";
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

  // Edit category
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [editCatName, setEditCatName] = useState("");
  const [editCatSlug, setEditCatSlug] = useState("");
  const [editCatParent, setEditCatParent] = useState("");

  // Post search/filter
  const [postSearch, setPostSearch] = useState("");
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

  const handleQuickPost = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const slug = quickTitle.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, "").replace(/\s+/g, "-").substring(0, 100) + "-" + Date.now().toString(36);
    const { error } = await supabase.from("posts").insert({
      title: quickTitle, slug, content: quickContent, excerpt: (quickSummary || quickContent).substring(0, 200),
      image_url: quickImage || null, source_url: quickUrl || null, category_id: quickCategory || null,
      tags: quickTags ? quickTags.split(",").map((t) => t.trim()) : [], status: "published", author_id: user!.id,
    });
    if (error) {
      toast({ title: "ত্রুটি", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "সফল", description: "পোস্ট প্রকাশিত হয়েছে" });
      setQuickTitle(""); setQuickContent(""); setQuickImage(""); setQuickUrl(""); setQuickTags(""); setQuickCategory(""); setQuickSummary("");
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
  };

  const saveEdit = async () => {
    if (!editingPost) return;
    const { error } = await supabase.from("posts").update({
      title: editTitle, category_id: editCategory || null, content: editContent,
      excerpt: cleanText(editContent).substring(0, 200),
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

  if (authLoading) return <div className="flex items-center justify-center min-h-screen">লোড হচ্ছে...</div>;

  const rssPostCount = posts.filter(p => !!p.rss_feed_id).length;
  const scraperPostCount = posts.filter(p => !p.rss_feed_id && !!p.source_name && !p.author_id).length;
  const manualPostCount = posts.filter(p => !!p.author_id).length;

  // Sorted categories for display
  const parentCats = categories.filter(c => !c.parent_id).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const getSubCats = (pid: string) => categories.filter(c => c.parent_id === pid).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="bg-primary text-primary-foreground p-3 sm:p-4 sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between gap-2">
          <h1 className="text-base sm:text-xl font-bold truncate">📋 এডমিন</h1>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <span className="text-[10px] sm:text-sm opacity-80 hidden sm:inline">{userRole}</span>
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
                  <Input placeholder="ইমেজ URL" value={quickImage} onChange={(e) => setQuickImage(e.target.value)} className="text-sm h-9" />
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
                {/* Mobile card view */}
                <div className="sm:hidden space-y-2">
                  {pagedPosts.map((post) => (
                    <div key={post.id} className="border rounded-lg p-2.5 bg-card space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-medium leading-tight flex-1">{cleanText(post.title)}</p>
                        {post.rss_feed_id ? <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded flex-shrink-0">RSS</span>
                          : post.author_id ? <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded flex-shrink-0">ম্যানুয়াল</span>
                          : post.source_name ? <span className="text-[9px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded flex-shrink-0">স্ক্র্যাপ</span>
                          : null}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <span>{post.source_name || "নিজস্ব"}</span>
                        <span>•</span>
                        <span>{post.published_at ? new Date(post.published_at).toLocaleDateString("bn-BD") : ""}</span>
                      </div>
                      <div className="flex items-center gap-1 flex-wrap">
                        <select className="text-[10px] border rounded p-0.5 bg-background w-20" value={post.category_id || ""} onChange={(e) => quickAssignCategory(post.id, e.target.value)}>
                          <option value="">ক্যাটাগরি</option>
                          {categories.map((c) => <option key={c.id} value={c.id}>{c.parent_id ? "↳ " : ""}{c.name}</option>)}
                        </select>
                        <Button size="icon" variant={post.is_featured ? "default" : "ghost"} onClick={() => toggleFeatured(post)} className="h-6 w-6">
                          <Star className="h-3 w-3" />
                        </Button>
                        <Button size="icon" variant={post.is_highlighted ? "default" : "ghost"} onClick={() => toggleHighlighted(post)} className="h-6 w-6">
                          <Highlighter className="h-3 w-3" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => startEdit(post)} className="h-6 w-6">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => goToPhotoCard(post)} className="h-6 w-6" title="কার্ড">
                          <Camera className="h-3 w-3" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => shareToBlogger(post)} className="h-6 w-6" title="Blogger">
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => sharePost(post)} className="h-6 w-6">
                          <Share2 className="h-3 w-3" />
                        </Button>
                        {userRole === "admin" && (
                          <Button size="icon" variant="ghost" onClick={() => deletePost(post.id)} className="h-6 w-6 text-destructive">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
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
                      ["sports", "খেলা"], ["entertainment", "বিনোদন"], ["education", "শিক্ষা"], ["technology", "প্রযুক্তি"], ["economy", "অর্থনীতি"],
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
        </Tabs>
      </div>
    </div>
  );
};

const LayoutSettingsTab = () => {
  const { data: settings, isLoading } = useLayoutSettings();
  const updateSetting = useUpdateLayoutSetting();
  const { toast } = useToast();

  if (isLoading) return <div className="p-4 text-center text-sm text-muted-foreground">লোড হচ্ছে...</div>;

  return (
    <Card>
      <CardHeader className="p-3 sm:p-6">
        <CardTitle className="text-sm sm:text-base flex items-center gap-2">
          <Settings2 className="w-4 h-4" /> হোমপেজ লেআউট সেটিংস
        </CardTitle>
        <p className="text-xs text-muted-foreground">প্রতিটি সেকশনে কতটি পোস্ট দেখাবে তা নিয়ন্ত্রণ করুন</p>
      </CardHeader>
      <CardContent className="p-3 sm:p-6 pt-0 space-y-2">
        {(settings ?? []).map((s) => (
          <div key={s.id} className="flex items-center gap-2 p-2 rounded-lg border bg-card">
            <button
              onClick={() => {
                updateSetting.mutate({ id: s.id, is_visible: !s.is_visible });
                toast({ title: s.is_visible ? "হাইড করা হয়েছে" : "দেখানো হচ্ছে" });
              }}
              className="shrink-0"
            >
              {s.is_visible ? <Eye className="w-4 h-4 text-green-600" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
            </button>
            <span className={`text-xs sm:text-sm flex-1 font-medium ${!s.is_visible ? "opacity-50" : ""}`}>
              {s.section_label}
            </span>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="outline" className="h-7 w-7"
                disabled={s.post_count <= 1}
                onClick={() => {
                  updateSetting.mutate({ id: s.id, post_count: Math.max(1, s.post_count - 1) });
                }}>
                <Minus className="w-3 h-3" />
              </Button>
              <span className="w-7 text-center text-sm font-bold">{s.post_count}</span>
              <Button size="icon" variant="outline" className="h-7 w-7"
                onClick={() => {
                  updateSetting.mutate({ id: s.id, post_count: s.post_count + 1 });
                }}>
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

const SiteSettingsTab = () => {
  const { data: logoUrl, isLoading } = useSiteSetting("site_logo");
  const updateSetting = useUpdateSiteSetting();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `logo/site-logo.${ext}`;
      
      // Remove old logo if exists
      await supabase.storage.from("site-assets").remove([path]);
      
      const { error: uploadError } = await supabase.storage
        .from("site-assets")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("site-assets")
        .getPublicUrl(path);

      await updateSetting.mutateAsync({ key: "site_logo", value: urlData.publicUrl });
      toast({ title: "লোগো আপলোড সফল!" });
    } catch (err: any) {
      toast({ title: "আপলোড ব্যর্থ", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="p-3 sm:p-6">
        <CardTitle className="text-sm sm:text-base flex items-center gap-2">
          <Image className="w-4 h-4" /> সাইট সেটিংস
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-6 pt-0 space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium">সাইট লোগো</p>
          {isLoading ? (
            <div className="w-32 h-16 bg-muted animate-pulse rounded" />
          ) : logoUrl ? (
            <img src={logoUrl} alt="সাইট লোগো" className="h-16 w-auto rounded border border-border p-1" />
          ) : (
            <p className="text-xs text-muted-foreground">কোনো লোগো আপলোড করা হয়নি (ডিফল্ট ব্যবহার হচ্ছে)</p>
          )}
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            <Button variant="outline" size="sm" disabled={uploading} asChild>
              <span>
                <Upload className="w-3.5 h-3.5 mr-1" />
                {uploading ? "আপলোড হচ্ছে..." : "লোগো আপলোড"}
              </span>
            </Button>
          </label>
        </div>
      </CardContent>
    </Card>
  );
};

export default Admin;