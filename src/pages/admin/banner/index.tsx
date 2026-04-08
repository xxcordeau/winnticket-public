import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/page-header";
import { authStore } from "@/data/auth";
import { BannerManagementTab } from "./banner-management-tab";
import { PopupManagementTab } from "./popup-management-tab-new";
import { SegmentTabs } from "@/components/ui/segment-tabs";
import { useState, useEffect } from "react";
import { CoachMark, useCoachMark, TourHelpButton, type TourStep } from "@/components/coach-mark";
import { MobilePcNotice } from "@/components/mobile-pc-notice";

type TabType = "banners" | "popups";

export default function BannerManagement() {
  const [activeTab, setActiveTab] = useState<TabType>("banners");

  const bannerTourSteps: TourStep[] = [
    { target: "banner-tabs", title: "배너 / 팝업 관리", description: "배너 관리: 메인 페이지 슬라이드 배너를 설정합니다.\n팝업 관리: 메인 페이지 팝업을 설정합니다.\n탭을 전환하여 각각 관리하세요.", placement: "bottom" },
    { target: "banner-content", title: "배너/팝업 목록", description: "등록된 배너(또는 팝업) 목록입니다.\n추가/수정/삭제/순서변경이 가능합니다.\n이미지, 링크, 노출 기간 등을 설정할 수 있습니다.", placement: "top", waitForTarget: 500 },
  ];

  const { isActive: isTourActive, startTour, endTour } = useCoachMark("banner_mgmt_tour");
  const canView = authStore.hasPermission("banners", "view");

  if (!canView) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-muted-foreground">배너 관리 권한이 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="배너 & 팝업 관리"
        subtitle="메인 페이지에 표시될 배너와 팝업을 관리합니다"
        language="ko"
        rightContent={
          <TourHelpButton onClick={startTour} />
        }
      />

      {/* Tabs */}
      <div data-tour="banner-tabs" className="w-full md:inline-flex">
      <SegmentTabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as TabType)}
        options={[
          { value: "banners", label: "배너 관리" },
          { value: "popups", label: "팝업 관리" },
        ]}
      />
      </div>

      {/* 모바일 안내 메시지 */}
      <MobilePcNotice pageName="배너관리 페이지" />

      {/* Table Container */}
      <div className="bg-card relative rounded-[8px] flex-1 flex flex-col">
        <div
          aria-hidden="true"
          className="absolute border border-border border-solid inset-0 pointer-events-none rounded-[8px]"
        />

        <div className="flex flex-col gap-4 px-4 py-4 sm:gap-[20px] sm:px-[32px] sm:py-[20px] sm:flex-1 sm:overflow-hidden sm:box-border sm:content-stretch" data-tour="banner-content">
          {activeTab === "banners" && <BannerManagementTab />}
          {activeTab === "popups" && <PopupManagementTab />}
        </div>
      </div>

      <CoachMark steps={bannerTourSteps} isActive={isTourActive} onFinish={endTour} storageKey="banner_mgmt_tour" />
    </div>
  );
}