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
            `তুমি একজন বাংলা নিউজ এডিটর ও কোটেশন বিশেষজ্ঞ। নিচের সম্পূর্ণ আর্টিকেল থেকে ৩টি আলাদা ধরনের smart quote তৈরি করো:

1. **মূল সংবাদ কোটেশন**: সংবাদের সবচেয়ে গুরুত্বপূর্ণ তথ্য নিয়ে ৩-৫ লাইনের একটি সারাংশমূলক কোটেশন।
2. **বিশ্লেষণমূলক কোটেশন**: সংবাদের প্রভাব, তাৎপর্য বা পটভূমি নিয়ে ২-৪ লাইনের একটি গভীর কোটেশন।  
3. **শিরোনাম কোটেশন**: সোশ্যাল মিডিয়ায় শেয়ারযোগ্য ১-২ লাইনের একটি আকর্ষণীয় কোটেশন।

প্রতিটি কোটেশন বাংলায় লিখো, স্বাভাবিক ভাষায়, উদ্ধৃতি চিহ্ন ছাড়া।
শুধু JSON ফরম্যাটে উত্তর দাও: {"quotes": ["...", "...", "..."]}`,
            text.substring(0, 3000)
          );
          const parsed = JSON.parse(aiResult);
          if (parsed.quotes?.length) {
            return jsonResponse({ quotes: parsed.quotes });
          }
        } catch { /* fallback below */ }
      }

      // Fallback: smarter local extraction
      const input = (text || "").trim();
      const quotes: string[] = [];
      if (input) {
        const sentences = input
          .split(/[।\.\!\?\n]+/)
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 15);
        
        // Quote 1: Key summary (first few meaningful sentences)
        if (sentences.length >= 2) {
          quotes.push(sentences.slice(0, Math.min(4, sentences.length)).join("। ") + "।");
        }
        // Quote 2: Middle section insight
        if (sentences.length >= 5) {
          const mid = Math.floor(sentences.length / 2);
          quotes.push(sentences.slice(mid, mid + 3).join("। ") + "।");
        }
        // Quote 3: Short headline-worthy
        if (sentences.length >= 1) {
          quotes.push(sentences[0] + "।");
        }
        if (quotes.length === 0) {
          quotes.push(input.substring(0, 300));
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
