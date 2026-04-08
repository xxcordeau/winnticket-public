import { RefreshCw } from "lucide-react";
import { ReactNode } from "react";

type Language = "ko" | "en";

interface PageHeaderProps {
  title: string;
  subtitle: string;
  language: Language;
  lastUpdate?: Date;
  onRefresh?: () => void;
  rightContent?: ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  language,
  lastUpdate,
  onRefresh,
  rightContent,
}: PageHeaderProps) {
  const formatDateTime = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 min-h-[72px] py-4">
      <div className="flex-1 min-w-0">
        <h1 className="font-bold text-xl sm:text-2xl truncate">{title}</h1>
        <p className="text-xs sm:text-sm text-muted-foreground [word-break:keep-all] [overflow-wrap:break-word]">{subtitle}</p>
      </div>
      
      {rightContent ? (
        <div className="flex-shrink-0">
          {rightContent}
        </div>
      ) : onRefresh && lastUpdate ? (
        <div className="flex flex-col items-start sm:items-end gap-1.5 flex-shrink-0">
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-accent transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span className="text-[11px] sm:text-[13px]">
              {language === "ko" ? "새로고침" : "Refresh"}
            </span>
          </button>
          <p className="text-[10px] sm:text-[11px] text-muted-foreground">
            {language === "ko" ? "마지막 업데이트" : "Last Update"} :{" "}
            {formatDateTime(lastUpdate)}
          </p>
        </div>
      ) : null}
    </div>
  );
}