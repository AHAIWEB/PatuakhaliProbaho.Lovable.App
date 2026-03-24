import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Share2, Eye, Link2, Upload, ImagePlus, X, QrCode } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Post = Tables<"posts">;

type TemplateType = "news" | "quote" | "event" | "minimal" | "breaking";

const templates: { id: TemplateType; name: string; icon: string }[] = [
  { id: "news", name: "নিউজ কার্ড", icon: "📰" },
  { id: "quote", name: "কোটেশন কার্ড", icon: "❝" },
  { id: "event", name: "ইভেন্ট কার্ড", icon: "📅" },
  { id: "minimal", name: "মিনিমাল", icon: "✨" },
  { id: "breaking", name: "ব্রেকিং নিউজ", icon: "🔴" },
];

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
  const [activeTemplate, setActiveTemplate] = useState<TemplateType>("news");
  const [qrUrl, setQrUrl] = useState("");
  const [showQr, setShowQr] = useState(false);

  // Upload states
  const [uploadedBgImage, setUploadedBgImage] = useState<string | null>(null);
  const [uploadedPersonImage, setUploadedPersonImage] = useState<string | null>(null);
  const [uploadedFrameImage, setUploadedFrameImage] = useState<string | null>(null);
  const [uploadedLogo, setUploadedLogo] = useState<string | null>(null);
  const [personPosition, setPersonPosition] = useState<"bottom-right" | "bottom-left" | "center-right" | "center-left">("bottom-right");
  const [personSize, setPersonSize] = useState(50);

  const bgInputRef = useRef<HTMLInputElement>(null);
  const personInputRef = useRef<HTMLInputElement>(null);
  const frameInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

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
    setQrUrl(post.source_url || "");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setter(reader.result as string);
    reader.readAsDataURL(file);
  };

  const [extractedQuotes, setExtractedQuotes] = useState<string[]>([]);

  const handleFetchUrl = async () => {
    if (!fetchUrl) return;
    setUrlFetching(true);
    try {
      const { data, error } = await supabase.functions.invoke("scrape-url", { body: { url: fetchUrl, fullContent: true } });
      if (error) throw error;
      if (data?.title) setCustomTitle(data.title);
      if (data?.image) setFetchedImage(data.image);
      if (data?.quotes?.length) setExtractedQuotes(data.quotes);
      setQrUrl(fetchUrl);
      toast({ title: "সফল", description: `ফেচ হয়েছে (${data?.quotes?.length || 0}টি কোটেশন পাওয়া গেছে)` });
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

  const generateQRDataUrl = (text: string, size = 150): string => {
    // Simple QR-like placeholder using canvas text - for real QR, generate via API
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = "#000000";
    // Draw a simple QR-like pattern
    const cellSize = Math.floor(size / 21);
    for (let i = 0; i < 21; i++) {
      for (let j = 0; j < 21; j++) {
        // Position detection patterns (corners)
        const isCorner = (i < 7 && j < 7) || (i < 7 && j > 13) || (i > 13 && j < 7);
        const isBorder = isCorner && (i === 0 || i === 6 || j === 0 || j === 6 || (i >= 2 && i <= 4 && j >= 2 && j <= 4));
        // Data pattern from text hash
        const hash = (text.charCodeAt(i % text.length) * (j + 1) + i * 31) % 3;
        if (isBorder || (!isCorner && hash === 0)) {
          ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
        }
      }
    }
    return canvas.toDataURL("image/png");
  };

  const drawTemplate = async (ctx: CanvasRenderingContext2D) => {
    const W = 1080, H = 1080;

    // Step 1: Background
    const bgSrc = uploadedBgImage || fetchedImage;
    if (bgSrc) {
      try {
        const bgImg = await loadImage(bgSrc);
        ctx.drawImage(bgImg, 0, 0, W, H);
        // Overlay for readability
        if (activeTemplate !== "minimal") {
          ctx.fillStyle = "rgba(0,0,0,0.35)";
          ctx.fillRect(0, 0, W, H);
        }
      } catch {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, W, H);
      }
    } else {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, W, H);
    }

    // Step 2: Frame overlay
    if (uploadedFrameImage) {
      try {
        const frameImg = await loadImage(uploadedFrameImage);
        ctx.drawImage(frameImg, 0, 0, W, H);
      } catch { /* continue */ }
    }

    // Step 3: Template-specific design
    switch (activeTemplate) {
      case "news":
        drawNewsTemplate(ctx, W, H);
        break;
      case "quote":
        drawQuoteTemplate(ctx, W, H);
        break;
      case "event":
        drawEventTemplate(ctx, W, H);
        break;
      case "minimal":
        drawMinimalTemplate(ctx, W, H);
        break;
      case "breaking":
        drawBreakingTemplate(ctx, W, H);
        break;
    }

    // Step 4: Person image
    if (uploadedPersonImage) {
      try {
        const personImg = await loadImage(uploadedPersonImage);
        const size = Math.round(W * (personSize / 100));
        let px = 0, py = 0;
        switch (personPosition) {
          case "bottom-right": px = W - size; py = H - size; break;
          case "bottom-left": px = 0; py = H - size; break;
          case "center-right": px = W - size; py = (H - size) / 2; break;
          case "center-left": px = 0; py = (H - size) / 2; break;
        }
        ctx.drawImage(personImg, px, py, size, size);
      } catch { /* failed */ }
    }

    // Step 5: Logo
    if (uploadedLogo) {
      try {
        const logoImg = await loadImage(uploadedLogo);
        const logoSize = 120;
        ctx.drawImage(logoImg, W - logoSize - 30, 20, logoSize, logoSize);
      } catch { /* fallback text logo */ }
    }

    // Step 6: QR Code
    if (showQr && qrUrl) {
      try {
        const qrDataUrl = generateQRDataUrl(qrUrl, 150);
        const qrImg = await loadImage(qrDataUrl);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(W - 170, H - 170, 160, 160);
        ctx.drawImage(qrImg, W - 165, H - 165, 150, 150);
      } catch { /* failed */ }
    }
  };

  const drawNewsTemplate = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
    // Top accent bar
    ctx.fillStyle = textColor;
    ctx.fillRect(0, 0, W, 8);

    // Category badge
    ctx.fillStyle = textColor;
    ctx.fillRect(60, 60, 200, 45);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 24px 'Hind Siliguri', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("সংবাদ", 160, 93);

    // Logo text
    if (!uploadedLogo) {
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 28px 'Hind Siliguri', sans-serif";
      ctx.textAlign = "right";
      ctx.fillText("পটুয়াখালী প্রবাহ", W - 60, 90);
    }

    // Title
    ctx.textAlign = "left";
    const maxW = uploadedPersonImage ? 580 : 900;
    if (customTitle) {
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 52px 'Hind Siliguri', sans-serif";
      const lines = wrapText(ctx, customTitle, maxW);
      let y = 220;
      lines.forEach((line) => { ctx.fillText(line, 80, y); y += 68; });
    }

    if (customQuote) {
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = "36px 'Hind Siliguri', sans-serif";
      const lines = wrapText(ctx, customQuote, maxW);
      let y = customTitle ? 220 + wrapText(ctx, customTitle, maxW).length * 68 + 30 : 280;
      lines.forEach((line) => { ctx.fillText(line, 80, y); y += 50; });
    }

    drawPersonInfo(ctx, W, H, "#ffffff");

    // Bottom bar
    ctx.fillStyle = textColor;
    ctx.fillRect(0, H - 50, W, 50);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 22px 'Hind Siliguri', sans-serif";
    ctx.textAlign = "center";
    const today = new Date();
    const dateStr = `${today.getDate()} ${["জানু", "ফেব্রু", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টে", "অক্টো", "নভে", "ডিসে"][today.getMonth()]} ${today.getFullYear()}`;
    ctx.fillText(`🔴 patuakhaliprobaho.com  ┃  ${dateStr}`, W / 2, H - 18);
  };

  const drawQuoteTemplate = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
    // Large quote mark
    ctx.fillStyle = "#f4c542";
    ctx.font = "bold 200px serif";
    ctx.textAlign = "left";
    ctx.fillText("❝", 40, 230);

    // Logo text
    if (!uploadedLogo) {
      ctx.fillStyle = textColor;
      ctx.font = "bold 28px 'Hind Siliguri', sans-serif";
      ctx.textAlign = "right";
      ctx.fillText("পটুয়াখালী প্রবাহ", W - 60, 60);
    }

    // Date
    const today = new Date();
    const dateStr = `${today.getDate()} ${["জানু", "ফেব্রু", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টে", "অক্টো", "নভে", "ডিসে"][today.getMonth()]} ${today.getFullYear()}`;
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "22px 'Hind Siliguri', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(dateStr, 80, 60);

    const maxW = uploadedPersonImage ? 580 : 860;

    // Quote text (larger)
    if (customTitle) {
      ctx.fillStyle = uploadedBgImage || fetchedImage ? "#ffffff" : textColor;
      ctx.font = "bold 56px 'Hind Siliguri', sans-serif";
      const lines = wrapText(ctx, customTitle, maxW);
      let y = 340;
      lines.forEach((line) => { ctx.fillText(line, 100, y); y += 74; });
    }

    if (customQuote) {
      ctx.fillStyle = uploadedBgImage || fetchedImage ? "rgba(255,255,255,0.8)" : "#333";
      ctx.font = "italic 40px 'Hind Siliguri', sans-serif";
      const lines = wrapText(ctx, customQuote, maxW);
      let y = customTitle ? 340 + wrapText(ctx, customTitle, maxW).length * 74 + 30 : 350;
      lines.forEach((line) => { ctx.fillText(line, 100, y); y += 54; });
    }

    // Closing quote
    ctx.fillStyle = "#f4c542";
    ctx.font = "bold 200px serif";
    ctx.textAlign = "right";
    ctx.fillText("❞", W - 40, H - 120);

    drawPersonInfo(ctx, W, H, uploadedBgImage || fetchedImage ? "#ffffff" : textColor);

    // Bottom bar
    ctx.fillStyle = textColor;
    ctx.fillRect(0, H - 45, W, 45);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 20px 'Hind Siliguri', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("🔴 patuakhaliprobaho.com", W / 2, H - 15);
  };

  const drawEventTemplate = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
    // Side accent
    ctx.fillStyle = textColor;
    ctx.fillRect(0, 0, 12, H);

    // Event badge
    ctx.fillStyle = "#f4c542";
    ctx.fillRect(40, 60, 220, 50);
    ctx.fillStyle = "#000";
    ctx.font = "bold 26px 'Hind Siliguri', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("📅 ইভেন্ট", 150, 96);

    if (!uploadedLogo) {
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 26px 'Hind Siliguri', sans-serif";
      ctx.textAlign = "right";
      ctx.fillText("পটুয়াখালী প্রবাহ", W - 60, 92);
    }

    const maxW = uploadedPersonImage ? 560 : 880;

    if (customTitle) {
      ctx.fillStyle = uploadedBgImage || fetchedImage ? "#ffffff" : textColor;
      ctx.font = "bold 50px 'Hind Siliguri', sans-serif";
      ctx.textAlign = "left";
      const lines = wrapText(ctx, customTitle, maxW);
      let y = 220;
      lines.forEach((line) => { ctx.fillText(line, 60, y); y += 65; });
    }

    if (customQuote) {
      ctx.fillStyle = uploadedBgImage || fetchedImage ? "rgba(255,255,255,0.85)" : "#444";
      ctx.font = "36px 'Hind Siliguri', sans-serif";
      ctx.textAlign = "left";
      const lines = wrapText(ctx, customQuote, maxW);
      let y = customTitle ? 220 + wrapText(ctx, customTitle, maxW).length * 65 + 30 : 260;
      lines.forEach((line) => { ctx.fillText(line, 60, y); y += 48; });
    }

    drawPersonInfo(ctx, W, H, uploadedBgImage || fetchedImage ? "#ffffff" : "#333");

    ctx.fillStyle = textColor;
    ctx.fillRect(0, H - 50, W, 50);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 22px 'Hind Siliguri', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("patuakhaliprobaho.com", W / 2, H - 18);
  };

  const drawMinimalTemplate = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
    // Clean white/light bg card
    if (!uploadedBgImage && !fetchedImage) {
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, "#f8f9fa");
      grad.addColorStop(1, "#e9ecef");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    }

    // Thin accent line
    ctx.fillStyle = textColor;
    ctx.fillRect(80, 200, 120, 4);

    const maxW = uploadedPersonImage ? 560 : 860;

    if (customTitle) {
      ctx.fillStyle = uploadedBgImage || fetchedImage ? "#ffffff" : "#222";
      ctx.font = "bold 48px 'Hind Siliguri', sans-serif";
      ctx.textAlign = "left";
      const lines = wrapText(ctx, customTitle, maxW);
      let y = 280;
      lines.forEach((line) => { ctx.fillText(line, 80, y); y += 64; });
    }

    if (customQuote) {
      ctx.fillStyle = uploadedBgImage || fetchedImage ? "rgba(255,255,255,0.8)" : "#555";
      ctx.font = "34px 'Hind Siliguri', sans-serif";
      ctx.textAlign = "left";
      const lines = wrapText(ctx, customQuote, maxW);
      let y = customTitle ? 280 + wrapText(ctx, customTitle, maxW).length * 64 + 25 : 290;
      lines.forEach((line) => { ctx.fillText(line, 80, y); y += 46; });
    }

    drawPersonInfo(ctx, W, H, uploadedBgImage || fetchedImage ? "#ffffff" : "#333");

    if (!uploadedLogo) {
      ctx.fillStyle = uploadedBgImage || fetchedImage ? "#ffffff" : textColor;
      ctx.font = "24px 'Hind Siliguri', sans-serif";
      ctx.textAlign = "right";
      ctx.fillText("পটুয়াখালী প্রবাহ", W - 60, H - 30);
    }
  };

  const drawBreakingTemplate = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
    // Red top banner
    ctx.fillStyle = "#e74c3c";
    ctx.fillRect(0, 0, W, 100);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 48px 'Hind Siliguri', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("🔴 ব্রেকিং নিউজ 🔴", W / 2, 68);

    if (!uploadedLogo) {
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 24px 'Hind Siliguri', sans-serif";
      ctx.textAlign = "right";
      ctx.fillText("পটুয়াখালী প্রবাহ", W - 40, 40);
    }

    const maxW = uploadedPersonImage ? 560 : 900;

    if (customTitle) {
      ctx.fillStyle = uploadedBgImage || fetchedImage ? "#ffffff" : "#222";
      ctx.font = "bold 58px 'Hind Siliguri', sans-serif";
      ctx.textAlign = "left";
      const lines = wrapText(ctx, customTitle, maxW);
      let y = 230;
      lines.forEach((line) => { ctx.fillText(line, 70, y); y += 74; });
    }

    if (customQuote) {
      ctx.fillStyle = uploadedBgImage || fetchedImage ? "rgba(255,255,255,0.85)" : "#333";
      ctx.font = "38px 'Hind Siliguri', sans-serif";
      ctx.textAlign = "left";
      const lines = wrapText(ctx, customQuote, maxW);
      let y = customTitle ? 230 + wrapText(ctx, customTitle, maxW).length * 74 + 30 : 260;
      lines.forEach((line) => { ctx.fillText(line, 70, y); y += 52; });
    }

    drawPersonInfo(ctx, W, H, uploadedBgImage || fetchedImage ? "#ffffff" : "#333");

    // Red bottom
    ctx.fillStyle = "#e74c3c";
    ctx.fillRect(0, H - 55, W, 55);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 24px 'Hind Siliguri', sans-serif";
    ctx.textAlign = "center";
    const today = new Date();
    ctx.fillText(`patuakhaliprobaho.com  ┃  ${today.toLocaleDateString("bn-BD")}`, W / 2, H - 18);
  };

  const drawPersonInfo = (ctx: CanvasRenderingContext2D, W: number, H: number, color: string) => {
    if (!quotePerson) return;
    const textX = 100;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(textX, H - 220);
    ctx.lineTo(textX + 200, H - 220);
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.font = "bold 30px 'Hind Siliguri', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(quotePerson, textX, H - 180);

    if (quoteDesignation) {
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.7;
      ctx.font = "24px 'Hind Siliguri', sans-serif";
      ctx.fillText(quoteDesignation, textX, H - 140);
      ctx.globalAlpha = 1;
    }
  };

  const generateCard = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 1080;
    canvas.height = 1080;

    await drawTemplate(ctx);
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

        {/* Template Selector */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {templates.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTemplate(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm whitespace-nowrap transition-colors ${
                activeTemplate === t.id ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-muted border-border"
              }`}
            >
              <span>{t.icon}</span>{t.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-3 sm:space-y-4">
            {/* URL Fetch */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">URL থেকে ফেচ করুন</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <div className="flex gap-2">
                  <Input placeholder="নিউজ URL পেস্ট করুন" value={fetchUrl} onChange={(e) => setFetchUrl(e.target.value)} className="flex-1" />
                  <Button onClick={handleFetchUrl} disabled={urlFetching || !fetchUrl} variant="outline" size="sm">
                    <Link2 className={`w-4 h-4 mr-1 ${urlFetching ? "animate-spin" : ""}`} />ফেচ
                  </Button>
                </div>
                {extractedQuotes.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">❝ AI কোটেশন ({extractedQuotes.length}টি):</p>
                    <div className="max-h-28 overflow-y-auto space-y-1">
                      {extractedQuotes.map((q, i) => (
                        <button key={i} onClick={() => { setCustomQuote(q); toast({ title: "কোটেশন যুক্ত হয়েছে" }); }}
                          className="w-full text-left text-xs p-1.5 rounded border bg-accent/10 hover:bg-accent/20 transition-colors leading-tight">
                          ❝ {q.substring(0, 120)}{q.length > 120 ? "…" : ""} ❞
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Image Uploads */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">📷 ছবি আপলোড</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {/* Background */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">ব্যাকগ্রাউন্ড ছবি</label>
                  <input ref={bgInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, setUploadedBgImage)} />
                  <div className="flex gap-2 items-center">
                    <Button onClick={() => bgInputRef.current?.click()} variant="outline" size="sm" className="flex-1">
                      <Upload className="w-4 h-4 mr-1" />ব্যাকগ্রাউন্ড
                    </Button>
                    {uploadedBgImage && <Button onClick={() => setUploadedBgImage(null)} variant="ghost" size="icon" className="h-8 w-8"><X className="w-4 h-4" /></Button>}
                  </div>
                  {uploadedBgImage && <img src={uploadedBgImage} alt="bg" className="mt-2 h-16 rounded border object-cover" />}
                </div>

                {/* Frame */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">কাস্টম ফ্রেম (PNG)</label>
                  <input ref={frameInputRef} type="file" accept="image/png,image/webp" className="hidden" onChange={(e) => handleFileUpload(e, setUploadedFrameImage)} />
                  <div className="flex gap-2 items-center">
                    <Button onClick={() => frameInputRef.current?.click()} variant="outline" size="sm" className="flex-1">
                      <ImagePlus className="w-4 h-4 mr-1" />ফ্রেম
                    </Button>
                    {uploadedFrameImage && <Button onClick={() => setUploadedFrameImage(null)} variant="ghost" size="icon" className="h-8 w-8"><X className="w-4 h-4" /></Button>}
                  </div>
                  {uploadedFrameImage && <img src={uploadedFrameImage} alt="frame" className="mt-2 h-16 rounded border object-cover" />}
                </div>

                {/* Logo */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">লোগো</label>
                  <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, setUploadedLogo)} />
                  <div className="flex gap-2 items-center">
                    <Button onClick={() => logoInputRef.current?.click()} variant="outline" size="sm" className="flex-1">
                      <Upload className="w-4 h-4 mr-1" />লোগো আপলোড
                    </Button>
                    {uploadedLogo && <Button onClick={() => setUploadedLogo(null)} variant="ghost" size="icon" className="h-8 w-8"><X className="w-4 h-4" /></Button>}
                  </div>
                  {uploadedLogo && <img src={uploadedLogo} alt="logo" className="mt-2 h-12 rounded border object-contain" />}
                </div>

                {/* Person */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">ব্যক্তির ছবি</label>
                  <input ref={personInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, setUploadedPersonImage)} />
                  <div className="flex gap-2 items-center">
                    <Button onClick={() => personInputRef.current?.click()} variant="outline" size="sm" className="flex-1">
                      <ImagePlus className="w-4 h-4 mr-1" />ব্যক্তির ছবি
                    </Button>
                    {uploadedPersonImage && <Button onClick={() => setUploadedPersonImage(null)} variant="ghost" size="icon" className="h-8 w-8"><X className="w-4 h-4" /></Button>}
                  </div>
                  {uploadedPersonImage && (
                    <div className="mt-2 space-y-2">
                      <img src={uploadedPersonImage} alt="person" className="h-16 rounded border object-cover" />
                      <div className="flex gap-1 flex-wrap">
                        {(["bottom-right", "bottom-left", "center-right", "center-left"] as const).map((pos) => (
                          <button key={pos} onClick={() => setPersonPosition(pos)}
                            className={`text-[10px] px-2 py-1 rounded border ${personPosition === pos ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
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

                {/* QR Code option */}
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={showQr} onChange={(e) => setShowQr(e.target.checked)} className="rounded" />
                    <QrCode className="w-4 h-4" /> QR কোড যুক্ত করুন
                  </label>
                  {showQr && (
                    <Input placeholder="QR URL" value={qrUrl} onChange={(e) => setQrUrl(e.target.value)} className="flex-1 text-xs h-8" />
                  )}
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
