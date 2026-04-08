import { Monitor } from "lucide-react";

interface MobilePcNoticeProps {
  pageName?: string;
}

export function MobilePcNotice({ pageName = "이 페이지" }: MobilePcNoticeProps) {
  return (
    <div className="md:hidden bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <Monitor className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
            PC 화면에서 이용해주세요
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            {pageName}는 PC 환경에 최적화되어 있습니다. 더 나은 사용 경험을 위해 데스크톱이나 태블릿 환경에서 접속해주세요.
          </p>
        </div>
      </div>
    </div>
  );
}
