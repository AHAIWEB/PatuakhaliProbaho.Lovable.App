import featured1 from "@/assets/featured-1.jpg";
import featured2 from "@/assets/featured-2.jpg";
import news1 from "@/assets/news-1.jpg";
import news2 from "@/assets/news-2.jpg";
import news3 from "@/assets/news-3.jpg";

export interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  image: string;
  source: string;
  sourceUrl: string;
  date: string;
  isFeatured?: boolean;
  isHighlighted?: boolean;
  division?: string;
}

export const featuredNews: NewsItem[] = [
  {
    id: "f1",
    title: "পটুয়াখালীতে নদী ভাঙনে বিপন্ন শত শত পরিবার, জরুরি ত্রাণ বিতরণ শুরু",
    excerpt: "পটুয়াখালী জেলার বিভিন্ন উপজেলায় নদী ভাঙনে ক্ষতিগ্রস্ত পরিবারদের মধ্যে জরুরি ত্রাণ বিতরণ শুরু হয়েছে। স্থানীয় প্রশাসন ও বিভিন্ন সংস্থা ত্রাণ কার্যক্রমে অংশ নিচ্ছে।",
    category: "জাতীয়",
    image: featured1,
    source: "পটুয়াখালী বার্তা",
    sourceUrl: "https://patuakhalibarta.com",
    date: "২৩ মার্চ ২০২৬",
    isFeatured: true,
  },
  {
    id: "f2",
    title: "জাতীয় সংসদে নতুন শিক্ষা বিল উত্থাপন, বিরোধী দলের তীব্র প্রতিবাদ",
    excerpt: "সরকার নতুন শিক্ষা সংস্কার বিল উত্থাপন করেছে যেখানে প্রাথমিক শিক্ষায় ব্যাপক পরিবর্তনের প্রস্তাব রয়েছে।",
    category: "রাজনীতি",
    image: featured2,
    source: "চ্যানেল আই",
    sourceUrl: "https://www.channelionline.com",
    date: "২৩ মার্চ ২০২৬",
    isFeatured: true,
  },
];

export const nationalNews: NewsItem[] = [
  {
    id: "n1",
    title: "সারাদেশে পণ্যের দাম বৃদ্ধিতে ভোক্তাদের হতাশা বাড়ছে",
    excerpt: "নিত্যপ্রয়োজনীয় পণ্যের দাম বাড়ায় সাধারণ মানুষের জীবনযাত্রায় প্রভাব পড়ছে।",
    category: "অর্থনীতি",
    image: news1,
    source: "প্রথম আলো",
    sourceUrl: "https://www.prothomalo.com",
    date: "২৩ মার্চ ২০২৬",
  },
  {
    id: "n2",
    title: "শিক্ষা মন্ত্রণালয়ের নতুন কারিকুলাম নিয়ে বিতর্ক চলছে",
    excerpt: "নতুন জাতীয় কারিকুলাম নিয়ে শিক্ষক ও অভিভাবকদের মধ্যে মিশ্র প্রতিক্রিয়া।",
    category: "শিক্ষা",
    image: news2,
    source: "সমকাল",
    sourceUrl: "https://samakal.com",
    date: "২২ মার্চ ২০২৬",
  },
  {
    id: "n3",
    title: "বাংলাদেশ ক্রিকেট দলের ঐতিহাসিক জয়, সিরিজ ক্লিন সুইপ",
    excerpt: "টানা তিন ম্যাচ জিতে সিরিজ ক্লিন সুইপ করেছে বাংলাদেশ ক্রিকেট দল।",
    category: "খেলা",
    image: news3,
    source: "এনটিভি",
    sourceUrl: "https://www.ntvbd.com",
    date: "২২ মার্চ ২০২৬",
  },
  {
    id: "n4",
    title: "ঢাকায় নতুন মেট্রোরেল লাইনের কাজ শুরু, যানজট কমার আশা",
    excerpt: "মেট্রোরেলের নতুন লাইন নির্মাণ শুরু হয়েছে যা ঢাকার যানজট কমাতে সাহায্য করবে।",
    category: "জাতীয়",
    image: featured2,
    source: "যমুনা টিভি",
    sourceUrl: "https://jamuna.tv",
    date: "২১ মার্চ ২০২৬",
  },
];

export const barisalNews: NewsItem[] = [
  {
    id: "b1",
    title: "বরিশালে নৌপথে যাত্রী সেবার মান উন্নয়নে নতুন উদ্যোগ",
    excerpt: "বরিশাল বিভাগের নৌপথে যাত্রীদের সেবার মান বাড়াতে নতুন পদক্ষেপ নেওয়া হয়েছে।",
    category: "বরিশাল",
    image: featured1,
    source: "বরিশাল প্রতিদিন",
    sourceUrl: "https://barisalprotidin.com",
    date: "২৩ মার্চ ২০২৬",
    isHighlighted: true,
  },
  {
    id: "b2",
    title: "পটুয়াখালীতে কৃষকদের জন্য নতুন প্রশিক্ষণ কেন্দ্র উদ্বোধন",
    excerpt: "আধুনিক কৃষি প্রযুক্তি শেখাতে পটুয়াখালীতে নতুন প্রশিক্ষণ কেন্দ্র চালু হয়েছে।",
    category: "পটুয়াখালী",
    image: news1,
    source: "আমাদের পটুয়াখালী",
    sourceUrl: "https://dailyamaderpatuakhali.com",
    date: "২২ মার্চ ২০২৬",
  },
  {
    id: "b3",
    title: "ভোলায় শিক্ষা প্রতিষ্ঠানে ডিজিটাল ক্লাসরুম চালু",
    excerpt: "ভোলা জেলার বিভিন্ন স্কুলে ডিজিটাল ক্লাসরুম স্থাপন করা হয়েছে।",
    category: "ভোলা",
    image: news2,
    source: "ভোলা নিউজ",
    sourceUrl: "https://bholanews.com",
    date: "২১ মার্চ ২০২৬",
  },
  {
    id: "b4",
    title: "বরগুনায় মৎস্য চাষে বিপ্লব, স্থানীয় অর্থনীতিতে চাঙ্গা ভাব",
    excerpt: "বরগুনায় আধুনিক মৎস্য চাষ পদ্ধতি গ্রহণে স্থানীয় অর্থনীতিতে ইতিবাচক প্রভাব পড়ছে।",
    category: "বরগুনা",
    image: news3,
    source: "মানবকল্যাণ",
    sourceUrl: "https://manobkal.com",
    date: "২০ মার্চ ২০২৬",
  },
];

export const divisionalNews: NewsItem[] = [
  {
    id: "d1",
    title: "চট্টগ্রামে নতুন শিল্পাঞ্চল স্থাপনের পরিকল্পনা",
    excerpt: "চট্টগ্রাম বিভাগে নতুন শিল্পাঞ্চল গড়ে তোলার পরিকল্পনা নিয়েছে সরকার।",
    category: "চট্টগ্রাম",
    image: news1,
    source: "চট্টগ্রাম প্রতিদিন",
    sourceUrl: "https://ctgpratidin.com",
    date: "২৩ মার্চ ২০২৬",
  },
  {
    id: "d2",
    title: "সিলেটে পর্যটন শিল্পের নতুন দিগন্ত উন্মোচিত",
    excerpt: "সিলেটের পর্যটন শিল্পে নতুন বিনিয়োগের সম্ভাবনা দেখা দিয়েছে।",
    category: "সিলেট",
    image: news2,
    source: "সিলেটের ডাক",
    sourceUrl: "https://sylheterdak.com.bd",
    date: "২২ মার্চ ২০২৬",
  },
  {
    id: "d3",
    title: "রাজশাহীতে আম রফতানিতে নতুন রেকর্ড",
    excerpt: "এবার আম মৌসুমে রাজশাহী থেকে রেকর্ড পরিমাণ আম রফতানি হয়েছে।",
    category: "রাজশাহী",
    image: news3,
    source: "সোনালী সংবাদ",
    sourceUrl: "https://sonalisangbad.com",
    date: "২১ মার্চ ২০২৬",
  },
  {
    id: "d4",
    title: "রংপুরে কৃষি প্রযুক্তি মেলায় ব্যাপক সাড়া",
    excerpt: "রংপুর বিভাগে অনুষ্ঠিত কৃষি প্রযুক্তি মেলায় হাজারো কৃষক অংশগ্রহণ করেছেন।",
    category: "রংপুর",
    image: featured1,
    source: "রংপুর নিউজ",
    sourceUrl: "https://rangpur.news",
    date: "২০ মার্চ ২০২৬",
  },
];

export const categories = [
  { name: "জাতীয়", slug: "national" },
  { name: "রাজনীতি", slug: "politics" },
  { name: "বিশ্ব", slug: "world" },
  { name: "আলোচিত", slug: "trending" },
  { name: "শিক্ষা", slug: "education" },
  { name: "ধর্ম", slug: "religion" },
  { name: "অর্থনীতি", slug: "economy" },
  {
    name: "📹 বিনোদন",
    slug: "entertainment",
    subCategories: [
      { name: "হলিউড", slug: "hollywood" },
      { name: "বলিউড", slug: "bollywood" },
      { name: "টলিউড", slug: "tollywood" },
      { name: "ঢালিউড", slug: "dhallywood" },
      { name: "মিডিয়া", slug: "media" },
    ],
  },
  { name: "খেলা", slug: "sports" },
  {
    name: "🫂 লাইফস্টাইল",
    slug: "lifestyle",
    subCategories: [
      { name: "জীবনযাপন", slug: "living" },
      { name: "নারী", slug: "women" },
      { name: "ফ্যাশন", slug: "fashion" },
      { name: "শরীর", slug: "body" },
      { name: "রান্না-বান্না", slug: "cooking" },
      { name: "শখ", slug: "hobby" },
      { name: "স্বাস্থ্যসেবা", slug: "healthcare" },
    ],
  },
  { name: "ভ্রমণ", slug: "travel" },
];

export const divisions = [
  {
    name: "বরিশাল",
    slug: "barisal",
    districts: [
      { name: "বরিশাল", upazilas: ["বরিশাল সদর", "বাকেরগঞ্জ", "বানারীপাড়া", "গৌরনদী", "হিজলা", "মেহেন্দিগঞ্জ", "মুলাদী", "উজিরপুর", "আগৈলঝাড়া", "বাবুগঞ্জ"] },
      { name: "পটুয়াখালী", upazilas: ["পটুয়াখালী সদর", "বাউফল", "দুমকি", "দশমিনা", "গলাচিপা", "কলাপাড়া", "মির্জাগঞ্জ", "রাঙ্গাবালী"] },
      { name: "ভোলা", upazilas: ["ভোলা সদর", "বোরহানউদ্দিন", "চরফ্যাশন", "দৌলতখান", "লালমোহন", "মনপুরা", "তজুমদ্দিন"] },
      { name: "বরগুনা", upazilas: ["বরগুনা সদর", "আমতলী", "বামনা", "বেতাগী", "পাথরঘাটা", "তালতলী"] },
      { name: "পিরোজপুর", upazilas: ["পিরোজপুর সদর", "ভাণ্ডারিয়া", "কাউখালী", "মঠবাড়িয়া", "নাজিরপুর", "নেছারাবাদ", "জিয়ানগর"] },
      { name: "ঝালকাঠি", upazilas: ["ঝালকাঠি সদর", "কাঠালিয়া", "নলছিটি", "রাজাপুর"] },
    ],
  },
  {
    name: "ঢাকা",
    slug: "dhaka",
    districts: [
      { name: "ঢাকা", upazilas: ["ঢাকা সদর"] },
      { name: "নারায়ণগঞ্জ", upazilas: ["নারায়ণগঞ্জ সদর"] },
      { name: "গাজীপুর", upazilas: ["গাজীপুর সদর"] },
      { name: "মুন্সিগঞ্জ", upazilas: ["মুন্সিগঞ্জ সদর"] },
    ],
  },
  {
    name: "চট্টগ্রাম",
    slug: "chittagong",
    districts: [
      { name: "চট্টগ্রাম", upazilas: ["চট্টগ্রাম সদর"] },
      { name: "কক্সবাজার", upazilas: ["কক্সবাজার সদর"] },
      { name: "রাঙামাটি", upazilas: ["রাঙামাটি সদর"] },
    ],
  },
  {
    name: "সিলেট",
    slug: "sylhet",
    districts: [
      { name: "সিলেট", upazilas: ["সিলেট সদর"] },
      { name: "হবিগঞ্জ", upazilas: ["হবিগঞ্জ সদর"] },
    ],
  },
  {
    name: "রাজশাহী",
    slug: "rajshahi",
    districts: [
      { name: "রাজশাহী", upazilas: ["রাজশাহী সদর"] },
      { name: "বগুড়া", upazilas: ["বগুড়া সদর"] },
    ],
  },
  {
    name: "রংপুর",
    slug: "rangpur",
    districts: [
      { name: "রংপুর", upazilas: ["রংপুর সদর"] },
      { name: "দিনাজপুর", upazilas: ["দিনাজপুর সদর"] },
    ],
  },
  {
    name: "খুলনা",
    slug: "khulna",
    districts: [
      { name: "খুলনা", upazilas: ["খুলনা সদর"] },
      { name: "যশোর", upazilas: ["যশোর সদর"] },
    ],
  },
  {
    name: "ময়মনসিংহ",
    slug: "mymensingh",
    districts: [
      { name: "ময়মনসিংহ", upazilas: ["ময়মনসিংহ সদর"] },
      { name: "জামালপুর", upazilas: ["জামালপুর সদর"] },
    ],
  },
];
