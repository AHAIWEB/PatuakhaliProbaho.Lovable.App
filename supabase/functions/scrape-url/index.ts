const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    if (!url) {
      return new Response(JSON.stringify({ error: "URL required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 PatuakhaliProbaho/1.0" },
      signal: AbortSignal.timeout(10000),
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
      || html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const descMatch = html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i)
      || html.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
    const imageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
    const siteMatch = html.match(/<meta\s+property="og:site_name"\s+content="([^"]+)"/i);

    const title = titleMatch?.[1]?.trim() || "";
    const description = descMatch?.[1]?.trim() || "";
    const image = imageMatch?.[1]?.trim() || "";
    const siteName = siteMatch?.[1]?.trim() || new URL(url).hostname;

    return new Response(
      JSON.stringify({ title, description, image, siteName, url }),
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
