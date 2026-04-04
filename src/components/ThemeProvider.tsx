import { useEffect } from "react";
import { useSiteSetting } from "@/hooks/useSiteSettings";

// Convert hex to HSL string for CSS variables
const hexToHSL = (hex: string): string => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { data: primaryColor } = useSiteSetting("theme_primary");
  const { data: accentColor } = useSiteSetting("theme_accent");
  const { data: bgColor } = useSiteSetting("theme_background");
  const { data: headerBg } = useSiteSetting("theme_header_bg");
  const { data: topbarBg } = useSiteSetting("theme_topbar_bg");
  const { data: footerBg } = useSiteSetting("theme_footer_bg");
  const { data: fontFamily } = useSiteSetting("theme_font");

  useEffect(() => {
    const root = document.documentElement;
    if (primaryColor) root.style.setProperty("--primary", hexToHSL(primaryColor));
    if (accentColor) root.style.setProperty("--accent", hexToHSL(accentColor));
    if (bgColor) root.style.setProperty("--background", hexToHSL(bgColor));
    if (headerBg) root.style.setProperty("--header-bg", hexToHSL(headerBg));
    if (topbarBg) {
      root.style.setProperty("--topbar-bg", hexToHSL(topbarBg));
      root.style.setProperty("--category-badge", hexToHSL(topbarBg));
    }
    if (footerBg) root.style.setProperty("--header-bg", hexToHSL(footerBg));
    if (fontFamily) {
      root.style.setProperty("--font-family", fontFamily);
      document.body.style.fontFamily = `'${fontFamily}', sans-serif`;
    }
  }, [primaryColor, accentColor, bgColor, headerBg, topbarBg, footerBg, fontFamily]);

  return <>{children}</>;
};

export default ThemeProvider;
