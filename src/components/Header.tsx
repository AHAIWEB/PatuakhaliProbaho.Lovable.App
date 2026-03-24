import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LogIn, User, Shield, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

const Header = () => {
  const { user, userRole, loading, signOut } = useAuth();

  return (
    <header className="bg-card border-b border-border py-2 sm:py-4">
      <div className="container mx-auto px-3 sm:px-4 flex items-center justify-between">
        <div className="w-16 sm:w-32" />
        <a href="/" className="flex flex-col items-center gap-0.5">
          <img src={logo} alt="পটুয়াখালী প্রবাহ" width={180} height={90} className="h-10 sm:h-16 w-auto" />
          <span className="text-[10px] sm:text-xs text-muted-foreground tracking-wide">Patuakhali Probaho</span>
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
