import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, MapPin, Menu, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const CategoryNav = () => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const { data: dbCategories } = useQuery({
    queryKey: ["categories-nav"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").order("sort_order");
      return data || [];
    },
  });

  const parentCats = (dbCategories || []).filter((c) => !c.parent_id);
  const getSubCats = (parentId: string) => (dbCategories || []).filter((c) => c.parent_id === parentId);

  const goTo = (slug: string) => {
    navigate(`/category/${slug}`);
    setMobileOpen(false);
    setOpenDropdown(null);
  };

  return (
    <nav className="bg-header-bg text-header-foreground sticky top-0 z-50 shadow-md">
      <div className="container mx-auto px-4">
        <div className="md:hidden flex items-center justify-between py-2">
          <span className="text-sm font-bold">মেনু</span>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="p-1">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <ul className={`${mobileOpen ? "flex" : "hidden"} md:flex flex-col md:flex-row md:items-center md:gap-0 text-sm`}>
          {parentCats.map((cat) => {
            const subs = getSubCats(cat.id);
            return (
              <li
                key={cat.id}
                className="relative group"
                onMouseEnter={() => subs.length > 0 && setOpenDropdown(cat.slug)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <button
                  onClick={() => goTo(cat.slug)}
                  className="flex items-center gap-1 px-3 py-2.5 hover:bg-primary/80 transition-colors whitespace-nowrap w-full text-left"
                >
                  {cat.name}
                  {subs.length > 0 && <ChevronDown className="h-3 w-3" />}
                </button>
                {subs.length > 0 && openDropdown === cat.slug && (
                  <ul className="absolute left-0 top-full bg-header-bg border border-primary/30 min-w-[160px] shadow-lg z-50">
                    {subs.map((sub) => (
                      <li key={sub.id}>
                        <button onClick={() => goTo(sub.slug)} className="block w-full text-left px-4 py-2 hover:bg-primary/80 transition-colors text-sm">
                          {sub.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}

          {/* Archive link */}
          <li>
            <button
              onClick={() => { navigate("/archive"); setMobileOpen(false); }}
              className="flex items-center gap-1 px-3 py-2.5 hover:bg-primary/80 transition-colors whitespace-nowrap w-full text-left"
            >
              📁 আর্কাইভ
            </button>
          </li>

          {/* Gallery link */}
          <li>
            <button
              onClick={() => { navigate("/gallery"); setMobileOpen(false); }}
              className="flex items-center gap-1 px-3 py-2.5 hover:bg-primary/80 transition-colors whitespace-nowrap w-full text-left"
            >
              📸 গ্যালারি
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default CategoryNav;
