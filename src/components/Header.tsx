import logo from "@/assets/logo.png";

const Header = () => {
  return (
    <header className="bg-card border-b border-border py-4">
      <div className="container mx-auto px-4 flex items-center justify-center">
        <a href="/" className="flex flex-col items-center gap-1">
          <img src={logo} alt="পটুয়াখালী প্রবাহ" width={180} height={90} className="h-16 w-auto" />
          <span className="text-xs text-muted-foreground tracking-wide">Patuakhali Probaho</span>
        </a>
      </div>
    </header>
  );
};

export default Header;
