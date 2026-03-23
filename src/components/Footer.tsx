import { Facebook, Youtube, Twitter, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-header-bg text-header-foreground mt-8">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-bold mb-3">পটুয়াখালী প্রবাহ</h3>
            <p className="text-sm opacity-80 leading-relaxed">
              পটুয়াখালী ও বরিশাল বিভাগের সবচেয়ে বিশ্বস্ত সংবাদ পোর্টাল। দেশ-বিদেশের সর্বশেষ খবর, বিশ্লেষণ ও মতামত।
            </p>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-3">যোগাযোগ</h3>
            <ul className="space-y-2 text-sm opacity-80">
              <li className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> পটুয়াখালী, বরিশাল, বাংলাদেশ</li>
              <li className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> +৮৮০ ১৭XX-XXXXXX</li>
              <li className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> info@patuakhaliprobaho.com</li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-3">সামাজিক যোগাযোগ</h3>
            <div className="flex gap-3">
              <a href="#" className="bg-primary/30 hover:bg-primary/50 p-2 rounded-sm transition-colors" aria-label="Facebook">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="bg-primary/30 hover:bg-primary/50 p-2 rounded-sm transition-colors" aria-label="Youtube">
                <Youtube className="h-5 w-5" />
              </a>
              <a href="#" className="bg-primary/30 hover:bg-primary/50 p-2 rounded-sm transition-colors" aria-label="Twitter">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-primary/20 mt-6 pt-4 text-center text-xs opacity-60">
          &copy; {new Date().getFullYear()} পটুয়াখালী প্রবাহ | Patuakhali Probaho. সর্বস্বত্ব সংরক্ষিত।
        </div>
      </div>
    </footer>
  );
};

export default Footer;
