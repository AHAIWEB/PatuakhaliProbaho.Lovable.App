const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, url, image_url, platforms } = await req.json();

    if (!title) {
      return new Response(JSON.stringify({ error: "Title is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: Record<string, { success: boolean; error?: string }> = {};

    // Telegram posting
    if (platforms?.includes("telegram")) {
      const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
      const TELEGRAM_CHANNEL_ID = Deno.env.get("TELEGRAM_CHANNEL_ID");

      if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHANNEL_ID) {
        try {
          const message = `📰 *${escapeMarkdown(title)}*\n\n${url ? `🔗 [বিস্তারিত পড়ুন](${url})` : ""}\n\n📌 পটুয়াখালী প্রবাহ`;

          const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
          const body: Record<string, unknown> = {
            chat_id: TELEGRAM_CHANNEL_ID,
            text: message,
            parse_mode: "Markdown",
            disable_web_page_preview: false,
          };

          const res = await fetch(telegramUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

          const data = await res.json();
          if (data.ok) {
            results.telegram = { success: true };
          } else {
            results.telegram = { success: false, error: data.description || "Unknown error" };
          }
        } catch (e: unknown) {
          results.telegram = { success: false, error: e instanceof Error ? e.message : "Unknown error" };
        }
      } else {
        results.telegram = { success: false, error: "Telegram credentials not configured" };
      }
    }

    // Facebook Page posting
    if (platforms?.includes("facebook")) {
      const FB_PAGE_TOKEN = Deno.env.get("FACEBOOK_PAGE_TOKEN");
      const FB_PAGE_ID = Deno.env.get("FACEBOOK_PAGE_ID");

      if (FB_PAGE_TOKEN && FB_PAGE_ID) {
        try {
          const message = `📰 ${title}\n\n${url ? `🔗 বিস্তারিত: ${url}` : ""}\n\n📌 পটুয়াখালী প্রবাহ`;

          const fbUrl = `https://graph.facebook.com/v18.0/${FB_PAGE_ID}/feed`;
          const res = await fetch(fbUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message,
              link: url || undefined,
              access_token: FB_PAGE_TOKEN,
            }),
          });

          const data = await res.json();
          if (data.id) {
            results.facebook = { success: true };
          } else {
            results.facebook = { success: false, error: data.error?.message || "Unknown error" };
          }
        } catch (e: unknown) {
          results.facebook = { success: false, error: e instanceof Error ? e.message : "Unknown error" };
        }
      } else {
        results.facebook = { success: false, error: "Facebook credentials not configured" };
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");
}
