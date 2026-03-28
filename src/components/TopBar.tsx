import { Clock, Facebook, Youtube, Twitter, Send, Instagram, ExternalLink } from "lucide-react";
import { useSiteSetting } from "@/hooks/useSiteSettings";

const platformIcons: Record<string, React.ReactNode> = {
  facebook: <Facebook className="h-3.5 w-3.5" />,
  youtube: <Youtube className="h-3.5 w-3.5" />,
  twitter: <Twitter className="h-3.5 w-3.5" />,
  telegram: <Send className="h-3.5 w-3.5" />,
  instagram: <Instagram className="h-3.5 w-3.5" />,
  tiktok: <ExternalLink className="h-3.5 w-3.5" />,
  whatsapp: <ExternalLink className="h-3.5 w-3.5" />,
};

const TopBar = () => {
  const { data: socialLinksRaw } = useSiteSetting("social_links");
  const socialLinks: { platform: string; url: string }[] = (() => {
    try { return socialLinksRaw ? JSON.parse(socialLinksRaw) : []; } catch { return []; }
  })();

  const today = new Date();
  const banglaDate = today.toLocaleDateString("bn-BD", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="bg-topbar text-topbar-foreground text-[10px] sm:text-xs py-1 sm:py-1.5">
      <div className="container mx-auto flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Clock className="h-3 w-3" />
          <span>{banglaDate}</span>
        </div>
        <div className="flex items-center gap-3">
          {socialLinks.length > 0 ? (
            socialLinks.map((link, i) => (
              <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity" aria-label={link.platform}>
                {platformIcons[link.platform] || <ExternalLink className="h-3.5 w-3.5" />}
              </a>
            ))
          ) : (
            <>
              <a href="#" className="hover:opacity-80 transition-opacity" aria-label="Facebook"><Facebook className="h-3.5 w-3.5" /></a>
              <a href="#" className="hover:opacity-80 transition-opacity" aria-label="Youtube"><Youtube className="h-3.5 w-3.5" /></a>
              <a href="#" className="hover:opacity-80 transition-opacity" aria-label="Twitter"><Twitter className="h-3.5 w-3.5" /></a>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopBar;
