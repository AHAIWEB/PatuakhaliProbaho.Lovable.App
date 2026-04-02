import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function extractContent(html: string): { content: string; image: string } {
  let content = "";
  let image = "";

  // Try article selectors
  const selectors = [
    /<article[^>]*>([\s\S]*?)<\/article>/i,
    /<div[^>]*class="[^"]*(?:story-content|article-body|news-content|entry-content|post-content|main-content)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
  ];

  for (const sel of selectors) {
    const m = html.match(sel);
    if (m && m[1] && m[1].length > 200) {
      content = m[1];
      break;
    }
  }

  // Fallback: collect <p> tags
  if (!content || content.length < 200) {
    const pMatches = html.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) || [];
    const paragraphs = pMatches
      .map((p) => p.replace(/<[^>]+>/g, "").trim())
      .filter((t) => t.length > 30);
    if (paragraphs.length > 0) {
      content = paragraphs.map((p) => `<p>${p}</p>`).join("\n");
    }
  }

  // Clean content
  if (content) {
    content = content
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
      .replace(/<!--[\s\S]*?-->/g, "")
      .trim();
  }

  // Extract main image
  const imgMatch = html.match(
    /<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i
  );
  if (imgMatch) image = imgMatch[1];

  return { content, image };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get posts with source_url but minimal content
    const { data: posts, error } = await supabase
      .from("posts")
      .select("id, source_url, content, image_url, title")
      .eq("status", "published")
      .not("source_url", "is", null)
      .order("published_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    const needsUpdate = (posts || []).filter((p: any) => {
      if (!p.source_url) return false;
      const textLen = (p.content || "")
        .replace(/<[^>]+>/g, "")
        .trim().length;
      return textLen < 150; // Content too short
    });

    let updated = 0;
    const errors: string[] = [];

    for (const post of needsUpdate.slice(0, 30)) {
      try {
        const resp = await fetch(post.source_url, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (compatible; NewsBot/1.0)",
          },
          redirect: "follow",
        });
        if (!resp.ok) continue;

        const html = await resp.text();
        const { content, image } = extractContent(html);

        if (!content || content.replace(/<[^>]+>/g, "").trim().length < 100)
          continue;

        const updateData: any = { content };
        if (image && !post.image_url) updateData.image_url = image;

        // Generate excerpt
        const plainText = content.replace(/<[^>]+>/g, "").trim();
        updateData.excerpt = plainText.substring(0, 200);

        const { error: upErr } = await supabase
          .from("posts")
          .update(updateData)
          .eq("id", post.id);

        if (upErr) {
          errors.push(`${post.id}: ${upErr.message}`);
        } else {
          updated++;
        }

        // Small delay to avoid overwhelming sources
        await new Promise((r) => setTimeout(r, 500));
      } catch (e) {
        errors.push(`${post.id}: ${e.message}`);
      }
    }

    return new Response(
      JSON.stringify({
        total_checked: needsUpdate.length,
        updated,
        errors: errors.slice(0, 10),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
