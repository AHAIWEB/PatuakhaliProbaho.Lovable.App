import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, MapPin, Menu, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { divisions } from "@/data/mockNews";

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

          {/* Division dropdown */}
          <li
            className="relative group"
            onMouseEnter={() => setOpenDropdown("divisions")}
            onMouseLeave={() => setOpenDropdown(null)}
          >
            <button className="flex items-center gap-1 px-3 py-2.5 hover:bg-primary/80 transition-colors whitespace-nowrap">
              <MapPin className="h-3 w-3" />
              দেশ
              <ChevronDown className="h-3 w-3" />
            </button>
            {openDropdown === "divisions" && <DivisionDropdown />}
          </li>
        </ul>
      </div>
    </nav>
  );
};

const DivisionDropdown = () => {
  const [activeDivision, setActiveDivision] = useState<string | null>(null);
  const [activeDistrict, setActiveDistrict] = useState<string | null>(null);

  return (
    <div className="absolute left-0 top-full bg-header-bg border border-primary/30 shadow-lg z-50 flex">
      <ul className="min-w-[140px] border-r border-primary/20">
        {divisions.map((div) => (
          <li key={div.slug} onMouseEnter={() => { setActiveDivision(div.slug); setActiveDistrict(null); }}>
            <a href={`/category/${div.slug}`} className={`block px-4 py-2 text-sm hover:bg-primary/80 transition-colors ${activeDivision === div.slug ? "bg-primary/60" : ""}`}>
              {div.name} ▸
            </a>
          </li>
        ))}
      </ul>
      {activeDivision && (
        <ul className="min-w-[140px] border-r border-primary/20">
          {divisions.find((d) => d.slug === activeDivision)?.districts.map((dist) => (
            <li key={dist.name} onMouseEnter={() => setActiveDistrict(dist.name)}>
              <span className={`block px-4 py-2 text-sm hover:bg-primary/80 transition-colors cursor-default ${activeDistrict === dist.name ? "bg-primary/60" : ""}`}>
                {dist.name} ▸
              </span>
            </li>
          ))}
        </ul>
      )}
      {activeDistrict && activeDivision && (
        <ul className="min-w-[140px]">
          {divisions.find((d) => d.slug === activeDivision)?.districts.find((d) => d.name === activeDistrict)?.upazilas.map((upazila) => (
            <li key={upazila}>
              <span className="block px-4 py-2 text-sm hover:bg-primary/80 transition-colors cursor-default">{upazila}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CategoryNav;
