interface SectionTitleProps {
  title: string;
  className?: string;
  accent?: "primary" | "red";
}

const SectionTitle = ({ title, className = "", accent = "primary" }: SectionTitleProps) => {
  return (
    <div className={`flex items-center mb-3 sm:mb-4 ${className}`}>
      <h2 className="news-section-title">{title}</h2>
      <div className="flex-1 h-[2px] ml-1" style={{
        background: `linear-gradient(to right, hsl(var(--${accent === "red" ? "accent" : "section-title-bg"})), transparent)`
      }} />
    </div>
  );
};

export default SectionTitle;
