import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RSSItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  imageUrl: string | null;
  category: string | null;
}

function extractImageFromContent(content: string): string | null {
  const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch) return imgMatch[1];
  const mediaMatch = content.match(/<media:content[^>]+url=["']([^"']+)["']/i);
  if (mediaMatch) return mediaMatch[1];
  const enclosureMatch = content.match(/<enclosure[^>]+url=["']([^"']+)["']/i);
  if (enclosureMatch) return enclosureMatch[1];
  return null;
}

function extractTextContent(html: string, maxLen = 500): string {
  const text = html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();
  return text.length > maxLen ? text.substring(0, maxLen) + "..." : text;
}

function parseRSSItems(xml: string): RSSItem[] {
  const items: RSSItem[] = [];
  const itemMatches = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || [];

  for (const itemXml of itemMatches) {
    const titleMatch = itemXml.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
    const linkMatch = itemXml.match(/<link[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i);
    const descMatch = itemXml.match(/<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i);
    const contentMatch = itemXml.match(/<content:encoded[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/content:encoded>/i);
    const dateMatch = itemXml.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i);
    const categoryMatch = itemXml.match(/<category[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/category>/i);
    const mediaMatch = itemXml.match(/<media:content[^>]+url=["']([^"']+)["']/i);
    const thumbnailMatch = itemXml.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/i);

    const title = titleMatch ? titleMatch[1].trim() : "";
    const link = linkMatch ? linkMatch[1].trim() : "";
    if (!title || !link) continue;

    const fullContent = contentMatch ? contentMatch[1] : descMatch ? descMatch[1] : "";
    const imageUrl = mediaMatch?.[1] || thumbnailMatch?.[1] || extractImageFromContent(fullContent);

    items.push({
      title,
      link,
      description: extractTextContent(fullContent),
      pubDate: dateMatch ? dateMatch[1].trim() : new Date().toISOString(),
      imageUrl,
      category: categoryMatch ? categoryMatch[1].trim() : null,
    });
  }
  return items;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .substring(0, 100) + "-" + Date.now().toString(36);
}

const categoryKeywords: Record<string, string[]> = {
  "national": ["জাতীয়", "national", "bangladesh", "বাংলাদেশ", "সরকার", "government"],
  "politics": ["রাজনীতি", "politics", "political", "সংসদ", "নির্বাচন", "election"],
  "world": ["বিশ্ব", "world", "international", "আন্তর্জাতিক", "global"],
  "sports": ["খেলা", "sports", "cricket", "football", "ক্রিকেট", "ফুটবল"],
  "entertainment": ["বিনোদন", "entertainment", "movie", "film", "সিনেমা", "নাটক", "bollywood", "hollywood", "tollywood"],
  "economy": ["অর্থনীতি", "economy", "business", "ব্যবসা", "বাজার", "finance"],
  "education": ["শিক্ষা", "education", "বিশ্ববিদ্যালয়", "স্কুল", "পরীক্ষা"],
  "technology": ["প্রযুক্তি", "technology", "tech", "digital", "ডিজিটাল", "software"],
  "health": ["স্বাস্থ্য", "health", "medical", "চিকিৎসা", "হাসপাতাল"],
  "lifestyle": ["লাইফস্টাইল", "lifestyle", "fashion", "ফ্যাশন", "রান্না", "cooking"],
  "religion": ["ধর্ম", "religion", "ইসলাম", "islam", "মসজিদ"],
  "travel": ["ভ্রমণ", "travel", "tourism", "পর্যটন"],
  "trending": ["আলোচিত", "trending", "viral", "ভাইরাল"],
};

function matchCategorySlug(feedCategory: string, itemCategory: string | null, feedName: string): string | null {
  const searchText = `${feedCategory} ${itemCategory || ""} ${feedName}`.toLowerCase();
  for (const [slug, keywords] of Object.entries(categoryKeywords)) {
    for (const kw of keywords) {
      if (searchText.includes(kw.toLowerCase())) return slug;
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

    // Parse optional batch params
    let batchSize = 15;
    let offset = 0;
    try {
      const body = await req.json();
      if (body?.batchSize) batchSize = Math.min(body.batchSize, 30);
      if (body?.offset) offset = body.offset;
    } catch { /* no body, use defaults */ }

    // Get active RSS feeds with pagination (oldest fetched first)
    const { data: feeds, error: feedError } = await supabase
      .from("rss_feeds")
      .select("*")
      .eq("is_active", true)
      .order("last_fetched_at", { ascending: true, nullsFirst: true })
      .range(offset, offset + batchSize - 1);

    if (feedError) throw feedError;
    if (!feeds || feeds.length === 0) {
      return new Response(JSON.stringify({ message: "No active feeds in this batch", fetched: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load all categories for slug->id mapping
    const { data: dbCategories } = await supabase.from("categories").select("id, slug, parent_id");
    const categoryMap = new Map<string, string>();
    if (dbCategories) {
      for (const cat of dbCategories) {
        categoryMap.set(cat.slug, cat.id);
      }
    }

    let totalInserted = 0;
    const errors: string[] = [];

    // Process feeds concurrently in groups of 5
    const processOneFeed = async (feed: typeof feeds[0]) => {
      try {
        const response = await fetch(feed.url, {
          headers: { "User-Agent": "PatuakhaliProbaho/1.0 RSS Reader" },
          signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) {
          errors.push(`${feed.name}: HTTP ${response.status}`);
          return;
        }

        const xml = await response.text();
        const items = parseRSSItems(xml);

        // Batch check duplicates
        const sourceUrls = items.slice(0, 15).map((i) => i.link);
        const { data: existingPosts } = await supabase
          .from("posts")
          .select("source_url")
          .in("source_url", sourceUrls);
        const existingUrls = new Set((existingPosts || []).map((p) => p.source_url));

        const newItems = items.slice(0, 15).filter((item) => !existingUrls.has(item.link));

        if (newItems.length > 0) {
          const rows = newItems.map((item) => {
            let categoryId: string | null = null;
            const matchedSlug = matchCategorySlug(feed.category || "", item.category, feed.name);
            if (matchedSlug && categoryMap.has(matchedSlug)) {
              categoryId = categoryMap.get(matchedSlug)!;
            }
            if (!categoryId && feed.division && categoryMap.has(feed.division)) {
              categoryId = categoryMap.get(feed.division)!;
            }

            return {
              title: item.title,
              slug: generateSlug(item.title),
              content: item.description,
              excerpt: item.description.substring(0, 200),
              image_url: item.imageUrl,
              source_url: item.link,
              source_name: feed.name,
              division: feed.division,
              tags: item.category ? [item.category] : [],
              status: "published",
              rss_feed_id: feed.id,
              published_at: item.pubDate,
              category_id: categoryId,
            };
          });

          const { error: insertError, data: inserted } = await supabase
            .from("posts")
            .insert(rows)
            .select("id, title, content");

          if (!insertError && inserted) {
            totalInserted += inserted.length;

            // AI post-processing: categorize & extract quotes for each new post
            const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
            if (LOVABLE_API_KEY) {
              for (const post of inserted) {
                try {
                  // AI categorization
                  const catRes = await fetch(`${supabaseUrl}/functions/v1/ai-process`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      "Authorization": `Bearer ${supabaseKey}`,
                    },
                    body: JSON.stringify({ action: "categorize", text: post.title + " " + (post.content || "").substring(0, 500) }),
                  });
                  if (catRes.ok) {
                    const catData = await catRes.json();
                    const updateFields: Record<string, unknown> = {};
                    if (catData.summary) updateFields.excerpt = catData.summary;
                    if (catData.tags && Array.isArray(catData.tags)) updateFields.tags = catData.tags;
                    if (catData.category) updateFields.source_category = catData.category;
                    // Map AI category to DB category
                    if (catData.category && categoryMap.has(catData.category)) {
                      updateFields.category_id = categoryMap.get(catData.category);
                    }
                    if (Object.keys(updateFields).length > 0) {
                      await supabase.from("posts").update(updateFields).eq("id", post.id);
                    }
                  } else {
                    await catRes.text(); // consume body
                  }
                } catch {
                  // AI processing is best-effort, don't fail the feed
                }
              }
            }
          } else if (insertError) {
            errors.push(`${feed.name}: Insert error - ${insertError.message}`);
          }
        }

        // Update last_fetched_at
        await supabase
          .from("rss_feeds")
          .update({ last_fetched_at: new Date().toISOString() })
          .eq("id", feed.id);
      } catch (e) {
        errors.push(`${feed.name}: ${e instanceof Error ? e.message : "Unknown error"}`);
      }
    };

    // Process in parallel chunks of 5
    for (let i = 0; i < feeds.length; i += 5) {
      const chunk = feeds.slice(i, i + 5);
      await Promise.allSettled(chunk.map(processOneFeed));
    }

    const { count } = await supabase.from("rss_feeds").select("*", { count: "exact", head: true }).eq("is_active", true);

    return new Response(
      JSON.stringify({
        message: "RSS fetch complete",
        fetched: totalInserted,
        processedFeeds: feeds.length,
        totalFeeds: count,
        nextOffset: offset + batchSize,
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
