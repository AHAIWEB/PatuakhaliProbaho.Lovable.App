import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LogIn, User, Shield, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import defaultLogo from "@/assets/logo.png";
import { useSiteSetting } from "@/hooks/useSiteSettings";

const Header = () => {
  const { user, userRole, loading, signOut } = useAuth();
  const { data: customLogo } = useSiteSetting("site_logo");
  const { data: siteNameSetting } = useSiteSetting("site_name");
  const { data: logoSizeSetting } = useSiteSetting("header_logo_size");
  const { data: faviconUrl } = useSiteSetting("site_favicon");
  const logo = customLogo || defaultLogo;
  const logoHeight = parseInt(logoSizeSetting || "64") || 64;
  const siteName = siteNameSetting || "Patuakhali Probaho";

  // Dynamic favicon
  useEffect(() => {
    if (faviconUrl) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) { link = document.createElement("link"); link.rel = "icon"; document.head.appendChild(link); }
      link.href = faviconUrl;
    }
  }, [faviconUrl]);

  return (
    <header className="bg-card border-b border-border py-2 sm:py-4">
      <div className="container mx-auto px-3 sm:px-4 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2">
          <img src={logo} alt={siteName} width={logoHeight * 2} height={logoHeight} style={{ height: `${Math.max(logoHeight, 56)}px` }} className="w-auto h-14 sm:h-14 md:h-16" />
        </a>
        <div className="flex items-center gap-1 sm:gap-2 w-16 sm:w-32 justify-end">
          {loading ? null : user ? (
            <>
              {["admin", "editor", "reporter"].includes(userRole || "") && (
                <Link to="/admin">
                  <Button variant="ghost" size="icon" className="h-8 w-8" title="এডমিন প্যানেল">
                    <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                </Link>
              )}
              <div className="hidden sm:flex items-center gap-1 text-sm text-muted-foreground">
                <User className="h-3.5 w-3.5" />
                <span className="max-w-[80px] truncate">{user.user_metadata?.full_name || user.email?.split("@")[0]}</span>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={signOut} title="লগআউট">
                <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </>
          ) : (
            <Link to="/auth">
              <Button variant="outline" size="sm" className="gap-1 h-7 text-xs sm:h-9 sm:text-sm">
                <LogIn className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="hidden sm:inline">লগইন</span>
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
