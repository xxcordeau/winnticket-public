import { useState, useEffect } from "react";
import { useNavigate } from "@/lib/channel-context";
import { ShopHeader } from "@/components/shop-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Calendar, Eye } from "lucide-react";
import { getNotices } from "@/lib/api/notice";
import type { NoticePost } from "@/data/dto/community.dto";

type Language = "ko" | "en";

interface ShopNoticesProps {
  language: Language;
}

export function ShopNotices({ language }: ShopNoticesProps) {
  const navigate = useNavigate();
  const [notices, setNotices] = useState<NoticePost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotices = async () => {
      setLoading(true);
      const response = await getNotices();
      if (response.success && response.data) {
        // ()
        setNotices(response.data.filter(notice => notice.isActive));
      }
      setLoading(false);
    };

    fetchNotices();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === "ko" ? "ko-KR" : "en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const isNew = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ShopHeader language={language} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {language === "ko" ? "쇼핑 홈으로" : "Back to Shop"}
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl mb-2">
                {language === "ko" ? "공지사항" : "Notices"}
              </h1>
              <p className="text-muted-foreground">
                {language === "ko" 
                  ? "Winnticket의 새로운 소식을 확인하세요" 
                  : "Check out the latest news from Winnticket"}
              </p>
            </div>
          </div>
        </div>

        {/* Notices List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border">
          {loading ? (
            <div className="p-12 text-center text-muted-foreground">
              {language === "ko" ? "로딩 중..." : "Loading..."}
            </div>
          ) : notices.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              {language === "ko" ? "등록된 공지사항이 없습니다" : "No notices available"}
            </div>
          ) : (
            <div className="divide-y">
              {notices.map((notice) => (
                <div
                  key={notice.id}
                  onClick={() => navigate(`/notices/${notice.id}`)}
                  className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {isNew(notice.createdAt) && (
                          <Badge variant="destructive" className="text-xs">
                            NEW
                          </Badge>
                        )}
                        <h3 className="text-lg truncate">
                          {notice.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(notice.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          <span>{notice.views}</span>
                        </div>
                        <span>{notice.authorName}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default ShopNotices;
