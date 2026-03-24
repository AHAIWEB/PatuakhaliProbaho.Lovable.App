import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Share2, Eye, Link2, Upload, ImagePlus, X, Move } from "lucide-react";
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
  const [quotePerson, setQuotePerson] = useState("");
  const [quoteDesignation, setQuoteDesignation] = useState("");
  const [bgColor, setBgColor] = useState("#f5f0eb");
  const [textColor, setTextColor] = useState("#c0392b");
  const [fetchUrl, setFetchUrl] = useState("");
  const [urlFetching, setUrlFetching] = useState(false);
  const [fetchedImage, setFetchedImage] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // Upload states
  const [uploadedBgImage, setUploadedBgImage] = useState<string | null>(null);
  const [uploadedPersonImage, setUploadedPersonImage] = useState<string | null>(null);
  const [uploadedFrameImage, setUploadedFrameImage] = useState<string | null>(null);
  const [personPosition, setPersonPosition] = useState<"bottom-right" | "bottom-left" | "center-right" | "center-left">("bottom-right");
  const [personSize, setPersonSize] = useState(50); // percentage of canvas

  const bgInputRef = useRef<HTMLInputElement>(null);
  const personInputRef = useRef<HTMLInputElement>(null);
  const frameInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setter(reader.result as string);
    reader.readAsDataURL(file);
  };

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

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  const generateCard = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 1080;
    canvas.height = 1080;

    // Step 1: Background
    const bgSrc = uploadedBgImage || fetchedImage;
    if (bgSrc) {
      try {
        const bgImg = await loadImage(bgSrc);
        ctx.drawImage(bgImg, 0, 0, 1080, 1080);
      } catch {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, 1080, 1080);
      }
    } else {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, 1080, 1080);
    }

    // Step 2: Frame overlay (if uploaded)
    if (uploadedFrameImage) {
      try {
        const frameImg = await loadImage(uploadedFrameImage);
        ctx.drawImage(frameImg, 0, 0, 1080, 1080);
      } catch { /* frame load failed, continue */ }
    } else {
      // Default design elements - quote marks
      ctx.fillStyle = "#f4c542";
      ctx.font = "bold 120px serif";
      ctx.textAlign = "left";
      ctx.fillText("❝", 60, 160);

      // Logo top-right
      ctx.fillStyle = textColor;
      ctx.font = "bold 28px 'Hind Siliguri', sans-serif";
      ctx.textAlign = "right";
      ctx.fillText("পটুয়াখালী প্রবাহ", 1020, 60);

      // Date
      const today = new Date();
      const dateStr = `${today.getDate()} ${["জানু", "ফেব্রু", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টে", "অক্টো", "নভে", "ডিসে"][today.getMonth()]} ${today.getFullYear()}`;
      ctx.fillStyle = "#555";
      ctx.font = "22px 'Hind Siliguri', sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(dateStr, 80, 60);

      // Bottom bar
      ctx.fillStyle = textColor;
      ctx.fillRect(0, 1040, 1080, 40);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 20px 'Hind Siliguri', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("🔴 patuakhaliprobaho.com", 540, 1067);
    }

    // Step 3: Person image
    if (uploadedPersonImage) {
      try {
        const personImg = await loadImage(uploadedPersonImage);
        const size = Math.round(1080 * (personSize / 100));
        let px = 0, py = 0;
        switch (personPosition) {
          case "bottom-right": px = 1080 - size; py = 1080 - size; break;
          case "bottom-left": px = 0; py = 1080 - size; break;
          case "center-right": px = 1080 - size; py = (1080 - size) / 2; break;
          case "center-left": px = 0; py = (1080 - size) / 2; break;
        }
        ctx.drawImage(personImg, px, py, size, size);
      } catch { /* person image failed */ }
    }

    // Step 4: Title/Quote text
    ctx.textAlign = "left";
    const textX = 100;
    const maxTextW = uploadedPersonImage ? 600 : 900;

    if (customTitle) {
      ctx.fillStyle = textColor;
      ctx.font = "bold 52px 'Hind Siliguri', sans-serif";
      const titleLines = wrapText(ctx, customTitle, maxTextW);
      let y = 280;
      titleLines.forEach((line) => { ctx.fillText(line, textX, y); y += 68; });
    }

    if (customQuote) {
      ctx.fillStyle = "#333";
      ctx.font = "bold 48px 'Hind Siliguri', sans-serif";
      const quoteLines = wrapText(ctx, customQuote, maxTextW);
      let y = customTitle ? 280 + wrapText(ctx, customTitle, maxTextW).length * 68 + 40 : 300;
      quoteLines.forEach((line) => { ctx.fillText(line, textX, y); y += 62; });
    }

    // Step 5: Person name & designation
    if (quotePerson) {
      ctx.fillStyle = "#333";
      ctx.font = "italic 28px 'Hind Siliguri', sans-serif";
      ctx.textAlign = "left";
      // Separator line
      ctx.strokeStyle = textColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(textX, 860);
      ctx.lineTo(textX + 200, 860);
      ctx.stroke();
      
      ctx.fillStyle = textColor;
      ctx.font = "bold 30px 'Hind Siliguri', sans-serif";
      ctx.fillText(quotePerson, textX, 900);

      if (quoteDesignation) {
        ctx.fillStyle = "#555";
        ctx.font = "24px 'Hind Siliguri', sans-serif";
        ctx.fillText(quoteDesignation, textX, 940);
      }
    }

    setPreview(canvas.toDataURL("image/png"));
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
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">📸 কুইক ফটোকার্ড</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-3 sm:space-y-4">
            {/* URL Fetch */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">URL থেকে ফেচ করুন</CardTitle></CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input placeholder="নিউজ URL পেস্ট করুন" value={fetchUrl} onChange={(e) => setFetchUrl(e.target.value)} className="flex-1" />
                  <Button onClick={handleFetchUrl} disabled={urlFetching || !fetchUrl} variant="outline" size="sm">
                    <Link2 className={`w-4 h-4 mr-1 ${urlFetching ? "animate-spin" : ""}`} />ফেচ
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Image Uploads */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">📷 ছবি আপলোড</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {/* Background Image */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">ব্যাকগ্রাউন্ড ছবি</label>
                  <input ref={bgInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, setUploadedBgImage)} />
                  <div className="flex gap-2 items-center">
                    <Button onClick={() => bgInputRef.current?.click()} variant="outline" size="sm" className="flex-1">
                      <Upload className="w-4 h-4 mr-1" />ব্যাকগ্রাউন্ড আপলোড
                    </Button>
                    {uploadedBgImage && (
                      <Button onClick={() => setUploadedBgImage(null)} variant="ghost" size="icon" className="h-8 w-8">
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  {uploadedBgImage && <img src={uploadedBgImage} alt="bg" className="mt-2 h-16 rounded border object-cover" />}
                </div>

                {/* Frame Upload */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">কাস্টম ফ্রেম (PNG স্বচ্ছ)</label>
                  <input ref={frameInputRef} type="file" accept="image/png,image/webp" className="hidden" onChange={(e) => handleFileUpload(e, setUploadedFrameImage)} />
                  <div className="flex gap-2 items-center">
                    <Button onClick={() => frameInputRef.current?.click()} variant="outline" size="sm" className="flex-1">
                      <ImagePlus className="w-4 h-4 mr-1" />ফ্রেম আপলোড
                    </Button>
                    {uploadedFrameImage && (
                      <Button onClick={() => setUploadedFrameImage(null)} variant="ghost" size="icon" className="h-8 w-8">
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  {uploadedFrameImage && <img src={uploadedFrameImage} alt="frame" className="mt-2 h-16 rounded border object-cover" />}
                </div>

                {/* Person Image */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">ব্যক্তির ছবি</label>
                  <input ref={personInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, setUploadedPersonImage)} />
                  <div className="flex gap-2 items-center">
                    <Button onClick={() => personInputRef.current?.click()} variant="outline" size="sm" className="flex-1">
                      <ImagePlus className="w-4 h-4 mr-1" />ব্যক্তির ছবি আপলোড
                    </Button>
                    {uploadedPersonImage && (
                      <Button onClick={() => setUploadedPersonImage(null)} variant="ghost" size="icon" className="h-8 w-8">
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  {uploadedPersonImage && (
                    <div className="mt-2 space-y-2">
                      <img src={uploadedPersonImage} alt="person" className="h-16 rounded border object-cover" />
                      <div className="flex gap-2 flex-wrap">
                        <label className="text-xs text-muted-foreground">পজিশন:</label>
                        {(["bottom-right", "bottom-left", "center-right", "center-left"] as const).map((pos) => (
                          <button key={pos} onClick={() => setPersonPosition(pos)}
                            className={`text-xs px-2 py-1 rounded border ${personPosition === pos ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                            {pos === "bottom-right" ? "নিচে-ডানে" : pos === "bottom-left" ? "নিচে-বামে" : pos === "center-right" ? "মাঝে-ডানে" : "মাঝে-বামে"}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-muted-foreground">সাইজ:</label>
                        <input type="range" min="20" max="80" value={personSize} onChange={(e) => setPersonSize(Number(e.target.value))} className="flex-1" />
                        <span className="text-xs">{personSize}%</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* News Select */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">নিউজ সিলেক্ট করুন</CardTitle></CardHeader>
              <CardContent className="max-h-36 overflow-y-auto space-y-1">
                {posts.map((post) => (
                  <button key={post.id} onClick={() => selectPost(post)}
                    className={`w-full text-right p-2 rounded text-xs border transition-colors ${selectedPost?.id === post.id ? "bg-primary/10 border-primary" : "hover:bg-muted"}`}>
                    {post.title}
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Customize */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">কাস্টমাইজ</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Input placeholder="শিরোনাম / কোটেশন" value={customTitle} onChange={(e) => setCustomTitle(e.target.value)} />
                <Textarea placeholder="বিস্তারিত লেখা (ঐচ্ছিক)" value={customQuote} onChange={(e) => setCustomQuote(e.target.value)} rows={2} />
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="ব্যক্তির নাম" value={quotePerson} onChange={(e) => setQuotePerson(e.target.value)} />
                  <Input placeholder="পদবী/পরিচয়" value={quoteDesignation} onChange={(e) => setQuoteDesignation(e.target.value)} />
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1">
                    <label className="text-xs">ব্যাকগ্রাউন্ড:</label>
                    <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="text-xs">টেক্সট রঙ:</label>
                    <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
                  </div>
                </div>
                <Button onClick={generateCard} className="w-full">
                  <Eye className="w-4 h-4 mr-2" />প্রিভিউ তৈরি করুন
                </Button>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">প্রিভিউ</CardTitle></CardHeader>
              <CardContent>
                <canvas ref={canvasRef} className="hidden" />
                {preview ? (
                  <div className="space-y-3">
                    <img src={preview} alt="Photo Card Preview" className="w-full rounded-lg shadow-lg" />
                    <div className="flex gap-2">
                      <Button onClick={downloadCard} className="flex-1" size="sm"><Download className="w-4 h-4 mr-1" />ডাউনলোড</Button>
                      <Button onClick={shareCard} variant="outline" className="flex-1" size="sm"><Share2 className="w-4 h-4 mr-1" />শেয়ার</Button>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-square bg-muted rounded-lg flex items-center justify-center text-muted-foreground text-sm">
                    প্রিভিউ দেখতে বাটনে ক্লিক করুন
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
