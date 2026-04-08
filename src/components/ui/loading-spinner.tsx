import loadingImage from "@/assets/bee05894efbe96641b12e116dce823584b159d86.png";

interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  text?: string;
}

export function LoadingSpinner({ className = "", size = "md", text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-10 w-10",
    lg: "h-16 w-16",
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <img
        src={loadingImage}
        alt="Loading..."
        className={`${sizeClasses[size]} object-contain animate-fast-pulse ${className}`}
      />
      {text && <p className="text-muted-foreground text-sm">{text}</p>}
    </div>
  );
}