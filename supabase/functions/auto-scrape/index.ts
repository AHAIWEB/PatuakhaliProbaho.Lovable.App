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

function extractLinks(html: string, baseUrl: string, selectorConfig?: any): { title: string; url: string; image: string | null }[] {
  const links: { title: string; url: string; image: string | null }[] = [];
  const seen = new Set<string>();

  // Custom selectors from config
  const articleSel = selectorConfig?.article;
  const titleSel = selectorConfig?.title;
  const linkSel = selectorConfig?.link;
  const imgSel = selectorConfig?.image;

  // Build patterns based on selectors or use defaults
  const patterns = [
    /<a[^>]+href=["']([^"'#]+)["'][^>]*>[\s\S]*?<(?:h[1-6]|span|div)[^>]*>([\s\S]*?)<\/(?:h[1-6]|span|div)>[\s\S]*?<\/a>/gi,
    /<h[1-6][^>]*>\s*<a[^>]+href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>\s*<\/h[1-6]>/gi,
    /<a[^>]+href=["']([^"']+)["'][^>]*title=["']([^"']+)["']/gi,
  ];

  // If custom article/link selectors provided, also try class-based patterns
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
      if (!title || title.length < 10) continue;

      try {
        if (url.startsWith("/")) url = new URL(url, baseUrl).href;
        else if (!url.startsWith("http")) continue;
      } catch { continue; }

      if (seen.has(url)) continue;
      seen.add(url);

      // Find nearby image - use custom selector or default
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get sources due for scraping
    const now = new Date();
    const { data: sources, error: srcError } = await supabase
      .from("scrape_sources")
      .select("*")
      .eq("is_active", true)
      .order("last_scraped_at", { ascending: true, nullsFirst: true })
      .limit(10);

    if (srcError) throw srcError;
    if (!sources || sources.length === 0) {
      return new Response(JSON.stringify({ message: "No sources to scrape", scraped: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Filter sources that are due (interval elapsed)
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

    // Load categories
    const { data: dbCategories } = await supabase.from("categories").select("id, slug");
    const categoryMap = new Map<string, string>();
    if (dbCategories) {
      for (const cat of dbCategories) categoryMap.set(cat.slug, cat.id);
    }

    let totalInserted = 0;
    const errors: string[] = [];

    for (const source of dueSources) {
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
          errors.push(`${source.name}: HTTP ${response.status}`);
          continue;
        }

        const html = await response.text();
        const baseUrl = new URL(source.url).origin;
        const articles = extractLinks(html, baseUrl, source.selector_config);

        if (articles.length === 0) {
          await supabase.from("scrape_sources").update({
            last_scraped_at: now.toISOString(),
            last_error: "No articles found",
          }).eq("id", source.id);
          continue;
        }

        // Check for duplicates
        const urls = articles.map((a) => a.url);
        const { data: existing } = await supabase
          .from("posts")
          .select("source_url")
          .in("source_url", urls);
        const existingUrls = new Set((existing || []).map((p) => p.source_url));

        const newArticles = articles.filter((a) => !existingUrls.has(a.url));

        if (newArticles.length > 0) {
          const rows = newArticles.map((article) => {
            const matchedSlug = matchCategory(`${source.category || ""} ${source.name} ${article.title}`);
            let categoryId: string | null = null;
            if (matchedSlug && categoryMap.has(matchedSlug)) categoryId = categoryMap.get(matchedSlug)!;

            return {
              title: article.title,
              slug: generateSlug(article.title),
              content: article.title,
              excerpt: article.title.substring(0, 200),
              image_url: article.image,
              source_url: article.url,
              source_name: source.name,
              division: source.division,
              district: source.district,
              upazila: source.upazila,
              source_category: source.source_category || source.category,
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
            totalInserted += inserted.length;
          } else if (insertError) {
            errors.push(`${source.name}: ${insertError.message}`);
          }
        }

        await supabase.from("scrape_sources").update({
          last_scraped_at: now.toISOString(),
          last_error: null,
        }).eq("id", source.id);

      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        errors.push(`${source.name}: ${msg}`);
        await supabase.from("scrape_sources").update({
          last_scraped_at: now.toISOString(),
          last_error: msg,
        }).eq("id", source.id);
      }
    }

    return new Response(
      JSON.stringify({
        message: "Auto-scrape complete",
        scraped: totalInserted,
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
