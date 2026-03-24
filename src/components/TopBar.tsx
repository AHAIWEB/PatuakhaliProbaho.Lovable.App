import { Clock, Facebook, Youtube, Twitter } from "lucide-react";

const TopBar = () => {
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
          <a href="#" className="hover:opacity-80 transition-opacity" aria-label="Facebook">
            <Facebook className="h-3.5 w-3.5" />
          </a>
          <a href="#" className="hover:opacity-80 transition-opacity" aria-label="Youtube">
            <Youtube className="h-3.5 w-3.5" />
          </a>
          <a href="#" className="hover:opacity-80 transition-opacity" aria-label="Twitter">
            <Twitter className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
