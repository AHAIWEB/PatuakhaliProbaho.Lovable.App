const headlines = [
  "পটুয়াখালীতে নদী ভাঙনে বিপন্ন শত শত পরিবার",
  "জাতীয় সংসদে নতুন শিক্ষা বিল উত্থাপন",
  "বাংলাদেশ ক্রিকেট দলের ঐতিহাসিক জয়",
  "সারাদেশে পণ্যের দাম বৃদ্ধিতে ভোক্তাদের হতাশা",
  "বরিশালে নৌপথে যাত্রী সেবার মান উন্নয়নে নতুন উদ্যোগ",
];

const NewsTicker = () => {
  return (
    <div className="ticker-bar overflow-hidden py-2">
      <div className="container mx-auto px-4 flex items-center gap-3">
        <span className="bg-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded-sm shrink-0">
          সর্বশেষ
        </span>
        <div className="overflow-hidden flex-1">
          <div className="animate-ticker whitespace-nowrap text-sm">
            {headlines.map((h, i) => (
              <span key={i} className="mx-6">● {h}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsTicker;
