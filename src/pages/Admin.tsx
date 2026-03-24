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
import { Star, Trash2, Edit, Plus, Rss, Newspaper, Tag, RefreshCw, Highlighter, Link2, Save, X, Search } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

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
  const [loading, setLoading] = useState(false);

  // Quick post form
  const [quickUrl, setQuickUrl] = useState("");
  const [quickTitle, setQuickTitle] = useState("");
  const [quickContent, setQuickContent] = useState("");
  const [quickImage, setQuickImage] = useState("");
  const [quickCategory, setQuickCategory] = useState("");
  const [quickTags, setQuickTags] = useState("");
  const [urlFetching, setUrlFetching] = useState(false);

  // RSS feed form
  const [feedUrl, setFeedUrl] = useState("");
  const [feedName, setFeedName] = useState("");
  const [feedDivision, setFeedDivision] = useState("");
  const [feedCategory, setFeedCategory] = useState("general");

  // Category form
  const [newCatName, setNewCatName] = useState("");
  const [newCatSlug, setNewCatSlug] = useState("");

  // Edit post
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editContent, setEditContent] = useState("");

  // Post search/filter
  const [postSearch, setPostSearch] = useState("");
  const [postPage, setPostPage] = useState(0);
  const postsPerPage = 50;

  useEffect(() => {
    if (!authLoading && (!user || !["admin", "editor", "reporter"].includes(userRole || ""))) {
      navigate("/auth");
      return;
    }
    if (user) fetchData();
  }, [user, userRole, authLoading]);

  const fetchData = async () => {
    const [postsRes, feedsRes, catsRes] = await Promise.all([
      supabase.from("posts").select("*").order("published_at", { ascending: false }).limit(200),
      supabase.from("rss_feeds").select("*").order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("sort_order"),
    ]);
    if (postsRes.data) setPosts(postsRes.data);
    if (feedsRes.data) setFeeds(feedsRes.data);
    if (catsRes.data) setCategories(catsRes.data);
  };

  // Auto-fetch from URL
  const handleFetchUrl = async () => {
    if (!quickUrl) return;
    setUrlFetching(true);
    try {
      const { data, error } = await supabase.functions.invoke("scrape-url", {
        body: { url: quickUrl },
      });
      if (error) throw error;
      if (data?.title) setQuickTitle(data.title);
      if (data?.description) setQuickContent(data.description);
      if (data?.image) setQuickImage(data.image);
      toast({ title: "সফল", description: "URL থেকে ডাটা ফেচ হয়েছে" });
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
      title: quickTitle, slug, content: quickContent, excerpt: quickContent.substring(0, 200),
      image_url: quickImage || null, source_url: quickUrl || null, category_id: quickCategory || null,
      tags: quickTags ? quickTags.split(",").map((t) => t.trim()) : [], status: "published", author_id: user!.id,
    });
    if (error) {
      toast({ title: "ত্রুটি", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "সফল", description: "পোস্ট প্রকাশিত হয়েছে" });
      setQuickTitle(""); setQuickContent(""); setQuickImage(""); setQuickUrl(""); setQuickTags(""); setQuickCategory("");
      fetchData();
    }
    setLoading(false);
  };

  const handleAddFeed = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("rss_feeds").insert({
      url: feedUrl, name: feedName, division: feedDivision || null, category: feedCategory,
    });
    if (error) {
      toast({ title: "ত্রুটি", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "সফল", description: "RSS ফিড যুক্ত হয়েছে" });
      setFeedUrl(""); setFeedName(""); setFeedDivision("");
      fetchData();
    }
  };

  const handleFetchRSS = async () => {
    setLoading(true);
    toast({ title: "ফেচিং...", description: "RSS ফিড থেকে নিউজ ফেচ করা হচ্ছে" });
    const { data, error } = await supabase.functions.invoke("fetch-rss");
    if (error) {
      toast({ title: "ত্রুটি", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "সফল", description: `${data?.fetched || 0}টি নিউজ ফেচ হয়েছে` });
      fetchData();
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

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("categories").insert({ name: newCatName, slug: newCatSlug });
    if (error) {
      toast({ title: "ত্রুটি", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "সফল", description: "ক্যাটাগরি যুক্ত হয়েছে" });
      setNewCatName(""); setNewCatSlug("");
      fetchData();
    }
  };

  // Edit post handlers
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
      excerpt: editContent.substring(0, 200),
    }).eq("id", editingPost.id);
    if (error) {
      toast({ title: "ত্রুটি", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "সফল", description: "পোস্ট আপডেট হয়েছে" });
      setEditingPost(null);
      fetchData();
    }
  };

  // Quick assign category to post
  const quickAssignCategory = async (postId: string, categoryId: string) => {
    await supabase.from("posts").update({ category_id: categoryId || null }).eq("id", postId);
    fetchData();
  };

  const filteredPosts = posts.filter((p) =>
    !postSearch || p.title.toLowerCase().includes(postSearch.toLowerCase()) ||
    (p.source_name || "").toLowerCase().includes(postSearch.toLowerCase())
  );
  const pagedPosts = filteredPosts.slice(postPage * postsPerPage, (postPage + 1) * postsPerPage);

  if (authLoading) return <div className="flex items-center justify-center min-h-screen">লোড হচ্ছে...</div>;

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="bg-primary text-primary-foreground p-4">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold">📋 এডমিন প্যানেল</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm opacity-80">রোল: {userRole}</span>
            <Button variant="secondary" size="sm" onClick={() => navigate("/")}>হোমপেজ</Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-4">
        <Tabs defaultValue="quick-post">
          <TabsList className="w-full flex-wrap h-auto gap-1">
            <TabsTrigger value="quick-post"><Newspaper className="w-4 h-4 mr-1" />কুইক পোস্ট</TabsTrigger>
            <TabsTrigger value="posts"><Edit className="w-4 h-4 mr-1" />সকল পোস্ট ({posts.length})</TabsTrigger>
            <TabsTrigger value="rss"><Rss className="w-4 h-4 mr-1" />RSS ম্যানেজার</TabsTrigger>
            <TabsTrigger value="categories"><Tag className="w-4 h-4 mr-1" />ক্যাটাগরি</TabsTrigger>
          </TabsList>

          {/* Quick Post Tab */}
          <TabsContent value="quick-post">
            <Card>
              <CardHeader><CardTitle>কুইক পোস্ট</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleQuickPost} className="space-y-4">
                  <div className="flex gap-2">
                    <Input placeholder="নিউজ URL পেস্ট করুন (অটো ফেচ)" value={quickUrl} onChange={(e) => setQuickUrl(e.target.value)} className="flex-1" />
                    <Button type="button" onClick={handleFetchUrl} disabled={urlFetching || !quickUrl} variant="outline">
                      <Link2 className={`w-4 h-4 mr-1 ${urlFetching ? "animate-spin" : ""}`} />ফেচ
                    </Button>
                  </div>
                  <Input placeholder="শিরোনাম *" value={quickTitle} onChange={(e) => setQuickTitle(e.target.value)} required />
                  <Textarea placeholder="কন্টেন্ট" value={quickContent} onChange={(e) => setQuickContent(e.target.value)} rows={6} />
                  <Input placeholder="ইমেজ URL" value={quickImage} onChange={(e) => setQuickImage(e.target.value)} />
                  {quickImage && <img src={quickImage} alt="preview" className="h-24 object-cover rounded" />}
                  <select className="w-full border rounded-md p-2 bg-background" value={quickCategory} onChange={(e) => setQuickCategory(e.target.value)}>
                    <option value="">ক্যাটাগরি নির্বাচন করুন</option>
                    {categories.filter((c) => !c.parent_id).map((c) => (
                      <optgroup key={c.id} label={c.name}>
                        <option value={c.id}>{c.name}</option>
                        {categories.filter((sc) => sc.parent_id === c.id).map((sc) => (
                          <option key={sc.id} value={sc.id}>↳ {sc.name}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <Input placeholder="ট্যাগ (কমা দিয়ে আলাদা)" value={quickTags} onChange={(e) => setQuickTags(e.target.value)} />
                  <Button type="submit" disabled={loading} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />পোস্ট করুন
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* All Posts Tab */}
          <TabsContent value="posts">
            {/* Edit Modal */}
            {editingPost && (
              <Card className="mb-4 border-accent">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>পোস্ট এডিট করুন</CardTitle>
                    <Button variant="ghost" size="icon" onClick={() => setEditingPost(null)}><X className="h-4 w-4" /></Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="শিরোনাম" />
                  <select className="w-full border rounded-md p-2 bg-background" value={editCategory} onChange={(e) => setEditCategory(e.target.value)}>
                    <option value="">ক্যাটাগরি নির্বাচন</option>
                    {categories.filter((c) => !c.parent_id).map((c) => (
                      <optgroup key={c.id} label={c.name}>
                        <option value={c.id}>{c.name}</option>
                        {categories.filter((sc) => sc.parent_id === c.id).map((sc) => (
                          <option key={sc.id} value={sc.id}>↳ {sc.name}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={4} placeholder="কন্টেন্ট" />
                  <Button onClick={saveEdit}><Save className="w-4 h-4 mr-2" />সেভ করুন</Button>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <CardTitle>সকল পোস্ট ({filteredPosts.length})</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="সার্চ..." className="pl-8 w-48" value={postSearch} onChange={(e) => { setPostSearch(e.target.value); setPostPage(0); }} />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>শিরোনাম</TableHead>
                      <TableHead>ক্যাটাগরি</TableHead>
                      <TableHead>সোর্স</TableHead>
                      <TableHead>তারিখ</TableHead>
                      <TableHead>অ্যাকশন</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedPosts.map((post) => (
                      <TableRow key={post.id}>
                        <TableCell className="max-w-[180px] truncate font-medium">{post.title}</TableCell>
                        <TableCell>
                          <select
                            className="text-xs border rounded p-1 bg-background w-24"
                            value={post.category_id || ""}
                            onChange={(e) => quickAssignCategory(post.id, e.target.value)}
                          >
                            <option value="">—</option>
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>{c.parent_id ? "↳ " : ""}{c.name}</option>
                            ))}
                          </select>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{post.source_name || "নিজস্ব"}</TableCell>
                        <TableCell className="text-xs">{post.published_at ? new Date(post.published_at).toLocaleDateString("bn-BD") : ""}</TableCell>
                        <TableCell>
                          <div className="flex gap-0.5">
                            <Button size="icon" variant={post.is_featured ? "default" : "ghost"} onClick={() => toggleFeatured(post)} title="ফিচার্ড">
                              <Star className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant={post.is_highlighted ? "default" : "ghost"} onClick={() => toggleHighlighted(post)} title="হাইলাইট">
                              <Highlighter className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => startEdit(post)} title="এডিট">
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            {userRole === "admin" && (
                              <Button size="icon" variant="ghost" onClick={() => deletePost(post.id)} className="text-destructive">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredPosts.length > postsPerPage && (
                  <div className="flex gap-2 mt-4 justify-center">
                    <Button variant="outline" size="sm" disabled={postPage === 0} onClick={() => setPostPage((p) => p - 1)}>আগের</Button>
                    <span className="text-sm text-muted-foreground self-center">
                      {postPage + 1} / {Math.ceil(filteredPosts.length / postsPerPage)}
                    </span>
                    <Button variant="outline" size="sm" disabled={(postPage + 1) * postsPerPage >= filteredPosts.length} onClick={() => setPostPage((p) => p + 1)}>পরের</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* RSS Tab */}
          <TabsContent value="rss">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>RSS ফিড ম্যানেজার ({feeds.length})</CardTitle>
                    <Button onClick={handleFetchRSS} disabled={loading}>
                      <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />এখনই ফেচ করুন
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddFeed} className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                    <Input placeholder="RSS URL *" value={feedUrl} onChange={(e) => setFeedUrl(e.target.value)} required />
                    <Input placeholder="নাম *" value={feedName} onChange={(e) => setFeedName(e.target.value)} required />
                    <Input placeholder="বিভাগ (যেমন: barisal)" value={feedDivision} onChange={(e) => setFeedDivision(e.target.value)} />
                    <select className="border rounded-md p-2 bg-background" value={feedCategory} onChange={(e) => setFeedCategory(e.target.value)}>
                      <option value="general">সাধারণ</option>
                      <option value="national">জাতীয়</option>
                      <option value="international">আন্তর্জাতিক</option>
                      <option value="divisional">বিভাগীয়</option>
                      <option value="tv">টিভি</option>
                    </select>
                    <Button type="submit" className="md:col-span-2"><Plus className="w-4 h-4 mr-2" />ফিড যুক্ত করুন</Button>
                  </form>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>নাম</TableHead>
                        <TableHead>URL</TableHead>
                        <TableHead>বিভাগ</TableHead>
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
                          <TableCell className="text-xs">{feed.last_fetched_at ? new Date(feed.last_fetched_at).toLocaleString("bn-BD") : "কখনো না"}</TableCell>
                          <TableCell>
                            <Button size="icon" variant="ghost" onClick={() => deleteFeed(feed.id)} className="text-destructive">
                              <Trash2 className="h-3.5 w-3.5" />
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

          {/* Categories Tab */}
          <TabsContent value="categories">
            <Card>
              <CardHeader><CardTitle>ক্যাটাগরি ম্যানেজমেন্ট</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleAddCategory} className="flex gap-3 mb-6">
                  <Input placeholder="ক্যাটাগরি নাম" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} required />
                  <Input placeholder="স্লাগ (english)" value={newCatSlug} onChange={(e) => setNewCatSlug(e.target.value)} required />
                  <Button type="submit"><Plus className="w-4 h-4" /></Button>
                </form>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {categories.map((cat) => (
                    <div key={cat.id} className={`p-2 rounded border text-sm ${cat.parent_id ? "ml-4 bg-muted/50" : "font-medium"}`}>
                      {cat.name}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
