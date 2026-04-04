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
    // Decode numeric HTML entities (decimal &#8217; and hex &#x2019;)
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    // Decode common HTML entities
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "\u2019")
    .replace(/&lsquo;/g, "\u2018")
    .replace(/&rdquo;/g, "\u201D")
    .replace(/&ldquo;/g, "\u201C")
    .replace(/&hellip;/g, "\u2026")
    .replace(/&mdash;/g, "\u2014")
    .replace(/&ndash;/g, "\u2013")
    .replace(/&eacute;/g, "\u00E9")
    .replace(/&aacute;/g, "\u00E1")
    .replace(/&oacute;/g, "\u00F3")
    .replace(/&uuml;/g, "\u00FC")
    .replace(/&copy;/g, "\u00A9")
    .replace(/&reg;/g, "\u00AE")
    .replace(/&trade;/g, "\u2122")
    .replace(/&bull;/g, "\u2022")
    .replace(/&middot;/g, "\u00B7")
    .replace(/&laquo;/g, "\u00AB")
    .replace(/&raquo;/g, "\u00BB")
    // Collapse whitespace
    .replace(/\s+/g, " ")
    .trim();
}

export function buildExcerpt(text: string, maxLen = 200): string {
  const clean = cleanText(text);
  return clean.length > maxLen ? clean.substring(0, maxLen) + "…" : clean;
}
