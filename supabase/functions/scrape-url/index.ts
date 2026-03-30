import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function isPrivateUrl(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    if (!["http:", "https:"].includes(parsed.protocol)) return true;
    const hostname = parsed.hostname.toLowerCase();
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1" || hostname === "[::1]") return true;
    if (hostname === "metadata.google.internal") return true;
    const parts = hostname.split(".").map(Number);
    if (parts.length === 4 && parts.every(n => !isNaN(n))) {
      if (parts[0] === 10) return true;
      if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
      if (parts[0] === 192 && parts[1] === 168) return true;
      if (parts[0] === 169 && parts[1] === 254) return true;
      if (parts[0] === 127) return true;
      if (parts[0] === 0) return true;
    }
    return false;
  } catch {
    return true;
  }
}

async function verifyAdmin(req: Request): Promise<Response | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  const userId = data.claims.sub;
  const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle();
  if (!roleData || !["admin", "editor"].includes(roleData.role)) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  return null;
}

function extractText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<aside[\s\S]*?<\/aside>/gi, "")
    .replace(/<!\[CDATA\[/gi, "")
    .replace(/\]\]>/g, "")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function extractArticleContent(html: string): string {
  const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (articleMatch) return extractText(articleMatch[1]);

  const contentPatterns = [
    /<div[^>]*class="[^"]*(?:entry-content|post-content|article-body|story-body|news-content|content-area)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*id="[^"]*(?:content|article|story|post)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
  ];

  for (const pattern of contentPatterns) {
    const match = html.match(pattern);
    if (match) return extractText(match[1]);
  }

  const paragraphs = html.match(/<p[^>]*>[\s\S]*?<\/p>/gi) || [];
  const text = paragraphs.map(p => extractText(p)).filter(t => t.length > 30).join("\n\n");
  return text || extractText(html).substring(0, 2000);
}

// ===== Enhanced keyword-based AI system =====

const categoryKeywords: Record<string, string[]> = {
  national: ["জাতীয়", "national", "bangladesh", "বাংলাদেশ", "সরকার", "মন্ত্রী", "সংসদ", "প্রধানমন্ত্রী", "রাষ্ট্রপতি", "দেশ", "জাতি"],
  politics: ["রাজনীতি", "politics", "political", "সংসদ", "নির্বাচন", "ভোট", "দল", "আওয়ামী", "বিএনপি", "জোট", "আন্দোলন", "হরতাল", "election"],
  international: ["বিশ্ব", "world", "international", "আন্তর্জাতিক", "যুক্তরাষ্ট্র", "ভারত", "চীন", "রাশিয়া", "জাতিসংঘ", "মধ্যপ্রাচ্য", "ইউরোপ", "trump", "modi", "global", "usa", "uk", "europe", "asia"],
  sports: ["খেলা", "sports", "cricket", "football", "ক্রিকেট", "ফুটবল", "টেস্ট", "ম্যাচ", "গোল", "বিশ্বকাপ", "অলিম্পিক", "ipl", "bpl", "premier league", "world cup", "score", "tournament"],
  entertainment: ["বিনোদন", "entertainment", "movie", "সিনেমা", "নাটক", "গান", "চলচ্চিত্র", "অভিনেতা", "অভিনেত্রী", "বলিউড", "হলিউড", "ঢালিউড", "টলিউড", "bollywood", "hollywood", "film", "celebrity", "album", "drama"],
  economy: ["অর্থনীতি", "economy", "business", "ব্যবসা", "বাজার", "শেয়ার", "ডলার", "টাকা", "রপ্তানি", "আমদানি", "জিডিপি", "মুদ্রাস্ফীতি", "stock", "market", "investment", "gdp", "inflation"],
  education: ["শিক্ষা", "education", "বিশ্ববিদ্যালয়", "স্কুল", "কলেজ", "পরীক্ষা", "ভর্তি", "ফলাফল", "শিক্ষক", "ছাত্র", "এইচএসসি", "এসএসসি", "result", "admission", "university", "exam"],
  technology: ["প্রযুক্তি", "technology", "tech", "ডিজিটাল", "সফটওয়্যার", "ইন্টারনেট", "এআই", "রোবট", "স্মার্টফোন", "অ্যাপ", "ai", "smartphone", "google", "apple", "microsoft", "startup", "app", "cyber", "digital"],
  health: ["স্বাস্থ্য", "health", "medical", "চিকিৎসা", "রোগ", "হাসপাতাল", "ডাক্তার", "ওষুধ", "ভ্যাকসিন", "কোভিড", "ক্যান্সার", "ডায়াবেটিস", "disease", "hospital", "doctor", "covid", "vaccine", "who"],
  lifestyle: ["লাইফস্টাইল", "lifestyle", "fashion", "রান্না", "ফ্যাশন", "রেসিপি", "ফিটনেস", "যোগ", "সৌন্দর্য", "ত্বক", "recipe", "cooking", "beauty", "fitness", "yoga", "diet", "wellness"],
  religion: ["ধর্ম", "religion", "ইসলাম", "হিন্দু", "বৌদ্ধ", "খ্রিস্টান", "নামাজ", "রোজা", "হজ", "ঈদ", "পূজা", "mosque", "temple", "church", "prayer", "ramadan", "eid"],
  travel: ["ভ্রমণ", "travel", "tourism", "পর্যটন", "হোটেল", "পাহাড়", "সমুদ্র", "সৈকত", "কক্সবাজার", "সুন্দরবন", "tourist", "beach", "hotel", "trip", "destination"],
  trending: ["আলোচিত", "trending", "viral", "ভাইরাল", "ব্রেকিং", "সাড়া", "শীর্ষ", "জরুরি", "breaking", "top", "hot", "urgent"],
  crime: ["অপরাধ", "crime", "হত্যা", "ধর্ষণ", "চুরি", "ডাকাতি", "পুলিশ", "গ্রেপ্তার", "আদালত", "মামলা", "জামিন", "murder", "robbery", "arrest", "court", "police"],
};

function detectCategory(text: string): string | null {
  const lower = text.toLowerCase();
  let bestMatch: string | null = null;
  let bestScore = 0;
  for (const [slug, keywords] of Object.entries(categoryKeywords)) {
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw.toLowerCase())) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = slug;
    }
  }
  return bestScore >= 1 ? bestMatch : null;
}

function generateSummary(text: string, maxLen = 200): string {
  const clean = text.replace(/\s+/g, " ").trim();
  const sentences = clean.split(/[।\.\!\?]+/).filter(s => s.trim().length > 15);
  if (sentences.length === 0) return clean.substring(0, maxLen);
  let summary = "";
  for (const s of sentences) {
    if ((summary + s).length > maxLen) break;
    summary += s.trim() + "। ";
  }
  return summary.trim() || sentences[0].trim().substring(0, maxLen);
}

function extractTags(text: string): string[] {
  const tags: string[] = [];
  const lower = text.toLowerCase();
  const tagKeywords = [
    "বাংলাদেশ", "ভারত", "ক্রিকেট", "ফুটবল", "নির্বাচন", "শিক্ষা", "প্রযুক্তি",
    "কোভিড", "অর্থনীতি", "পরিবেশ", "দুর্নীতি", "সংসদ", "বিশ্বকাপ", "ঈদ",
    "রমজান", "পূজা", "বাজেট", "আবহাওয়া", "বন্যা", "ঘূর্ণিঝড়",
  ];
  for (const kw of tagKeywords) {
    if (lower.includes(kw.toLowerCase())) tags.push(kw);
    if (tags.length >= 5) break;
  }
  return tags;
}

function extractQuotes(text: string): string[] {
  const quotes: string[] = [];
  // Bengali/English quote patterns
  const patterns = [
    /[❝"❞"']([\s\S]{15,200}?)[❝"❞"']/g,
    /[']([\s\S]{15,200}?)['']/g,
    /বলেন\s*,\s*['"]?([\s\S]{15,150}?)['"]?[।\.]/g,
    /বলেছেন\s*,\s*['"]?([\s\S]{15,150}?)['"]?[।\.]/g,
    /জানান\s*,\s*['"]?([\s\S]{15,150}?)['"]?[।\.]/g,
  ];
  for (const p of patterns) {
    let m;
    while ((m = p.exec(text)) !== null) {
      const q = m[1].trim();
      if (q.length > 15 && q.length < 250) quotes.push(q);
      if (quotes.length >= 3) return quotes;
    }
  }
  return quotes;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify auth
    const authError = await verifyAdmin(req);
    if (authError) return authError;

    const { url, fullContent } = await req.json();
    if (!url || typeof url !== "string") {
      return new Response(JSON.stringify({ error: "URL required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // SSRF protection
    if (isPrivateUrl(url)) {
      return new Response(JSON.stringify({ error: "URL not allowed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36" },
      signal: AbortSignal.timeout(15000),
      redirect: "follow",
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: `HTTP ${response.status}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const html = await response.text();

    // Extract metadata
    const titleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i)
      || html.match(/<meta\s+content="([^"]+)"\s+property="og:title"/i)
      || html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const descMatch = html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i)
      || html.match(/<meta\s+content="([^"]+)"\s+property="og:description"/i)
      || html.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
    const imageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i)
      || html.match(/<meta\s+content="([^"]+)"\s+property="og:image"/i);
    const siteMatch = html.match(/<meta\s+property="og:site_name"\s+content="([^"]+)"/i)
      || html.match(/<meta\s+content="([^"]+)"\s+property="og:site_name"/i);
    const dateMatch = html.match(/<meta\s+property="article:published_time"\s+content="([^"]+)"/i)
      || html.match(/<meta\s+content="([^"]+)"\s+property="article:published_time"/i)
      || html.match(/<time[^>]+datetime="([^"]+)"/i);
    const categoryMatch = html.match(/<meta\s+property="article:section"\s+content="([^"]+)"/i)
      || html.match(/<meta\s+content="([^"]+)"\s+property="article:section"/i);
    const tagsMatches = html.matchAll(/<meta\s+property="article:tag"\s+content="([^"]+)"/gi);
    const metaTags = [...tagsMatches].map(m => m[1]).slice(0, 10);

    const title = titleMatch?.[1]?.trim() || "";
    const description = descMatch?.[1]?.trim() || "";
    const image = imageMatch?.[1]?.trim() || "";
    const siteName = siteMatch?.[1]?.trim() || new URL(url).hostname;
    const publishedAt = dateMatch?.[1]?.trim() || "";
    const metaCategory = categoryMatch?.[1]?.trim() || "";

    // Extract full content if requested
    let content = description;
    if (fullContent) {
      content = extractArticleContent(html);
      if (content.length < 50) content = description;
    }

    // Enhanced AI: auto-detect category, generate summary, extract tags & quotes
    const fullText = `${title} ${description} ${content}`;
    const category = detectCategory(`${metaCategory} ${fullText}`) || metaCategory;
    const summary = generateSummary(content || description);
    const autoTags = metaTags.length > 0 ? metaTags : extractTags(fullText);
    const quotes = extractQuotes(content || description);

    return new Response(
      JSON.stringify({ title, description, content, image, siteName, url, publishedAt, category, tags: autoTags, summary, quotes }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
