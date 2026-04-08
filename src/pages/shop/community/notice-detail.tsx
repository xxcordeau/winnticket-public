import { useState, useEffect } from "react";
import { useParams } from "react-router";
import { useNavigate } from "@/lib/channel-context";
import { ShopHeader } from "@/components/shop-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, Eye, ChevronUp, ChevronDown } from "lucide-react";
import { getNoticeById, getNotices, incrementNoticeViewCount } from "@/lib/api/notice";
import type { NoticePost } from "@/data/dto/community.dto";

type Language = "ko" | "en";

interface ShopNoticeDetailProps {
  language: Language;
}

export function ShopNoticeDetail({ language }: ShopNoticeDetailProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [notice, setNotice] = useState<NoticePost | null>(null);
  const [allNotices, setAllNotices] = useState<NoticePost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      setLoading(true);
      
      // 
      const noticeResponse = await getNoticeById(id);
      if (noticeResponse.success && noticeResponse.data) {
        setNotice(noticeResponse.data);
        
        // API 
        await incrementNoticeViewCount(id);
      }
      
      // (/ )
      const listResponse = await getNotices();
      if (listResponse.success && listResponse.data) {
        setAllNotices(listResponse.data);
      }
      
      setLoading(false);
    };

    fetchData();
  }, [id]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === "ko" ? "ko-KR" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const isNew = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <ShopHeader language={language} />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {language === "ko" ? "로딩 중..." : "Loading..."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!notice) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <ShopHeader language={language} />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {language === "ko" ? "공지사항을 찾을 수 없습니다" : "Notice not found"}
            </p>
            <Button onClick={() => navigate("/notices")} className="mt-4">
              {language === "ko" ? "목록으로" : "Back to List"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentIndex = allNotices.findIndex(p => p.id === id);
  const prevNotice = currentIndex > 0 ? allNotices[currentIndex - 1] : null;
  const nextNotice = currentIndex < allNotices.length - 1 ? allNotices[currentIndex + 1] : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ShopHeader language={language} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/notices")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {language === "ko" ? "목록으로" : "Back to List"}
        </Button>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border overflow-hidden">
          {/* Header */}
          <div className="p-8 border-b">
            <div className="flex items-center gap-2 mb-3">
              {isNew(notice.createdAt) && (
                <Badge variant="destructive">NEW</Badge>
              )}
            </div>
            <h1 className="text-3xl mb-4">
              {notice.title}
            </h1>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(notice.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span>{notice.views}</span>
              </div>
              <span>{notice.authorName}</span>
            </div>
          </div>

          {/* Content */}
          <div 
            className="p-8 prose prose-slate max-w-none dark:prose-invert
              [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:my-6
              [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:my-4
              [&_h3]:text-xl [&_h3]:font-bold [&_h3]:my-3
              [&_p]:my-3 [&_p]:leading-7
              [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6
              [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6
              [&_li]:my-1
              [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-4
              [&_pre]:bg-gray-100 [&_pre]:p-4 [&_pre]:rounded [&_pre]:my-4 [&_pre]:overflow-x-auto
              [&_a]:text-blue-600 [&_a]:underline
              [&_hr]:my-8 [&_hr]:border-gray-300
              [&_img]:rounded-lg [&_img]:my-4"
            dangerouslySetInnerHTML={{ __html: notice.content }}
          />
        </div>

        {/* Navigation */}
        <div className="mt-6 space-y-2">
          {nextNotice && (
            <button
              onClick={() => navigate(`/notices/${nextNotice.id}`)}
              className="w-full p-4 bg-white dark:bg-gray-800 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground mb-1">
                    {language === "ko" ? "다음글" : "Next"}
                  </div>
                  <div className="truncate">{nextNotice.title}</div>
                </div>
                <ChevronDown className="h-5 w-5 text-muted-foreground ml-2 flex-shrink-0" />
              </div>
            </button>
          )}
          {prevNotice && (
            <button
              onClick={() => navigate(`/notices/${prevNotice.id}`)}
              className="w-full p-4 bg-white dark:bg-gray-800 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground mb-1">
                    {language === "ko" ? "이전글" : "Previous"}
                  </div>
                  <div className="truncate">{prevNotice.title}</div>
                </div>
                <ChevronUp className="h-5 w-5 text-muted-foreground ml-2 flex-shrink-0" />
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
export default ShopNoticeDetail;
