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
  // Try to find article body
  const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (articleMatch) return extractText(articleMatch[1]);

  // Try common content selectors
  const contentPatterns = [
    /<div[^>]*class="[^"]*(?:entry-content|post-content|article-body|story-body|news-content|content-area)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*id="[^"]*(?:content|article|story|post)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
  ];

  for (const pattern of contentPatterns) {
    const match = html.match(pattern);
    if (match) return extractText(match[1]);
  }

  // Fallback: get all <p> tags
  const paragraphs = html.match(/<p[^>]*>[\s\S]*?<\/p>/gi) || [];
  const text = paragraphs.map(p => extractText(p)).filter(t => t.length > 30).join("\n\n");
  return text || extractText(html).substring(0, 2000);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, fullContent } = await req.json();
    if (!url) {
      return new Response(JSON.stringify({ error: "URL required" }), {
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
    const tags = [...tagsMatches].map(m => m[1]).slice(0, 10);

    const title = titleMatch?.[1]?.trim() || "";
    const description = descMatch?.[1]?.trim() || "";
    const image = imageMatch?.[1]?.trim() || "";
    const siteName = siteMatch?.[1]?.trim() || new URL(url).hostname;
    const publishedAt = dateMatch?.[1]?.trim() || "";
    const category = categoryMatch?.[1]?.trim() || "";

    // If fullContent requested, extract article body
    let content = description;
    if (fullContent) {
      content = extractArticleContent(html);
      if (content.length < 50) content = description;
    }

    return new Response(
      JSON.stringify({ title, description, content, image, siteName, url, publishedAt, category, tags }),
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
