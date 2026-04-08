import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { CoachMark, useCoachMark, type TourStep } from "@/components/coach-mark";
import { OptionValueEdit } from "./option-value-edit";
import { OptionFormDialog } from "./option-form-dialog";
import type {
  Product,
  ProductOption,
  ProductOptionValue,
} from "@/data/dto/product.dto";
import {
  createProductOption,
  updateProductOption,
  deleteProductOption,
  getProductOption,
  updateProductOptionValue,
  type ProductOptionRequest,
  type ProductOptionValueUpdateRequest,
} from "@/lib/api/product";

interface ProductDetailOptionsProps {
  product: Product;
  options: ProductOption[];
  onOptionsUpdate: (options: ProductOption[]) => void;
  onRefresh?: () => Promise<void>; // ⭐ 상품 정보를 다시 불러오는 콜백
}

export function ProductDetailOptions({
  product,
  options,
  onOptionsUpdate,
  onRefresh, // ⭐ 추가
}: ProductDetailOptionsProps) {
  // 투어 가이드
  const optTourSteps: TourStep[] = [
    { target: "pd-options-add", title: "옵션 추가", description: "버튼을 눌러 새 옵션을 추가합니다.\n예: 성인/아동, 주중/주말, A석/S석 등", placement: "bottom" },
    { target: "opt-dialog-name", title: "옵션명 & 코드", description: "옵션 이름과 코드 타입을 설정합니다.\n• MOBILE: 모바일 자동 발권\n• MOBILE_MANUAL: 수동 발권\n• OPTION: 일반 옵션", placement: "bottom", waitForTarget: 1500 },
    { target: "opt-dialog-values", title: "옵션값 추가", description: "옵션값을 입력합니다.\n• 값: 성인, 아동 등 표시 이름\n• 금액: 추가/대체 가격\n• 원가: 파트너 원가\n• 재고: 수량 (빈칸이면 무제한)", placement: "top", waitForTarget: 500 },
    { target: "pd-options-list", title: "등록된 옵션", description: "등록된 옵션 목록입니다.\n각 옵션을 펼쳐서 옵션값을 확인하고\n수정/삭제할 수 있습니다.", placement: "top" },
  ];

  const { isActive: isOptTourActive, startTour: startOptTour, endTour: endOptTour } = useCoachMark("product_detail_options");

  // 부모 PageHeader의 ? 버튼에서 이벤트 수신
  useEffect(() => {
    const handler = () => startOptTour();
    window.addEventListener("startTabTour", handler);
    return () => window.removeEventListener("startTabTour", handler);
  }, [startOptTour]);

  const handleOptTourStep = (stepIndex: number, _step: TourStep) => {
    if (stepIndex === 1 || stepIndex === 2) {
      if (!isAddOptionDialogOpen) {
        resetOptionForm();
        setIsAddOptionDialogOpen(true);
      }
    } else {
      if (isAddOptionDialogOpen) setIsAddOptionDialogOpen(false);
    }
  };

  const [isAddOptionDialogOpen, setIsAddOptionDialogOpen] =
    useState(false);
  const [isEditOptionDialogOpen, setIsEditOptionDialogOpen] =
    useState(false);
  const [
    isDeleteOptionDialogOpen,
    setIsDeleteOptionDialogOpen,
  ] = useState(false);
  const [selectedOption, setSelectedOption] =
    useState<ProductOption | null>(null);

  // 옵션 폼 데이터
  const [optionFormData, setOptionFormData] = useState({
    name: "",
    code: "MOBILE", // 기본값: 모바일자동
    required: true,
    displayOrder: 1,
    visible: true,
    priceType: "OVERRIDE" as "ADDITIONAL" | "OVERRIDE", // 가격 방식 - 항상 추가금액만
    values: [] as Omit<ProductOptionValue, "id" | "optionId">[],
  });

  // 옵션 값 추가 (코드는 백엔드에서 자동 생성)
  const [newValue, setNewValue] = useState({
    value: "",
    code: "",
    additionalPrice: 0,
    basePrice: 0,
    stock: undefined as number | undefined,
    partnerSubCode: "",
  });

  // 옵션 값 편집
  const [editingValueIndex, setEditingValueIndex] = useState<
    number | null
  >(null);
  const [editingValue, setEditingValue] = useState<{
    value: string;
    code: string;
    additionalPrice: number;
    basePrice: number;
    stock: number | undefined;
    partnerSubCode: string;
  } | null>(null);

  const handleAddOptionValue = () => {
    if (!newValue.value.trim()) {
      toast.error("옵션 값을 입력해주세요.");
      return;
    }

    // ⭐ 옵션값 코드 중복 검사
    if (newValue.code.trim()) {
      const isDuplicateCode = optionFormData.values.some(
        (val) => val.code.toLowerCase() === newValue.code.toLowerCase()
      );
      
      if (isDuplicateCode) {
        toast.error(`옵션값 코드 "${newValue.code}"는 이미 사용 중입니다. 다른 코드를 입력해주세요.`);
        return;
      }
    }

    console.log("[옵션값 추가] newValue:", newValue);

    const newValueToAdd = {
      ...newValue,
      displayOrder: optionFormData.values.length + 1,
      visible: true,
    };

    console.log("[옵션값 추가] 추가될 값:", newValueToAdd);

    setOptionFormData({
      ...optionFormData,
      values: [...optionFormData.values, newValueToAdd as any],
    });

    setNewValue({
      value: "",
      code: "",
      additionalPrice: 0,
      basePrice: 0,
      stock: undefined,
      partnerSubCode: "",
    });
  };

  const handleRemoveOptionValue = (index: number) => {
    setOptionFormData({
      ...optionFormData,
      values: optionFormData.values.filter(
        (_, i) => i !== index,
      ),
    });
    // 편집 중인 옵션값이 삭제되면 편집 모드 취소
    if (editingValueIndex === index) {
      setEditingValueIndex(null);
      setEditingValue(null);
    }
  };

  // 옵션값 편집 시작
  const handleStartEditValue = (index: number) => {
    const val = optionFormData.values[index];
    setEditingValueIndex(index);
    setEditingValue({
      value: val.value,
      code: val.code || "",
      additionalPrice: val.additionalPrice,
      basePrice: (val as any).basePrice || 0,
      stock: val.stock,
      partnerSubCode: (val as any).partnerSubCode || "",
    });
  };

  // 옵션값 편집 저장
  const handleSaveEditValue = async () => {
    if (editingValueIndex === null || !editingValue) return;

    if (!editingValue.value.trim()) {
      toast.error("옵션 값을 입력해주세요.");
      return;
    }

    // ⭐ 옵션값 코드 중복 검사 (자기 자신 제외)
    if (editingValue.code.trim()) {
      const isDuplicateCode = optionFormData.values.some(
        (val, idx) => 
          idx !== editingValueIndex && 
          val.code.toLowerCase() === editingValue.code.toLowerCase()
      );
      
      if (isDuplicateCode) {
        toast.error(`옵션값 코드 "${editingValue.code}"는 이미 사용 중입니다. 다른 코드를 입력해주세요.`);
        return;
      }
    }

    const updatedValues = [...optionFormData.values];
    const currentValue = updatedValues[editingValueIndex] as any;

    // 옵션값 ID가 있으면 API 호출 (기존 옵션값 수정)
    if (currentValue.id) {
      try {
        const updateRequest: ProductOptionValueUpdateRequest = {
          value: editingValue.value,
          code: editingValue.code || "",
          stock: editingValue.stock || 0,
          additionalPrice: editingValue.additionalPrice || 0,
          basePrice: editingValue.basePrice || 0,
          partnerSubCode: editingValue.partnerSubCode || "",
        };

        const response = await updateProductOptionValue(
          currentValue.id,
          updateRequest
        );

        if (response.success) {
          toast.success("옵션값이 수정되었습니다.");

          // 로컬 상태 업데이트
          updatedValues[editingValueIndex] = {
            ...currentValue,
            ...editingValue,
          };

          setOptionFormData({
            ...optionFormData,
            values: updatedValues,
          });

          setEditingValueIndex(null);
          setEditingValue(null);

          // ⭐ 서버에서 최신 데이터 반영
          if (onRefresh) {
            await onRefresh();
          }
        } else {
          toast.error(response.message || "옵션값 수정에 실패했습니다.");
        }
      } catch (error) {
        console.error("옵션값 수정 오류:", error);
        toast.error("옵션값 수정 중 오류가 발생했습니다.");
      }
    } else {
      // 새로 추가된 옵션값은 로컬 상태만 업데이트
      updatedValues[editingValueIndex] = {
        ...currentValue,
        ...editingValue,
      };

      setOptionFormData({
        ...optionFormData,
        values: updatedValues,
      });

      setEditingValueIndex(null);
      setEditingValue(null);
      toast.success("옵션값이 수정되었습니다.");
    }
  };

  // 옵션값 편집 취소
  const handleCancelEditValue = () => {
    setEditingValueIndex(null);
    setEditingValue(null);
  };

  // ⭐ 옵션값 순서 위로 이동
  const handleMoveValueUp = (index: number) => {
    if (index === 0) return;
    
    const updatedValues = [...optionFormData.values];
    const temp = updatedValues[index];
    updatedValues[index] = updatedValues[index - 1];
    updatedValues[index - 1] = temp;
    
    // displayOrder 업데이트
    updatedValues.forEach((val, idx) => {
      (val as any).displayOrder = idx + 1;
    });
    
    setOptionFormData({
      ...optionFormData,
      values: updatedValues,
    });
  };

  // ⭐ 옵션값 순서 아래로 이동
  const handleMoveValueDown = (index: number) => {
    if (index === optionFormData.values.length - 1) return;
    
    const updatedValues = [...optionFormData.values];
    const temp = updatedValues[index];
    updatedValues[index] = updatedValues[index + 1];
    updatedValues[index + 1] = temp;
    
    // displayOrder 업데이트
    updatedValues.forEach((val, idx) => {
      (val as any).displayOrder = idx + 1;
    });
    
    setOptionFormData({
      ...optionFormData,
      values: updatedValues,
    });
  };

  const resetOptionForm = () => {
    setOptionFormData({
      name: "",
      code: "MOBILE", // 기본값: 모바일자동
      required: true,
      displayOrder: options.length + 1,
      visible: true,
      priceType: "OVERRIDE" as "ADDITIONAL" | "OVERRIDE", // 가격 방식 - 항상 추가금액만
      values: [],
    });
    setNewValue({
      value: "",
      code: "",
      additionalPrice: 0,
      basePrice: 0,
      stock: undefined,
    });
    // ✅ 편집 중인 옵션값 상태 초기화
    setEditingValueIndex(null);
    setEditingValue(null);
  };

  const handleCreateOption = async () => {
    console.log("[옵션 추가] 시작:", optionFormData);

    if (!optionFormData.name.trim()) {
      toast.error("옵션명을 입력해주세요.");
      return;
    }
    if (optionFormData.values.length === 0) {
      toast.error("최소 1개 이상의 옵션 값을 추가해주세요.");
      return;
    }

    try {
      // 백엔드 API 형식으로 요청 데이터 변환
      const optionRequest: ProductOptionRequest = {
        name: optionFormData.name,
        code: optionFormData.code || "MOBILE", // ⭐ 사용자가 선택한 옵션 코드 사용 (기본값: MOBILE)
        required: optionFormData.required,
        priceType: "OVERRIDE", // 옵션의 가격 타입 - 항상 추가금액만
        valuesInsert: optionFormData.values.map((val, idx) => ({
          value: val.value,
          code: val.code,
          additionalPrice: val.additionalPrice,
          basePrice: (val as any).basePrice || 0,
          stock: val.stock,
          partnerSubCode: (val as any).partnerSubCode || "",
          displayOrder: idx + 1,
        })),
      };

      console.log("[옵션 추가] API 요청:", optionRequest);

      const response = await createProductOption(
        product.id,
        optionRequest,
      );

      console.log("[옵션 추가] API 응답:", response);

      if (response.success && response.data) {
        toast.success("옵션이 추가되었습니다.");
        setIsAddOptionDialogOpen(false);
        resetOptionForm();
        
        // ⭐ 서버에서 옵션값의 UUID를 받아오기 위해 상품 정보를 다시 불러옴
        if (onRefresh) {
          await onRefresh();
        } else {
          // onRefresh가 없으면 기존 방식대로 처리
          const newOption: ProductOption = {
            id: response.data.id,
            name: response.data.name,
            code: response.data.code,
            required: response.data.required,
            displayOrder: options.length + 1,
            visible: true,
            values:
              response.data.values ||
              optionFormData.values.map((val, idx) => ({
                id: `opt-val-${idx}`,
                optionId: response.data.id || "",
                value: val.value,
                code: val.code,
                additionalPrice: val.additionalPrice,
                displayOrder: idx + 1,
                visible: true,
              })),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          console.log("[옵션 추가] 생성된 옵션:", newOption);
          onOptionsUpdate([...options, newOption]);
        }
      } else {
        toast.error(
          response.message || "옵션 추가에 실패했습니다.",
        );
      }
    } catch (error) {
      console.error("옵션 추가 오류:", error);
      toast.error("션 추가 중 오류가 발생했습니다.");
    }
  };

  const handleEditOption = async () => {
    if (!selectedOption) return;

    if (!optionFormData.name.trim()) {
      toast.error("옵션명을 입력해주세요.");
      return;
    }
    if (optionFormData.values.length === 0) {
      toast.error("최소 1개 이상의 션 값을 추가해주세요.");
      return;
    }

    try {
      // ⭐ 백엔드 API 형식으로 데이터 변환
      const optionRequest: ProductOptionRequest = {
        name: optionFormData.name,
        code: optionFormData.code, // ⭐ 사용자가 입력한 옵션 코드 전송
        required: optionFormData.required,
        priceType: "OVERRIDE", // 옵션의 가격 타입 - 항상 추가금액만
        valuesInsert: [
          // ⭐ 새로 추가된 값만 (id가 없는 값만)
          ...optionFormData.values
            .filter((val) => !(val as any).id)
            .map((val, _, arr) => ({
              value: val.value,
              code: val.code, // ⭐ 사용자가 입력한 code 값 그대로 전송
              additionalPrice: val.additionalPrice,
              basePrice: (val as any).basePrice || 0, // 원가
              stock: val.stock || 0,
              displayOrder: (val as any).displayOrder || optionFormData.values.indexOf(val) + 1,
            })),
        ],
        deleteValueIds: [
          // ⭐ 완전히 삭제된 값들만 (삭제 버튼으로 제거된 값)
          ...selectedOption.values
            .filter(
              (oldVal) =>
                !optionFormData.values.some(
                  (newVal) => (newVal as any).id === oldVal.id,
                ),
            )
            .map((val) => val.id),
        ],
      };

      console.log("[옵션 수정] API 요청:", optionRequest);
      console.log("[옵션 수정] 새로 추가된 값 개수:", optionRequest.valuesInsert.length);
      console.log("[옵션 수정] 삭제된 값 개수:", optionRequest.deleteValueIds.length);

      const response = await updateProductOption(
        selectedOption.id,
        optionRequest,
      );

      if (response.success) {
        // 기존 값들의 displayOrder를 현재 배열 순서로 업데이트
        const existingValues = optionFormData.values
          .map((val, idx) => ({ val, position: idx + 1 }))
          .filter(({ val }) => !!(val as any).id);

        if (existingValues.length > 0) {
          await Promise.all(
            existingValues.map(({ val, position }) =>
              updateProductOptionValue((val as any).id, {
                value: val.value,
                code: val.code,
                stock: val.stock || 0,
                additionalPrice: val.additionalPrice || 0,
                basePrice: (val as any).basePrice || 0,
                partnerSubCode: (val as any).partnerSubCode || "",
                displayOrder: position,
              })
            )
          );
        }

        toast.success("옵션이 수정되었습니다.");
        setIsEditOptionDialogOpen(false);
        setSelectedOption(null);
        resetOptionForm();

        // ⭐ 서버에서 옵션값의 UUID를 받아오기 위해 상품 정보를 다시 불러옴
        if (onRefresh) {
          await onRefresh();
        } else {
          // onRefresh가 없으면 기존 방식대로 처리
          const updatedOption: ProductOption = {
            ...selectedOption,
            ...optionFormData,
            values: optionFormData.values.map((val, idx) => ({
              id:
                (val as any).id ||
                `${selectedOption.id}-val-${idx}`,
              optionId: selectedOption.id,
              ...val,
            })),
            updatedAt: new Date().toISOString(),
          };

          const updatedOptions = options.map((opt) =>
            opt.id === selectedOption.id ? updatedOption : opt,
          );
          onOptionsUpdate(updatedOptions);
        }
      } else {
        toast.error(
          response.message || "옵션 수정에 실패했습니다.",
        );
      }
    } catch (error) {
      console.error("옵션 수정 오류:", error);
      toast.error("옵션 수정 중 오류가 발생했습니다.");
    }
  };

  const handleDeleteOption = async () => {
    if (!selectedOption) return;

    console.log("[옵션 삭제] 선택된 옵션:", selectedOption);
    console.log("[옵션 삭제] 삭제할 ID:", selectedOption.id);

    try {
      // ⭐ 1단계: 먼저 옵션 조회 API로 UUID 받아오기
      console.log("[옵션 삭제] 1단계: 옵션 조회 API 호출...");
      const optionResponse = await getProductOption(
        selectedOption.id,
      );

      if (!optionResponse.success || !optionResponse.data) {
        toast.error("옵션 정보를 찾을 수 없습니다.");
        return;
      }

      const optionUuid =
        optionResponse.data.id || selectedOption.id;
      console.log("[옵션 삭제] 조회된 UUID:", optionUuid);

      // ⭐ 2단계: UUID로 삭제 API 호출
      console.log("[옵션 삭제] 2단계: 삭제 API 호출...");
      const response = await deleteProductOption(optionUuid);

      console.log("[옵션 삭제] API 응답:", response);

      if (response.success) {
        const updatedOptions = options.filter(
          (opt) => opt.id !== selectedOption.id,
        );
        onOptionsUpdate(updatedOptions);

        setIsDeleteOptionDialogOpen(false);
        setSelectedOption(null);
        toast.success("옵션이 삭제되었습니다.");
      } else {
        toast.error(
          response.message || "옵션 삭제에 실패했습니다.",
        );
      }
    } catch (error) {
      console.error("옵션 삭제 오류:", error);
      toast.error("옵션 삭제 중 오류가 발생했습니다.");
    }
  };

  const openEditOptionDialog = async (
    option: ProductOption,
  ) => {
    setSelectedOption(option);

    try {
      // 백엔드에서 최신 옵션 데이터 조회
      const response = await getProductOption(option.id);

      if (response.success && response.data) {
        // API에서 받은 최신 데이터로 폼 설정
        setOptionFormData({
          name: response.data.name,
          code: response.data.code,
          required: response.data.required,
          displayOrder: option.displayOrder,
          visible: option.visible,
          priceType: (response.data.priceType ||
            "ADDITIONAL") as "ADDITIONAL" | "OVERRIDE", // API에서 받은 가격 방식
          values: (response.data.values || []).map(
            (val) =>
              ({
                id: val.id,
                value: val.value,
                code: val.code,
                additionalPrice: val.additionalPrice,
                basePrice: (val as any).basePrice || 0, // 원가
                displayOrder: val.displayOrder || 0,
                visible:
                  val.visible !== undefined
                    ? val.visible
                    : true,
                stock: val.stock, // OVERRIDE 타입 옵션값의 재고
              }) as any,
          ),
        });
      } else {
        // API 실패 시 기존 데이터 사용
        setOptionFormData({
          name: option.name,
          code: option.code,
          required: option.required,
          displayOrder: option.displayOrder,
          visible: option.visible,
          priceType: "OVERRIDE" as "ADDITIONAL" | "OVERRIDE", // 기존 데이터의 가격 방식 - 항상 추가금액만
          values: option.values.map(
            (val) =>
              ({
                id: val.id,
                value: val.value,
                code: val.code,
                additionalPrice: val.additionalPrice,
                basePrice: (val as any).basePrice || 0, // 원가
                displayOrder: val.displayOrder,
                visible: val.visible,
                stock: val.stock, // OVERRIDE 타입 옵션값의 재고
              }) as any,
          ),
        });
      }
    } catch (error) {
      console.error("옵션 조회 오류:", error);
      // 에러 시 기존 데이터 사용
      setOptionFormData({
        name: option.name,
        code: option.code,
        required: option.required,
        displayOrder: option.displayOrder,
        visible: option.visible,
        priceType: "OVERRIDE" as "ADDITIONAL" | "OVERRIDE", // 기존 데이터의 가격 방식 - 항상 추가금액만
        values: option.values.map(
          (val) =>
            ({
              id: val.id,
              value: val.value,
              code: val.code,
              additionalPrice: val.additionalPrice,
              displayOrder: val.displayOrder,
              visible: val.visible,
              stock: val.stock, // OVERRIDE 타입 옵션값의 재고
            }) as any,
        ),
      });
    }

    // ✅ 편집 중인 옵션값 상태 초기화
    setEditingValueIndex(null);
    setEditingValue(null);

    setIsEditOptionDialogOpen(true);
  };

  const openDeleteOptionDialog = (option: ProductOption) => {
    setSelectedOption(option);
    setIsDeleteOptionDialogOpen(true);
  };

  return (
    <>
      <div className="space-y-3 sm:space-y-4 py-2 pb-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-medium text-[18px]">
            상품 옵션 관리
          </h3>
          <Button
            onClick={() => {
              resetOptionForm();
              setIsAddOptionDialogOpen(true);
            }}
            size="sm"
            className="h-8 sm:h-9"
            data-tour="pd-options-add"
          >
            <Plus className="size-3.5 sm:size-4 mr-1.5 sm:mr-2" />
            <span className="text-xs sm:text-sm">
              옵션 추가
            </span>
          </Button>
        </div>

        {options.length === 0 ? (
          <div className="border border-border rounded-lg p-6 sm:p-8 text-center text-sm sm:text-base text-muted-foreground" data-tour="pd-options-list">
            등록된 옵션이 없습니다.
          </div>
        ) : (
          <div className="space-y-6" data-tour="pd-options-list">
            {options.map((option) => (
              <div
                key={option.id}
                className="border border-border rounded-lg overflow-hidden bg-card"
              >
                {/* 옵션 헤더 */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-semibold">
                      {option.name}
                    </h4>
                    <Badge
                      variant="outline"
                      className="text-[10px]"
                    >
                      {option.code}
                    </Badge>
                    {option.required && (
                      <Badge
                        variant="destructive"
                        className="text-[10px]"
                      >
                        필수
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        openEditOptionDialog(option)
                      }
                      className="h-7 w-7 p-0"
                    >
                      <Edit className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        openDeleteOptionDialog(option)
                      }
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>

                {/* 옵션 값 테이블 */}
                {option.values.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                    등록된 옵션 값이 없습니다.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/20">
                          <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">
                            옵션값
                          </th>
                          <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">
                            옵션 코드
                          </th>
                          <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">
                            금액 (원)
                          </th>
                          <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">
                            원가 (원)
                          </th>
                          <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">
                            재고
                          </th>
                          <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">
                            파트너코드
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {option.values.map((value, index) => (
                          <tr
                            key={value.id}
                            className={`border-b border-border last:border-b-0 hover:bg-muted/10 transition-colors ${
                              index % 2 === 0
                                ? "bg-background"
                                : "bg-muted/5"
                            }`}
                          >
                            <td className="px-3 py-3 font-medium">
                              {value.value}
                            </td>
                            <td className="px-3 py-3">
                              <code className="text-xs bg-muted px-2 py-0.5 rounded">
                                {value.code}
                              </code>
                            </td>
                            <td className="px-3 py-3 text-right font-medium">
                              {value.additionalPrice > 0 ? (
                                <span className="text-primary text-sm">
                                  ₩
                                  {value.additionalPrice.toLocaleString()}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">
                                  -
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-3 text-right font-medium">
                              {(value as any).basePrice > 0 ? (
                                <span className="text-gray-600 text-sm">
                                  ₩
                                  {((value as any).basePrice || 0).toLocaleString()}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">
                                  -
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-3 text-center">
                              {value.stock !== undefined ? (
                                <span
                                  className={
                                    value.stock > 0
                                      ? "text-foreground"
                                      : "text-destructive"
                                  }
                                >
                                  {value.stock}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">
                                  -
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-3 text-left">
                              <span className="text-xs text-muted-foreground">
                                {(value as any).partnerSubCode || "-"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 옵션 추가 다이얼로그 */}
      <OptionFormDialog
        mode="add"
        open={isAddOptionDialogOpen}
        onOpenChange={(open) => {
          if (isOptTourActive && !open) return;
          setIsAddOptionDialogOpen(open);
          if (!open) {
            setEditingValueIndex(null);
            setEditingValue(null);
            resetOptionForm();
          }
        }}
        isOptTourActive={isOptTourActive}
        optionFormData={optionFormData}
        setOptionFormData={setOptionFormData}
        newValue={newValue}
        setNewValue={setNewValue}
        editingValueIndex={editingValueIndex}
        editingValue={editingValue}
        setEditingValue={setEditingValue}
        onAddOptionValue={handleAddOptionValue}
        onRemoveOptionValue={handleRemoveOptionValue}
        onStartEditValue={handleStartEditValue}
        onSaveEditValue={handleSaveEditValue}
        onCancelEditValue={handleCancelEditValue}
        onMoveValueUp={handleMoveValueUp}
        onMoveValueDown={handleMoveValueDown}
        onSubmit={handleCreateOption}
        onCancel={() => {
          setIsAddOptionDialogOpen(false);
          resetOptionForm();
        }}
      />

      {/* 옵션 수정 다이얼로그 */}
      <OptionFormDialog
        mode="edit"
        open={isEditOptionDialogOpen}
        onOpenChange={(open) => {
          setIsEditOptionDialogOpen(open);
          if (!open) {
            setEditingValueIndex(null);
            setEditingValue(null);
            resetOptionForm();
          }
        }}
        optionFormData={optionFormData}
        setOptionFormData={setOptionFormData}
        newValue={newValue}
        setNewValue={setNewValue}
        editingValueIndex={editingValueIndex}
        editingValue={editingValue}
        setEditingValue={setEditingValue}
        selectedOption={selectedOption}
        onAddOptionValue={handleAddOptionValue}
        onRemoveOptionValue={handleRemoveOptionValue}
        onStartEditValue={handleStartEditValue}
        onSaveEditValue={handleSaveEditValue}
        onCancelEditValue={handleCancelEditValue}
        onMoveValueUp={handleMoveValueUp}
        onMoveValueDown={handleMoveValueDown}
        onSubmit={handleEditOption}
        onCancel={() => {
          setIsEditOptionDialogOpen(false);
          resetOptionForm();
        }}
      />

      {/* 옵션 삭제 확인 다이얼로그 */}
      <AlertDialog
        open={isDeleteOptionDialogOpen}
        onOpenChange={setIsDeleteOptionDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>옵션 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              "{selectedOption?.name}" 옵션을 삭제하시겠습니까?
              이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteOption}>
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 옵션 투어 가이드 */}
      <CoachMark
        steps={optTourSteps}
        isActive={isOptTourActive}
        onFinish={() => {
          setIsAddOptionDialogOpen(false);
          endOptTour();
        }}
        storageKey="product_detail_options"
        onStepChange={handleOptTourStep}
      />
    </>
  );
}