import { useState } from "react";
import { ChevronDown, MapPin, Menu, X } from "lucide-react";
import { categories, divisions } from "@/data/mockNews";

const CategoryNav = () => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="bg-header-bg text-header-foreground sticky top-0 z-50 shadow-md">
      <div className="container mx-auto px-4">
        {/* Mobile toggle */}
        <div className="md:hidden flex items-center justify-between py-2">
          <span className="text-sm font-bold">মেনু</span>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="p-1">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Desktop nav */}
        <ul className={`${mobileOpen ? "flex" : "hidden"} md:flex flex-col md:flex-row md:items-center md:gap-0 text-sm`}>
          {categories.map((cat) => (
            <li
              key={cat.slug}
              className="relative group"
              onMouseEnter={() => cat.subCategories && setOpenDropdown(cat.slug)}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <a
                href={`#${cat.slug}`}
                className="flex items-center gap-1 px-3 py-2.5 hover:bg-primary/80 transition-colors whitespace-nowrap"
              >
                {cat.name}
                {cat.subCategories && <ChevronDown className="h-3 w-3" />}
              </a>
              {cat.subCategories && openDropdown === cat.slug && (
                <ul className="absolute left-0 top-full bg-header-bg border border-primary/30 min-w-[160px] shadow-lg z-50">
                  {cat.subCategories.map((sub) => (
                    <li key={sub.slug}>
                      <a href={`#${sub.slug}`} className="block px-4 py-2 hover:bg-primary/80 transition-colors text-sm">
                        {sub.name}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}

          {/* Division dropdown */}
          <li
            className="relative group"
            onMouseEnter={() => setOpenDropdown("divisions")}
            onMouseLeave={() => setOpenDropdown(null)}
          >
            <a href="#divisions" className="flex items-center gap-1 px-3 py-2.5 hover:bg-primary/80 transition-colors whitespace-nowrap">
              <MapPin className="h-3 w-3" />
              দেশ
              <ChevronDown className="h-3 w-3" />
            </a>
            {openDropdown === "divisions" && (
              <DivisionDropdown />
            )}
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
          <li
            key={div.slug}
            onMouseEnter={() => { setActiveDivision(div.slug); setActiveDistrict(null); }}
          >
            <a
              href={`#${div.slug}`}
              className={`block px-4 py-2 text-sm hover:bg-primary/80 transition-colors ${activeDivision === div.slug ? "bg-primary/60" : ""}`}
            >
              {div.name} ▸
            </a>
          </li>
        ))}
      </ul>
      {activeDivision && (
        <ul className="min-w-[140px] border-r border-primary/20">
          {divisions
            .find((d) => d.slug === activeDivision)
            ?.districts.map((dist) => (
              <li
                key={dist.name}
                onMouseEnter={() => setActiveDistrict(dist.name)}
              >
                <a
                  href={`#${dist.name}`}
                  className={`block px-4 py-2 text-sm hover:bg-primary/80 transition-colors ${activeDistrict === dist.name ? "bg-primary/60" : ""}`}
                >
                  {dist.name} ▸
                </a>
              </li>
            ))}
        </ul>
      )}
      {activeDistrict && activeDivision && (
        <ul className="min-w-[140px]">
          {divisions
            .find((d) => d.slug === activeDivision)
            ?.districts.find((d) => d.name === activeDistrict)
            ?.upazilas.map((upazila) => (
              <li key={upazila}>
                <a href={`#${upazila}`} className="block px-4 py-2 text-sm hover:bg-primary/80 transition-colors">
                  {upazila}
                </a>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
};

export default CategoryNav;
