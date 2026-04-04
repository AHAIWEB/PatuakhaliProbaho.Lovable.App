import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Download, Share2, Eye, Link2, Upload, ImagePlus, X, QrCode, Type, Sparkles, Send, Globe, Layers, ArrowUp, ArrowDown, Lock, Unlock } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { Tables } from "@/integrations/supabase/types";

type Post = Tables<"posts">;
type TemplateType = "news" | "quote" | "event" | "minimal" | "breaking" | "elegant" | "gradient" | "bold";
type CardSize = "square" | "story" | "landscape" | "poster";

const templates: { id: TemplateType; name: string; icon: string }[] = [
  { id: "news", name: "নিউজ", icon: "📰" },
  { id: "quote", name: "কোটেশন", icon: "❝" },
  { id: "breaking", name: "ব্রেকিং", icon: "🔴" },
  { id: "elegant", name: "এলিগ্যান্ট", icon: "💎" },
  { id: "gradient", name: "গ্রেডিয়েন্ট", icon: "🌈" },
  { id: "bold", name: "বোল্ড", icon: "⚡" },
  { id: "event", name: "ইভেন্ট", icon: "📅" },
  { id: "minimal", name: "মিনিমাল", icon: "✨" },
];

const cardSizes: { id: CardSize; name: string; w: number; h: number }[] = [
  { id: "square", name: "1:1", w: 1080, h: 1080 },
  { id: "story", name: "9:16", w: 1080, h: 1920 },
  { id: "landscape", name: "16:9", w: 1920, h: 1080 },
  { id: "poster", name: "3:4", w: 1080, h: 1440 },
];

const builtInFrames = [
  { id: "none", name: "কোনো ফ্রেম নেই" },
  { id: "classic", name: "ক্লাসিক বর্ডার" },
  { id: "rounded", name: "রাউন্ড কর্নার" },
  { id: "double", name: "ডাবল লাইন" },
  { id: "corner-accent", name: "কর্নার অ্যাক্সেন্ট" },
  { id: "film-strip", name: "ফিল্ম স্ট্রিপ" },
   { id: "ornate", name: "অর্নেট" },
   { id: "modern-geo", name: "মডার্ন জিও" },
   { id: "neon-glow", name: "নিয়ন গ্লো" },
   { id: "newspaper", name: "নিউজপেপার" },
];

const PhotoCard = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [customTitle, setCustomTitle] = useState("");
  const [customQuote, setCustomQuote] = useState("");
  const [quotePerson, setQuotePerson] = useState("");
  const [quoteDesignation, setQuoteDesignation] = useState("");
  const [bgColor, setBgColor] = useState("#1a1a2e");
  const [textColor, setTextColor] = useState("#e74c3c");
  const [titleColor, setTitleColor] = useState("#ffffff");
  const [quoteColor, setQuoteColor] = useState("#dddddd");
  const [fetchUrl, setFetchUrl] = useState("");
  const [urlFetching, setUrlFetching] = useState(false);
  const [fetchedImage, setFetchedImage] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [activeTemplate, setActiveTemplate] = useState<TemplateType>("news");
  const [activeSize, setActiveSize] = useState<CardSize>("square");
  const [qrUrl, setQrUrl] = useState("");
  const [showQr, setShowQr] = useState(false);
  const [titleFontSize, setTitleFontSize] = useState(52);
  const [quoteFontSize, setQuoteFontSize] = useState(36);
  const [logoSize, setLogoSize] = useState(80);
  const [logoOffsetX, setLogoOffsetX] = useState(85);
  const [logoOffsetY, setLogoOffsetY] = useState(5);
  const [activeFrame, setActiveFrame] = useState("none");
  const [frameColor1, setFrameColor1] = useState("#e74c3c");
  const [frameColor2, setFrameColor2] = useState("#f39c12");

  // Upload states
  const [uploadedBgImage, setUploadedBgImage] = useState<string | null>(null);
  const [uploadedPersonImage, setUploadedPersonImage] = useState<string | null>(null);
  const [uploadedFrameImage, setUploadedFrameImage] = useState<string | null>(null);
  const [uploadedLogo, setUploadedLogo] = useState<string | null>(null);
  const [personOffsetX, setPersonOffsetX] = useState(50);
  const [personOffsetY, setPersonOffsetY] = useState(50);
  const [personSize, setPersonSize] = useState(50);
  const [removingBg, setRemovingBg] = useState(false);
  // Image layer: true = image in front of frame, false = behind
  const [imageInFront, setImageInFront] = useState(false);

  // Text position states (draggable)
  const [titleOffsetX, setTitleOffsetX] = useState(50);
  const [titleOffsetY, setTitleOffsetY] = useState(35);
  const [quoteOffsetX, setQuoteOffsetX] = useState(50);
  const [quoteOffsetY, setQuoteOffsetY] = useState(55);
  const [dragTarget, setDragTarget] = useState<"person" | "title" | "quote" | null>(null);

  const bgInputRef = useRef<HTMLInputElement>(null);
  const personInputRef = useRef<HTMLInputElement>(null);
  const frameInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  const dragRef = useRef<{ startX: number; startY: number; startOx: number; startOy: number; active: boolean; target: string }>({
    startX: 0, startY: 0, startOx: 0, startOy: 0, active: false, target: "",
  });

  const [extractedQuotes, setExtractedQuotes] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [postingToSite, setPostingToSite] = useState(false);
  const [aiCategory, setAiCategory] = useState("");
  const [aiSummary, setAiSummary] = useState("");
  const [aiTags, setAiTags] = useState<string[]>([]);

  const extractQuotesLocally = useCallback((text: string) => {
    const cleaned = text.replace(/^শিরোনাম\s*:\s*/i, "").replace(/\s+/g, " ").trim();
    if (!cleaned) return [];
    const directQuotes = Array.from(cleaned.matchAll(/["""'''❝❞]([^"""'''❝❞]{6,500})["""'''❝❞]/g))
      .map((match) => `"${match[1].trim()}"`);
    if (directQuotes.length) return directQuotes.slice(0, 5);
    // Split into sentences and combine for longer quotes (8-10 lines)
    const sentences = cleaned.split(/[।!?]| - | — /).map((p) => p.trim()).filter((p) => p.length > 8);
    if (sentences.length === 0) return [`"${cleaned.slice(0, 500)}"`];
    // Create longer combined quotes
    const quotes: string[] = [];
    if (sentences.length >= 4) {
      quotes.push(`"${sentences.slice(0, Math.min(8, sentences.length)).join("। ")}।"`);
    }
    if (sentences.length >= 2) {
      quotes.push(`"${sentences.slice(0, Math.min(4, sentences.length)).join("। ")}।"`);
    }
    quotes.push(...sentences.slice(0, 3).map((p) => `"${p}"`));
    return quotes.slice(0, 5);
  }, []);

  const getImageProxyUrl = useCallback((src: string) => {
    if (!src || src.startsWith("data:") || src.startsWith("blob:")) return src;
    try {
      const parsed = new URL(src, window.location.origin);
      if (parsed.origin === window.location.origin) return parsed.toString();
      return `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/image-proxy?url=${encodeURIComponent(parsed.toString())}`;
    } catch { return src; }
  }, []);

  useEffect(() => {
    const title = searchParams.get("title");
    const image = searchParams.get("image");
    const quote = searchParams.get("quote");
    const source = searchParams.get("source");
    if (title) setCustomTitle(title);
    if (image) setFetchedImage(image);
    if (quote) setCustomQuote(quote);
    if (source) setQrUrl(source);
  }, [searchParams]);

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
    // Send full content for smarter AI quotes
    const fullText = [post.title, post.content, post.excerpt].filter(Boolean).join("\n\n");
    if (fullText) handleAiQuotes(fullText);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setter(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handlePersonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setUploadedPersonImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeBackground = useCallback(async () => {
    if (!uploadedPersonImage) return;
    setRemovingBg(true);
    try {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width; canvas.height = img.height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const w = canvas.width, h = canvas.height;
        const samples: number[][] = [];
        const sampleSize = Math.min(20, Math.floor(w / 10));
        for (let y = 0; y < sampleSize; y++) {
          for (let x = 0; x < sampleSize; x++) { const i = (y * w + x) * 4; samples.push([data[i], data[i+1], data[i+2]]); }
          for (let x = w - sampleSize; x < w; x++) { const i = (y * w + x) * 4; samples.push([data[i], data[i+1], data[i+2]]); }
        }
        for (let y = h - sampleSize; y < h; y++) {
          for (let x = 0; x < sampleSize; x++) { const i = (y * w + x) * 4; samples.push([data[i], data[i+1], data[i+2]]); }
          for (let x = w - sampleSize; x < w; x++) { const i = (y * w + x) * 4; samples.push([data[i], data[i+1], data[i+2]]); }
        }
        const avgR = samples.reduce((s, c) => s + c[0], 0) / samples.length;
        const avgG = samples.reduce((s, c) => s + c[1], 0) / samples.length;
        const avgB = samples.reduce((s, c) => s + c[2], 0) / samples.length;
        const threshold = 60;
        for (let i = 0; i < data.length; i += 4) {
          const dr = data[i] - avgR, dg = data[i+1] - avgG, db = data[i+2] - avgB;
          const dist = Math.sqrt(dr*dr + dg*dg + db*db);
          if (dist < threshold) data[i+3] = 0;
          else if (dist < threshold + 20) data[i+3] = Math.round(255 * ((dist - threshold) / 20));
        }
        ctx.putImageData(imageData, 0, 0);
        setUploadedPersonImage(canvas.toDataURL("image/png"));
        toast({ title: "✅ ব্যাকগ্রাউন্ড রিমুভ হয়েছে" });
        setRemovingBg(false);
      };
      img.src = uploadedPersonImage;
    } catch {
      setRemovingBg(false);
      toast({ title: "ত্রুটি", description: "ব্যাকগ্রাউন্ড রিমুভ ব্যর্থ", variant: "destructive" });
    }
  }, [uploadedPersonImage, toast]);

  const handleAiQuotes = async (text: string) => {
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-process", { body: { action: "extract_quotes", text } });
      if (error) throw error;
      if (data?.quotes?.length) {
        setExtractedQuotes(data.quotes);
        toast({ title: "✅ AI কোটেশন", description: `${data.quotes.length}টি কোটেশন পাওয়া গেছে` });
      } else {
        const fb = extractQuotesLocally(text);
        setExtractedQuotes(fb);
        toast({ title: "✅ কোটেশন তৈরি হয়েছে", description: `${fb.length}টি কোটেশন পাওয়া গেছে` });
      }
    } catch {
      const fb = extractQuotesLocally(text);
      setExtractedQuotes(fb);
      toast({ title: "✅ কোটেশন তৈরি হয়েছে", description: fb.length ? "Fallback extraction ব্যবহার করা হয়েছে" : "কোটেশন তৈরি করা যায়নি" });
    }
    setAiLoading(false);
  };

  const handleAiCategorize = async (text: string) => {
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-process", { body: { action: "categorize", text } });
      if (error) throw error;
      if (data?.category) setAiCategory(data.category);
      if (data?.summary) setAiSummary(data.summary);
      if (data?.tags?.length) setAiTags(data.tags);
      toast({ title: "✅ ক্যাটাগরি নির্ধারণ হয়েছে", description: `ক্যাটাগরি: ${data?.category || "national"}` });
    } catch {
      toast({ title: "ক্যাটাগরি নির্ধারণ ব্যর্থ", variant: "destructive" });
    }
  };

  const handleFetchUrl = async () => {
    if (!fetchUrl) return;
    setUrlFetching(true);
    try {
      const { data, error } = await supabase.functions.invoke("scrape-url", { body: { url: fetchUrl, fullContent: true } });
      if (error) throw error;
      if (data?.title) setCustomTitle(data.title);
      if (data?.image) setFetchedImage(data.image);
      setQrUrl(fetchUrl);
      if (data?.content || data?.description) {
        await handleAiQuotes(`${data.title}\n\n${data.content || data.description}`);
      } else if (data?.quotes?.length) {
        setExtractedQuotes(data.quotes);
      }
      toast({ title: "✅ ফেচ সফল" });
    } catch (e: any) {
      toast({ title: "ত্রুটি", description: e.message || "ফেচ ব্যর্থ", variant: "destructive" });
    }
    setUrlFetching(false);
  };

  const loadImage = useCallback((src: string): Promise<HTMLImageElement> => {
    const tryLoad = (imageSrc: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.referrerPolicy = "no-referrer";
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image`));
        img.src = imageSrc;
      });
    const proxiedSrc = getImageProxyUrl(src);
    // For external images, try proxy first (more reliable for CORS)
    if (src && !src.startsWith("data:") && !src.startsWith("blob:")) {
      const isExternal = (() => { try { return new URL(src, window.location.origin).origin !== window.location.origin; } catch { return false; } })();
      if (isExternal) return tryLoad(proxiedSrc).catch(() => tryLoad(src));
    }
    return tryLoad(src).catch(() => proxiedSrc !== src ? tryLoad(proxiedSrc) : Promise.reject(new Error("Image load failed")));
  }, [getImageProxyUrl]);

  const generateQRDataUrl = (text: string, size = 150): string => {
    const canvas = document.createElement("canvas");
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = "#000";
    const cellSize = Math.floor(size / 21);
    for (let i = 0; i < 21; i++) {
      for (let j = 0; j < 21; j++) {
        const isCorner = (i < 7 && j < 7) || (i < 7 && j > 13) || (i > 13 && j < 7);
        const isBorder = isCorner && (i === 0 || i === 6 || j === 0 || j === 6 || (i >= 2 && i <= 4 && j >= 2 && j <= 4));
        const hash = (text.charCodeAt(i % text.length) * (j + 1) + i * 31) % 3;
        if (isBorder || (!isCorner && hash === 0)) ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
      }
    }
    return canvas.toDataURL("image/png");
  };

  const getCanvasSize = () => {
    const size = cardSizes.find(s => s.id === activeSize) || cardSizes[0];
    return { W: size.w, H: size.h };
  };

  // Draw built-in frame with gradient colors
  const drawBuiltInFrame = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
    ctx.save();
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, frameColor1);
    grad.addColorStop(1, frameColor2);

    switch (activeFrame) {
      case "classic":
        ctx.strokeStyle = grad; ctx.lineWidth = 12;
        ctx.strokeRect(20, 20, W - 40, H - 40);
        break;
      case "rounded": {
        ctx.strokeStyle = grad; ctx.lineWidth = 8;
        const r = 40;
        ctx.beginPath();
        ctx.moveTo(20 + r, 20); ctx.lineTo(W - 20 - r, 20);
        ctx.quadraticCurveTo(W - 20, 20, W - 20, 20 + r);
        ctx.lineTo(W - 20, H - 20 - r);
        ctx.quadraticCurveTo(W - 20, H - 20, W - 20 - r, H - 20);
        ctx.lineTo(20 + r, H - 20);
        ctx.quadraticCurveTo(20, H - 20, 20, H - 20 - r);
        ctx.lineTo(20, 20 + r);
        ctx.quadraticCurveTo(20, 20, 20 + r, 20);
        ctx.stroke();
        break;
      }
      case "double":
        ctx.strokeStyle = grad; ctx.lineWidth = 4;
        ctx.strokeRect(12, 12, W - 24, H - 24);
        ctx.strokeRect(24, 24, W - 48, H - 48);
        break;
      case "corner-accent": {
        ctx.strokeStyle = grad; ctx.lineWidth = 6;
        const cs = 80;
        ctx.beginPath(); ctx.moveTo(10, cs); ctx.lineTo(10, 10); ctx.lineTo(cs, 10); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(W - cs, 10); ctx.lineTo(W - 10, 10); ctx.lineTo(W - 10, cs); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(10, H - cs); ctx.lineTo(10, H - 10); ctx.lineTo(cs, H - 10); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(W - cs, H - 10); ctx.lineTo(W - 10, H - 10); ctx.lineTo(W - 10, H - cs); ctx.stroke();
        break;
      }
      case "film-strip":
        ctx.fillStyle = "#000"; ctx.fillRect(0, 0, 50, H); ctx.fillRect(W - 50, 0, 50, H);
        ctx.fillStyle = "#fff";
        for (let y = 15; y < H; y += 50) { ctx.fillRect(10, y, 30, 30); ctx.fillRect(W - 40, y, 30, 30); }
        break;
      case "ornate":
        ctx.strokeStyle = grad; ctx.lineWidth = 3;
        ctx.strokeRect(15, 15, W - 30, H - 30);
        ctx.lineWidth = 1;
        ctx.strokeRect(22, 22, W - 44, H - 44);
        const ocs = 60;
        ctx.lineWidth = 2;
        [[15, 15], [W - 15 - ocs, 15], [15, H - 15 - ocs], [W - 15 - ocs, H - 15 - ocs]].forEach(([x, y]) => {
          ctx.beginPath(); ctx.arc(x + ocs / 2, y + ocs / 2, ocs / 3, 0, Math.PI * 2); ctx.stroke();
        });
        break;
      case "modern-geo": {
        // Geometric corner triangles + border
        ctx.fillStyle = frameColor1; ctx.globalAlpha = 0.7;
        const ts = 120;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(ts, 0); ctx.lineTo(0, ts); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(W, 0); ctx.lineTo(W - ts, 0); ctx.lineTo(W, ts); ctx.closePath(); ctx.fill();
        ctx.fillStyle = frameColor2;
        ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(ts, H); ctx.lineTo(0, H - ts); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(W, H); ctx.lineTo(W - ts, H); ctx.lineTo(W, H - ts); ctx.closePath(); ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = grad; ctx.lineWidth = 4;
        ctx.strokeRect(30, 30, W - 60, H - 60);
        break;
      }
      case "neon-glow": {
        // Neon glow border effect
        for (let i = 0; i < 4; i++) {
          ctx.strokeStyle = frameColor1;
          ctx.lineWidth = 8 - i * 2;
          ctx.globalAlpha = 0.3 + i * 0.15;
          ctx.strokeRect(10 + i * 6, 10 + i * 6, W - 20 - i * 12, H - 20 - i * 12);
        }
        ctx.globalAlpha = 1;
        // Corner dots
        ctx.fillStyle = frameColor2;
        [[25, 25], [W - 25, 25], [25, H - 25], [W - 25, H - 25]].forEach(([x, y]) => {
          ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.fill();
        });
        break;
      }
      case "newspaper": {
        // Classic newspaper style
        ctx.fillStyle = frameColor1; ctx.fillRect(0, 0, W, 6); ctx.fillRect(0, H - 6, W, 6);
        ctx.fillRect(0, 10, W, 2); ctx.fillRect(0, H - 12, W, 2);
        ctx.fillRect(0, 0, 6, H); ctx.fillRect(W - 6, 0, 6, H);
        ctx.fillRect(10, 0, 2, H); ctx.fillRect(W - 12, 0, 2, H);
        break;
      }
    }
    ctx.restore();
  };

  // Get first grapheme cluster (handles Bengali conjuncts like প্র, স্ব, etc.)
  const getFirstGrapheme = (text: string): { first: string; rest: string } => {
    if (!text) return { first: "", rest: "" };
    // Use Intl.Segmenter if available for proper grapheme segmentation
    if (typeof Intl !== "undefined" && (Intl as any).Segmenter) {
      const segmenter = new (Intl as any).Segmenter(undefined, { granularity: "grapheme" });
      const segments = [...segmenter.segment(text)];
      if (segments.length === 0) return { first: "", rest: "" };
      return { first: segments[0].segment, rest: segments.slice(1).map((s: any) => s.segment).join("") };
    }
    // Fallback: find the first complete Bengali syllable/conjunct
    // Bengali combining marks: \u09BE-\u09CC (vowel signs), \u09CD (hasanta/virama), \u09D7 (au length mark)
    let i = 1;
    while (i < text.length) {
      const code = text.charCodeAt(i);
      // Continue if it's a combining mark (vowel sign, hasanta, or followed by consonant after hasanta)
      if (code >= 0x09BE && code <= 0x09CC) { i++; continue; }
      if (code === 0x09CD) { i += 2; continue; } // hasanta + next consonant
      if (code === 0x09D7) { i++; continue; }
      break;
    }
    return { first: text.slice(0, i), rest: text.slice(i) };
  };

  const capitalizeFirst = (text: string) => {
    if (!text) return text;
    return text.charAt(0).toUpperCase() + text.slice(1);
  };

  const drawTemplate = async (ctx: CanvasRenderingContext2D) => {
    const { W, H } = getCanvasSize();

    // Determine if fetched image should be treated as a layered content image
    // (when custom frame is uploaded and no separate bg image)
    const fetchedAsLayer = !uploadedBgImage && fetchedImage && uploadedFrameImage;

    // Background - always show fetched image as background when no custom bg
    const bgSrc = uploadedBgImage || fetchedImage;
    if (bgSrc) {
      try {
        const bgImg = await loadImage(bgSrc);
        const scale = Math.max(W / bgImg.width, H / bgImg.height);
        const sw = bgImg.width * scale, sh = bgImg.height * scale;
        ctx.drawImage(bgImg, (W - sw) / 2, (H - sh) / 2, sw, sh);
        if (activeTemplate !== "minimal") {
          ctx.fillStyle = "rgba(0,0,0,0.4)";
          ctx.fillRect(0, 0, W, H);
        }
      } catch (err) {
        console.warn("Background image load failed, using color:", err);
        ctx.fillStyle = bgColor; ctx.fillRect(0, 0, W, H);
      }
    } else {
      ctx.fillStyle = bgColor; ctx.fillRect(0, 0, W, H);
    }

    // Layer order: if imageInFront=true, draw frame first then image. Otherwise image first then frame.
    const drawPersonLayer = async () => {
      // Draw fetched image as layer if applicable
      if (fetchedAsLayer && fetchedImage) {
        try {
          const fetchImg = await loadImage(fetchedImage);
          const scale = Math.max(W / fetchImg.width, H / fetchImg.height);
          const sw = fetchImg.width * scale, sh = fetchImg.height * scale;
          ctx.drawImage(fetchImg, (W - sw) / 2, (H - sh) / 2, sw, sh);
        } catch { /* failed */ }
      }
      // Draw person image
      if (uploadedPersonImage) {
        try {
          const personImg = await loadImage(uploadedPersonImage);
          const size = Math.round(W * (personSize / 100));
          const px = Math.round((W - size) * (personOffsetX / 100));
          const py = Math.round((H - size) * (personOffsetY / 100));
          ctx.drawImage(personImg, px, py, size, size);
        } catch { /* failed */ }
      }
    };

    const drawFrameLayer = async () => {
      if (uploadedFrameImage) {
        try {
          const frameImg = await loadImage(uploadedFrameImage);
          ctx.drawImage(frameImg, 0, 0, W, H);
        } catch { /* continue */ }
      } else if (activeFrame !== "none") {
        drawBuiltInFrame(ctx, W, H);
      }
    };

    if (imageInFront) {
      // Frame first, then person image on top
      await drawFrameLayer();
      await drawPersonLayer();
    } else {
      // Person behind frame
      await drawPersonLayer();
      await drawFrameLayer();
    }

    // Template-specific drawing
    switch (activeTemplate) {
      case "news": drawNewsTemplate(ctx, W, H); break;
      case "quote": drawQuoteTemplate(ctx, W, H); break;
      case "event": drawEventTemplate(ctx, W, H); break;
      case "minimal": drawMinimalTemplate(ctx, W, H); break;
      case "breaking": drawBreakingTemplate(ctx, W, H); break;
      case "elegant": drawElegantTemplate(ctx, W, H); break;
      case "gradient": drawGradientTemplate(ctx, W, H); break;
      case "bold": drawBoldTemplate(ctx, W, H); break;
    }

    // Logo with size/position controls
    if (uploadedLogo) {
      try {
        const logoImg = await loadImage(uploadedLogo);
        const lSize = Math.round(W * (logoSize / 100));
        const lx = Math.round((W - lSize) * (logoOffsetX / 100));
        const ly = Math.round((H - lSize) * (logoOffsetY / 100));
        ctx.drawImage(logoImg, lx, ly, lSize, lSize);
      } catch { /* fallback */ }
    }

    // QR Code
    if (showQr && qrUrl) {
      try {
        const qrDataUrl = generateQRDataUrl(qrUrl, 150);
        const qrImg = await loadImage(qrDataUrl);
        ctx.fillStyle = "#fff";
        ctx.fillRect(W - 170, H - 170, 160, 160);
        ctx.drawImage(qrImg, W - 165, H - 165, 150, 150);
      } catch { /* failed */ }
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

  const hasBgImg = () => !!(uploadedBgImage || fetchedImage);

  const drawSiteBranding = (ctx: CanvasRenderingContext2D, W: number, _H: number) => {
    if (!uploadedLogo) {
      ctx.fillStyle = "#fff";
      ctx.font = "bold 26px 'Hind Siliguri', sans-serif";
      ctx.textAlign = "right";
      ctx.fillText("পটুয়াখালী প্রবাহ", W - 60, 55);
    }
  };

  // Draw title and quote at dynamic positions with drop cap
  const drawTitleAndQuote = (ctx: CanvasRenderingContext2D, W: number, H: number, _startY: number, maxW: number) => {
    const tSize = titleFontSize;
    const qSize = quoteFontSize;

    // Calculate position from percentage
    const titleX = Math.round(W * (titleOffsetX / 100));
    const titleY = Math.round(H * (titleOffsetY / 100));
    const quoteX = Math.round(W * (quoteOffsetX / 100));
    const quoteY = Math.round(H * (quoteOffsetY / 100));

    if (customTitle) {
      const title = capitalizeFirst(customTitle);
      ctx.fillStyle = titleColor;
      ctx.textAlign = "left";

      // Drop cap: first grapheme cluster (handles Bengali conjuncts)
      const { first: firstChar, rest: restText } = getFirstGrapheme(title);
      const dropCapSize = Math.round(tSize * 1.6);

      ctx.font = `bold ${dropCapSize}px 'Hind Siliguri', sans-serif`;
      const dcWidth = ctx.measureText(firstChar).width;
      const startX = Math.max(40, titleX - maxW / 2);
      let y = titleY;

      ctx.fillText(firstChar, startX, y);

      // Rest of the first word on same line
      ctx.font = `bold ${tSize}px 'Hind Siliguri', sans-serif`;
      const firstSpaceIdx = restText.indexOf(" ");
      const firstWordRest = firstSpaceIdx >= 0 ? restText.slice(0, firstSpaceIdx) : restText;
      const remainingText = firstSpaceIdx >= 0 ? restText.slice(firstSpaceIdx + 1) : "";

      ctx.fillText(firstWordRest, startX + dcWidth + 2, y);

      if (remainingText) {
        y += tSize + 16;
        const lines = wrapText(ctx, remainingText, maxW);
        lines.forEach((line) => { ctx.fillText(line, startX, y); y += tSize + 16; });
      }
    }

    if (customQuote) {
      const quote = capitalizeFirst(customQuote);
      ctx.fillStyle = quoteColor;
      ctx.textAlign = "left";

      const { first: firstChar, rest: restText } = getFirstGrapheme(quote);
      const dropCapSize = Math.round(qSize * 1.5);
      const startX = Math.max(40, quoteX - maxW / 2);
      let y = quoteY;

      ctx.font = `bold ${dropCapSize}px 'Hind Siliguri', sans-serif`;
      const dcWidth = ctx.measureText(firstChar).width;
      ctx.fillText(firstChar, startX, y);

      ctx.font = `${qSize}px 'Hind Siliguri', sans-serif`;
      const firstSpaceIdx = restText.indexOf(" ");
      const firstWordRest = firstSpaceIdx >= 0 ? restText.slice(0, firstSpaceIdx) : restText;
      const remainingText = firstSpaceIdx >= 0 ? restText.slice(firstSpaceIdx + 1) : "";

      ctx.fillText(firstWordRest, startX + dcWidth + 2, y);

      if (remainingText) {
        y += qSize + 14;
        const lines = wrapText(ctx, remainingText, maxW);
        lines.forEach((line) => { ctx.fillText(line, startX, y); y += qSize + 14; });
      }
    }
  };

  const drawPersonInfo = (ctx: CanvasRenderingContext2D, W: number, H: number, color: string) => {
    if (!quotePerson) return;
    const textX = 100;
    ctx.strokeStyle = color; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(textX, H - 220); ctx.lineTo(textX + 200, H - 220); ctx.stroke();
    ctx.fillStyle = color;
    ctx.font = "bold 30px 'Hind Siliguri', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(quotePerson, textX, H - 180);
    if (quoteDesignation) {
      ctx.globalAlpha = 0.7;
      ctx.font = "24px 'Hind Siliguri', sans-serif";
      ctx.fillText(quoteDesignation, textX, H - 140);
      ctx.globalAlpha = 1;
    }
  };

  const drawFooter = (ctx: CanvasRenderingContext2D, W: number, H: number, bg: string = textColor) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, H - 50, W, 50);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 22px 'Hind Siliguri', sans-serif";
    ctx.textAlign = "center";
    const today = new Date();
    const months = ["জানু", "ফেব্রু", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টে", "অক্টো", "নভে", "ডিসে"];
    ctx.fillText(`🔴 patuakhaliprobaho.com  ┃  ${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`, W / 2, H - 18);
  };

  const maxW = () => uploadedPersonImage ? 580 : 900;

  // ======== Template Renderers ========
  const drawNewsTemplate = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
    ctx.fillStyle = textColor; ctx.fillRect(0, 0, W, 8);
    ctx.fillStyle = textColor; ctx.fillRect(60, 60, 200, 45);
    ctx.fillStyle = "#fff"; ctx.font = "bold 24px 'Hind Siliguri', sans-serif";
    ctx.textAlign = "center"; ctx.fillText("সংবাদ", 160, 93);
    drawSiteBranding(ctx, W, H);
    ctx.textAlign = "left";
    drawTitleAndQuote(ctx, W, H, 220, maxW());
    drawPersonInfo(ctx, W, H, "#fff");
    drawFooter(ctx, W, H);
  };

  const drawQuoteTemplate = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
    ctx.fillStyle = "#f4c542"; ctx.font = "bold 200px serif";
    ctx.textAlign = "left"; ctx.fillText("❝", 40, 230);
    drawSiteBranding(ctx, W, H);
    drawTitleAndQuote(ctx, W, H, 340, maxW());
    ctx.fillStyle = "#f4c542"; ctx.font = "bold 200px serif";
    ctx.textAlign = "right"; ctx.fillText("❞", W - 40, H - 120);
    drawPersonInfo(ctx, W, H, titleColor);
    drawFooter(ctx, W, H);
  };

  const drawEventTemplate = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
    ctx.fillStyle = textColor; ctx.fillRect(0, 0, 12, H);
    ctx.fillStyle = "#f4c542"; ctx.fillRect(40, 60, 220, 50);
    ctx.fillStyle = "#000"; ctx.font = "bold 26px 'Hind Siliguri', sans-serif";
    ctx.textAlign = "center"; ctx.fillText("📅 ইভেন্ট", 150, 96);
    drawSiteBranding(ctx, W, H);
    drawTitleAndQuote(ctx, W, H, 220, maxW());
    drawPersonInfo(ctx, W, H, titleColor);
    drawFooter(ctx, W, H);
  };

  const drawMinimalTemplate = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
    if (!hasBgImg()) {
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, "#f8f9fa"); grad.addColorStop(1, "#e9ecef");
      ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
    }
    ctx.fillStyle = textColor; ctx.fillRect(80, 200, 120, 4);
    drawTitleAndQuote(ctx, W, H, 280, maxW());
    drawPersonInfo(ctx, W, H, titleColor);
    if (!uploadedLogo) {
      ctx.fillStyle = titleColor;
      ctx.font = "24px 'Hind Siliguri', sans-serif";
      ctx.textAlign = "right";
      ctx.fillText("পটুয়াখালী প্রবাহ", W - 60, H - 30);
    }
  };

  const drawBreakingTemplate = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
    ctx.fillStyle = "#e74c3c"; ctx.fillRect(0, 0, W, 100);
    ctx.fillStyle = "#fff"; ctx.font = "bold 48px 'Hind Siliguri', sans-serif";
    ctx.textAlign = "center"; ctx.fillText("🔴 ব্রেকিং নিউজ 🔴", W / 2, 68);
    drawSiteBranding(ctx, W, H);
    drawTitleAndQuote(ctx, W, H, 230, maxW());
    drawPersonInfo(ctx, W, H, titleColor);
    drawFooter(ctx, W, H, "#e74c3c");
  };

  const drawElegantTemplate = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
    if (!hasBgImg()) {
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, "#0f0c29"); grad.addColorStop(0.5, "#302b63"); grad.addColorStop(1, "#24243e");
      ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
    }
    ctx.strokeStyle = "#c4953a"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(80, 140); ctx.lineTo(W - 80, 140); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(80, H - 100); ctx.lineTo(W - 80, H - 100); ctx.stroke();
    drawSiteBranding(ctx, W, H);
    drawTitleAndQuote(ctx, W, H, 220, maxW());
    drawPersonInfo(ctx, W, H, "#c4953a");
    drawFooter(ctx, W, H, "#1a1a2e");
  };

  const drawGradientTemplate = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
    if (!hasBgImg()) {
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, "#667eea"); grad.addColorStop(1, "#764ba2");
      ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
    }
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(W * 0.8, H * 0.2, 200, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(W * 0.2, H * 0.8, 150, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    drawSiteBranding(ctx, W, H);
    drawTitleAndQuote(ctx, W, H, 250, maxW());
    drawPersonInfo(ctx, W, H, "#fff");
    drawFooter(ctx, W, H, "rgba(0,0,0,0.4)");
  };

  const drawBoldTemplate = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
    if (!hasBgImg()) { ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H); }
    ctx.fillStyle = textColor;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(W * 0.4, 0); ctx.lineTo(0, H * 0.4); ctx.closePath(); ctx.fill();
    drawSiteBranding(ctx, W, H);
    drawTitleAndQuote(ctx, W, H, 300, maxW());
    drawPersonInfo(ctx, W, H, "#fff");
    drawFooter(ctx, W, H, textColor);
  };

  // ======= Generate & Actions =======
  const generateCard = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { W, H } = getCanvasSize();
    canvas.width = W; canvas.height = H;
    await drawTemplate(ctx);
    setPreview(canvas.toDataURL("image/png"));
  };

  const downloadCard = () => {
    if (!preview) return;
    const a = document.createElement("a");
    a.href = preview; a.download = `photocard-${Date.now()}.png`; a.click();
  };

  const shareCard = async () => {
    if (!preview) return;
    try {
      const blob = await (await fetch(preview)).blob();
      const file = new File([blob], "photocard.png", { type: "image/png" });
      if (navigator.share) await navigator.share({ title: customTitle, files: [file] });
      else downloadCard();
    } catch { downloadCard(); }
  };

  const postToSite = async () => {
    if (!preview || !customTitle) {
      toast({ title: "শিরোনাম ও প্রিভিউ প্রয়োজন", variant: "destructive" });
      return;
    }
    setPostingToSite(true);
    try {
      // Convert canvas preview (data URL) to blob and upload to storage
      const blob = await (await fetch(preview)).blob();
      const ext = blob.type === "image/jpeg" ? "jpg" : "png";
      const filePath = `photocards/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("site-assets")
        .upload(filePath, blob, { contentType: blob.type, upsert: false });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("site-assets")
        .getPublicUrl(filePath);
      const uploadedImageUrl = urlData.publicUrl;

      const slug = customTitle.replace(/[^\u0980-\u09FFa-zA-Z0-9\s]/g, "").replace(/\s+/g, "-").toLowerCase() + "-" + Date.now();
      const { error } = await supabase.from("posts").insert({
        title: customTitle, slug,
        content: customQuote || customTitle,
        excerpt: customQuote || customTitle.substring(0, 200),
        image_url: uploadedImageUrl,
        status: "published",
        published_at: new Date().toISOString(),
        author_id: user?.id || null,
        source_url: qrUrl || null,
        tags: ["ফটোকার্ড"],
      });
      if (error) throw error;
      toast({ title: "✅ সাইটে পোস্ট হয়েছে!" });
    } catch (e: any) {
      toast({ title: "পোস্ট ব্যর্থ", description: e.message, variant: "destructive" });
    }
    setPostingToSite(false);
  };

  const shareToBlogger = () => {
    if (!customTitle) return;
    const bloggerUrl = new URL("https://www.blogger.com/blog-this.g");
    const body = `<div style="text-align:center;">
${fetchedImage ? `<img src="${fetchedImage}" alt="${customTitle}" style="max-width:100%;border-radius:8px;" />` : ""}
<h2>${customTitle}</h2>
${customQuote ? `<blockquote>${customQuote}</blockquote>` : ""}
${qrUrl ? `<p><a href="${qrUrl}" target="_blank">বিস্তারিত পড়ুন</a></p>` : ""}
<p style="font-size:12px;color:#888;">সূত্র: পটুয়াখালী প্রবাহ</p>
</div>`;
    bloggerUrl.searchParams.set("n", customTitle);
    bloggerUrl.searchParams.set("t", body);
    if (qrUrl) bloggerUrl.searchParams.set("u", qrUrl);
    window.open(bloggerUrl.toString(), "_blank", "width=700,height=600");
  };

  // ======= Pointer-based Drag (touch + mouse) for person, title, quote =======
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const container = previewContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;

    // Determine which element is closest to the touch point
    const titleDist = Math.hypot(xPct - titleOffsetX, yPct - titleOffsetY);
    const quoteDist = customQuote ? Math.hypot(xPct - quoteOffsetX, yPct - quoteOffsetY) : Infinity;
    const personDist = uploadedPersonImage ? Math.hypot(xPct - personOffsetX, yPct - personOffsetY) : Infinity;

    let target = "title";
    let startOx = titleOffsetX, startOy = titleOffsetY;
    const minDist = Math.min(titleDist, quoteDist, personDist);

    if (minDist === personDist && personDist < 30) {
      target = "person"; startOx = personOffsetX; startOy = personOffsetY;
    } else if (minDist === quoteDist && quoteDist < 30) {
      target = "quote"; startOx = quoteOffsetX; startOy = quoteOffsetY;
    } else {
      target = "title"; startOx = titleOffsetX; startOy = titleOffsetY;
    }

    setDragTarget(target as any);
    dragRef.current = { startX: e.clientX, startY: e.clientY, startOx, startOy, active: true, target };
  }, [uploadedPersonImage, personOffsetX, personOffsetY, titleOffsetX, titleOffsetY, quoteOffsetX, quoteOffsetY, customQuote]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current?.active) return;
    e.preventDefault();
    const container = previewContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const dx = ((e.clientX - dragRef.current.startX) / rect.width) * 100;
    const dy = ((e.clientY - dragRef.current.startY) / rect.height) * 100;
    const nx = Math.max(0, Math.min(100, dragRef.current.startOx + dx));
    const ny = Math.max(0, Math.min(100, dragRef.current.startOy + dy));

    switch (dragRef.current.target) {
      case "person": setPersonOffsetX(nx); setPersonOffsetY(ny); break;
      case "title": setTitleOffsetX(nx); setTitleOffsetY(ny); break;
      case "quote": setQuoteOffsetX(nx); setQuoteOffsetY(ny); break;
    }
  }, []);

  const handlePointerUp = useCallback(() => {
    if (dragRef.current) dragRef.current.active = false;
    setDragTarget(null);
  }, []);

  // Auto-regenerate on drag end
  useEffect(() => {
    if (!dragRef.current?.active && preview) {
      const timer = setTimeout(generateCard, 300);
      return () => clearTimeout(timer);
    }
  }, [personOffsetX, personOffsetY, titleOffsetX, titleOffsetY, quoteOffsetX, quoteOffsetY, logoOffsetX, logoOffsetY, logoSize]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-6">
        <h1 className="text-lg sm:text-2xl font-bold mb-3">📸 ফটোকার্ড জেনারেটর</h1>

        {/* Templates */}
        <div className="flex gap-1.5 mb-2 overflow-x-auto pb-1.5 scrollbar-hide">
          {templates.map((t) => (
            <button key={t.id} onClick={() => setActiveTemplate(t.id)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs whitespace-nowrap transition-all ${
                activeTemplate === t.id ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-card hover:bg-muted border-border"
              }`}>
              <span>{t.icon}</span>{t.name}
            </button>
          ))}
        </div>

        {/* Sizes */}
        <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
          {cardSizes.map((s) => (
            <button key={s.id} onClick={() => setActiveSize(s.id)}
              className={`px-2.5 py-1 rounded border text-xs whitespace-nowrap ${
                activeSize === s.id ? "bg-accent text-accent-foreground border-accent" : "bg-card hover:bg-muted border-border"
              }`}>
              {s.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-5">
          {/* Left: Controls */}
          <div className="space-y-3">
            {/* URL Fetch */}
            <Card>
              <CardHeader className="p-3 pb-1"><CardTitle className="text-sm">🔗 URL ফেচ</CardTitle></CardHeader>
              <CardContent className="p-3 pt-1 space-y-2">
                <div className="flex gap-1.5">
                  <Input placeholder="নিউজ URL পেস্ট করুন" value={fetchUrl} onChange={(e) => setFetchUrl(e.target.value)} className="flex-1 h-9 text-sm" />
                  <Button onClick={handleFetchUrl} disabled={urlFetching || !fetchUrl} variant="outline" size="sm" className="h-9">
                    <Link2 className={`w-3.5 h-3.5 mr-1 ${urlFetching ? "animate-spin" : ""}`} />ফেচ
                  </Button>
                </div>
                {extractedQuotes.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> AI কোটেশন ({extractedQuotes.length}টি):
                    </p>
                    <div className="max-h-24 overflow-y-auto space-y-1">
                      {extractedQuotes.map((q, i) => (
                        <button key={i} onClick={() => { setCustomQuote(q); toast({ title: "কোটেশন যুক্ত হয়েছে" }); }}
                          className="w-full text-left text-[11px] p-1.5 rounded border bg-accent/10 hover:bg-accent/20 transition-colors leading-tight">
                          ❝ {q.substring(0, 100)}{q.length > 100 ? "…" : ""} ❞
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {/* AI Categorize button */}
                {customTitle && (
                  <div className="space-y-1">
                    <Button onClick={() => handleAiCategorize(customTitle + (customQuote ? "\n" + customQuote : ""))} 
                      disabled={aiLoading} variant="outline" size="sm" className="h-8 text-xs w-full">
                      <Sparkles className={`w-3 h-3 mr-1 ${aiLoading ? "animate-spin" : ""}`} />
                      {aiLoading ? "প্রসেসিং..." : "🤖 AI ক্যাটাগরি ও ট্যাগ"}
                    </Button>
                    {aiCategory && (
                      <div className="flex flex-wrap gap-1 items-center">
                        <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">📂 {aiCategory}</span>
                        {aiTags.map((tag, i) => (
                          <span key={i} className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full">#{tag}</span>
                        ))}
                      </div>
                    )}
                    {aiSummary && (
                      <p className="text-[10px] text-muted-foreground leading-tight bg-muted/50 rounded p-1.5">{aiSummary}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Image Uploads */}
            <Card>
              <CardHeader className="p-3 pb-1"><CardTitle className="text-sm">📷 ছবি ও ফ্রেম</CardTitle></CardHeader>
              <CardContent className="p-3 pt-1 space-y-2">
                <div className="grid grid-cols-2 gap-1.5">
                  <input ref={bgInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, setUploadedBgImage)} />
                  <input ref={personInputRef} type="file" accept="image/*" className="hidden" onChange={handlePersonUpload} />
                  <input ref={frameInputRef} type="file" accept="image/png,image/webp" className="hidden" onChange={(e) => handleFileUpload(e, setUploadedFrameImage)} />
                  <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, setUploadedLogo)} />

                  <Button onClick={() => bgInputRef.current?.click()} variant="outline" size="sm" className="h-8 text-xs w-full">
                    <Upload className="w-3 h-3 mr-1" />ব্যাকগ্রাউন্ড
                  </Button>
                  <Button onClick={() => personInputRef.current?.click()} variant="outline" size="sm" className="h-8 text-xs w-full">
                    <ImagePlus className="w-3 h-3 mr-1" />ব্যক্তি ছবি
                  </Button>
                  <Button onClick={() => frameInputRef.current?.click()} variant="outline" size="sm" className="h-8 text-xs w-full">
                    <ImagePlus className="w-3 h-3 mr-1" />কাস্টম ফ্রেম
                  </Button>
                  <Button onClick={() => logoInputRef.current?.click()} variant="outline" size="sm" className="h-8 text-xs w-full">
                    <Upload className="w-3 h-3 mr-1" />লোগো
                  </Button>
                </div>

                {/* Uploaded previews */}
                <div className="flex gap-1.5 flex-wrap">
                  {uploadedBgImage && (
                    <div className="relative">
                      <img src={uploadedBgImage} alt="bg" className="h-10 rounded border object-cover" />
                      <button onClick={() => setUploadedBgImage(null)} className="absolute -top-1 -right-1 bg-destructive text-white rounded-full w-4 h-4 flex items-center justify-center text-[8px]">✕</button>
                    </div>
                  )}
                  {uploadedPersonImage && (
                    <div className="relative">
                      <img src={uploadedPersonImage} alt="person" className="h-10 rounded border object-cover" />
                      <button onClick={() => setUploadedPersonImage(null)} className="absolute -top-1 -right-1 bg-destructive text-white rounded-full w-4 h-4 flex items-center justify-center text-[8px]">✕</button>
                    </div>
                  )}
                  {uploadedFrameImage && (
                    <div className="relative">
                      <img src={uploadedFrameImage} alt="frame" className="h-10 rounded border object-cover" />
                      <button onClick={() => setUploadedFrameImage(null)} className="absolute -top-1 -right-1 bg-destructive text-white rounded-full w-4 h-4 flex items-center justify-center text-[8px]">✕</button>
                    </div>
                  )}
                  {uploadedLogo && (
                    <div className="relative">
                      <img src={uploadedLogo} alt="logo" className="h-10 rounded border object-contain" />
                      <button onClick={() => setUploadedLogo(null)} className="absolute -top-1 -right-1 bg-destructive text-white rounded-full w-4 h-4 flex items-center justify-center text-[8px]">✕</button>
                    </div>
                  )}
                </div>

                {/* Logo size/position controls */}
                {uploadedLogo && (
                  <div className="space-y-1.5 bg-muted/50 rounded p-2">
                    <span className="text-[11px] font-medium">লোগো কন্ট্রোল</span>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] text-muted-foreground">X পজিশন</label>
                        <Slider value={[logoOffsetX]} onValueChange={([v]) => setLogoOffsetX(v)} min={0} max={100} step={1} className="mt-1" />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground">Y পজিশন</label>
                        <Slider value={[logoOffsetY]} onValueChange={([v]) => setLogoOffsetY(v)} min={0} max={100} step={1} className="mt-1" />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground">সাইজ</label>
                        <Slider value={[logoSize]} onValueChange={([v]) => setLogoSize(v)} min={5} max={100} step={1} className="mt-1" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Image layer toggle */}
                {(uploadedPersonImage || uploadedFrameImage || (fetchedImage && uploadedFrameImage)) && (
                  <div className="flex items-center gap-2 bg-muted/50 rounded p-2">
                    <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-[11px] font-medium">ছবি লেয়ার:</span>
                    <Button onClick={() => setImageInFront(!imageInFront)} variant="outline" size="sm" className="h-6 text-[10px] px-2 gap-1">
                      {imageInFront ? <><ArrowUp className="w-3 h-3" />ফ্রন্টে</> : <><ArrowDown className="w-3 h-3" />ব্যাকে</>}
                    </Button>
                  </div>
                )}

                {/* Person image controls */}
                {uploadedPersonImage && (
                  <div className="space-y-1.5 bg-muted/50 rounded p-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium">ছবি কন্ট্রোল</span>
                      <Button onClick={removeBackground} disabled={removingBg} variant="outline" size="sm" className="h-6 text-[10px] px-2">
                        {removingBg ? "⏳ রিমুভ হচ্ছে..." : "🪄 BG রিমুভ"}
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] text-muted-foreground">X পজিশন</label>
                        <Slider value={[personOffsetX]} onValueChange={([v]) => setPersonOffsetX(v)} min={0} max={100} step={1} className="mt-1" />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground">Y পজিশন</label>
                        <Slider value={[personOffsetY]} onValueChange={([v]) => setPersonOffsetY(v)} min={0} max={100} step={1} className="mt-1" />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground">সাইজ</label>
                        <Slider value={[personSize]} onValueChange={([v]) => setPersonSize(v)} min={10} max={100} step={1} className="mt-1" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Built-in frames */}
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">বিল্ট-ইন ফ্রেম</label>
                  <div className="flex gap-1 flex-wrap">
                    {builtInFrames.map((f) => (
                      <button key={f.id} onClick={() => setActiveFrame(f.id)}
                        className={`text-[10px] px-2 py-1 rounded border transition-colors ${
                          activeFrame === f.id ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-muted border-border"
                        }`}>
                        {f.name}
                      </button>
                    ))}
                  </div>
                  {/* Frame gradient color pickers */}
                  {activeFrame !== "none" && !uploadedFrameImage && (
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1">
                        <label className="text-[10px]">ফ্রেম রং ১:</label>
                        <input type="color" value={frameColor1} onChange={(e) => setFrameColor1(e.target.value)} className="w-7 h-7 rounded cursor-pointer border-0" />
                      </div>
                      <div className="flex items-center gap-1">
                        <label className="text-[10px]">ফ্রেম রং ২:</label>
                        <input type="color" value={frameColor2} onChange={(e) => setFrameColor2(e.target.value)} className="w-7 h-7 rounded cursor-pointer border-0" />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Text Customization */}
            <Card>
              <CardHeader className="p-3 pb-1"><CardTitle className="text-sm">✍️ টেক্সট কাস্টমাইজ</CardTitle></CardHeader>
              <CardContent className="p-3 pt-1 space-y-2">
                <Input placeholder="শিরোনাম" value={customTitle} onChange={(e) => setCustomTitle(e.target.value)} className="h-9 text-sm" />
                <Textarea placeholder="কোটেশন / বিস্তারিত (৮-১০ লাইন লিখুন)" value={customQuote} onChange={(e) => setCustomQuote(e.target.value)} rows={6} className="text-sm" />
                <div className="grid grid-cols-2 gap-1.5">
                  <Input placeholder="ব্যক্তির নাম" value={quotePerson} onChange={(e) => setQuotePerson(e.target.value)} className="h-8 text-xs" />
                  <Input placeholder="পদবী" value={quoteDesignation} onChange={(e) => setQuoteDesignation(e.target.value)} className="h-8 text-xs" />
                </div>

                {/* Font size controls */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-muted-foreground flex items-center gap-1"><Type className="w-3 h-3" /> শিরোনাম সাইজ: {titleFontSize}px</label>
                    <Slider value={[titleFontSize]} onValueChange={([v]) => setTitleFontSize(v)} min={24} max={80} step={2} className="mt-1" />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground flex items-center gap-1"><Type className="w-3 h-3" /> কোটেশন সাইজ: {quoteFontSize}px</label>
                    <Slider value={[quoteFontSize]} onValueChange={([v]) => setQuoteFontSize(v)} min={16} max={60} step={2} className="mt-1" />
                  </div>
                </div>

                {/* Colors */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1">
                    <label className="text-[10px]">BG:</label>
                    <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-7 h-7 rounded cursor-pointer border-0" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="text-[10px]">অ্যাক্সেন্ট:</label>
                    <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-7 h-7 rounded cursor-pointer border-0" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="text-[10px]">শিরোনাম:</label>
                    <input type="color" value={titleColor} onChange={(e) => setTitleColor(e.target.value)} className="w-7 h-7 rounded cursor-pointer border-0" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="text-[10px]">কোটেশন:</label>
                    <input type="color" value={quoteColor} onChange={(e) => setQuoteColor(e.target.value)} className="w-7 h-7 rounded cursor-pointer border-0" />
                  </div>
                  <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <input type="checkbox" checked={showQr} onChange={(e) => setShowQr(e.target.checked)} className="rounded" />
                    <QrCode className="w-3.5 h-3.5" /> QR
                  </label>
                </div>
                {showQr && <Input placeholder="QR URL" value={qrUrl} onChange={(e) => setQrUrl(e.target.value)} className="h-8 text-xs" />}

                {/* Manual position controls for title & quote */}
                <div className="space-y-1.5 bg-muted/50 rounded p-2">
                  <span className="text-[11px] font-medium">📍 টেক্সট পজিশন কন্ট্রোল</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-muted-foreground">শিরোনাম X: {titleOffsetX}%</label>
                      <Slider value={[titleOffsetX]} onValueChange={([v]) => setTitleOffsetX(v)} min={0} max={100} step={1} className="mt-0.5" />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground">শিরোনাম Y: {titleOffsetY}%</label>
                      <Slider value={[titleOffsetY]} onValueChange={([v]) => setTitleOffsetY(v)} min={0} max={100} step={1} className="mt-0.5" />
                    </div>
                    {customQuote && (
                      <>
                        <div>
                          <label className="text-[10px] text-muted-foreground">কোটেশন X: {quoteOffsetX}%</label>
                          <Slider value={[quoteOffsetX]} onValueChange={([v]) => setQuoteOffsetX(v)} min={0} max={100} step={1} className="mt-0.5" />
                        </div>
                        <div>
                          <label className="text-[10px] text-muted-foreground">কোটেশন Y: {quoteOffsetY}%</label>
                          <Slider value={[quoteOffsetY]} onValueChange={([v]) => setQuoteOffsetY(v)} min={0} max={100} step={1} className="mt-0.5" />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <p className="text-[10px] text-muted-foreground">👆 প্রিভিউতে টাচ/ড্র্যাগ করে অথবা উপরের স্লাইডার দিয়ে পজিশন ঠিক করুন</p>

                <Button onClick={generateCard} className="w-full h-10">
                  <Eye className="w-4 h-4 mr-2" />প্রিভিউ তৈরি করুন
                </Button>
              </CardContent>
            </Card>

            {/* Post Select */}
            <Card>
              <CardHeader className="p-3 pb-1"><CardTitle className="text-sm">নিউজ সিলেক্ট</CardTitle></CardHeader>
              <CardContent className="p-3 pt-1 max-h-32 overflow-y-auto space-y-1">
                {posts.map((post) => (
                  <button key={post.id} onClick={() => selectPost(post)}
                    className={`w-full text-left p-1.5 rounded text-[11px] border transition-colors ${selectedPost?.id === post.id ? "bg-primary/10 border-primary" : "hover:bg-muted"}`}>
                    {post.title}
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right: Preview */}
          <div>
            <Card className="sticky top-4">
              <CardHeader className="p-3 pb-1"><CardTitle className="text-sm">প্রিভিউ</CardTitle></CardHeader>
              <CardContent className="p-3 pt-1">
                <canvas ref={canvasRef} className="hidden" />
                {preview ? (
                  <div className="space-y-2">
                    <div
                      ref={previewContainerRef}
                      onPointerDown={handlePointerDown}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      className="relative touch-none select-none cursor-grab active:cursor-grabbing"
                    >
                      <img src={preview} alt="Photo Card Preview" className="w-full rounded-lg shadow-lg pointer-events-none" draggable={false} />
                      {/* Selection indicators */}
                      {dragTarget && (
                        <div className="absolute inset-0 pointer-events-none">
                          <div className={`absolute w-5 h-5 rounded-full border-2 border-dashed animate-pulse ${
                            dragTarget === "person" ? "border-blue-400 bg-blue-400/30" : dragTarget === "quote" ? "border-green-400 bg-green-400/30" : "border-yellow-400 bg-yellow-400/30"
                          }`} style={{
                            left: `${(dragTarget === "person" ? personOffsetX : dragTarget === "quote" ? quoteOffsetX : titleOffsetX)}%`,
                            top: `${(dragTarget === "person" ? personOffsetY : dragTarget === "quote" ? quoteOffsetY : titleOffsetY)}%`,
                            transform: "translate(-50%, -50%)",
                          }} />
                        </div>
                      )}
                      <div className={`absolute bottom-2 left-1/2 -translate-x-1/2 text-white text-[10px] px-2.5 py-1 rounded-full transition-colors ${
                        dragTarget ? (dragTarget === "person" ? "bg-blue-600/80" : dragTarget === "quote" ? "bg-green-600/80" : "bg-yellow-600/80") : "bg-black/60"
                      }`}>
                        {dragTarget ? `✋ ${dragTarget === "person" ? "ছবি" : dragTarget === "quote" ? "কোটেশন" : "শিরোনাম"} সরাচ্ছেন` : "👆 ট্যাপ করে ড্র্যাগ করুন"}
                      </div>
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      <Button onClick={downloadCard} className="flex-1 h-9" size="sm"><Download className="w-4 h-4 mr-1" />ডাউনলোড</Button>
                      <Button onClick={shareCard} variant="outline" className="flex-1 h-9" size="sm"><Share2 className="w-4 h-4 mr-1" />শেয়ার</Button>
                      <Button onClick={postToSite} disabled={postingToSite} variant="secondary" className="flex-1 h-9" size="sm">
                        <Send className="w-4 h-4 mr-1" />{postingToSite ? "পোস্ট হচ্ছে..." : "সাইটে পোস্ট"}
                      </Button>
                      <Button onClick={shareToBlogger} variant="outline" className="flex-1 h-9" size="sm">
                        <Globe className="w-4 h-4 mr-1" />ব্লগার শেয়ার
                      </Button>
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
