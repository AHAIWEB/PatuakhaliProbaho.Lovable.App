interface AdSpaceProps {
  size: "banner" | "sidebar" | "leaderboard";
  className?: string;
}

const AdSpace = ({ size, className = "" }: AdSpaceProps) => {
  const sizeClasses = {
    banner: "h-16 sm:h-20",
    sidebar: "h-32 sm:h-48",
    leaderboard: "h-16 sm:h-24",
  };

  return (
    <div className={`bg-muted border border-dashed border-border rounded-sm flex items-center justify-center ${sizeClasses[size]} ${className}`}>
      <span className="text-xs text-muted-foreground">বিজ্ঞাপনের স্থান</span>
    </div>
  );
};

export default AdSpace;
