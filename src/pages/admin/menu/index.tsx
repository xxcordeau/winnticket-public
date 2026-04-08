import { useState, useEffect, useMemo, useCallback, Fragment } from "react";
import {
  useMenuCategories,
  loadMenuFromServer,
  invalidateMenuCache,
} from "@/data/hooks/useShopStore";
import {
  useAdminMenus,
  loadAdminMenuFromServer,
  invalidateAdminMenuCache,
} from "@/data/hooks/useAdminMenus";
import type { MenuCategory } from "@/data/dto/shop.dto";
import type { AdminMenuItem } from "@/data/admin-menus";
import {
  createMenu,
  createSubMenu,
  updateMenu,
  deleteMenu as deleteShopMenu,
  moveMenuUp,
  moveMenuDown,
  type MenuItem,
} from "@/lib/api/menu";
import {
  getAdminMenuList,
  insertAdminMenu,
  updateAdminMenu as updateAdminMenuAPI,
  deleteAdminMenu as deleteAdminMenuAPI,
  updateAdminMenuVisibility,
  updateAdminMenuOrder,
} from "@/lib/api/admin-menu";
import { PageHeader } from "@/components/page-header";
import { SegmentTabs } from "@/components/ui/segment-tabs";
import { MobilePcNotice } from "@/components/mobile-pc-notice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ChevronDown,
  ChevronRight,
  Edit,
  MoreVertical,
  Plus,
  Search,
  Trash2,
  MoveUp,
  MoveDown,
  ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";
import { CoachMark, useCoachMark, TourHelpButton, type TourStep } from "@/components/coach-mark";

type Language = "ko" | "en";
type MenuType = "shop" | "admin";

interface MenuManagementProps {
  language: Language;
}

export function MenuManagement({
  language,
}: MenuManagementProps) {
  // 쇼핑몰 메뉴 관리 (Shop menu management)
  const {
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    updateCategories,
    toggleVisibility: toggleCategoryVisibility,
  } = useMenuCategories();

  // 관리자 메뉴 관리
  const {
    menus: adminMenus,
    addMenu: addAdminMenu,
    updateMenu: updateAdminMenu,
    deleteMenu: deleteAdminMenu,
    toggleVisibility: toggleAdminVisibility,
    updateMenus: updateAdminMenus,
  } = useAdminMenus();

  const [menuType, setMenuType] = useState<MenuType>("shop");
  const [expandedCategories, setExpandedCategories] = useState<
    Set<string>
  >(new Set());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] =
    useState(false);
  const [editingCategory, setEditingCategory] =
    useState<MenuCategory | null>(null);
  const [editingAdminMenu, setEditingAdminMenu] =
    useState<AdminMenuItem | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<
    string | null
  >(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    level: 1,
    parentId: null as string | null,
    displayOrder: 1,
    visible: true,
    iconUrl: "",
    routePath: "",
  });
  const [adminFormData, setAdminFormData] = useState({
    title: "",
    page: "",
    displayOrder: 1,
    visible: true,
  });

  const text = {
    ko: {
      title: "메뉴 관리",
      description: "노출되는 메뉴를 관리합니다.",
      shopMenuTab: "쇼핑몰 메뉴 관리",
      adminMenuTab: "관리자 메뉴 관리",
      addMenu: "메뉴 추가",
      editMenu: "메뉴 수정",
      deleteMenu: "메뉴 삭제",
      name: "메뉴명",
      code: "메뉴 코드",
      level: "레벨",
      parentCategory: "상위 카테고리",
      displayOrder: "표시 순서",
      visible: "메뉴 활성화",
      iconUrl: "아이콘 URL",
      routePath: "라우팅 경로",
      actions: "작업",
      cancel: "취소",
      save: "저장",
      delete: "삭제",
      confirm: "확인",
      level1: "상위메뉴",
      level2: "하위메뉴",
      none: "없음 (최상위)",
      deleteConfirm: "이 메뉴를 삭제하시겠습니까?",
      deleteWarning:
        "하위 카테고리가 있는 경우 함께 삭제됩니다.",
      addSuccess: "메뉴가 추가되었습니다.",
      updateSuccess: "메뉴가 수정되었습니다.",
      deleteSuccess: "메뉴가 삭제되었습니다.",
      subCategories: "하위 카테고리",
      moveUp: "위로",
      moveDown: "아래로",
      show: "활성화",
      hide: "비활성화",
      search: "메뉴 검색",
      noResults: "등록된 메뉴가 없습니다.",
      codeExists: "이미 존재하는 메뉴 코드입니다.",
      codeRequired: "메뉴 코드는 필수입니다.",
      active: "활성화",
      inactive: "비활성화",
      order: "순서",
      icon: "아이콘",
      page: "페이지",
    },
    en: {
      title: "Menu Management",
      description: "Manage visible menus.",
      shopMenuTab: "Shop Menu",
      adminMenuTab: "Admin Menu",
      addMenu: "Add Menu",
      editMenu: "Edit Menu",
      deleteMenu: "Delete Menu",
      name: "Menu Name",
      code: "Menu Code",
      level: "Level",
      parentCategory: "Parent Category",
      displayOrder: "Display Order",
      visible: "Menu Active",
      iconUrl: "Icon URL",
      routePath: "Route Path",
      actions: "Actions",
      cancel: "Cancel",
      save: "Save",
      delete: "Delete",
      confirm: "Confirm",
      level1: "Parent Menu",
      level2: "Sub Menu",
      none: "None (Root)",
      deleteConfirm:
        "Are you sure you want to delete this menu?",
      deleteWarning:
        "Sub-categories will also be deleted if they exist.",
      addSuccess: "Menu added successfully.",
      updateSuccess: "Menu updated successfully.",
      deleteSuccess: "Menu deleted successfully.",
      subCategories: "Sub Categories",
      moveUp: "Move Up",
      moveDown: "Move Down",
      show: "Active",
      hide: "Inactive",
      search: "Search menus",
      noResults: "No menus registered.",
      codeExists: "Menu code already exists.",
      codeRequired: "Menu code is required.",
      active: "Active",
      inactive: "Inactive",
      order: "Order",
      icon: "Icon",
      page: "Page",
    },
  };

  const t = text[language];

  // 투어 가이드
  const shopTourSteps: TourStep[] = [
    {
      target: "menu-add-btn",
      title: "메뉴 추가",
      description: "이 버튼을 눌러 새로운 쇼핑몰 메뉴를 추가합니다.",
      placement: "bottom",
    },
    {
      target: "menu-dialog-name",
      title: "메뉴명 입력",
      description: "쇼핑몰에 표시될 메뉴 이름을 입력합니다.\n예: 테마파크, 워터파크 등",
      placement: "bottom",
      waitForTarget: 1500,
    },
    {
      target: "menu-dialog-code",
      title: "코드 입력 = URL 경로",
      description: "입력한 코드가 곧 URL 경로가 됩니다.\n예: 'themepark' → winnticket.co.kr/themepark\n영문 소문자로 입력하세요.",
      placement: "bottom",
      waitForTarget: 500,
    },
    {
      target: "menu-dialog-route",
      title: "자동 생성 URL",
      description: "위에서 입력한 코드를 기반으로 URL 경로가\n자동으로 생성됩니다.",
      placement: "bottom",
      waitForTarget: 500,
    },
    {
      target: "menu-dialog-order",
      title: "표시 순서",
      description: "숫자가 작을수록 메뉴가 앞에 표시됩니다.\n1이면 가장 처음에 노출됩니다.",
      placement: "top",
      waitForTarget: 500,
    },
    {
      target: "menu-dialog-visible",
      title: "메뉴 활성화",
      description: "토글을 켜면 쇼핑몰에 메뉴가 표시되고,\n끄면 숨겨집니다.",
      placement: "top",
      waitForTarget: 500,
    },
    {
      target: "menu-actions-col",
      title: "메뉴 관리 (···)",
      description: "각 메뉴 행의 ··· 버튼을 누르면:\n• 위로 / 아래로 — 순서 변경\n• 하위 메뉴 추가 — 서브 메뉴 생성\n• 메뉴 수정 / 삭제",
      placement: "left",
    },
    {
      target: "menu-tabs",
      title: "관리자 메뉴 탭",
      description: "탭을 전환하여 관리자 메뉴를 관리할 수 있습니다.\n다음 스텝에서 관리자 메뉴 기능을 안내합니다.",
      placement: "bottom",
    },
    // === 관리자 메뉴 탭 스텝 (8~11) ===
    {
      target: "admin-menu-name",
      title: "메뉴 이름",
      description: "사이드바에 표시되는 관리자 메뉴 이름입니다.\n··· 버튼에서 이름을 수정할 수 있습니다.",
      placement: "bottom",
      waitForTarget: 1500,
    },
    {
      target: "admin-menu-order",
      title: "메뉴 순서",
      description: "숫자가 작을수록 사이드바에서 위에 표시됩니다.\n··· 버튼으로 위/아래로 이동하여 순서를 변경하세요.",
      placement: "bottom",
      waitForTarget: 500,
    },
    {
      target: "admin-menu-visible",
      title: "활성화 / 비활성화",
      description: "토글로 메뉴의 표시 여부를 제어합니다.\n비활성화하면 사이드바에서 숨겨집니다.",
      placement: "bottom",
      waitForTarget: 500,
    },
    {
      target: "admin-menu-actions",
      title: "메뉴 관리 (···)",
      description: "··· 버튼을 누르면:\n• 위로 / 아래로 — 사이드바 순서 변경\n• 수정 — 메뉴 이름 변경\n• 삭제 — 메뉴 제거",
      placement: "left",
      waitForTarget: 500,
    },
  ];

  const { isActive: isTourActive, startTour, endTour } = useCoachMark("menu_mgmt_tour");

  // 투어 스텝 변경 시 모달/탭 전환 제어
  const handleTourStepChange = (stepIndex: number, _step: TourStep) => {
    const isModalStep = stepIndex >= 1 && stepIndex <= 5;
    const isAdminTabStep = stepIndex >= 8 && stepIndex <= 11;

    // 모달 제어
    if (isModalStep) {
      setEditingCategory(null);
      setFormData({
        name: "",
        code: "",
        level: 1,
        parentId: null,
        displayOrder: 1,
        visible: true,
        iconUrl: "",
        routePath: "",
      });
      setIsDialogOpen(true);
    } else {
      setIsDialogOpen(false);
    }

    // 탭 전환: 스텝 8~11은 관리자 메뉴 탭
    if (isAdminTabStep && menuType !== "admin") {
      setMenuType("admin");
    }
    // 쇼핑몰 메뉴 탭 스텝 (0~7)
    if (stepIndex <= 7 && menuType !== "shop") {
      setMenuType("shop");
    }
  };

  const resetFormData = () => {
    setFormData({
      name: "",
      code: "",
      level: 1,
      parentId: null,
      displayOrder: 1,
      visible: true,
      iconUrl: "",
      routePath: "",
    });
  };

  // 초기 데이터 로드 - 쇼핑몰 메뉴와 관리자 메뉴 모두 서버에서 로드
  useEffect(() => {
    if (menuType === "shop") {
      loadMenuFromServer(false, true)
        .then((serverMenus) => {
          if (serverMenus.length > 0) {
            console.log(
              `✅ Shop menu loaded ${serverMenus.length} menus`,
            );
          }
        })
        .catch((error) => {
          console.error("❌ Shop menu load failed:", error);
        });
    } else if (menuType === "admin") {
      // 관리자 메뉴 API 로드
      loadAdminMenuFromServer()
        .then((serverMenus) => {
          if (serverMenus && serverMenus.length > 0) {
            console.log(
              `✅ Admin menu loaded ${serverMenus.length} menus`,
            );
            // updateMenus 함수를 사용하여 스토어에 데이터 설정
            updateAdminMenus(serverMenus);
          } else {
            // ⭐ 조용한 처리 - 데이터가 없는 것은 정상적인 상황
            // console.log(
            //   "⚠️ Admin menu API returned no data, using localStorage",
            // );
          }
        })
        .catch((error) => {
          console.error("❌ Admin menu load failed:", error);
          // 에러가 발생해도 이미 로컬스토리지에서 로드되어 있으므로 토스트는 표시하지 않음
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuType]); // language 제거 - 불필요한 리로드 방지

  // 쇼핑몰 메뉴 관련 함수들
  const generateRoutePath = (
    code: string,
    parentId: string | null,
  ): string => {
    if (!code) return "";

    if (!parentId) {
      return `/${code}`;
    }

    const parent = categories.find((c) => c.id === parentId);
    if (!parent) {
      return `/${code}`;
    }

    let suffix = code;
    if (code.startsWith(parent.code + "_")) {
      suffix = code.substring(parent.code.length + 1);
    } else {
      suffix = code.split("_").pop() || code;
    }

    return `${parent.routePath}/${suffix}`;
  };

  const toggleExpand = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleAdd = () => {
    if (menuType === "shop") {
      setEditingCategory(null);
      const nextOrder = getNextDisplayOrder(null);
      setFormData({
        name: "",
        code: "",
        level: 1,
        parentId: null,
        displayOrder: nextOrder,
        visible: true,
        iconUrl: "",
        routePath: "",
      });
    } else {
      setEditingAdminMenu(null);
      const nextOrder = getNextAdminDisplayOrder();
      setAdminFormData({
        title: "",
        page: "",
        displayOrder: nextOrder,
        visible: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleEdit = (item: MenuCategory | AdminMenuItem) => {
    if (menuType === "shop") {
      const category = item as MenuCategory;
      setEditingCategory(category);
      setFormData({
        name: category.name,
        code: category.code,
        level: category.level,
        parentId: category.parentId,
        displayOrder: category.displayOrder,
        visible: category.visible,
        iconUrl: category.iconUrl || "",
        routePath: category.routePath || "",
      });
    } else {
      const menu = item as AdminMenuItem;
      setEditingAdminMenu(menu);
      setAdminFormData({
        title: menu.title,
        page: menu.page,
        displayOrder: menu.displayOrder,
        visible: menu.visible,
      });
    }
    setIsDialogOpen(true);
  };

  const handleAddChild = (parentCategory: MenuCategory) => {
    if (parentCategory.level >= 2) {
      toast.error(
        language === "ko"
          ? "최대 2단계까지만 생성할 수 있습니다."
          : "Maximum 2 levels allowed.",
      );
      return;
    }

    setEditingCategory(null);
    const newLevel = parentCategory.level + 1;
    const nextOrder = getNextDisplayOrder(parentCategory.id);
    const codePrefix = parentCategory.code + "_";

    setFormData({
      name: "",
      code: codePrefix,
      level: newLevel,
      parentId: parentCategory.id,
      displayOrder: nextOrder,
      visible: true,
      iconUrl: "",
      routePath: "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteTargetId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;

    try {
      if (menuType === "shop") {
        // 쇼핑몰 메뉴 삭제 API 호출
        const response = await deleteShopMenu(deleteTargetId);

        if (response.success) {
          // ✅ 성공 메시지 표시
          toast.success(t.deleteSuccess);

          // ✅ 서버에서 최신 메뉴 목록 다시 가져오기
          await loadMenuFromServer(true, true);
        } else {
          throw new Error(
            response.message || "메뉴 삭제에 실패했습니다.",
          );
        }
      } else {
        // 관리자 메뉴 삭제 API 호출
        const response =
          await deleteAdminMenuAPI(deleteTargetId);

        if (response.success) {
          // 로컬 스토어에서도 삭제하고 캐시 무효화
          deleteAdminMenu(deleteTargetId);
          invalidateAdminMenuCache();
          toast.success(t.deleteSuccess);
        } else {
          throw new Error(
            response.message || "메뉴 삭제에 실패했습니다.",
          );
        }
      }
    } catch (error) {
      console.error("Delete menu error:", error);
      toast.error(
        language === "ko"
          ? `메뉴 삭제에 실패했습니다: ${error instanceof Error ? error.message : "알 수 없는 오류"}`
          : `Failed to delete menu: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }

    setIsDeleteDialogOpen(false);
    setDeleteTargetId(null);
  };

  const handleSave = async () => {
    if (menuType === "shop") {
      if (!formData.name || !formData.code) {
        toast.error(
          language === "ko"
            ? "메뉴명과 코드는 필수입니다."
            : "Name and code are required.",
        );
        return;
      }

      const isDuplicateCode = categories.some(
        (cat) =>
          cat.code === formData.code &&
          cat.id !== editingCategory?.id,
      );
      if (isDuplicateCode) {
        toast.error(t.codeExists);
        return;
      }

      if (formData.level > 1 && !formData.parentId) {
        toast.error(
          language === "ko"
            ? "상위 메뉴를 선택해야 합니다."
            : "Parent menu is required.",
        );
        return;
      }

      if (formData.parentId) {
        const parent = categories.find(
          (c) => c.id === formData.parentId,
        );
        if (parent && parent.level !== formData.level - 1) {
          toast.error(
            language === "ko"
              ? "상위 메뉴의 레벨이 올바르지 않습니다."
              : "Invalid parent menu level.",
          );
          return;
        }
      }

      const autoRoutePath = generateRoutePath(
        formData.code,
        formData.parentId,
      );
      const dataToSave = {
        ...formData,
        routePath: autoRoutePath,
      };

      try {
        // 상점 메뉴는 항상 서버 API 사용
        if (editingCategory) {
          // 수정 - id와 data를 분리해서 전달
          const response = await updateMenu(
            editingCategory.id,
            {
              name: dataToSave.name,
              code: dataToSave.code,
              level: dataToSave.level,
              parentId: dataToSave.parentId,
              displayOrder: dataToSave.displayOrder,
              visible: dataToSave.visible,
              iconUrl: dataToSave.iconUrl,
              routePath: dataToSave.routePath,
            },
          );

          console.log("📝 Update response:", response);

          // 두 가지 응답 형태 처리:
          // 1. 객체가 직접 반환된 경우 (서버가 ApiResponse 없이 반환)
          // 2. ApiResponse 형태: { success: true, data: {...} }
          let isSuccess = false;
          let responseData = null;

          if (response && typeof response === "object") {
            // ApiResponse 형태인 경우
            if ("success" in response && response.success) {
              isSuccess = true;
              responseData = response.data;
            }
            // 객체가 직접 반환된 경우 (id 필드가 있으면 성공으로 간주)
            else if ("id" in response) {
              isSuccess = true;
              responseData = response;
            }
          }

          if (isSuccess) {
            // ✅ 성공 메시지 표시
            toast.success(t.updateSuccess);

            // ✅ 서버에서 최신 메뉴 목록 다시 가져오기
            await loadMenuFromServer(true, true);
          } else {
            throw new Error(
              response?.message || "메뉴 수정에 실패했습니다.",
            );
          }
        } else {
          // 생성
          const response = dataToSave.parentId
            ? await createSubMenu(dataToSave.parentId, {
                name: dataToSave.name,
                code: dataToSave.code,
                level: dataToSave.level,
                displayOrder: dataToSave.displayOrder,
                visible: dataToSave.visible,
                routePath: dataToSave.routePath,
              })
            : await createMenu({
                name: dataToSave.name,
                code: dataToSave.code,
                level: dataToSave.level,
                displayOrder: dataToSave.displayOrder,
                visible: dataToSave.visible,
              });

          console.log("📝 Insert response:", response);

          // 두 가지 응답 형태 처리:
          // 1. 객체가 직접 반환된 경우 (서버가 ApiResponse 없이 반환)
          // 2. ApiResponse 형태: { success: true, data: {...} } 또는 { success: true, data: null }
          let isSuccess = false;
          let responseData = null;

          if (response && typeof response === "object") {
            // ApiResponse 형태인 경우 - success: true면 성공 (data가 null이어도 OK)
            if ("success" in response && response.success) {
              isSuccess = true;
              responseData = response.data;
            }
            // 객체가 직접 반환된 경우 (id 필드가 있으면 성공으로 간주)
            else if ("id" in response) {
              isSuccess = true;
              responseData = response;
            }
          }

          if (isSuccess) {
            // ✅ 성공 메시지 표시
            toast.success(t.addSuccess);

            // ✅ 서버에서 최신 메뉴 목록 다시 가져오기
            await loadMenuFromServer(true, true);
          } else {
            throw new Error(
              response?.message || "메뉴 추가에 실패했습니다.",
            );
          }
        }
      } catch (error) {
        console.error("Menu save error:", error);
        toast.error(
          language === "ko"
            ? `메뉴 저장에 실패했습니다: ${error instanceof Error ? error.message : "알 수 없는 오류"}`
            : `Failed to save menu: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
        return; // 오류 발생 시 다이얼로그 닫지 않음
      }
    } else {
      // 관리자 메뉴 저장 - API 사용
      if (!adminFormData.title || !adminFormData.page) {
        toast.error(
          language === "ko"
            ? "필수 항목을 모두 입력해주세요."
            : "Please fill in all required fields.",
        );
        return;
      }

      try {
        if (editingAdminMenu) {
          // 수정
          const response = await updateAdminMenuAPI(
            editingAdminMenu.id,
            adminFormData,
          );

          console.log(
            "📝 Admin Menu Update response:",
            response,
          );

          // 응답 처리
          let isSuccess = false;

          if (response && typeof response === "object") {
            if ("success" in response && response.success) {
              isSuccess = true;
            } else if ("id" in response) {
              isSuccess = true;
            } else if (response.data && typeof response.data === "object" && "id" in (response.data as object)) {
              isSuccess = true;
            }
          }

          if (isSuccess) {
            // 로컬 스토어도 업데이트 (UI 반영용)
            updateAdminMenu(editingAdminMenu.id, adminFormData);
            toast.success(t.updateSuccess);
          } else {
            throw new Error(
              (response as any)?.message ||
                "관리자 메뉴 수정에 실패했습니다.",
            );
          }
        } else {
          // 생성
          const response = await insertAdminMenu({
            title: adminFormData.title,
            page: adminFormData.page,
            displayOrder: adminFormData.displayOrder,
            visible: adminFormData.visible,
          });

          console.log(
            "📝 Admin Menu Insert response:",
            response,
          );

          // 응답 처리
          let isSuccess = false;
          let responseData = null;

          if (response && typeof response === "object") {
            if (
              "success" in response &&
              response.success &&
              response.data
            ) {
              isSuccess = true;
              responseData = response.data;
            } else if ("id" in response) {
              isSuccess = true;
              responseData = response;
            }
          }

          if (isSuccess && responseData && responseData.id) {
            // 서버에서 받은 ID로 로컬 스토어에도 추가
            const newMenu: AdminMenuItem = {
              id: responseData.id,
              title: adminFormData.title,
              page: adminFormData.page,
              displayOrder: adminFormData.displayOrder,
              visible: adminFormData.visible,
              createdAt:
                responseData.createdAt ||
                new Date().toISOString(),
              updatedAt:
                responseData.updatedAt ||
                new Date().toISOString(),
            };
            addAdminMenu(newMenu);
            toast.success(t.addSuccess);
          } else {
            throw new Error(
              response?.message ||
                "관리자 메뉴 추가에 실패했습니다.",
            );
          }
        }
      } catch (error) {
        console.error("Admin menu save error:", error);
        toast.error(
          language === "ko"
            ? `관리자 메뉴 저장에 실패했습니다: ${error instanceof Error ? error.message : "알 수 없는 오류"}`
            : `Failed to save admin menu: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
        return;
      }
    }

    setIsDialogOpen(false);
  };

  const handleMove = async (
    id: string,
    direction: "up" | "down",
  ) => {
    if (menuType === "shop") {
      const category = categories.find((c) => c.id === id);
      if (!category) return;

      const siblings = categories
        .filter((c) => c.parentId === category.parentId)
        .sort((a, b) => a.displayOrder - b.displayOrder);

      const currentIndex = siblings.findIndex(
        (c) => c.id === id,
      );
      if (
        (direction === "up" && currentIndex === 0) ||
        (direction === "down" &&
          currentIndex === siblings.length - 1)
      ) {
        return;
      }

      try {
        // ✅ 서버 API 호출
        const response =
          direction === "up"
            ? await moveMenuUp(id)
            : await moveMenuDown(id);

        // 성공 여부 확인
        if (response && response.success) {
          toast.success(
            language === "ko"
              ? "메뉴 순서가 변경되었습니다."
              : "Menu order updated.",
          );

          // ✅ 서버에서 최신 메뉴 목록 다시 가져오기
          await loadMenuFromServer(true, true);
        } else {
          throw new Error(
            response?.message || "순서 변경에 실패했습니다.",
          );
        }
      } catch (error) {
        console.error("Move menu error:", error);
        toast.error(
          language === "ko"
            ? `순서 변경에 실패했습니다: ${error instanceof Error ? error.message : "알 수 없는 오류"}`
            : `Failed to update order: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    } else {
      // 관리자 메뉴 이동
      const sorted = [...adminMenus].sort(
        (a, b) => a.displayOrder - b.displayOrder,
      );
      const currentIndex = sorted.findIndex((m) => m.id === id);

      if (
        (direction === "up" && currentIndex === 0) ||
        (direction === "down" &&
          currentIndex === sorted.length - 1)
      ) {
        return;
      }

      const swapIndex =
        direction === "up"
          ? currentIndex - 1
          : currentIndex + 1;
      const temp = sorted[currentIndex].displayOrder;
      sorted[currentIndex].displayOrder =
        sorted[swapIndex].displayOrder;
      sorted[swapIndex].displayOrder = temp;

      // 먼저 로컬 상태 업데이트 (낙관적 업데이트)
      updateAdminMenus(sorted);

      // 두 메뉴의 순서를 각각 API로 업데이트
      const currentMenu = sorted[currentIndex];
      const swapMenu = sorted[swapIndex];

      // 두 메뉴의 순서 변경을 순차 실행 (동시 실행 시 데드락 발생)
      (async () => {
        try {
          const response1 = await updateAdminMenuOrder(
            currentMenu.id,
            currentMenu.displayOrder,
          );
          const response2 = await updateAdminMenuOrder(
            swapMenu.id,
            swapMenu.displayOrder,
          );

          if (response1.success && response2.success) {
            toast.success(
              language === "ko"
                ? "메뉴 순서가 변경되었습니다."
                : "Menu order updated.",
            );
          } else {
            throw new Error("Failed to update menu order");
          }
        } catch (error) {
          console.error(
            "Update admin menu order error:",
            error,
          );
          // 실패 시 롤백 (원래 순서로 되돌림)
          const temp2 = sorted[currentIndex].displayOrder;
          sorted[currentIndex].displayOrder =
            sorted[swapIndex].displayOrder;
          sorted[swapIndex].displayOrder = temp2;
          updateAdminMenus(sorted);

          toast.error(
            language === "ko"
              ? `순서 변경에 실패했습니다: ${error instanceof Error ? error.message : "알 수 없는 오류"}`
              : `Failed to update order: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
        }
      })();
    }
  };

  const toggleVisibility = (id: string) => {
    if (menuType === "shop") {
      // 쇼핑몰 메뉴는 서버 API를 사용
      const category = categories.find((c) => c.id === id);
      if (!category) return;

      const newVisibleState = !category.visible;

      // 서버 API 호출 - id와 data를 분리해서 전달
      updateMenu(id, {
        visible: newVisibleState,
      })
        .then(async (response) => {
          // 성공 여부 확인
          let isSuccess = false;
          if (response && typeof response === "object") {
            if ("success" in response && response.success) {
              isSuccess = true;
            } else if ("id" in response) {
              isSuccess = true;
            }
          }

          if (isSuccess) {
            toast.success(
              language === "ko"
                ? `메뉴가 ${newVisibleState ? "활성화" : "비활성화"}되었습니다.`
                : `Menu ${newVisibleState ? "enabled" : "disabled"}.`,
            );

            // ✅ 서버에서 최신 메뉴 목록 다시 가져오기
            await loadMenuFromServer(true, true);
          } else {
            throw new Error(
              response?.message || "상태 변경에 실패했습니다.",
            );
          }
        })
        .catch((error) => {
          console.error("Toggle visibility error:", error);
          toast.error(
            language === "ko"
              ? `상태 변경에 실패했습니다: ${error instanceof Error ? error.message : "알 수 없는 오류"}`
              : `Failed to toggle visibility: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
        });
    } else {
      // 관리자 메뉴는 서버 API를 사용
      const menu = adminMenus.find((m) => m.id === id);
      if (!menu) return;

      const newVisibleState = !menu.visible;

      // 먼저 로컬 상태를 즉시 업데이트 (낙관적 업데이트)
      toggleAdminVisibility(id);

      // 서버 API 호출
      updateAdminMenuVisibility(id, newVisibleState)
        .then((response) => {
          // 성공 여부 확인
          if (response && response.success) {
            toast.success(
              language === "ko"
                ? `관리자 메뉴가 ${newVisibleState ? "활성화" : "비활성화"}되었습니다.`
                : `Admin menu ${newVisibleState ? "enabled" : "disabled"}.`,
            );
          } else {
            // 실패 시 롤백
            toggleAdminVisibility(id);
            throw new Error(
              response?.message || "상태 변경에 실패했습니다.",
            );
          }
        })
        .catch((error) => {
          // 실패 시 롤백
          toggleAdminVisibility(id);
          console.error(
            "Toggle admin menu visibility error:",
            error,
          );
          toast.error(
            language === "ko"
              ? `상태 변경에 실패했습니다: ${error instanceof Error ? error.message : "알 수 없는 오류"}`
              : `Failed to toggle visibility: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
        });
    }
  };

  const getParentCategories = (
    excludeId?: string,
    targetLevel?: number,
  ) => {
    const maxParentLevel = targetLevel ? targetLevel - 1 : 1;

    return categories
      .filter((c) => {
        if (c.id === excludeId) return false;
        if (targetLevel) {
          return c.level === maxParentLevel;
        }
        return c.level < 2;
      })
      .sort(
        (a, b) =>
          a.level - b.level || a.displayOrder - b.displayOrder,
      );
  };

  const getNextDisplayOrder = (parentId: string | null) => {
    const siblings = categories.filter(
      (c) => c.parentId === parentId,
    );
    if (siblings.length === 0) return 1;

    const maxOrder = Math.max(
      ...siblings.map((c) => c.displayOrder),
    );
    return maxOrder + 1;
  };

  const getNextAdminDisplayOrder = () => {
    if (adminMenus.length === 0) return 1;
    const maxOrder = Math.max(
      ...adminMenus.map((m) => m.displayOrder),
    );
    return maxOrder + 1;
  };

  const filterCategories = (
    cats: MenuCategory[],
  ): MenuCategory[] => {
    if (!searchQuery) return cats;

    const query = searchQuery.toLowerCase();
    return cats.filter((cat) => {
      const matchesSearch =
        cat.name.toLowerCase().includes(query) ||
        cat.code.toLowerCase().includes(query);

      const hasMatchingChild = categories.some(
        (child) =>
          child.parentId === cat.id &&
          (child.name.toLowerCase().includes(query) ||
            child.code.toLowerCase().includes(query)),
      );

      return matchesSearch || hasMatchingChild;
    });
  };

  const filterAdminMenus = (
    menus: AdminMenuItem[],
  ): AdminMenuItem[] => {
    if (!searchQuery) return menus;

    const query = searchQuery.toLowerCase();
    return menus.filter(
      (menu) =>
        menu.title.toLowerCase().includes(query) ||
        menu.page.toLowerCase().includes(query),
    );
  };

  const getHierarchicalOrder = (
    category: MenuCategory,
  ): string => {
    if (category.level === 1) {
      return category.displayOrder.toString();
    }

    const parent = categories.find(
      (c) => c.id === category.parentId,
    );
    if (parent) {
      const parentOrder = getHierarchicalOrder(parent);
      return `${parentOrder}-${category.displayOrder}`;
    }

    return category.displayOrder.toString();
  };

  const renderShopCategory = (
    category: MenuCategory,
    level: number = 0,
    rowIndex: number = 0,
  ) => {
    const hasChildren = categories.some(
      (c) => c.parentId === category.id,
    );
    const isExpanded = expandedCategories.has(category.id);
    const children = filterCategories(
      categories
        .filter((c) => c.parentId === category.id)
        .sort((a, b) => a.displayOrder - b.displayOrder),
    );

    return (
      <Fragment key={category.id}>
        {/* Main Row */}
        <div
          className={`content-stretch flex h-[52px] items-center overflow-clip relative shrink-0 w-full group transition-colors ${
            rowIndex % 2 === 0
              ? "bg-card hover:bg-[#F3F4F6] dark:hover:bg-muted/10"
              : "bg-[#F9FAFB] dark:bg-muted/30 hover:bg-[#F3F4F6] dark:hover:bg-muted/10"
          }`}
        >
          {/* Name Column (grow) */}
          <div className="basis-0 grow h-full min-h-px min-w-px relative shrink-0">
            <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
              <div
                className="box-border content-stretch flex items-center pl-[20px] pr-[16px] py-[7px] relative size-full"
                style={{ paddingLeft: `${20 + level * 24}px` }}
              >
                <div className="flex items-center gap-2">
                  {hasChildren ? (
                    <button
                      onClick={() => toggleExpand(category.id)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-all cursor-pointer hover:scale-110"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                  ) : (
                    <div className="w-6" />
                  )}
                  <p className="text-[14px] text-foreground text-nowrap overflow-ellipsis overflow-hidden">
                    {category.name}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Code Column */}
          <div className="box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-[16px] py-0 relative shrink-0 w-[200px]">
            <code className="text-[12px] bg-muted px-2 py-1 rounded text-nowrap">
              {category.code}
            </code>
          </div>

          {/* Level Column */}
          <div className="box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-[16px] py-0 relative shrink-0 w-[150px]">
            <Badge variant="outline" className="text-[10px]">
              {category.level === 1 ? t.level1 : t.level2}
            </Badge>
          </div>

          {/* Display Order Column */}
          <div className="box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-[16px] py-0 relative shrink-0 w-[100px]">
            <p className="text-[14px] text-foreground text-center w-full">
              {getHierarchicalOrder(category)}
            </p>
          </div>

          {/* Visible Column */}
          <div className="box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-[16px] py-0 relative shrink-0 w-[120px]">
            <Switch
              checked={category.visible}
              onCheckedChange={() =>
                toggleVisibility(category.id)
              }
            />
          </div>

          {/* Actions Column */}
          <div className="content-stretch flex gap-[11px] h-full items-center justify-center overflow-clip relative shrink-0 w-[40px]">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 rounded-md transition-colors hover:bg-muted text-muted-foreground hover:text-foreground">
                  <MoreVertical className="h-[14px] w-[14px]" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {category.level < 2 && (
                  <DropdownMenuItem
                    onClick={() => handleAddChild(category)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {language === "ko"
                      ? "하위 메뉴 추가"
                      : "Add Submenu"}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => handleMove(category.id, "up")}
                >
                  <MoveUp className="h-4 w-4 mr-2" />
                  {t.moveUp}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    handleMove(category.id, "down")
                  }
                >
                  <MoveDown className="h-4 w-4 mr-2" />
                  {t.moveDown}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleEdit(category)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {t.editMenu}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDelete(category.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t.deleteMenu}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Children Rows */}
        {isExpanded &&
          children.map((child, index) =>
            renderShopCategory(
              child,
              level + 1,
              rowIndex + index + 1,
            ),
          )}
      </Fragment>
    );
  };

  // 페이지 이름에 따라 아이콘 이름 반환
  const getIconForPage = (page: string): string => {
    const iconMap: Record<string, string> = {
      dashboard: "LayoutDashboard",
      products: "Package",
      orders: "ShoppingCart",
      partners: "Handshake",
      banners: "Image",
      channels: "Radio",
      community: "Users",
      "menu-management": "Menu",
      "site-info": "Info",
      permissions: "Shield",
      "entity-diagram": "Network",
      "data-preview": "Database",
    };
    return iconMap[page] || "File";
  };

  const renderAdminMenu = (
    menu: AdminMenuItem,
    index: number,
  ) => {
    const iconName = getIconForPage(menu.page);
    // ⭐ 현장주문관리(field-orders)는 수정/삭제/순서변경/비활성화 불가
    const isProtected = menu.page === "field-orders";

    return (
      <div
        key={menu.id}
        className={`content-stretch flex h-[52px] items-center overflow-clip relative shrink-0 w-full group transition-colors ${
          index % 2 === 0
            ? "bg-card hover:bg-[#F3F4F6] dark:hover:bg-muted/10"
            : "bg-[#F9FAFB] dark:bg-muted/30 hover:bg-[#F3F4F6] dark:hover:bg-muted/10"
        }`}
        {...(index === 0 ? { "data-tour": "admin-menu-row" } : {})}
      >
        {/* 메뉴명 */}
        <div className="box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-[16px] py-0 relative shrink-0 w-[220px]"
          {...(index === 0 ? { "data-tour": "admin-menu-name" } : {})}
        >
          <div className="flex flex-col overflow-hidden">
            <p className="text-[14px] text-foreground text-nowrap overflow-ellipsis overflow-hidden">
              {menu.title}
            </p>
          </div>
        </div>

        {/* 아이콘 */}
        <div className="box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-[16px] py-0 relative shrink-0 w-[180px]">
          <code className="text-[12px] bg-muted px-2 py-1 rounded text-nowrap">
            {iconName}
          </code>
        </div>

        {/* 페이지 */}
        <div className="box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-[16px] py-0 relative shrink-0 w-[180px]">
          <p className="text-[13px] text-muted-foreground">
            {menu.page}
          </p>
        </div>

        {/* 순서 */}
        <div className="box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-[16px] py-0 relative shrink-0 w-[80px]"
          {...(index === 0 ? { "data-tour": "admin-menu-order" } : {})}
        >
          <p className="text-[14px] text-foreground">
            {menu.displayOrder}
          </p>
        </div>

        {/* 표시 */}
        <div className="box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-[16px] py-0 relative shrink-0 w-[80px]"
          {...(index === 0 ? { "data-tour": "admin-menu-visible" } : {})}
        >
          <Switch
            checked={menu.visible}
            disabled={isProtected}
            onCheckedChange={() => toggleVisibility(menu.id)}
          />
        </div>

        {/* 작업 */}
        <div className="content-stretch flex gap-[11px] h-full items-center justify-center overflow-clip relative shrink-0 w-[120px]"
          {...(index === 0 ? { "data-tour": "admin-menu-actions" } : {})}
        >
          {isProtected ? (
            <span className="text-xs text-muted-foreground">잠금</span>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 rounded-md transition-colors hover:bg-muted text-muted-foreground hover:text-foreground">
                  <MoreVertical className="h-[14px] w-[14px]" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => handleMove(menu.id, "up")}
                >
                  <MoveUp className="h-4 w-4 mr-2" />
                  {t.moveUp}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleMove(menu.id, "down")}
                >
                  <MoveDown className="h-4 w-4 mr-2" />
                  {t.moveDown}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleEdit(menu)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {t.editMenu}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDelete(menu.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t.deleteMenu}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    );
  };

  const rootCategories = useMemo(() => {
    const filtered = filterCategories(
      categories
        .filter((c) => c.parentId === null)
        .sort((a, b) => a.displayOrder - b.displayOrder),
    );
    return filtered;
  }, [categories, searchQuery]);

  const filteredAdminMenus = useMemo(
    () =>
      filterAdminMenus(
        [...adminMenus].sort(
          (a, b) => a.displayOrder - b.displayOrder,
        ),
      ),
    [adminMenus, searchQuery],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={t.title}
        subtitle={t.description}
        language={language}
        rightContent={
          <TourHelpButton onClick={startTour} />
        }
      />

      {/* Mobile PC Notice */}
      <MobilePcNotice pageName="메뉴관리" />

      {/* Segment Tabs - 박스 밖으로 이동 */}
      <div data-tour="menu-tabs" className="inline-flex">
      <SegmentTabs
        value={menuType}
        onValueChange={(value) => {
          setMenuType(value as MenuType);
          setSearchQuery("");
        }}
        options={[
          { value: "shop" as MenuType, label: t.shopMenuTab },
          { value: "admin" as MenuType, label: t.adminMenuTab },
        ]}
      />
      </div>

      {/* Table Container */}
      <div className="bg-card relative rounded-[8px] flex-1 flex flex-col">
        <div
          aria-hidden="true"
          className="absolute border border-border border-solid inset-0 pointer-events-none rounded-[8px]"
        />

        <div className="flex flex-col gap-4 px-4 py-4 sm:gap-[20px] sm:items-start sm:px-[32px] sm:py-[20px] sm:flex-1 sm:overflow-hidden sm:box-border sm:content-stretch">
          {/* Search and Add Button */}
          <div className="flex flex-col gap-3 w-full sm:flex-row sm:items-center sm:gap-3">
            <div className="bg-background box-border content-stretch flex gap-[8px] h-[36px] items-center px-[16px] py-[8px] relative rounded-[6px] shrink-0 w-full sm:w-[360px] focus-within:shadow-[0_0_0_1px_#0c8ce9] transition-shadow">
              <div
                aria-hidden="true"
                className="absolute border border-border border-solid inset-0 pointer-events-none rounded-[6px]"
              />
              <Search className="h-[18px] w-[18px] text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.search}
                className="text-[12px] text-muted-foreground placeholder:text-muted-foreground bg-transparent border-none outline-none flex-1"
              />
            </div>

            {/* Add Button - 관리자 메뉴에서는 숨김 */}
            {menuType === "shop" && (
              <Button
                onClick={handleAdd}
                className="gap-2 h-[36px] w-full sm:w-auto sm:ml-auto"
                data-tour="menu-add-btn"
              >
                <Plus className="h-4 w-4" />
                {t.addMenu}
              </Button>
            )}
          </div>

          {/* Desktop Table */}
          <div className="content-stretch flex-col items-start relative shrink-0 w-full flex-1 overflow-auto flex">
            {/* Table Header */}
            <div className="h-[40px] relative shrink-0 w-full bg-muted/30">
              <div className="content-stretch flex h-[40px] items-center overflow-clip relative rounded-[inherit] w-full">
                {/* 메뉴명 Header */}
                <div
                  className={`box-border content-stretch flex h-full items-center justify-between overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 ${menuType === "shop" ? "flex-1" : "w-[220px]"}`}
                >
                  <p className="text-[13px] text-nowrap whitespace-pre">
                    {t.name}
                  </p>
                  <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                    <div className="h-[16px] w-px bg-border" />
                  </div>
                </div>

                {menuType === "shop" ? (
                  <>
                    {/* 코드 Header */}
                    <div className="box-border content-stretch flex h-full items-center justify-between overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 w-[200px]" data-tour="menu-code-col">
                      <p className="text-[13px] text-nowrap whitespace-pre">
                        {t.code}
                      </p>
                      <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                        <div className="h-[16px] w-px bg-border" />
                      </div>
                    </div>

                    {/* 레벨 Header */}
                    <div className="box-border content-stretch flex h-full items-center justify-between overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 w-[150px]">
                      <p className="text-[13px] text-nowrap whitespace-pre">
                        {t.level}
                      </p>
                      <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                        <div className="h-[16px] w-px bg-border" />
                      </div>
                    </div>

                    {/* 표시 순서 Header */}
                    <div className="box-border content-stretch flex h-full items-center justify-between overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 w-[100px]" data-tour="menu-order-col">
                      <p className="text-[13px] text-nowrap whitespace-pre">
                        {t.displayOrder}
                      </p>
                      <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                        <div className="h-[16px] w-px bg-border" />
                      </div>
                    </div>

                    {/* 표시 Header */}
                    <div className="box-border content-stretch flex h-full items-center justify-between overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 w-[120px]" data-tour="menu-visible-col">
                      <p className="text-[13px] text-nowrap whitespace-pre">
                        {t.visible}
                      </p>
                      <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                        <div className="h-[16px] w-px bg-border" />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* 아이콘 Header */}
                    <div className="box-border content-stretch flex h-full items-center justify-between overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 w-[180px]">
                      <p className="text-[13px] text-nowrap whitespace-pre">
                        {t.icon}
                      </p>
                      <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                        <div className="h-[16px] w-px bg-border" />
                      </div>
                    </div>

                    {/* 페이지 Header */}
                    <div className="box-border content-stretch flex h-full items-center justify-between overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 w-[180px]">
                      <p className="text-[13px] text-nowrap whitespace-pre">
                        페이지
                      </p>
                      <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                        <div className="h-[16px] w-px bg-border" />
                      </div>
                    </div>

                    {/* 순서 Header */}
                    <div className="box-border content-stretch flex h-full items-center justify-between overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 w-[80px]">
                      <p className="text-[13px] text-nowrap whitespace-pre">
                        {t.order}
                      </p>
                      <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                        <div className="h-[16px] w-px bg-border" />
                      </div>
                    </div>

                    {/* 표시 Header */}
                    <div className="box-border content-stretch flex h-full items-center justify-between overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 w-[80px]">
                      <p className="text-[13px] text-nowrap whitespace-pre">
                        {t.visible}
                      </p>
                      <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                        <div className="h-[16px] w-px bg-border" />
                      </div>
                    </div>
                  </>
                )}

                {/* 작업 Header */}
                <div
                  className={`content-stretch flex gap-[11px] h-full items-center justify-center overflow-clip relative shrink-0 ${menuType === "shop" ? "w-[40px]" : "w-[120px]"}`}
                  data-tour="menu-actions-col"
                >
                  <div className="h-[16px] w-px bg-border" />
                  {menuType === "admin" && (
                    <p className="text-[13px] text-nowrap whitespace-pre">
                      {t.actions}
                    </p>
                  )}
                </div>
              </div>
              <div
                aria-hidden="true"
                className="absolute border-[1px_0px] border-border border-solid inset-0 pointer-events-none"
              />
            </div>

            {/* Table Body */}
            <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
              {menuType === "shop" ? (
                rootCategories.length === 0 ? (
                  <div className="flex flex-col items-center justify-center w-full py-16 gap-4">
                    <ShoppingBag className="size-12 text-muted-foreground opacity-20" />
                    <p className="text-muted-foreground">
                      {t.noResults}
                    </p>
                  </div>
                ) : (
                  rootCategories.map((category, index) =>
                    renderShopCategory(category, 0, index),
                  )
                )
              ) : filteredAdminMenus.length === 0 ? (
                <div className="flex flex-col items-center justify-center w-full py-16 gap-4">
                  <p className="text-muted-foreground">
                    {t.noResults}
                  </p>
                </div>
              ) : (
                filteredAdminMenus.map((menu, index) =>
                  renderAdminMenu(menu, index),
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Dialog - Shop Menu */}
      {menuType === "shop" && (
        <Dialog
          open={isDialogOpen}
          modal={!isTourActive}
          onOpenChange={(open) => {
            if (isTourActive && !open) return;
            setIsDialogOpen(open);
          }}
        >
          <DialogContent
            className="max-w-md"
            onInteractOutside={(e) => { if (isTourActive) e.preventDefault(); }}
            onEscapeKeyDown={(e) => { if (isTourActive) e.preventDefault(); }}
          >
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? t.editMenu : t.addMenu}
              </DialogTitle>
              <DialogDescription>
                {language === "ko"
                  ? "메뉴 정보를 입력하세요."
                  : "Enter menu information."}
                {formData.parentId && !editingCategory && (
                  <div className="mt-2 text-sm text-muted-foreground bg-muted px-3 py-2 rounded-md">
                    {language === "ko"
                      ? "상위 메뉴: "
                      : "Parent: "}
                    <span className="font-medium text-foreground">
                      {
                        categories.find(
                          (c) => c.id === formData.parentId,
                        )?.name
                      }
                    </span>
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2" data-tour="menu-dialog-name">
                <Label htmlFor="name">{t.name}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      name: e.target.value,
                    })
                  }
                  placeholder={
                    language === "ko"
                      ? "메뉴명 입력"
                      : "Enter name"
                  }
                />
              </div>

              <div className="space-y-2" data-tour="menu-dialog-code">
                <Label htmlFor="code">{t.code}</Label>
                {formData.parentId ? (
                  <div className="flex items-center gap-2">
                    <div className="bg-muted px-3 py-2 rounded-md border text-sm text-muted-foreground font-mono">
                      {
                        categories.find(
                          (c) => c.id === formData.parentId,
                        )?.code
                      }
                      _
                    </div>
                    <Input
                      id="code"
                      value={
                        formData.code.split("_").pop() || ""
                      }
                      onChange={(e) => {
                        const parent = categories.find(
                          (c) => c.id === formData.parentId,
                        );
                        if (parent) {
                          const suffix = e.target.value
                            .toLowerCase()
                            .replace(/_/g, "");
                          const newCode =
                            parent.code + "_" + suffix;
                          setFormData({
                            ...formData,
                            code: newCode,
                          });
                        }
                      }}
                      placeholder="suffix"
                      className="flex-1 font-mono"
                    />
                  </div>
                ) : (
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        code: e.target.value.toLowerCase(),
                      })
                    }
                    placeholder={
                      language === "ko"
                        ? "코드 입력 (예: concert)"
                        : "Enter code"
                    }
                    className="font-mono"
                  />
                )}
              </div>

              {!formData.parentId &&
                editingCategory === null && (
                  <div className="space-y-2">
                    <Label htmlFor="level">{t.level}</Label>
                    <Select
                      value={formData.level.toString()}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          level: parseInt(value),
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">
                          {t.level1}
                        </SelectItem>
                        <SelectItem value="2">
                          {t.level2}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

              {formData.level > 1 && !formData.parentId && (
                <div className="space-y-2">
                  <Label htmlFor="parent">
                    {t.parentCategory}
                  </Label>
                  <Select
                    value={formData.parentId || "none"}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        parentId:
                          value === "none" ? null : value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        {t.none}
                      </SelectItem>
                      {getParentCategories(
                        editingCategory?.id,
                        formData.level,
                      ).map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name} ({cat.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2" data-tour="menu-dialog-route">
                <Label htmlFor="routePath">{t.routePath}</Label>
                <div className="bg-muted px-3 py-2 rounded-md border text-sm font-mono">
                  {generateRoutePath(
                    formData.code,
                    formData.parentId,
                  ) || "/..."}
                </div>
                <p className="text-xs text-muted-foreground">
                  {language === "ko"
                    ? "url 경로는 메뉴 코드로부터 자동 생성됩니다"
                    : "Route path is auto-generated from menu code"}
                </p>
              </div>

              <div className="space-y-2" data-tour="menu-dialog-order">
                <Label htmlFor="displayOrder">
                  {t.displayOrder}
                </Label>
                <Input
                  id="displayOrder"
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      displayOrder:
                        Math.max(1, parseInt(e.target.value) || 1),
                    })
                  }
                />
              </div>

              <div className="space-y-2" data-tour="menu-dialog-visible">
                <Label className="text-xs">메뉴 상태</Label>
                <div className="border rounded-md p-3 bg-muted/30 flex items-center gap-2">
                  <Switch
                    id="visible"
                    checked={formData.visible}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        visible: checked,
                      })
                    }
                  />
                  <Label
                    htmlFor="visible"
                    className="cursor-pointer"
                  >
                    {formData.visible ? "활성" : "비활성"}
                  </Label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                {t.cancel}
              </Button>
              <Button onClick={handleSave}>{t.save}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Add/Edit Dialog - Admin Menu */}
      {menuType === "admin" && (
        <Dialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingAdminMenu ? t.editMenu : t.addMenu}
              </DialogTitle>
              <DialogDescription>
                {language === "ko"
                  ? "관리자 메뉴 정보를 입력하세요."
                  : "Enter admin menu information."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">메뉴명 (한글)</Label>
                <Input
                  id="title"
                  value={adminFormData.title}
                  onChange={(e) =>
                    setAdminFormData({
                      ...adminFormData,
                      title: e.target.value,
                    })
                  }
                  placeholder="예: 대시보드"
                />
              </div>

              {/* 수정 모드일 때는 아래 필드들 숨김 */}
              {!editingAdminMenu && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="page">페이지</Label>
                    <Input
                      id="page"
                      value={adminFormData.page}
                      onChange={(e) =>
                        setAdminFormData({
                          ...adminFormData,
                          page: e.target.value.toLowerCase(),
                        })
                      }
                      placeholder="예: dashboard"
                      className="font-mono"
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="adminDisplayOrder">
                  {t.displayOrder}
                </Label>
                <Input
                  id="adminDisplayOrder"
                  type="number"
                  value={adminFormData.displayOrder}
                  onChange={(e) =>
                    setAdminFormData({
                      ...adminFormData,
                      displayOrder:
                        Math.max(1, parseInt(e.target.value) || 1),
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">메뉴 상태</Label>
                <div className="border rounded-md p-3 bg-muted/30 flex items-center gap-2">
                  <Switch
                    id="adminVisible"
                    checked={adminFormData.visible}
                    onCheckedChange={(checked) =>
                      setAdminFormData({
                        ...adminFormData,
                        visible: checked,
                      })
                    }
                  />
                  <Label
                    htmlFor="adminVisible"
                    className="cursor-pointer"
                  >
                    {adminFormData.visible ? "활성" : "비활성"}
                  </Label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                {t.cancel}
              </Button>
              <Button onClick={handleSave}>{t.save}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t.deleteConfirm}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {menuType === "shop" && t.deleteWarning}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 투어 가이드 */}
      <CoachMark
        steps={shopTourSteps}
        isActive={isTourActive}
        onFinish={() => {
          setIsDialogOpen(false);
          setMenuType("shop");
          endTour();
        }}
        storageKey="menu_mgmt_tour"
        onStepChange={handleTourStepChange}
      />
    </div>
  );
}
export default MenuManagement;
