import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { SegmentTabs } from "@/components/ui/segment-tabs";
import { CoachMark, useCoachMark, TourHelpButton, type TourStep } from "@/components/coach-mark";
import { NoticeManagement } from "./notice/notice-management";
import { EventManagement } from "./event/event-management";
import { FaqManagement } from "./faq-management";
import { InquiryManagement } from "./inquiry-management";

type Language = "ko" | "en";
type TabType = "notice" | "event" | "faq" | "inquiry";

interface CommunityManagementProps {
  language: Language;
}

export function CommunityManagement({ language }: CommunityManagementProps) {
  const [activeTab, setActiveTab] = useState<TabType>("notice");

  const tabs: Array<{ value: TabType; label: string }> = [
    { value: "notice", label: "공지사항" },
    { value: "event", label: "이벤트" },
    { value: "faq", label: "FAQ" },
    { value: "inquiry", label: "문의 관리" },
  ];

  const communityTourSteps: TourStep[] = [
    { target: "community-tabs", title: "커뮤니티 관리", description: "4가지 커뮤니티 기능을 탭으로 관리합니다:\n• 공지사항: 쇼핑몰 공지 작성/관리\n• 이벤트: 이벤트 게시글 관리\n• FAQ: 자주 묻는 질문 + 카테고리 관리\n• 문의: 고객 문의 답변/차단 처리", placement: "bottom" },
    { target: "community-content", title: "게시글 관리", description: "각 탭에서 게시글을 검색/필터링하고\n추가/수정/삭제할 수 있습니다.\n날짜 범위로 기간 필터링도 가능합니다.\n행을 클릭하면 상세 내용을 볼 수 있습니다.", placement: "top", waitForTarget: 500 },
  ];

  const { isActive: isTourActive, startTour, endTour } = useCoachMark("community_mgmt_tour");

  return (
    <div className="space-y-6">
      <PageHeader
        title="커뮤니티 관리"
        subtitle="공지사항, 이벤트, FAQ, 문의를 관리합니다"
        language={language}
        rightContent={
          <TourHelpButton onClick={startTour} />
        }
      />

      {/* 탭 */}
      <div data-tour="community-tabs" className="w-full md:inline-flex">
        <SegmentTabs<TabType>
          value={activeTab}
          onValueChange={(tab) => setActiveTab(tab)}
          options={tabs}
        />
      </div>

      {/* 탭별 컨텐츠 */}
      <div className="bg-card relative rounded-[8px] flex-1 flex flex-col">
        <div
          aria-hidden="true"
          className="absolute border border-border border-solid inset-0 pointer-events-none rounded-[8px]"
        />

        <div className="flex flex-col gap-4 px-4 py-4 sm:gap-[20px] sm:px-[32px] sm:py-[20px] sm:flex-1 sm:overflow-hidden sm:box-border sm:content-stretch" data-tour="community-content">
          {activeTab === "notice" && <NoticeManagement language={language} />}
          {activeTab === "event" && <EventManagement language={language} />}
          {activeTab === "faq" && <FaqManagement language={language} />}
          {activeTab === "inquiry" && <InquiryManagement language={language} />}
        </div>
      </div>

      <CoachMark steps={communityTourSteps} isActive={isTourActive} onFinish={endTour} storageKey="community_mgmt_tour" />
    </div>
  );
}

export default CommunityManagement;
