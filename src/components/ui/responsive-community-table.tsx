import React from "react";
import { Post, NoticePost, EventPost, FaqPost, QnaPost } from "../../data/dto/community.dto";
import { Badge } from "./badge";
import { Button } from "./button";
import { Switch } from "./switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { MoreVertical, Edit, Trash2, Eye, MessageCircle } from "lucide-react";

interface ResponsiveCommunityTableProps {
  posts: Post[];
  activeTab: "notice" | "event" | "faq" | "inquiry";
  language: "ko" | "en";
  onView: (post: Post) => void;
  onEdit?: (post: Post) => void;
  onDelete?: (post: Post) => void;
  onToggleActive?: (post: Post) => void;
  pagination?: React.ReactNode;
  categories?: Array<{ id: string; name: string }>;
}

export function ResponsiveCommunityTable({
  posts,
  activeTab,
  language,
  onView,
  onEdit,
  onDelete,
  onToggleActive,
  pagination,
  categories,
}: ResponsiveCommunityTableProps) {
  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center w-full py-16 gap-4">
        <MessageCircle className="size-12 text-muted-foreground opacity-20" />
        <p className="text-muted-foreground">
          {language === "ko" ? "등록된 게시글이 없습니다." : "No posts found."}
        </p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const getTypeBadge = () => {
    const variants = {
      notice: "bg-blue-50 text-blue-700 border-blue-200",
      event: "bg-purple-50 text-purple-700 border-purple-200",
      faq: "bg-green-50 text-green-700 border-green-200",
      inquiry: "bg-orange-50 text-orange-700 border-orange-200",
    };
    
    const labels = {
      notice: language === "ko" ? "공지" : "Notice",
      event: language === "ko" ? "이벤트" : "Event",
      faq: "FAQ",
      inquiry: language === "ko" ? "문의" : "Inquiry",
    };

    return <Badge variant="outline" className={variants[activeTab]}>{labels[activeTab]}</Badge>;
  };

  const getInquiryStatusBadge = (post: QnaPost) => {
    if (post.isBlocked || (post as any).blocked) {
      return <Badge variant="destructive" className="text-[10px]">{language === "ko" ? "차단됨" : "Blocked"}</Badge>;
    }
    if (post.status === "ANSWERED") {
      return <Badge variant="default" className="text-[10px]">{language === "ko" ? "답변완료" : "Answered"}</Badge>;
    }
    return <Badge variant="secondary" className="text-[10px]">{language === "ko" ? "답변대기" : "Pending"}</Badge>;
  };

  // ID 
  const getCategoryName = (categoryId: string) => {
    const category = categories?.find(c => c.id === categoryId);
    return category?.name || categoryId;
  };

  return (
    <>
      {/* 모바일 리스트 (md 미만) */}
      <div className="md:hidden divide-y divide-border w-full">
        {posts.map((post) => (
          <div key={post.id} className="py-4 px-2">
              <div className="space-y-3">
                {/* 헤더: 타입, 제목, 액션 */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getTypeBadge()}
                      {activeTab === "inquiry" && getInquiryStatusBadge(post as QnaPost)}
                    </div>
                    <button
                      onClick={() => onView(post)}
                      className="text-sm font-medium hover:text-primary hover:underline transition-colors text-left line-clamp-2 w-full"
                    >
                      {post.title}
                    </button>
                    <p className="text-xs text-muted-foreground mt-1">
                      {post.authorName || (post as any).author || "-"} · {formatDate(post.createdAt)}
                    </p>
                  </div>

                  {/* 액션 메뉴 */}
                  {(activeTab === "notice" || activeTab === "event" || activeTab === "faq") && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onView(post)}>
                          <Eye className="h-4 w-4 mr-2" />
                          {language === "ko" ? "보기" : "View"}
                        </DropdownMenuItem>
                        {onEdit && (
                          <DropdownMenuItem onClick={() => onEdit(post)}>
                            <Edit className="h-4 w-4 mr-2" />
                            {language === "ko" ? "수정" : "Edit"}
                          </DropdownMenuItem>
                        )}
                        {onDelete && (
                          <DropdownMenuItem
                            onClick={() => onDelete(post)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {language === "ko" ? "삭제" : "Delete"}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  
                  {/* 문의 관리는 보기만 가능 */}
                  {activeTab === "inquiry" && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 flex-shrink-0"
                      onClick={() => onView(post)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* 통계 정보 */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                  <span>{language === "ko" ? "조회수" : "Views"}: {post.views}</span>
                  {activeTab === "inquiry" && (post as QnaPost).inquiryNumber && (
                    <span>{language === "ko" ? "문의번호" : "Inquiry"}: {(post as QnaPost).inquiryNumber}</span>
                  )}
                  {(activeTab === "notice" || activeTab === "event") && (post as NoticePost | EventPost).isActive !== undefined && (
                    <span className="ml-auto">
                      {(post as NoticePost | EventPost).isActive 
                        ? (language === "ko" ? "✓ 활성" : "✓ Active")
                        : (language === "ko" ? "○ 비활성" : "○ Inactive")}
                    </span>
                  )}
                </div>
              </div>
            </div>
        ))}
      </div>

      {/* 데스크톱 테이블 (md 이상) */}
      <div className="hidden md:block w-full overflow-x-auto">
        <div className="content-stretch flex flex-col items-start relative shrink-0 min-w-[800px]">
          {/* Table Header */}
          <div className="h-[40px] relative shrink-0 w-full bg-muted/30">
            <div className="content-stretch flex h-[40px] items-start overflow-clip relative rounded-[inherit] w-full">
              <div className="basis-0 content-stretch flex grow h-full items-center min-h-px min-w-px relative shrink-0">
                {/* 타입 Header */}
                <div className="box-border content-stretch flex h-full items-center justify-between overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 w-[100px]">
                  <p className="text-[13px] text-nowrap whitespace-pre">
                    {language === "ko" ? "타입" : "Type"}
                  </p>
                  <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                    <div className="h-[16px] w-px bg-border" />
                  </div>
                </div>

                {/* 제목 Header */}
                <div className="basis-0 grow h-full min-h-px min-w-px relative shrink-0">
                  <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
                    <div className="box-border content-stretch flex items-center justify-between gap-[10px] pl-[20px] pr-0 py-[7px] relative size-full">
                      <p className="text-[13px] text-nowrap whitespace-pre">
                        {language === "ko" ? "제목" : "Title"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 작성자 Header */}
                <div className="box-border content-stretch flex h-full items-center justify-between overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 w-[140px]">
                  <p className="text-[13px] text-nowrap whitespace-pre">
                    {language === "ko" ? "작성자" : "Author"}
                  </p>
                  <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                    <div className="h-[16px] w-px bg-border" />
                  </div>
                </div>

                {/* 작성일 Header */}
                <div className="box-border content-stretch flex h-full items-center justify-between overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 w-[140px]">
                  <p className="text-[13px] text-nowrap whitespace-pre">
                    {language === "ko" ? "작성일" : "Date"}
                  </p>
                  <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                    <div className="h-[16px] w-px bg-border" />
                  </div>
                </div>

                {/* 조회수 Header */}
                <div className="box-border content-stretch flex h-full items-center justify-between overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 w-[100px]">
                  <p className="text-[13px] text-nowrap whitespace-pre">
                    {language === "ko" ? "조회수" : "Views"}
                  </p>
                  <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                    <div className="h-[16px] w-px bg-border" />
                  </div>
                </div>

                {/* 카테고리 Header - FAQ만 */}
                {activeTab === "faq" && (
                  <div className="box-border content-stretch flex h-full items-center justify-between overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 w-[120px]">
                    <p className="text-[13px] text-nowrap whitespace-pre">
                      {language === "ko" ? "카테고리" : "Category"}
                    </p>
                    <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                      <div className="h-[16px] w-px bg-border" />
                    </div>
                  </div>
                )}

                {activeTab === "inquiry" && (
                  <div className="box-border content-stretch flex h-full items-center justify-between overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 w-[120px]">
                    <p className="text-[13px] text-nowrap whitespace-pre">
                      {language === "ko" ? "답변상태" : "Status"}
                    </p>
                    <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                      <div className="h-[16px] w-px bg-border" />
                    </div>
                  </div>
                )}

                {(activeTab === "notice" || activeTab === "event" || activeTab === "faq") && (
                  <div className="box-border content-stretch flex h-full items-center justify-between overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 w-[100px]">
                    <p className="text-[13px] text-nowrap whitespace-pre">
                      {language === "ko" ? "활성화" : "Active"}
                    </p>
                    <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                      <div className="h-[16px] w-px bg-border" />
                    </div>
                  </div>
                )}
              </div>

              {/* Actions Header */}
              {activeTab === "inquiry" && (
                <div className="content-stretch flex gap-[11px] h-full items-center justify-center overflow-clip relative shrink-0 w-[40px]">
                  <div className="h-[16px] w-px bg-border" />
                </div>
              )}
              {(activeTab === "notice" || activeTab === "event" || activeTab === "faq") && (
                <div className="content-stretch flex gap-[11px] h-full items-center justify-center overflow-clip relative shrink-0 w-[120px] pl-[20px]">
                  <p className="text-[13px] text-nowrap whitespace-pre">
                    {language === "ko" ? "관리" : "Actions"}
                  </p>
                </div>
              )}
            </div>
            <div aria-hidden="true" className="absolute border-[1px_0px] border-border border-solid inset-0 pointer-events-none" />
          </div>

          {/* Table Body */}
          <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
            {posts.map((post, rowIndex) => (
              <div
                key={post.id}
                onClick={() => onView(post)}
                className={`content-stretch flex h-[52px] items-center overflow-clip relative shrink-0 w-full cursor-pointer transition-colors ${
                  rowIndex % 2 === 0
                    ? "bg-card hover:bg-[#F3F4F6] dark:hover:bg-muted/10"
                    : "bg-[#F9FAFB] dark:bg-muted/30 hover:bg-[#F3F4F6] dark:hover:bg-muted/10"
                }`}
              >
                {/* 타입 Column */}
                <div className="box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-[16px] py-0 relative shrink-0 w-[100px]">
                  {getTypeBadge()}
                </div>

                {/* 제목 Column */}
                <div className="basis-0 grow h-full min-h-px min-w-px relative shrink-0">
                  <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
                    <div className="box-border content-stretch flex items-center gap-2 pl-[20px] pr-[16px] py-[7px] relative size-full">
                      <p className="text-[14px] text-foreground text-nowrap overflow-ellipsis overflow-hidden">
                        {post.title}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 작성자 Column */}
                <div className="box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-[16px] py-0 relative shrink-0 w-[140px]">
                  <p className="text-[13px] text-foreground text-nowrap overflow-ellipsis overflow-hidden">
                    {post.authorName || (post as any).author || "-"}
                  </p>
                </div>

                {/* 작성일 Column */}
                <div className="box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-[16px] py-0 relative shrink-0 w-[140px]">
                  <p className="text-[13px] text-muted-foreground text-nowrap">
                    {formatDate(post.createdAt)}
                  </p>
                </div>

                {/* 조회수 Column */}
                <div className="box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-[16px] py-0 relative shrink-0 w-[100px]">
                  <p className="text-[13px] text-foreground">{post.views}</p>
                </div>

                {/* 카테고리 Column - FAQ만 */}
                {activeTab === "faq" && (
                  <div className="box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-[16px] py-0 relative shrink-0 w-[120px]">
                    <p className="text-[13px] text-foreground text-nowrap overflow-ellipsis overflow-hidden">
                      {getCategoryName((post as FaqPost).category)}
                    </p>
                  </div>
                )}

                {activeTab === "inquiry" && (
                  <div className="box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-[16px] py-0 relative shrink-0 w-[120px]">
                    {getInquiryStatusBadge(post as QnaPost)}
                  </div>
                )}

                {(activeTab === "notice" || activeTab === "event" || activeTab === "faq") && (
                  <div 
                    className="box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-[16px] py-0 relative shrink-0 w-[100px]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Switch
                      checked={(post as NoticePost | EventPost | FaqPost).isActive}
                      onCheckedChange={() => onToggleActive && onToggleActive(post)}
                    />
                  </div>
                )}

                {/* Actions Column */}
                {activeTab === "inquiry" && (
                  <div className="content-stretch flex gap-[11px] h-full items-center justify-center overflow-clip relative shrink-0 w-[40px]" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onView(post)}
                      className="p-2 rounded-md transition-colors hover:bg-muted text-muted-foreground hover:text-foreground"
                    >
                      <Eye className="h-[14px] w-[14px]" />
                    </button>
                  </div>
                )}
                {(activeTab === "notice" || activeTab === "event" || activeTab === "faq") && (
                  <div className="content-stretch flex gap-1 h-full items-center justify-center overflow-clip relative shrink-0 w-[120px]" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" onClick={() => onView(post)}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    {onEdit && (
                      <Button variant="ghost" size="sm" onClick={() => onEdit(post)}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button variant="ghost" size="sm" onClick={() => onDelete(post)} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 페이징네이션 */}
      {pagination && pagination}
    </>
  );
}