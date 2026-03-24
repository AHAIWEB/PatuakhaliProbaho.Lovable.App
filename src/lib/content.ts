/**
 * Cleans raw RSS/HTML content for display
 */
export function cleanText(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw
    // Remove CDATA wrappers
    .replace(/<!\[CDATA\[/gi, "")
    .replace(/\]\]>/g, "")
    // Remove HTML tags
    .replace(/<[^>]*>/g, "")
    // Decode common HTML entities
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, "\u201D")
    .replace(/&ldquo;/g, "\u201C")
    .replace(/&hellip;/g, "…")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    // Collapse whitespace
    .replace(/\s+/g, " ")
    .trim();
}

export function buildExcerpt(text: string, maxLen = 200): string {
  const clean = cleanText(text);
  return clean.length > maxLen ? clean.substring(0, maxLen) + "…" : clean;
}
