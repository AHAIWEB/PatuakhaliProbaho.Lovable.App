const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, text } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (action === "extract_quotes") {
      // Try AI first, fallback to local
      if (LOVABLE_API_KEY && text) {
        try {
          const aiResult = await callAI(
            LOVABLE_API_KEY,
            `তুমি একজন বাংলা নিউজ এডিটর। নিচের টেক্সট থেকে সর্বোচ্চ ৫টি কোটেশন বের করো। প্রতিটি কোটেশন কমপক্ষে ৮-১০ লাইন (২০০-৫০০ অক্ষর) দীর্ঘ হবে এবং সংবাদের মূল বিষয়বস্তু, বিশ্লেষণ, এবং প্রেক্ষাপট অন্তর্ভুক্ত করবে। শুধু JSON ফরম্যাটে উত্তর দাও: {"quotes": ["...", "..."]}`,
            text
          );
          const parsed = JSON.parse(aiResult);
          if (parsed.quotes?.length) {
            return jsonResponse({ quotes: parsed.quotes });
          }
        } catch { /* fallback below */ }
      }

      // Fallback: local extraction
      const input = (text || "").trim();
      const quotes: string[] = [];
      if (input) {
        const sentences = input
          .split(/[।\.\!\?\n]+/)
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 5);
        if (sentences.length >= 4) {
          // Combine sentences for longer quotes (8-10 lines)
          quotes.push(`"${sentences.slice(0, Math.min(8, sentences.length)).join("। ")}।"`);
          if (sentences.length >= 6) {
            quotes.push(`"${sentences.slice(0, Math.min(5, sentences.length)).join("। ")}।"`);
          }
        }
        for (let i = 0; i < Math.min(3, sentences.length); i++) {
          quotes.push(`"${sentences[i]}"`);
        }
        if (quotes.length === 0) {
          quotes.push(`"${input.substring(0, 500)}"`);
        }
      }
      return jsonResponse({ quotes });
    }

    if (action === "categorize") {
      // Try AI first
      if (LOVABLE_API_KEY && text) {
        try {
          const aiResult = await callAI(
            LOVABLE_API_KEY,
            `তুমি একজন বাংলা নিউজ ক্যাটাগরাইজার। নিচের টেক্সটের ক্যাটাগরি, ট্যাগ এবং সারসংক্ষেপ বের করো। 
ক্যাটাগরি অবশ্যই এগুলোর মধ্যে হতে হবে: sports, politics, international, entertainment, economy, education, technology, health, crime, national
শুধু JSON ফরম্যাটে উত্তর দাও: {"category": "...", "tags": ["...", "..."], "summary": "..."}`,
            text
          );
          const parsed = JSON.parse(aiResult);
          if (parsed.category) {
            return jsonResponse(parsed);
          }
        } catch { /* fallback below */ }
      }

      // Fallback: keyword-based
      const input = (text || "").toLowerCase();
      const categoryMap: Record<string, string[]> = {
        sports: ["খেলা", "ক্রিকেট", "ফুটবল", "sports", "cricket", "football", "match"],
        politics: ["রাজনীতি", "সরকার", "মন্ত্রী", "politics", "government", "election", "নির্বাচন"],
        international: ["আন্তর্জাতিক", "বিশ্ব", "international", "world", "global"],
        entertainment: ["বিনোদন", "সিনেমা", "নাটক", "entertainment", "movie", "drama"],
        economy: ["অর্থনীতি", "ব্যবসা", "economy", "business", "market", "বাজার"],
        education: ["শিক্ষা", "বিশ্ববিদ্যালয়", "education", "university", "school", "স্কুল"],
        technology: ["প্রযুক্তি", "technology", "tech", "digital", "ডিজিটাল"],
        health: ["স্বাস্থ্য", "health", "hospital", "হাসপাতাল", "চিকিৎসা"],
        crime: ["অপরাধ", "হত্যা", "crime", "murder", "police", "পুলিশ"],
        national: ["জাতীয়", "বাংলাদেশ", "national", "bangladesh", "দেশ"],
      };
      let category = "national";
      for (const [cat, keywords] of Object.entries(categoryMap)) {
        if (keywords.some(k => input.includes(k))) { category = cat; break; }
      }
      const summary = text ? text.substring(0, 120) + "..." : "";
      return jsonResponse({ category, tags: [], summary });
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

function jsonResponse(data: unknown) {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function callAI(apiKey: string, systemPrompt: string, userText: string): Promise<string> {
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-lite",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userText },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (!resp.ok) throw new Error(`AI API error: ${resp.status}`);
  const data = await resp.json();
  return data.choices?.[0]?.message?.content || "";
}
