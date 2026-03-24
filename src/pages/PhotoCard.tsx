import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Share2, Eye, Link2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Post = Tables<"posts">;

const PhotoCard = () => {
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [customTitle, setCustomTitle] = useState("");
  const [customQuote, setCustomQuote] = useState("");
  const [bgColor, setBgColor] = useState("#1a5276");
  const [fetchUrl, setFetchUrl] = useState("");
  const [urlFetching, setUrlFetching] = useState(false);
  const [fetchedImage, setFetchedImage] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("posts").select("*").eq("status", "published")
      .order("published_at", { ascending: false }).limit(20)
      .then(({ data }) => { if (data) setPosts(data); });
  }, []);

  const selectPost = (post: Post) => {
    setSelectedPost(post);
    setCustomTitle(post.title);
    setFetchedImage(post.image_url || "");
    setCustomQuote("");
  };

  // Fetch from URL
  const handleFetchUrl = async () => {
    if (!fetchUrl) return;
    setUrlFetching(true);
    try {
      const { data, error } = await supabase.functions.invoke("scrape-url", {
        body: { url: fetchUrl },
      });
      if (error) throw error;
      if (data?.title) setCustomTitle(data.title);
      if (data?.image) setFetchedImage(data.image);
      toast({ title: "সফল", description: "URL থেকে ডাটা ফেচ হয়েছে" });
    } catch (e: any) {
      toast({ title: "ত্রুটি", description: e.message || "ফেচ ব্যর্থ", variant: "destructive" });
    }
    setUrlFetching(false);
  };

  const generateCard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 1080;
    canvas.height = 1080;

    const drawContent = () => {
      // Gradient overlay
      const grad = ctx.createLinearGradient(0, 0, 0, 1080);
      grad.addColorStop(0, "rgba(0,0,0,0.2)");
      grad.addColorStop(1, "rgba(0,0,0,0.7)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1080, 1080);

      // Logo
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 32px 'Hind Siliguri', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("পটুয়াখালী প্রবাহ", 540, 80);

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(340, 100);
      ctx.lineTo(740, 100);
      ctx.stroke();

      // Title
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 48px 'Hind Siliguri', sans-serif";
      const titleLines = wrapText(ctx, customTitle, 900);
      let y = 400;
      titleLines.forEach((line) => { ctx.fillText(line, 540, y); y += 60; });

      // Quote
      if (customQuote) {
        ctx.font = "italic 28px 'Hind Siliguri', sans-serif";
        ctx.fillStyle = "#e0e0e0";
        y += 30;
        ctx.fillText(`❝ ${customQuote} ❞`, 540, y);
      }

      // Footer
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.fillRect(0, 1020, 1080, 60);
      ctx.fillStyle = "#ffffff";
      ctx.font = "20px 'Hind Siliguri', sans-serif";
      ctx.fillText("patuakhaliprobaho.com", 540, 1055);

      setPreview(canvas.toDataURL("image/png"));
    };

    // Try loading background image
    if (fetchedImage) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        ctx.drawImage(img, 0, 0, 1080, 1080);
        drawContent();
      };
      img.onerror = () => {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, 1080, 1080);
        drawContent();
      };
      img.src = fetchedImage;
    } else {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, 1080, 1080);
      drawContent();
    }
  };

  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    const words = text.split(" ");
    const lines: string[] = [];
    let line = "";
    for (const word of words) {
      const test = line + word + " ";
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line.trim());
        line = word + " ";
      } else line = test;
    }
    if (line.trim()) lines.push(line.trim());
    return lines;
  };

  const downloadCard = () => {
    if (!preview) return;
    const a = document.createElement("a");
    a.href = preview;
    a.download = `photocard-${Date.now()}.png`;
    a.click();
  };

  const shareCard = async () => {
    if (!preview) return;
    try {
      const blob = await (await fetch(preview)).blob();
      const file = new File([blob], "photocard.png", { type: "image/png" });
      if (navigator.share) {
        await navigator.share({ title: customTitle, files: [file] });
      } else downloadCard();
    } catch { downloadCard(); }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">📸 কুইক ফটোকার্ড</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            {/* URL Fetch */}
            <Card>
              <CardHeader><CardTitle>URL থেকে ফেচ করুন</CardTitle></CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input placeholder="নিউজ URL পেস্ট করুন" value={fetchUrl} onChange={(e) => setFetchUrl(e.target.value)} className="flex-1" />
                  <Button onClick={handleFetchUrl} disabled={urlFetching || !fetchUrl} variant="outline">
                    <Link2 className={`w-4 h-4 mr-1 ${urlFetching ? "animate-spin" : ""}`} />ফেচ
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* News Select */}
            <Card>
              <CardHeader><CardTitle>অথবা নিউজ সিলেক্ট করুন</CardTitle></CardHeader>
              <CardContent className="max-h-48 overflow-y-auto space-y-1">
                {posts.map((post) => (
                  <button key={post.id} onClick={() => selectPost(post)}
                    className={`w-full text-right p-2 rounded text-sm border transition-colors ${selectedPost?.id === post.id ? "bg-primary/10 border-primary" : "hover:bg-muted"}`}>
                    {post.title}
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Customize */}
            <Card>
              <CardHeader><CardTitle>কাস্টমাইজ</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Input placeholder="শিরোনাম" value={customTitle} onChange={(e) => setCustomTitle(e.target.value)} />
                <Textarea placeholder="❝ কোটেশন লেখা ❞" value={customQuote} onChange={(e) => setCustomQuote(e.target.value)} rows={2} />
                <Input placeholder="ইমেজ URL (ব্যাকগ্রাউন্ড)" value={fetchedImage} onChange={(e) => setFetchedImage(e.target.value)} />
                <div className="flex items-center gap-3">
                  <label className="text-sm">ব্যাকগ্রাউন্ড রঙ (ছবি না থাকলে):</label>
                  <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer" />
                </div>
                <Button onClick={generateCard} className="w-full">
                  <Eye className="w-4 h-4 mr-2" />প্রিভিউ তৈরি করুন
                </Button>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader><CardTitle>প্রিভিউ</CardTitle></CardHeader>
              <CardContent>
                <canvas ref={canvasRef} className="hidden" />
                {preview ? (
                  <div className="space-y-4">
                    <img src={preview} alt="Photo Card Preview" className="w-full rounded-lg shadow-lg" />
                    <div className="flex gap-3">
                      <Button onClick={downloadCard} className="flex-1"><Download className="w-4 h-4 mr-2" />ডাউনলোড</Button>
                      <Button onClick={shareCard} variant="outline" className="flex-1"><Share2 className="w-4 h-4 mr-2" />শেয়ার</Button>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-square bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                    প্রিভিউ দেখতে উপরের বাটনে ক্লিক করুন
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PhotoCard;
