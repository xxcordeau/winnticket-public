import React from "react";
import { Badge } from "./badge";
import { Button } from "./button";
import { Card, CardContent } from "./card";
import { Switch } from "./switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { MoreVertical, Edit, Trash2, ArrowUp, ArrowDown, Menu } from "lucide-react";

export interface MenuItem {
  id: string;
  name: string;
  code?: string;
  level: number;
  displayOrder: number;
  visible: boolean;
  iconUrl?: string;
  routePath?: string;
  parentId?: string | null;
  children?: MenuItem[];
}

interface ResponsiveMenuTableProps {
  items: MenuItem[];
  menuType: "shop" | "admin";
  language: "ko" | "en";
  onEdit: (item: MenuItem) => void;
  onDelete: (item: MenuItem) => void;
  onToggleVisible: (id: string) => void;
  onMove?: (id: string, direction: "up" | "down") => void;
  expandedCategories?: Set<string>;
  onToggleExpand?: (id: string) => void;
}

export function ResponsiveMenuTable({
  items,
  menuType,
  language,
  onEdit,
  onDelete,
  onToggleVisible,
  onMove,
  expandedCategories,
  onToggleExpand,
}: ResponsiveMenuTableProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center w-full py-16 gap-4">
        <Menu className="size-12 text-muted-foreground opacity-20" />
        <p className="text-muted-foreground">
          {language === "ko" ? "등록된 메뉴가 없습니다." : "No menus found."}
        </p>
      </div>
    );
  }

  const getLevelBadge = (level: number) => {
    if (level === 1) {
      return <Badge variant="default" className="text-[10px]">{language === "ko" ? "상위" : "Parent"}</Badge>;
    }
    return <Badge variant="secondary" className="text-[10px]">{language === "ko" ? "하위" : "Sub"}</Badge>;
  };

  const renderMobileCard = (item: MenuItem, indent: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedCategories?.has(item.id) ?? false;

    return (
      <React.Fragment key={item.id}>
        <Card className="overflow-hidden" style={{ marginLeft: `${indent * 16}px` }}>
          <CardContent className="p-4">
            <div className="space-y-3">
              {/* 헤더: 레벨, 이름, 액션 */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {getLevelBadge(item.level)}
                    {item.visible ? (
                      <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200">
                        {language === "ko" ? "활성" : "Active"}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">
                        {language === "ko" ? "비활성" : "Inactive"}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {hasChildren && onToggleExpand && (
                      <button
                        onClick={() => onToggleExpand(item.id)}
                        className="p-1 hover:bg-muted rounded transition-colors flex-shrink-0"
                      >
                        {isExpanded ? "▼" : "▶"}
                      </button>
                    )}
                    <p className="text-sm font-medium">{item.name}</p>
                  </div>
                  {item.code && (
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded mt-1 inline-block">
                      {item.code}
                    </code>
                  )}
                </div>

                {/* 액션 메뉴 */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(item)}>
                      <Edit className="h-4 w-4 mr-2" />
                      {language === "ko" ? "수정" : "Edit"}
                    </DropdownMenuItem>
                    {onMove && (
                      <>
                        <DropdownMenuItem onClick={() => onMove(item.id, "up")}>
                          <ArrowUp className="h-4 w-4 mr-2" />
                          {language === "ko" ? "위로" : "Move Up"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onMove(item.id, "down")}>
                          <ArrowDown className="h-4 w-4 mr-2" />
                          {language === "ko" ? "아래로" : "Move Down"}
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuItem
                      onClick={() => onDelete(item)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {language === "ko" ? "삭제" : "Delete"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* 정보 */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{language === "ko" ? "표시 순서" : "Order"}</span>
                  <span>{item.displayOrder}</span>
                </div>
                {item.routePath && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{language === "ko" ? "경로" : "Path"}</span>
                    <code className="text-xs">{item.routePath}</code>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-muted-foreground">{language === "ko" ? "활성화" : "Active"}</span>
                  <Switch
                    checked={item.visible}
                    onCheckedChange={() => onToggleVisible(item.id)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 하위 메뉴 렌더링 */}
        {hasChildren && isExpanded && item.children!.map((child) => renderMobileCard(child, indent + 1))}
      </React.Fragment>
    );
  };

  return (
    <>
      {/* 모바일 카드 레이아웃 (md 미만) */}
      <div className="md:hidden space-y-3 w-full">
        {items.map((item) => renderMobileCard(item, 0))}
      </div>

      {/* 데스크톱 테이블 (md 이상) */}
      <div className="hidden md:block w-full overflow-x-auto">
        <div className="content-stretch flex flex-col items-start relative shrink-0 min-w-[800px]">
          {/* Table Header */}
          <div className="h-[40px] relative shrink-0 w-full bg-muted/30">
            <div className="content-stretch flex h-[40px] items-start overflow-clip relative rounded-[inherit] w-full">
              <div className="basis-0 content-stretch flex grow h-full items-center min-h-px min-w-px relative shrink-0">
                {/* 레벨 Header */}
                <div className="box-border content-stretch flex h-full items-center justify-between overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 w-[100px]">
                  <p className="text-[13px] text-nowrap whitespace-pre">
                    {language === "ko" ? "레벨" : "Level"}
                  </p>
                  <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                    <div className="h-[16px] w-px bg-border" />
                  </div>
                </div>

                {menuType === "shop" && (
                  <div className="box-border content-stretch flex h-full items-center justify-between overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 w-[120px]">
                    <p className="text-[13px] text-nowrap whitespace-pre">
                      {language === "ko" ? "코드" : "Code"}
                    </p>
                    <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                      <div className="h-[16px] w-px bg-border" />
                    </div>
                  </div>
                )}

                {/* 이름 Header */}
                <div className="basis-0 grow h-full min-h-px min-w-px relative shrink-0">
                  <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
                    <div className="box-border content-stretch flex items-center justify-between gap-[10px] pl-[20px] pr-0 py-[7px] relative size-full">
                      <p className="text-[13px] text-nowrap whitespace-pre">
                        {language === "ko" ? (menuType === "shop" ? "메뉴명" : "제목") : "Name"}
                      </p>
                    </div>
                  </div>
                </div>

                {menuType === "shop" && (
                  <div className="box-border content-stretch flex h-full items-center justify-between overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 w-[200px]">
                    <p className="text-[13px] text-nowrap whitespace-pre">
                      {language === "ko" ? "경로" : "Path"}
                    </p>
                    <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                      <div className="h-[16px] w-px bg-border" />
                    </div>
                  </div>
                )}

                {/* 순서 Header */}
                <div className="box-border content-stretch flex h-full items-center justify-between overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 w-[100px]">
                  <p className="text-[13px] text-nowrap whitespace-pre">
                    {language === "ko" ? "순서" : "Order"}
                  </p>
                  <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                    <div className="h-[16px] w-px bg-border" />
                  </div>
                </div>

                {/* 활성화 Header */}
                <div className="box-border content-stretch flex h-full items-center justify-between overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 w-[100px]">
                  <p className="text-[13px] text-nowrap whitespace-pre">
                    {language === "ko" ? "활성화" : "Active"}
                  </p>
                  <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                    <div className="h-[16px] w-px bg-border" />
                  </div>
                </div>
              </div>

              {/* Actions Header */}
              <div className="content-stretch flex gap-[11px] h-full items-center justify-center overflow-clip relative shrink-0 w-[120px] pl-[20px]">
                <p className="text-[13px] text-nowrap whitespace-pre">
                  {language === "ko" ? "관리" : "Actions"}
                </p>
              </div>
            </div>
            <div aria-hidden="true" className="absolute border-[1px_0px] border-border border-solid inset-0 pointer-events-none" />
          </div>

          {/* Table Body */}
          <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
            {items.map((item, rowIndex) => (
              <div
                key={item.id}
                className={`content-stretch flex h-[52px] items-center overflow-clip relative shrink-0 w-full transition-colors ${
                  rowIndex % 2 === 0
                    ? "bg-card hover:bg-[#F3F4F6] dark:hover:bg-muted/10"
                    : "bg-[#F9FAFB] dark:bg-muted/30 hover:bg-[#F3F4F6] dark:hover:bg-muted/10"
                }`}
              >
                {/* 레벨 Column */}
                <div className="box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-[16px] py-0 relative shrink-0 w-[100px]">
                  {getLevelBadge(item.level)}
                </div>

                {menuType === "shop" && (
                  <div className="box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-[16px] py-0 relative shrink-0 w-[120px]">
                    <code className="text-[12px] bg-muted px-2 py-1 rounded text-nowrap">
                      {item.code}
                    </code>
                  </div>
                )}

                {/* 이름 Column */}
                <div className="basis-0 grow h-full min-h-px min-w-px relative shrink-0">
                  <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
                    <div className="box-border content-stretch flex items-center gap-3 pl-[20px] pr-[16px] py-[7px] relative size-full">
                      <p className="text-[14px] text-foreground text-nowrap overflow-ellipsis overflow-hidden">
                        {item.name}
                      </p>
                    </div>
                  </div>
                </div>

                {menuType === "shop" && (
                  <div className="box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-[16px] py-0 relative shrink-0 w-[200px]">
                    <code className="text-[12px] text-muted-foreground text-nowrap overflow-ellipsis overflow-hidden">
                      {item.routePath || "-"}
                    </code>
                  </div>
                )}

                {/* 순서 Column */}
                <div className="box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-[16px] py-0 relative shrink-0 w-[100px]">
                  <p className="text-[14px] text-foreground">{item.displayOrder}</p>
                </div>

                {/* 활성화 Column */}
                <div className="box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-[16px] py-0 relative shrink-0 w-[100px]">
                  <Switch
                    checked={item.visible}
                    onCheckedChange={() => onToggleVisible(item.id)}
                  />
                </div>

                {/* Actions Column */}
                <div className="content-stretch flex gap-1 h-full items-center justify-center overflow-clip relative shrink-0 w-[120px]">
                  {onMove && (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => onMove(item.id, "up")}>
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => onMove(item.id, "down")}>
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => onEdit(item)}>
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onDelete(item)} className="text-destructive hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
