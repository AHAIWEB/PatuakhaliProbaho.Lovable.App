import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function extractText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
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

function extractArticleContent(html: string): { content: string; excerpt: string; image: string | null } {
  let articleHtml = "";
  const articlePatterns = [
    /<article[^>]*>([\s\S]*?)<\/article>/i,
    /<div[^>]+class="[^"]*(?:story-content|article-body|entry-content|post-content|news-content|content-body|main-content|story-element|article-content-body)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]+itemprop="articleBody"[^>]*>([\s\S]*?)<\/div>/i,
  ];
  for (const pattern of articlePatterns) {
    const match = html.match(pattern);
    if (match) { articleHtml = match[1] || match[0]; break; }
  }
  const source = articleHtml || html;
  const paragraphs: string[] = [];
  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let m;
  while ((m = pRegex.exec(source)) !== null) {
    const text = extractText(m[1]).trim();
    if (text.length > 25) paragraphs.push(text);
  }
  const imgMatch = source.match(/<img[^>]+src=["']([^"']+)["']/i);
  return {
    content: paragraphs.length > 0 ? paragraphs.map(p => `<p>${p}</p>`).join("\n") : "",
    excerpt: paragraphs.length > 0 ? paragraphs[0].substring(0, 300) : "",
    image: imgMatch?.[1] || null,
  };
}

async function fetchArticleContent(url: string): Promise<{ content: string; excerpt: string; image: string | null }> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36" },
      signal: AbortSignal.timeout(10000),
      redirect: "follow",
    });
    if (!res.ok) return { content: "", excerpt: "", image: null };
    return extractArticleContent(await res.text());
  } catch {
    return { content: "", excerpt: "", image: null };
  }
}

function isValidArticleUrl(url: string, baseUrl: string): boolean {
  try {
    const u = new URL(url);
    const base = new URL(baseUrl);
    if (!u.hostname.endsWith(base.hostname.replace(/^www\./, "")) && !base.hostname.endsWith(u.hostname.replace(/^www\./, ""))) return false;
    const path = u.pathname.toLowerCase();
    const rejectPatterns = [
      /^\/?$/, /\/tag\//i, /\/category\//i, /\/author\//i, /\/page\/\d/i,
      /\/search/i, /\/login/i, /\/register/i, /\/contact/i, /\/about/i,
      /\/privacy/i, /\/terms/i, /\.pdf$/i, /\.jpg$/i, /\.png$/i, /\.gif$/i,
      /\/feed\/?$/i, /\/rss\/?$/i, /\/sitemap/i, /\/archive\/?$/i,
      /^\/[a-z]{2}\/?$/i,
    ];
    for (const p of rejectPatterns) {
      if (p.test(path)) return false;
    }
    if (path.replace(/\//g, "").length < 5) return false;

    // Source-specific rules to filter generic category/section pages
    const host = u.hostname.replace(/^www\./, "");

    // NTV: reject division/category landing pages like /entertainment, /bangladesh etc
    if (host === "ntvbd.com") {
      if (/^\/(entertainment|sports|international|bangladesh|opinion|lifestyle|education|technology|feature|economy|country|video|photo)\/?$/i.test(path)) return false;
    }

    // RisingBD: reject division landing pages
    if (host === "risingbd.com") {
      if (/^\/(divisions|entertainment|national|politics|international|sports|economy|education|lifestyle|religion|crime|feature|opinion|technology)\/?$/i.test(path)) return false;
      if (/^\/divisions\/(chattogram|barishal|khulna|dhaka|sylhet|rajshahi|rangpur|mymensingh)\/?$/i.test(path)) return false;
    }

    // Naya Diganta: reject category landing pages
    if (host === "dailynayadiganta.com") {
      if (/^\/(entertainment|national|politics|international|sports|economy|education|lifestyle|religion|crime|editorial|opinion)\/?$/i.test(path)) return false;
    }

    // Jagonews24: reject division/category landing pages
    if (host === "jagonews24.com") {
      if (/^\/(entertainment|top-ten|bangladesh|sports|international|economy|education|technology|lifestyle|opinion)\/?$/i.test(path)) return false;
      if (/^\/bangladesh\/(chittagong|barisal|khulna|dhaka|sylhet|rajshahi|rangpur|mymensingh)\/?$/i.test(path)) return false;
    }

    // DainikAmaderShomoy: reject category landing pages
    if (host === "dainikamadershomoy.com") {
      if (/^\/category\/all\/(dhaka|cttgram-1|rajsahee|khulna|silet|brisal|rngpur|mzmnsingh|entertainment)\/?$/i.test(path)) return false;
    }

    // Generic: reject paths that look like section landing pages (single segment, no numbers/hyphens)
    if (/^\/[a-z-]+\/?$/i.test(path) && !/\d/.test(path) && path.split("/").filter(Boolean).length === 1) {
      const segment = path.replace(/\//g, "");
      const genericSections = ["entertainment", "sports", "international", "national", "politics", "economy", "education", "lifestyle", "health", "religion", "technology", "opinion", "feature", "video", "photo", "gallery", "travel", "crime"];
      if (genericSections.includes(segment)) return false;
    }

    return true;
  } catch { return false; }
}

function extractLinks(html: string, baseUrl: string, selectorConfig?: any): { title: string; url: string; image: string | null }[] {
  const links: { title: string; url: string; image: string | null }[] = [];
  const seen = new Set<string>();
  const articleSel = selectorConfig?.article;
  const linkSel = selectorConfig?.link;
  const imgSel = selectorConfig?.image;

  const patterns = [
    /<a[^>]+href=["']([^"'#]+)["'][^>]*>[\s\S]*?<(?:h[1-6]|span|div)[^>]*>([\s\S]*?)<\/(?:h[1-6]|span|div)>[\s\S]*?<\/a>/gi,
    /<h[1-6][^>]*>\s*<a[^>]+href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>\s*<\/h[1-6]>/gi,
    /<a[^>]+href=["']([^"']+)["'][^>]*title=["']([^"']+)["']/gi,
  ];

  if (articleSel || linkSel) {
    const classMatch = (articleSel || linkSel || "").replace(/^\./, "");
    if (classMatch) {
      patterns.push(new RegExp(`<[^>]+class="[^"]*${classMatch}[^"]*"[^>]*>[\\s\\S]*?<a[^>]+href=["']([^"'#]+)["'][^>]*>([\\s\\S]*?)<\\/a>`, "gi"));
    }
  }

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      let url = match[1].trim();
      const title = extractText(match[2]).trim();
      if (!title || title.length < 10 || title.length > 300) continue;

      try {
        if (url.startsWith("/")) url = new URL(url, baseUrl).href;
        else if (!url.startsWith("http")) continue;
      } catch { continue; }

      if (!isValidArticleUrl(url, baseUrl)) continue;
      if (seen.has(url)) continue;
      seen.add(url);

      const searchArea = html.substring(
        Math.max(0, (match.index || 0) - 500),
        (match.index || 0) + match[0].length + 500
      );
      
      let image: string | null = null;
      if (imgSel) {
        const imgClass = imgSel.replace(/^\./, "").replace(/\s+.*/, "");
        const customImgMatch = searchArea.match(new RegExp(`<img[^>]+class="[^"]*${imgClass}[^"]*"[^>]+src=["']([^"']+)["']`, "i"))
          || searchArea.match(new RegExp(`<img[^>]+src=["']([^"']+)["'][^>]+class="[^"]*${imgClass}[^"]*"`, "i"));
        image = customImgMatch?.[1] || null;
      }
      if (!image) {
        const nearbyImg = searchArea.match(/<img[^>]+src=["']([^"']+)["']/i);
        image = nearbyImg?.[1] || null;
      }
      if (image && image.startsWith("/")) {
        try { image = new URL(image, baseUrl).href; } catch { image = null; }
      }

      links.push({ title, url, image });
    }
  }
  return links.slice(0, 20);
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .substring(0, 100) + "-" + Date.now().toString(36);
}

const categoryKeywords: Record<string, string[]> = {
  national: ["জাতীয়", "national", "bangladesh", "বাংলাদেশ", "সরকার"],
  politics: ["রাজনীতি", "politics", "political", "সংসদ", "নির্বাচন"],
  world: ["বিশ্ব", "world", "international", "আন্তর্জাতিক"],
  sports: ["খেলা", "sports", "cricket", "football", "ক্রিকেট"],
  entertainment: ["বিনোদন", "entertainment", "movie", "সিনেমা"],
  economy: ["অর্থনীতি", "economy", "business", "ব্যবসা"],
  education: ["শিক্ষা", "education", "বিশ্ববিদ্যালয়"],
  technology: ["প্রযুক্তি", "technology", "tech", "ডিজিটাল"],
  health: ["স্বাস্থ্য", "health", "medical", "চিকিৎসা"],
  lifestyle: ["লাইফস্টাইল", "lifestyle", "fashion", "রান্না"],
  religion: ["ধর্ম", "religion", "ইসলাম"],
  travel: ["ভ্রমণ", "travel", "tourism", "পর্যটন"],
  trending: ["আলোচিত", "trending", "viral", "ভাইরাল"],
};

function matchCategory(text: string): string | null {
  const lower = text.toLowerCase();
  for (const [slug, keywords] of Object.entries(categoryKeywords)) {
    for (const kw of keywords) {
      if (lower.includes(kw.toLowerCase())) return slug;
    }
  }
  return null;
}

function isAuthorizedCronRequest(req: Request): boolean {
  const authHeader = req.headers.get("Authorization");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  return !!serviceRoleKey && authHeader === `Bearer ${serviceRoleKey}`;
}

async function verifyAdminOrCron(req: Request): Promise<Response | null> {
  if (isAuthorizedCronRequest(req)) {
    return null;
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  const anonClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await anonClient.auth.getClaims(token);
  if (error || !data?.claims) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  const userId = data.claims.sub;
  const { data: roleData } = await anonClient.from("user_roles").select("role").eq("user_id", userId).maybeSingle();
  if (!roleData || !["admin", "editor"].includes(roleData.role)) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let batchSize = 20;
    try {
      const body = await req.json();
      if (body?.batchSize) {
        batchSize = Math.min(Math.max(Number(body.batchSize), 1), 25);
      }
    } catch {
      // scheduled calls may not send a body
    }

    const authError = await verifyAdminOrCron(req);
    if (authError) return authError;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date();
    const { data: sources, error: srcError } = await supabase
      .from("scrape_sources")
      .select("*")
      .eq("is_active", true)
      .order("last_scraped_at", { ascending: true, nullsFirst: true })
      .limit(batchSize);

    if (srcError) throw srcError;
    if (!sources || sources.length === 0) {
      return new Response(JSON.stringify({ message: "No sources to scrape", scraped: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const dueSources = sources.filter((s) => {
      if (!s.last_scraped_at) return true;
      const elapsed = (now.getTime() - new Date(s.last_scraped_at).getTime()) / 60000;
      return elapsed >= (s.scrape_interval_minutes || 30);
    });

    if (dueSources.length === 0) {
      return new Response(JSON.stringify({ message: "No sources due for scraping", scraped: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: dbCategories } = await supabase.from("categories").select("id, slug");
    const categoryMap = new Map<string, string>();
    if (dbCategories) {
      for (const cat of dbCategories) categoryMap.set(cat.slug, cat.id);
    }

    const processSource = async (source: typeof dueSources[number]) => {
      let insertedCount = 0;
      let fetchedContentCount = 0;
      const sourceErrors: string[] = [];

      try {
        const response = await fetch(source.url, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36" },
          signal: AbortSignal.timeout(15000),
          redirect: "follow",
        });

        if (!response.ok) {
          await supabase.from("scrape_sources").update({
            last_scraped_at: now.toISOString(),
            last_error: `HTTP ${response.status}`,
          }).eq("id", source.id);
          sourceErrors.push(`${source.name}: HTTP ${response.status}`);
          return { insertedCount, fetchedContentCount, sourceErrors };
        }

        const html = await response.text();
        const baseUrl = new URL(source.url).origin;
        const articles = extractLinks(html, baseUrl, source.selector_config);

        if (articles.length === 0) {
          await supabase.from("scrape_sources").update({
            last_scraped_at: now.toISOString(),
            last_error: "No articles found",
          }).eq("id", source.id);
          return { insertedCount, fetchedContentCount, sourceErrors };
        }

        const urls = articles.map((a) => a.url);
        const { data: existing } = await supabase
          .from("posts")
          .select("source_url")
          .in("source_url", urls);
        const existingUrls = new Set((existing || []).map((p) => p.source_url));
        const newArticles = articles.filter((a) => !existingUrls.has(a.url));

        if (newArticles.length > 0) {
          // Fetch full content for up to 5 articles per source (to avoid timeout)
          const articlesWithContent = await Promise.all(
            newArticles.slice(0, 5).map(async (article) => {
              const fullContent = await fetchArticleContent(article.url);
              return { ...article, fullContent };
            })
          );
          // For remaining articles (6+), use title-only content
          const remainingArticles = newArticles.slice(5).map((article) => ({
            ...article,
            fullContent: { content: "", excerpt: "", image: null as string | null },
          }));

          const allArticles = [...articlesWithContent, ...remainingArticles];

          const rows = allArticles.map((article) => {
            const matchedSlug = matchCategory(`${source.category || ""} ${source.name} ${article.title}`);
            let categoryId: string | null = null;
            if (matchedSlug && categoryMap.has(matchedSlug)) categoryId = categoryMap.get(matchedSlug)!;

            const hasFullContent = article.fullContent.content.length > 50;
            if (hasFullContent) fetchedContentCount++;

            return {
              title: article.title,
              slug: generateSlug(article.title),
              content: hasFullContent ? article.fullContent.content : `<p>${article.title}</p>`,
              excerpt: hasFullContent ? article.fullContent.excerpt : article.title.substring(0, 200),
              image_url: article.image || article.fullContent.image,
              source_url: article.url,
              source_name: source.name,
              division: source.division,
              district: source.district,
              upazila: source.upazila,
              source_category: matchedSlug || source.source_category || source.category,
              tags: [],
              status: "published",
              published_at: now.toISOString(),
              category_id: categoryId,
            };
          });

          const { error: insertError, data: inserted } = await supabase
            .from("posts")
            .insert(rows)
            .select("id");

          if (!insertError && inserted) {
            insertedCount += inserted.length;
          } else if (insertError) {
            sourceErrors.push(`${source.name}: ${insertError.message}`);
          }
        }

        await supabase.from("scrape_sources").update({
          last_scraped_at: now.toISOString(),
          last_error: null,
        }).eq("id", source.id);

      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        sourceErrors.push(`${source.name}: ${msg}`);
        await supabase.from("scrape_sources").update({
          last_scraped_at: now.toISOString(),
          last_error: msg,
        }).eq("id", source.id);
      }

      return { insertedCount, fetchedContentCount, sourceErrors };
    };

    let totalInserted = 0;
    let contentFetched = 0;
    const errors: string[] = [];
    const SOURCE_CONCURRENCY = 4;

    for (let i = 0; i < dueSources.length; i += SOURCE_CONCURRENCY) {
      const chunk = dueSources.slice(i, i + SOURCE_CONCURRENCY);
      const results = await Promise.allSettled(chunk.map(processSource));

      for (const result of results) {
        if (result.status === "fulfilled") {
          totalInserted += result.value.insertedCount;
          contentFetched += result.value.fetchedContentCount;
          errors.push(...result.value.sourceErrors);
        } else {
          errors.push(result.reason instanceof Error ? result.reason.message : "Unknown source processing error");
        }
      }
    }

    return new Response(
      JSON.stringify({
        message: "Auto-scrape complete",
        scraped: totalInserted,
        contentFetched,
        processedSources: dueSources.length,
        errors: errors.slice(0, 10),
      }),
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
