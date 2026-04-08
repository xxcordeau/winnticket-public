import React from "react";
import { Channel } from "../../data/dto/channel.dto";
import { Badge } from "./badge";
import { Button } from "./button";
import { Switch } from "./switch";
import { Copy, ExternalLink, Building2 } from "lucide-react";

interface ResponsiveChannelTableProps {
  channels: Channel[];
  onOpenDetail: (channel: Channel) => void;
  onToggleActive: (channel: Channel, checked: boolean) => void;
  onCopyUrl: (channelCode: string) => void;
  onOpenUrl: (channelCode: string) => void;
}

export function ResponsiveChannelTable({
  channels,
  onOpenDetail,
  onToggleActive,
  onCopyUrl,
  onOpenUrl,
}: ResponsiveChannelTableProps) {
  if (channels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center w-full py-16 gap-4">
        <Building2 className="size-12 text-muted-foreground opacity-20" />
        <p className="text-muted-foreground">등록된 채널이 없습니다.</p>
      </div>
    );
  }

  return (
    <>
      {/* 모바일 리스트 (md 미만) */}
      <div className="md:hidden divide-y divide-border w-full">
        {channels.map((channel) => (
          <div key={channel.id} className="py-4 px-2">
            <div className="space-y-3">
              {/* 헤더: 로고, 채널명, 상태 */}
              <div className="flex items-start gap-3">
                {/* 로고 */}
                <div className="flex-shrink-0">
                  {channel.logoUrl ? (
                    <img
                      src={channel.logoUrl}
                      alt={channel.channelName}
                      className="w-12 h-12 object-contain rounded-md border"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center border">
                      <span className="text-lg font-medium text-muted-foreground">
                        {channel.channelName.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>

                {/* 채널 정보 */}
                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => onOpenDetail(channel)}
                    className="text-sm font-medium hover:text-primary hover:underline transition-colors text-left line-clamp-1 w-full"
                  >
                    {channel.channelName}
                  </button>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {channel.companyName}
                  </p>
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded mt-1 inline-block">
                    {channel.channelCode}
                  </code>
                </div>

                {/* 상태 스위치 */}
                <div className="flex-shrink-0">
                  <Switch
                    checked={channel.active}
                    onCheckedChange={(checked) => onToggleActive(channel, checked)}
                  />
                </div>
              </div>

              {/* URL 액션 버튼 */}
              <div className="flex gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => onCopyUrl(channel.channelCode)}
                >
                  <Copy className="h-3.5 w-3.5 mr-1.5" />
                  URL 복사
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => onOpenUrl(channel.channelCode)}
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                  열기
                </Button>
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
                {/* 채널 코드 Header */}
                <div className="box-border content-stretch flex h-full items-center justify-between overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 w-[120px]">
                  <p className="text-[13px] text-nowrap whitespace-pre">채널 코드</p>
                  <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                    <div className="h-[16px] w-px bg-border" />
                  </div>
                </div>

                {/* 로고 Header */}
                <div className="box-border content-stretch flex h-full items-center justify-between overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 w-[80px]">
                  <p className="text-[13px] text-nowrap whitespace-pre">로고</p>
                  <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                    <div className="h-[16px] w-px bg-border" />
                  </div>
                </div>

                {/* 채널 이름 Header */}
                <div className="box-border content-stretch flex h-full items-center justify-between overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 flex-1">
                  <p className="text-[13px] text-nowrap whitespace-pre">채널 이름</p>
                  <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                    <div className="h-[16px] w-px bg-border" />
                  </div>
                </div>

                {/* 회사명 Header */}
                <div className="box-border content-stretch flex h-full items-center justify-between overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 w-[180px]">
                  <p className="text-[13px] text-nowrap whitespace-pre">회사명</p>
                  <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                    <div className="h-[16px] w-px bg-border" />
                  </div>
                </div>

                {/* 상태 Header */}
                <div className="box-border content-stretch flex h-full items-center justify-between overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 w-[100px]">
                  <p className="text-[13px] text-nowrap whitespace-pre">상태</p>
                  <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                    <div className="h-[16px] w-px bg-border" />
                  </div>
                </div>

                {/* URL Header */}
                <div className="box-border content-stretch flex h-full items-center justify-between overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 w-[100px]">
                  <p className="text-[13px] text-nowrap whitespace-pre">URL</p>
                  <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                    <div className="h-[16px] w-px bg-border" />
                  </div>
                </div>
              </div>
            </div>
            <div aria-hidden="true" className="absolute border-[1px_0px] border-border border-solid inset-0 pointer-events-none" />
          </div>

          {/* Table Body */}
          <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
            {channels.map((channel, rowIndex) => (
              <div
                key={channel.id}
                className={`content-stretch flex h-[52px] items-center overflow-clip relative shrink-0 w-full cursor-pointer transition-colors ${
                  rowIndex % 2 === 0
                    ? "bg-card hover:bg-[#F3F4F6] dark:hover:bg-muted/10"
                    : "bg-[#F9FAFB] dark:bg-muted/30 hover:bg-[#F3F4F6] dark:hover:bg-muted/10"
                }`}
                onClick={() => onOpenDetail(channel)}
              >
                {/* 채널 코드 Column */}
                <div className="box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-[16px] py-0 relative shrink-0 w-[120px]">
                  <span className="font-mono text-[14px]">{channel.channelCode}</span>
                </div>

                {/* 로고 Column */}
                <div className="box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-[16px] py-0 relative shrink-0 w-[80px]">
                  {channel.logoUrl ? (
                    <img
                      src={channel.logoUrl}
                      alt={channel.channelName}
                      className="w-10 h-10 object-contain"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">
                        {channel.channelName.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>

                {/* 채널 이름 Column */}
                <div className="box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-[16px] py-0 relative shrink-0 flex-1">
                  <p className="text-[14px] text-foreground text-nowrap overflow-ellipsis overflow-hidden">
                    {channel.channelName}
                  </p>
                </div>

                {/* 회사명 Column */}
                <div className="box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-[16px] py-0 relative shrink-0 w-[180px]">
                  <p className="text-[14px] text-foreground text-nowrap overflow-ellipsis overflow-hidden">
                    {channel.companyName}
                  </p>
                </div>

                {/* 상태 Column */}
                <div
                  className="box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-[16px] py-0 relative shrink-0 w-[100px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Switch
                    checked={channel.active}
                    onCheckedChange={(checked) => onToggleActive(channel, checked)}
                  />
                </div>

                {/* URL Column */}
                <div
                  className="box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-[16px] py-0 relative shrink-0 w-[100px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex gap-1">
                    <button
                      onClick={() => onCopyUrl(channel.channelCode)}
                      className="p-1.5 rounded-md transition-colors hover:bg-muted text-muted-foreground hover:text-foreground"
                      title="URL 복사"
                    >
                      <Copy className="h-[14px] w-[14px]" />
                    </button>
                    <button
                      onClick={() => onOpenUrl(channel.channelCode)}
                      className="p-1.5 rounded-md transition-colors hover:bg-muted text-muted-foreground hover:text-foreground"
                      title="새 탭에서 열기"
                    >
                      <ExternalLink className="h-[14px] w-[14px]" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}