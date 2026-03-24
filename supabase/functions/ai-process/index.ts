const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, text, url } = await req.json();

    if (action === "extract_quotes") {
      // Use AI to extract quotations from article text
      const prompt = `নিচের আর্টিকেল থেকে সবচেয়ে গুরুত্বপূর্ণ ৩-৫টি কোটেশন/উক্তি বের করো। শুধু JSON array হিসেবে দাও, কোনো ব্যাখ্যা নয়।
যদি কোনো কোটেশন না পাও তাহলে আর্টিকেলের মূল বক্তব্য থেকে ৩টি ছোট বাক্য বের করো।

আর্টিকেল:
${text?.substring(0, 3000)}

Response format: ["quote1", "quote2", "quote3"]`;

      const response = await fetch("https://api.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: "You extract quotes from Bengali/English news articles. Always respond with a valid JSON array of strings." },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`AI API error ${response.status}: ${errText}`);
      }

      const aiData = await response.json();
      const content = aiData.choices?.[0]?.message?.content || "[]";
      
      // Parse quotes from AI response
      let quotes: string[] = [];
      try {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          quotes = parsed;
        } else if (parsed.quotes && Array.isArray(parsed.quotes)) {
          quotes = parsed.quotes;
        }
      } catch {
        // Try to extract array from text
        const match = content.match(/\[[\s\S]*\]/);
        if (match) {
          try { quotes = JSON.parse(match[0]); } catch { /* fallback */ }
        }
      }

      return new Response(JSON.stringify({ quotes }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "categorize") {
      const prompt = `এই নিউজ আর্টিকেলের জন্য সবচেয়ে উপযুক্ত ক্যাটাগরি এবং ৫টি ট্যাগ দাও।

শিরোনাম: ${text?.substring(0, 500)}

ক্যাটাগরি অপশন: national, politics, international, sports, entertainment, economy, education, technology, health, lifestyle, religion, travel, trending, crime

JSON format: {"category": "...", "tags": ["tag1", "tag2"], "summary": "২ বাক্যে সারাংশ"}`;

      const response = await fetch("https://api.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            { role: "system", content: "You categorize Bengali/English news. Respond only with valid JSON." },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        throw new Error(`AI API error ${response.status}`);
      }

      const aiData = await response.json();
      const content = aiData.choices?.[0]?.message?.content || "{}";
      let result = {};
      try { result = JSON.parse(content); } catch { /* fallback */ }

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
