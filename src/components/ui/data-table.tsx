import { useState, ReactNode, useEffect, useRef, useCallback } from "react";
import { ChevronUp, ChevronDown, MoreVertical, GripVertical, Settings2, Check } from "lucide-react";
import { useDrag, useDrop } from "react-dnd";
import { Button } from "./button";
import { FilterDropdown } from "./filter-dropdown";
import emptyStateIcon from "@/assets/86beff15b3d329ef3d0795e4c4ba4f41ded4391c.png";
import { formatPhoneNumber } from "./phone-input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "./pagination";

type Language = "ko" | "en";
type SortDirection = "asc" | "desc" | null;

export interface ColumnDef<T> {
  field: keyof T | string;
  header: string;
  width?: string;
  sortable?: boolean;
  grow?: boolean;
  align?: "left" | "center" | "right"; // 
  render?: (value: any, row: T) => ReactNode;
}

export interface FilterOption {
  label: string;
  value: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  language: Language;
  onRowClick?: (row: T) => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  filters?: {
    label: string;
    value: string;
    options: FilterOption[];
    onChange: (value: string) => void;
  }[];
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  idField?: keyof T;
  headerActions?: React.ReactNode;
  tableId?: string; // ID
  initialSort?: { field: string; direction: "asc" | "desc" }; // 
  disableDrag?: boolean; // 
  disableSettings?: boolean; // 
}

const ITEM_TYPE = "TABLE_COLUMN";

interface DraggableColumnHeaderProps<T> {
  column: ColumnDef<T>;
  index: number;
  moveColumn: (dragIndex: number, hoverIndex: number) => void;
  sortField: string | null;
  sortDirection: SortDirection;
  handleSort: (field: string) => void;
  SortIcon: React.ComponentType<{ field: string }>;
  columnsLength: number;
  editMode: boolean;
  columnWidth: number | undefined;
  onResizeStart: (field: string, startX: number, currentWidth: number, isLeftHandle?: boolean) => void;
  selectedColumn: string | null;
  onColumnSelect: (field: string) => void;
  onMinWidthCalculated: (field: string, width: number) => void;
  disableDrag?: boolean;
}

// 
function SimpleColumnHeader<T>(props: DraggableColumnHeaderProps<T>) {
  const {
    column,
    sortField,
    sortDirection,
    handleSort,
    SortIcon,
    editMode,
    columnWidth,
    onResizeStart,
    selectedColumn,
    onColumnSelect,
    onMinWidthCalculated,
  } = props;

  const ref = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const isSelected = editMode && selectedColumn === String(column.field);

  // 
  useEffect(() => {
    if (!column.grow && ref.current) {
      const headerContent = ref.current;
      const minWidth = headerContent.scrollWidth;
      onMinWidthCalculated(String(column.field), minWidth);
    }
  }, [column.field, column.grow, column.header, onMinWidthCalculated]);

  const handleResizeMouseDown = (e: React.MouseEvent, isLeftHandle: boolean = false) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    
    let currentWidth = columnWidth;
    if (!currentWidth && ref.current) {
      currentWidth = ref.current.getBoundingClientRect().width;
    }
    if (!currentWidth) {
      currentWidth = 120;
    }
    
    onResizeStart(String(column.field), e.clientX, currentWidth, isLeftHandle);
  };

  const getClassName = () => {
    if (column.grow) {
      return "box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-0 py-0 relative flex-1";
    }
    if (columnWidth !== undefined) {
      return "box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-0 py-0 relative shrink-0";
    }
    return `box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 ${column.width || "w-[120px]"}`;
  };

  const getStyle = () => {
    if (columnWidth !== undefined && !column.grow) {
      return { width: `${columnWidth}px` };
    }
    return undefined;
  };

  return (
    <div
      ref={ref}
      className={getClassName()}
      style={getStyle()}
      onClick={() => {
        if (editMode) {
          onColumnSelect(String(column.field));
        } else {
          handleSort(String(column.field));
        }
      }}
    >
      {/* 왼쪽 리사이즈 핸들 */}
      {editMode && isSelected && !column.grow && (
        <div
          className="absolute left-0 top-0 bottom-0 w-[4px] cursor-col-resize z-10 hover:bg-primary/30"
          onMouseDown={(e) => handleResizeMouseDown(e, true)}
          onClick={(e) => e.stopPropagation()}
        />
      )}

      <div
        ref={contentRef}
        className="content-stretch flex flex-1 gap-[4px] items-center justify-start overflow-clip relative h-full cursor-pointer select-none"
      >
        <div className="truncate">{column.header}</div>
        <SortIcon field={String(column.field)} />
      </div>

      {/* 오른쪽 리사즈 핸들 */}
      {editMode && isSelected && !column.grow && (
        <div
          className="absolute right-0 top-0 bottom-0 w-[4px] cursor-col-resize z-10 hover:bg-primary/30"
          onMouseDown={(e) => handleResizeMouseDown(e, false)}
          onClick={(e) => e.stopPropagation()}
        />
      )}
    </div>
  );
}

function DraggableColumnHeader<T>({
  column,
  index,
  moveColumn,
  sortField,
  sortDirection,
  handleSort,
  SortIcon,
  columnsLength,
  editMode,
  columnWidth,
  onResizeStart,
  selectedColumn,
  onColumnSelect,
  onMinWidthCalculated,
  disableDrag,
}: DraggableColumnHeaderProps<T>) {
  const ref = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const isSelected = editMode && selectedColumn === String(column.field);

  // 
  useEffect(() => {
    if (!column.grow && ref.current) {
      // 
      const headerContent = ref.current;
      const minWidth = headerContent.scrollWidth;
      onMinWidthCalculated(String(column.field), minWidth);
    }
  }, [column.field, column.grow, column.header, onMinWidthCalculated]);

  const [{ isDragging }, drag] = useDrag({
    type: ITEM_TYPE,
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: editMode && !isResizing && !disableDrag,
  });

  const [{ isOver }, drop] = useDrop({
    accept: ITEM_TYPE,
    hover: (item: { index: number }, monitor) => {
      if (!ref.current || !editMode) return;
      
      const dragIndex = item.index;
      const hoverIndex = index;
      
      if (dragIndex === hoverIndex) return;

      // threshold (30% )
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverWidth = hoverBoundingRect.right - hoverBoundingRect.left;
      const clientOffset = monitor.getClientOffset();
      
      if (!clientOffset) return;
      
      const hoverClientX = clientOffset.x - hoverBoundingRect.left;

      // threshold (30% )
      // : 30% 
      // : 70% 
      if (dragIndex < hoverIndex && hoverClientX < hoverWidth * 0.3) {
        return;
      }
      if (dragIndex > hoverIndex && hoverClientX > hoverWidth * 0.7) {
        return;
      }

      moveColumn(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
    canDrop: () => editMode,
  });

  if (editMode) {
    drag(drop(ref));
  }

  const handleResizeMouseDown = (e: React.MouseEvent, isLeftHandle: boolean = false) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    
    // DOM 
    let currentWidth = columnWidth;
    if (!currentWidth && ref.current) {
      currentWidth = ref.current.getBoundingClientRect().width;
    }
    if (!currentWidth) {
      currentWidth = 120; // 
    }
    
    onResizeStart(String(column.field), e.clientX, currentWidth, isLeftHandle);
  };

  // 
  const getColumnStyle = (): React.CSSProperties => {
    if (column.grow) {
      return {};
    }
    if (columnWidth !== undefined) {
      return { width: `${columnWidth}px`, minWidth: `${columnWidth}px`, maxWidth: `${columnWidth}px` };
    }
    return {};
  };

  const getColumnClassName = () => {
    if (column.grow) {
      return "flex-1 flex h-full relative shrink-0";
    }
    if (columnWidth !== undefined) {
      return "box-border content-stretch flex h-full items-center overflow-clip pl-[20px] pr-0 py-0 relative shrink-0";
    }
    return `box-border content-stretch flex h-full items-center overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 ${column.width || "w-[120px]"}`;
  };

  return (
    <div
      ref={ref}
      className={`${getColumnClassName()} group ${
        column.sortable && !isResizing && !editMode ? "cursor-pointer hover:text-[#0c8ce9] transition-colors" : ""
      } ${isDragging ? "opacity-50" : ""} ${isOver ? "bg-[#0c8ce9]/10" : ""} ${
        editMode ? "hover:outline hover:outline-2 hover:outline-[#0c8ce9] hover:outline-offset-[-2px] transition-all" : ""
      } ${isSelected ? "outline outline-2 outline-[#0c8ce9] outline-offset-[-2px]" : ""}`}
      style={getColumnStyle()}
      onClick={(e) => {
        if (editMode) {
          onColumnSelect(String(column.field));
        } else if (!isResizing && column.sortable) {
          handleSort(String(column.field));
        }
      }}
    >
      {/* 리사이즈 핸들 - 선택된 칼럼의 왼쪽 */}
      {isSelected && !column.grow && index > 0 && (
        <div
          onMouseDown={(e) => handleResizeMouseDown(e, true)}
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-[16px] cursor-col-resize bg-[#0c8ce9] hover:bg-[#0a7acc] transition-colors z-20 rounded-sm"
          onClick={(e) => e.stopPropagation()}
        />
      )}

      {column.grow ? (
        <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
          <div className="box-border content-stretch flex items-center justify-between gap-[10px] pl-[20px] pr-0 py-[7px] relative size-full">
            <div className="flex items-center gap-1">
              <p className={`text-[13px] text-nowrap whitespace-pre transition-colors ${
                sortField === String(column.field) && sortDirection ? 'text-[#0c8ce9]' : ''
              }`}>{column.header}</p>
            </div>
            {column.sortable && (
              <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                <div className={`absolute flex flex-col font-['SF_Pro:Regular',_sans-serif] font-normal h-[28px] justify-center leading-[0] right-[15.2px] text-[13px] text-center top-1/2 translate-x-[50%] translate-y-[-50%] w-[13px] transition-colors ${
                  sortField === String(column.field) && sortDirection ? 'text-[#0c8ce9]' : 'text-muted-foreground group-hover:text-[#0c8ce9]'
                }`} style={{ fontVariationSettings: "'wdth' 100" }}>
                  <SortIcon field={String(column.field)} />
                </div>
                <div className="h-[16px] w-px bg-border" />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-[10px] size-full">
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <p className={`text-[13px] text-center text-nowrap whitespace-pre transition-colors ${
              sortField === String(column.field) && sortDirection ? 'text-[#0c8ce9]' : ''
            }`}>{column.header}</p>
          </div>
          <div className="relative shrink-0 size-[28px] flex items-center justify-end">
            {column.sortable && (
              <div className={`absolute flex flex-col font-['SF_Pro:Regular',_sans-serif] font-normal h-[28px] justify-center leading-[0] right-[15.2px] text-[13px] text-center top-1/2 translate-x-[50%] translate-y-[-50%] w-[13px] transition-colors ${
                sortField === String(column.field) && sortDirection ? 'text-[#0c8ce9]' : 'text-muted-foreground group-hover:text-[#0c8ce9]'
              }`} style={{ fontVariationSettings: "'wdth' 100" }}>
                <SortIcon field={String(column.field)} />
              </div>
            )}
            {!isSelected && (
              <div className="h-[16px] w-px bg-border" />
            )}
            {/* 리사이즈 핸들 - 선택된 칼럼의 오른쪽 */}
            {isSelected && !column.grow && (
              <div
                onMouseDown={(e) => handleResizeMouseDown(e, false)}
                className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-[16px] cursor-col-resize bg-[#0c8ce9] hover:bg-[#0a7acc] transition-colors z-20 rounded-sm"
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DataTableContent<T extends Record<string, any>>({
  data,
  columns,
  language,
  onRowClick,
  onEdit,
  onDelete,
  filters = [],
  searchPlaceholder,
  onSearch,
  idField = "id" as keyof T,
  headerActions,
  tableId,
  initialSort,
  disableDrag,
  disableSettings,
}: DataTableProps<T>) {
  const [sortField, setSortField] = useState<string | null>(initialSort?.field || null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(initialSort?.direction || null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [orderedColumns, setOrderedColumns] = useState<ColumnDef<T>[]>(columns);
  const [editMode, setEditMode] = useState(false);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [resizing, setResizing] = useState<{
    field: string;
    startX: number;
    startWidth: number;
    isLeftHandle: boolean;
  } | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
  const [minWidths, setMinWidths] = useState<Record<string, number>>({});
  const tableHeaderRef = useRef<HTMLDivElement>(null);

  // localStorage 
  useEffect(() => {
    if (!tableId) {
      setOrderedColumns(columns);
      return;
    }

    // 
    const savedOrder = localStorage.getItem(`table-column-order-${tableId}`);
    if (savedOrder) {
      try {
        const orderMap = JSON.parse(savedOrder) as Record<string, number>;
        const sorted = [...columns].sort((a, b) => {
          const aOrder = orderMap[String(a.field)] ?? 999;
          const bOrder = orderMap[String(b.field)] ?? 999;
          return aOrder - bOrder;
        });
        setOrderedColumns(sorted);
      } catch (e) {
        setOrderedColumns(columns);
      }
    } else {
      setOrderedColumns(columns);
    }

    // 
    const savedWidths = localStorage.getItem(`table-column-widths-${tableId}`);
    if (savedWidths) {
      try {
        const widthsMap = JSON.parse(savedWidths) as Record<string, number>;
        setColumnWidths(widthsMap);
      } catch (e) {
        setColumnWidths({});
      }
    }
  }, [columns, tableId]);

  // 
  const saveColumnOrder = (newColumns: ColumnDef<T>[]) => {
    if (!tableId) return;
    const orderMap: Record<string, number> = {};
    newColumns.forEach((col, idx) => {
      orderMap[String(col.field)] = idx;
    });
    localStorage.setItem(`table-column-order-${tableId}`, JSON.stringify(orderMap));
  };

  // 
  const saveColumnWidths = (widths: Record<string, number>) => {
    if (!tableId) return;
    localStorage.setItem(`table-column-widths-${tableId}`, JSON.stringify(widths));
  };

  // 
  const resetTable = () => {
    if (!tableId) return;
    // localStorage 
    localStorage.removeItem(`table-column-order-${tableId}`);
    localStorage.removeItem(`table-column-widths-${tableId}`);
    // 
    setOrderedColumns(columns);
    setColumnWidths({});
    setEditMode(false);
    setSelectedColumn(null);
  };

  // 
  const moveColumn = (dragIndex: number, hoverIndex: number) => {
    const newColumns = [...orderedColumns];
    const [removed] = newColumns.splice(dragIndex, 1);
    newColumns.splice(hoverIndex, 0, removed);
    setOrderedColumns(newColumns);
    saveColumnOrder(newColumns);
  };

  // 
  const handleMinWidthCalculated = useCallback((field: string, width: number) => {
    setMinWidths((prev) => ({
      ...prev,
      [field]: width,
    }));
  }, []);

  // 
  const handleResizeStart = (field: string, startX: number, currentWidth: number, isLeftHandle: boolean = false) => {
    setResizing({ field, startX, startWidth: currentWidth, isLeftHandle });
  };

  // 
  useEffect(() => {
    if (!resizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      let diff = e.clientX - resizing.startX;
      // 
      if (resizing.isLeftHandle) {
        diff = -diff;
      }
      // , 80px
      const minWidth = minWidths[resizing.field] || 80;
      let newWidth = Math.max(minWidth, resizing.startWidth + diff);
      
      // 
      if (tableHeaderRef.current) {
        const tableWidth = tableHeaderRef.current.getBoundingClientRect().width;
        // (40px) 
        const availableWidth = tableWidth - 40;
        
        // 
        let otherColumnsWidth = 0;
        orderedColumns.forEach((col) => {
          const field = String(col.field);
          if (field !== resizing.field && !col.grow) {
            // , 
            const width = columnWidths[field];
            if (width !== undefined) {
              otherColumnsWidth += width;
            } else if (col.width) {
              // Tailwind (: "w-[120px]" -> 120)
              const match = col.width.match(/\[(\d+)px\]/);
              if (match) {
                otherColumnsWidth += parseInt(match[1], 10);
              } else {
                otherColumnsWidth += 120; // 
              }
            } else {
              otherColumnsWidth += 120; // 
            }
          }
        });
        
        // grow ( 80px)
        const hasGrowColumn = orderedColumns.some(col => col.grow);
        const minGrowWidth = hasGrowColumn ? 80 : 0;
        
        // 
        const maxWidth = availableWidth - otherColumnsWidth - minGrowWidth;
        newWidth = Math.min(newWidth, maxWidth);
      }
      
      setColumnWidths((prev) => ({
        ...prev,
        [resizing.field]: newWidth,
      }));
    };

    const handleMouseUp = () => {
      // localStorage 
      setColumnWidths((currentWidths) => {
        saveColumnWidths(currentWidths);
        return currentWidths;
      });
      setResizing(null);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resizing]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      if (sortDirection === "desc") {
        setSortDirection("asc");
      } else if (sortDirection === "asc") {
        setSortDirection("desc");
      }
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    onSearch?.(query);
  };

  const getSortedData = () => {
    let sorted = [...data];

    if (sortField && sortDirection) {
      sorted = sorted.sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];

        if (typeof aValue === "number" && typeof bValue === "number") {
          return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
        }

        const aStr = String(aValue);
        const bStr = String(bValue);
        return sortDirection === "asc"
          ? aStr.localeCompare(bStr, "ko-KR")
          : bStr.localeCompare(aStr, "ko-KR");
      });
    }

    return sorted;
  };

  const sortedData = getSortedData();
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginatedData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) {
      return <ChevronDown className="h-[14px] w-[14px]" />;
    }
    return sortDirection === "asc" ? (
      <ChevronDown className="h-[14px] w-[14px]" />
    ) : (
      <ChevronUp className="h-[14px] w-[14px]" />
    );
  };

  return (
    <div className="bg-card relative rounded-[8px] flex-1 flex flex-col">
      <div aria-hidden="true" className="absolute border border-border border-solid inset-0 pointer-events-none rounded-[8px]" />

      <div className="box-border content-stretch flex flex-col gap-[20px] items-start px-[32px] py-[20px] flex-1 overflow-hidden">
        {/* 검색 및 필터 */}
        <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
          {/* 좌측: 검색 + 필터 */}
          <div className="flex items-center gap-[10px]">
            {/* 검색 */}
            {onSearch && (
              <div className="bg-background box-border content-stretch flex gap-[8px] h-[36px] items-center px-[16px] py-[8px] relative rounded-[6px] shrink-0 w-[360px] focus-within:shadow-[0_0_0_1px_#0c8ce9] transition-shadow">
                <div aria-hidden="true" className="absolute border border-border border-solid inset-0 pointer-events-none rounded-[6px]" />
                <svg className="h-[18px] w-[18px] text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder={searchPlaceholder || (language === "ko" ? "통합 검색" : "Search")}
                  className="text-[12px] text-muted-foreground placeholder:text-muted-foreground bg-transparent border-none outline-none flex-1 focus:outline-none"
                />
              </div>
            )}

            {/* 필터 */}
            {filters.map((filter, index) => (
              <FilterDropdown
                key={index}
                value={filter.value}
                items={filter.options}
                onSelect={filter.onChange}
              />
            ))}
          </div>

          {/* 우측: 헤더 액션 버튼 */}
          {headerActions && (
            <div className="flex items-center gap-2">
              {headerActions}
            </div>
          )}
        </div>

        {/* 테이블 */}
        <div className="content-stretch flex flex-col items-start relative shrink-0 w-full flex-1 overflow-auto">
          {/* 테이블 헤더 */}
          <div ref={tableHeaderRef} className="h-[40px] relative shrink-0 w-full bg-muted/30">
            <div className="content-stretch flex h-[40px] items-start overflow-clip relative rounded-[inherit] w-full">
              <div className="flex-1 flex h-full items-center">
                {orderedColumns.map((column, index) =>
                  disableDrag ? (
                    <SimpleColumnHeader
                      key={String(column.field)}
                      column={column}
                      index={index}
                      moveColumn={moveColumn}
                      sortField={sortField}
                      sortDirection={sortDirection}
                      handleSort={handleSort}
                      SortIcon={SortIcon}
                      columnsLength={orderedColumns.length}
                      editMode={editMode}
                      columnWidth={columnWidths[String(column.field)]}
                      onResizeStart={handleResizeStart}
                      selectedColumn={selectedColumn}
                      onColumnSelect={setSelectedColumn}
                      onMinWidthCalculated={handleMinWidthCalculated}
                      disableDrag={disableDrag}
                    />
                  ) : (
                    <DraggableColumnHeader
                      key={String(column.field)}
                      column={column}
                      index={index}
                      moveColumn={moveColumn}
                      sortField={sortField}
                      sortDirection={sortDirection}
                      handleSort={handleSort}
                      SortIcon={SortIcon}
                      columnsLength={orderedColumns.length}
                      editMode={editMode}
                      columnWidth={columnWidths[String(column.field)]}
                      onResizeStart={handleResizeStart}
                      selectedColumn={selectedColumn}
                      onColumnSelect={setSelectedColumn}
                      onMinWidthCalculated={handleMinWidthCalculated}
                      disableDrag={disableDrag}
                    />
                  )
                )}
              </div>

              {/* 액션 컬럼 / 편집 모드 버튼 */}
              {(onEdit || onDelete || (tableId && !disableSettings)) && (
                <div className="content-stretch flex gap-[11px] h-full items-center justify-center overflow-clip relative shrink-0 w-[40px]">
                  {tableId && !disableSettings && (
                    <>
                      {editMode ? (
                        // : 
                        <button
                          onClick={() => {
                            setEditMode(false);
                            setSelectedColumn(null);
                          }}
                          className="p-2 rounded-md transition-colors bg-[#0c8ce9] text-white hover:bg-[#0a7acc]"
                          title={language === "ko" ? "저장" : "Save"}
                        >
                          <Check className="h-[14px] w-[14px]" />
                        </button>
                      ) : (
                        // : 
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className="p-2 rounded-md transition-colors hover:bg-muted text-muted-foreground hover:text-foreground"
                              title={language === "ko" ? "테이블 설정" : "Table settings"}
                            >
                              <Settings2 className="h-[14px] w-[14px]" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => setEditMode(true)}
                            >
                              {language === "ko" ? "테이블 편집" : "Edit Table"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={resetTable}
                            >
                              {language === "ko" ? "테이블 초기화" : "Reset Table"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
            <div aria-hidden="true" className={`absolute border-[1px_0px] border-solid inset-0 pointer-events-none ${editMode ? 'border-gray-400 dark:border-gray-600' : 'border-border'}`} />
          </div>

          {/* 테이블 바디 */}
          <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
            {paginatedData.length === 0 ? (
              <div className="flex flex-col items-center justify-center w-full py-16 gap-4">
                <img 
                  src={emptyStateIcon} 
                  alt="No data" 
                  className="h-24 w-24 object-contain"
                />
                <p className="text-muted-foreground">
                  {language === "ko" ? "조회된 결과가 없습니다." : "No results found."}
                </p>
              </div>
            ) : (
              paginatedData.map((row, rowIndex) => (
              <div
                key={String(row[idField]) || rowIndex}
                onClick={() => onRowClick?.(row)}
                className={`content-stretch flex h-[52px] items-center overflow-clip relative shrink-0 w-full group transition-colors cursor-pointer ${
                  rowIndex % 2 === 0 ? "bg-card hover:bg-[#F3F4F6] dark:hover:bg-muted/10" : "bg-[#F9FAFB] dark:bg-muted/30 hover:bg-[#F3F4F6] dark:hover:bg-muted/10"
                }`}
              >
                <div className="flex-1 flex h-full items-center">
                  {orderedColumns.map((column, colIndex) => {
                    const cellWidth = columnWidths[String(column.field)];
                    
                    const getCellClassName = () => {
                      let baseClass = "";
                      
                      if (column.grow) {
                        baseClass = "flex-1 flex h-full relative shrink-0";
                      } else if (cellWidth !== undefined) {
                        baseClass = "box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-0 py-0 relative shrink-0";
                      } else {
                        baseClass = `box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 ${column.width || "w-[120px]"}`;
                      }
                      
                      return baseClass;
                    };
                    
                    const getCellStyle = (): React.CSSProperties => {
                      if (column.grow) return {};
                      if (cellWidth !== undefined) {
                        return { width: `${cellWidth}px`, minWidth: `${cellWidth}px`, maxWidth: `${cellWidth}px` };
                      }
                      return {};
                    };
                    
                    const getContentAlignment = () => {
                      if (column.align === "center") return "justify-center";
                      if (column.align === "right") return "justify-end pr-[20px]";
                      return "justify-start";
                    };
                    
                    return (
                    <div
                      key={colIndex}
                      className={getCellClassName()}
                      style={getCellStyle()}
                    >
                      {column.grow ? (
                        <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
                          <div className="box-border content-stretch flex gap-[10px] items-center pl-[20px] pr-[16px] py-[7px] relative size-full">
                            {column.render ? (
                              <div className="text-[13px] text-foreground [white-space-collapse:collapse] text-nowrap overflow-ellipsis overflow-hidden relative shrink-0">
                                {column.render(row[column.field as keyof T], row)}
                              </div>
                            ) : (
                              <p className="[white-space-collapse:collapse] text-[13px] text-foreground text-nowrap overflow-ellipsis overflow-hidden relative shrink-0">
                                {String(row[column.field as keyof T] || "")}
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className={`flex items-center w-full ${getContentAlignment()}`}>
                          {column.render ? (
                            <div className="text-[13px] text-foreground text-nowrap whitespace-pre overflow-ellipsis overflow-hidden">
                              {column.render(row[column.field as keyof T], row)}
                            </div>
                          ) : (
                            <p className="text-[13px] text-foreground text-nowrap whitespace-pre overflow-ellipsis overflow-hidden">
                              {String(row[column.field as keyof T] || "")}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                  })}
                </div>

                {/* 액션 버튼 */}
                {(onEdit || onDelete || (tableId && !disableSettings)) && !editMode && (
                  <div className="content-stretch flex gap-[11px] h-full items-center justify-center overflow-clip relative shrink-0 w-[40px]">
                    {(onEdit || onDelete) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-[#0c8ce9]/10 rounded-md cursor-pointer">
                            <MoreVertical className="h-4 w-4 text-[#0c8ce9]" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {onEdit && (
                            <DropdownMenuItem className="cursor-pointer" onClick={(e) => {
                              e.stopPropagation();
                              onEdit(row);
                            }}>
                              {language === "ko" ? "수정" : "Edit"}
                            </DropdownMenuItem>
                          )}
                          {onDelete && (
                            <DropdownMenuItem className="text-red-600 cursor-pointer" onClick={(e) => {
                              e.stopPropagation();
                              onDelete(row);
                            }}>
                              {language === "ko" ? "삭제" : "Delete"}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                )}
                {(onEdit || onDelete || (tableId && !disableSettings)) && editMode && (
                  <div className="content-stretch flex gap-[11px] h-full items-center justify-center overflow-clip relative shrink-0 w-[40px]">
                    {/* 편집 모드일 때는 빈 공간 */}
                  </div>
                )}
              </div>
              ))
            )}
          </div>
        </div>

        {/* 페이지네이션 */}
        <div className="content-stretch flex items-center justify-between overflow-clip relative shrink-0 w-full">
          <div className="flex flex-col justify-center leading-[0] not-italic relative shrink-0 text-foreground text-[12px] text-nowrap">
            <p className="leading-[16px] whitespace-pre">Total : {sortedData.length}</p>
          </div>

          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  // 
                  if (totalPages > 7) {
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setCurrentPage(page)}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }
                    return null;
                  }
                  
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}

          <FilterDropdown
            value={`${itemsPerPage}개씩 보기`}
            items={[
              { label: "10개씩 보기", value: "10" },
              { label: "30개씩 보기", value: "30" },
              { label: "50개씩 보기", value: "50" },
              { label: "100개씩 보기", value: "100" },
            ]}
            onSelect={(value) => setItemsPerPage(Number(value))}
            width="130px"
          />
        </div>
      </div>
    </div>
  );
}

export function DataTable<T extends Record<string, any>>(props: DataTableProps<T>) {
  return <DataTableContent {...props} />;
}