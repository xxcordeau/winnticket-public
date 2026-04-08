import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { NoticePost } from "@/data/dto/community.dto";
import { ArrowLeft, Eye, Edit, Trash2, Calendar, User } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { getNoticeById, deleteNotice } from "@/lib/api/notice";

type Language = "ko" | "en";

interface NoticeDetailProps {
  language: Language;
}

export function NoticeDetail({ language }: NoticeDetailProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<NoticePost | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (id) {
      getNoticeById(id).then(response => {
        if (response.success && response.data) {
          setPost(response.data);
        }
      });
    }
  }, [id]);

  const handleEdit = () => {
    if (id) {
      navigate(`/admin/community/notice/${id}`);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    
    const response = await deleteNotice(id);
    if (response.success) {
      toast.success(language === "ko" ? "공지사항이 삭제되었습니다" : "Notice deleted successfully");
      navigate("/admin/community");
    } else {
      toast.error(language === "ko" ? "삭제에 실패했습니다" : "Failed to delete notice");
    }
  };

  if (!post) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={language === "ko" ? "공지사항 상세" : "Notice Detail"}
          subtitle={language === "ko" ? "공지사항 상세 정보를 확인하세요" : "View notice details"}
          language={language}
        />
        <div className="bg-card rounded-[8px] border p-4 sm:p-6">
          <div className="text-center py-12 text-muted-foreground">
            {language === "ko" ? "게시글을 찾을 수 없습니다" : "Post not found"}
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString(language === "ko" ? "ko-KR" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* 뒤로가기 버튼 */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/admin/community")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {language === "ko" ? "커뮤니티 관리" : "Community Management"}
        </Button>
      </div>

      <PageHeader
        title={language === "ko" ? "공지사항 상세" : "Notice Detail"}
        subtitle={language === "ko" ? "공지사항 상세 정보를 확인하세요" : "View notice details"}
        language={language}
        rightContent={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-2" />
              {language === "ko" ? "수정" : "Edit"}
            </Button>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              {language === "ko" ? "삭제" : "Delete"}
            </Button>
          </div>
        }
      />

      {/* 기본 정보 */}
      <div className="bg-card rounded-[8px] border p-4 sm:p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {language === "ko" ? "공지" : "Notice"}
              </Badge>
            </div>
            <h2 className="mb-4">{post.title}</h2>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 pt-6 border-t">
          <div>
            <Label className="text-muted-foreground text-xs flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              {language === "ko" ? "작성자" : "Author"}
            </Label>
            <p className="mt-1">{post.authorName}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {language === "ko" ? "작성일" : "Created At"}
            </Label>
            <p className="mt-1">{formatDate(post.createdAt)}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              {language === "ko" ? "조회수" : "Views"}
            </Label>
            <p className="mt-1">{post.views?.toLocaleString() || 0}</p>
          </div>
        </div>
      </div>

      {/* 내용 */}
      <div className="bg-card rounded-[8px] border p-4 sm:p-6">
        <h3 className="text-[15px] mb-4">{language === "ko" ? "공지 내용" : "Notice Content"}</h3>
        <div 
          dangerouslySetInnerHTML={{ __html: post.content }}
          className="prose prose-sm max-w-none min-h-[200px]"
        />
      </div>

      {/* 삭제 확인 Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === "ko" ? "공지사항 삭제" : "Delete Notice"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === "ko"
                ? "이 공지사항을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
                : "Are you sure you want to delete this notice? This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === "ko" ? "취소" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {language === "ko" ? "삭제" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
export default NoticeDetail;
