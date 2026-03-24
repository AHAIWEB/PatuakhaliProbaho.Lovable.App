interface SectionTitleProps {
  title: string;
  className?: string;
}

const SectionTitle = ({ title, className = "" }: SectionTitleProps) => {
  return (
    <div className={`flex items-center mb-3 sm:mb-4 ${className}`}>
      <h2 className="news-section-title">{title}</h2>
      <div className="flex-1 h-px bg-border ml-2" />
    </div>
  );
};

export default SectionTitle;
