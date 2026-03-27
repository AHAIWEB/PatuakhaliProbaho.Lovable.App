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

    if (action === "extract_quotes") {
      // Extract quotes from title/text without AI
      const input = (text || "").trim();
      const quotes: string[] = [];

      if (input) {
        // Split by common delimiters and use meaningful segments as quotes
        const sentences = input
          .split(/[।\.\!\?\n]+/)
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 5);

        if (sentences.length > 0) {
          // Use up to 3 sentences as quotes
          for (let i = 0; i < Math.min(3, sentences.length); i++) {
            quotes.push(`"${sentences[i]}"`);
          }
        } else {
          quotes.push(`"${input.substring(0, 100)}"`);
        }
      }

      return new Response(JSON.stringify({ quotes }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "categorize") {
      // Simple keyword-based categorization without AI
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
        if (keywords.some(k => input.includes(k))) {
          category = cat;
          break;
        }
      }

      const summary = text ? text.substring(0, 120) + "..." : "";

      return new Response(JSON.stringify({ category, tags: [], summary }), {
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
