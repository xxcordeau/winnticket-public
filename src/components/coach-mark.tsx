import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight, HelpCircle } from "lucide-react";

export interface TourStep {
  /** data-tour 속성값으로 타겟 요소를 지정 */
  target: string;
  /** 스텝 제목 */
  title: string;
  /** 스텝 설명 */
  description: string;
  /** 툴팁 위치 */
  placement?: "top" | "bottom" | "left" | "right";
  /** 타겟을 못 찾을 때 재시도 대기시간(ms). 모달 등 비동기 렌더링 대응 */
  waitForTarget?: number;
}

interface CoachMarkProps {
  /** 투어 스텝 배열 */
  steps: TourStep[];
  /** 투어 활성화 여부 */
  isActive: boolean;
  /** 투어 종료 콜백 */
  onFinish: () => void;
  /** localStorage 키 (페이지별 고유값) */
  storageKey?: string;
  /** 스텝 변경 콜백 (모달 열기/닫기 등 외부 동작 제어용) */
  onStepChange?: (stepIndex: number, step: TourStep) => void;
}

export function CoachMark({ steps, isActive, onFinish, storageKey, onStepChange }: CoachMarkProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [arrowStyle, setArrowStyle] = useState<React.CSSProperties>({});
  const [arrowDirection, setArrowDirection] = useState<"top" | "bottom" | "left" | "right">("bottom");
  const tooltipRef = useRef<HTMLDivElement>(null);

  const step = steps[currentStep];

  // 타겟 요소 찾기 및 위치 계산
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountRef = useRef(0);

  const updatePosition = useCallback(() => {
    if (!step || !isActive) return;

    if (retryRef.current) {
      clearTimeout(retryRef.current);
      retryRef.current = null;
    }

    const el = document.querySelector(`[data-tour="${step.target}"]`) as HTMLElement;
    if (!el) {
      // waitForTarget이 설정되어 있으면 최대 15회 재시도 (모달 등 비동기 렌더링 대응)
      const maxRetries = step.waitForTarget ? Math.ceil(step.waitForTarget / 100) : 0;
      if (maxRetries > 0 && retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        retryRef.current = setTimeout(() => {
          // step.target으로 다시 검색 (클로저 탈출)
          const retryEl = document.querySelector(`[data-tour="${step.target}"]`) as HTMLElement;
          if (retryEl) {
            retryCountRef.current = 0;
            const isModal = retryEl.closest('[role="dialog"]');
            if (!isModal) retryEl.scrollIntoView({ behavior: "smooth", block: "center" });
            setTimeout(() => setTargetRect(retryEl.getBoundingClientRect()), isModal ? 100 : 300);
          } else if (retryCountRef.current < maxRetries) {
            updatePosition();
          } else {
            retryCountRef.current = 0;
            setTargetRect(null);
          }
        }, 100);
      } else {
        retryCountRef.current = 0;
        setTargetRect(null);
      }
      return;
    }

    retryCountRef.current = 0;

    // 타겟 요소로 스크롤 (모달 내부도 포함)
    el.scrollIntoView({ behavior: "smooth", block: "center" });

    // 약간의 딜레이 후 위치 계산 (스크롤 완료 대기)
    setTimeout(() => {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
    }, 300);
  }, [step, isActive]);

  // 툴팁 위치 계산
  useEffect(() => {
    if (!targetRect || !tooltipRef.current || !step) return;

    const tooltip = tooltipRef.current;
    const tooltipRect = tooltip.getBoundingClientRect();
    const padding = 16;
    const arrowSize = 8;
    const placement = step.placement || "bottom";

    let top = 0;
    let left = 0;
    let actualPlacement = placement;

    // 위치 계산
    switch (placement) {
      case "bottom":
        top = targetRect.bottom + arrowSize + padding;
        left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;
        // 화면 아래 넘침 체크
        if (top + tooltipRect.height > window.innerHeight - padding) {
          top = targetRect.top - tooltipRect.height - arrowSize - padding;
          actualPlacement = "top";
        }
        break;
      case "top":
        top = targetRect.top - tooltipRect.height - arrowSize - padding;
        left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;
        if (top < padding) {
          top = targetRect.bottom + arrowSize + padding;
          actualPlacement = "bottom";
        }
        break;
      case "right":
        top = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2;
        left = targetRect.right + arrowSize + padding;
        if (left + tooltipRect.width > window.innerWidth - padding) {
          left = targetRect.left - tooltipRect.width - arrowSize - padding;
          actualPlacement = "left";
        }
        break;
      case "left":
        top = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2;
        left = targetRect.left - tooltipRect.width - arrowSize - padding;
        if (left < padding) {
          left = targetRect.right + arrowSize + padding;
          actualPlacement = "right";
        }
        break;
    }

    // 화면 경계 보정
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipRect.width - padding));
    top = Math.max(padding, Math.min(top, window.innerHeight - tooltipRect.height - padding));

    setTooltipStyle({ top, left });
    setArrowDirection(actualPlacement);

    // 화살표 위치
    const arrowPos: React.CSSProperties = { position: "absolute" };
    switch (actualPlacement) {
      case "bottom":
        arrowPos.top = -arrowSize;
        arrowPos.left = Math.min(
          Math.max(targetRect.left + targetRect.width / 2 - left - arrowSize, 16),
          tooltipRect.width - 32
        );
        break;
      case "top":
        arrowPos.bottom = -arrowSize;
        arrowPos.left = Math.min(
          Math.max(targetRect.left + targetRect.width / 2 - left - arrowSize, 16),
          tooltipRect.width - 32
        );
        break;
      case "right":
        arrowPos.left = -arrowSize;
        arrowPos.top = Math.min(
          Math.max(targetRect.top + targetRect.height / 2 - top - arrowSize, 16),
          tooltipRect.height - 32
        );
        break;
      case "left":
        arrowPos.right = -arrowSize;
        arrowPos.top = Math.min(
          Math.max(targetRect.top + targetRect.height / 2 - top - arrowSize, 16),
          tooltipRect.height - 32
        );
        break;
    }
    setArrowStyle(arrowPos);
  }, [targetRect, step]);

  // 스텝 변경 시 위치 업데이트 + 콜백
  useEffect(() => {
    retryCountRef.current = 0;
    if (retryRef.current) {
      clearTimeout(retryRef.current);
      retryRef.current = null;
    }

    const currentStepData = steps[currentStep];
    if (!isActive || !currentStepData) return;

    // 콜백 실행 (모달 열기 등)
    if (onStepChange) {
      onStepChange(currentStep, currentStepData);
    }

    // 타겟 요소를 polling으로 찾기 (모달 렌더링 대기)
    let found = false;
    const maxWait = currentStepData.waitForTarget || 2000;
    const startTime = Date.now();

    const scrollAndHighlight = (el: HTMLElement) => {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => setTargetRect(el.getBoundingClientRect()), 300);
    };

    const poll = setInterval(() => {
      const el = document.querySelector(`[data-tour="${currentStepData.target}"]`) as HTMLElement;
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          found = true;
          clearInterval(poll);
          scrollAndHighlight(el);
        }
      }
      if (!found && Date.now() - startTime > maxWait) {
        clearInterval(poll);
        updatePosition();
      }
    }, 100);

    // 즉시 한번 시도
    const el = document.querySelector(`[data-tour="${currentStepData.target}"]`) as HTMLElement;
    if (el) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        found = true;
        clearInterval(poll);
        scrollAndHighlight(el);
      }
    }

    return () => clearInterval(poll);
  }, [currentStep, isActive]);

  // 리사이즈 대응
  useEffect(() => {
    if (!isActive) return;
    const handler = () => updatePosition();
    window.addEventListener("resize", handler);
    window.addEventListener("scroll", handler, true);
    return () => {
      window.removeEventListener("resize", handler);
      window.removeEventListener("scroll", handler, true);
    };
  }, [isActive, updatePosition]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = () => {
    if (retryRef.current) {
      clearTimeout(retryRef.current);
      retryRef.current = null;
    }
    retryCountRef.current = 0;
    setCurrentStep(0);
    setTargetRect(null);
    if (storageKey) {
      localStorage.setItem(storageKey, "true");
    }
    onFinish();
  };

  if (!isActive || !step) return null;

  // 화살표 SVG
  const arrowSvg = () => {
    const size = 8;
    switch (arrowDirection) {
      case "bottom":
        return (
          <svg width={size * 2} height={size} style={arrowStyle}>
            <polygon points={`0,${size} ${size},0 ${size * 2},${size}`} fill="white" />
          </svg>
        );
      case "top":
        return (
          <svg width={size * 2} height={size} style={arrowStyle}>
            <polygon points={`0,0 ${size},${size} ${size * 2},0`} fill="white" />
          </svg>
        );
      case "right":
        return (
          <svg width={size} height={size * 2} style={arrowStyle}>
            <polygon points={`0,0 ${size},${size} 0,${size * 2}`} fill="white" />
          </svg>
        );
      case "left":
        return (
          <svg width={size} height={size * 2} style={arrowStyle}>
            <polygon points={`${size},0 0,${size} ${size},${size * 2}`} fill="white" />
          </svg>
        );
    }
  };

  return createPortal(
    <>
      {/* 오버레이 - 타겟 영역만 뚫린 반투명 배경 */}
      <div
        className="fixed inset-0 z-[9998]"
        style={{
          background: targetRect
            ? undefined
            : "rgba(0,0,0,0.5)",
        }}
      >
        {targetRect && (
          <svg
            className="absolute inset-0 w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <mask id="coach-mask">
                <rect width="100%" height="100%" fill="white" />
                <rect
                  x={targetRect.left - 6}
                  y={targetRect.top - 6}
                  width={targetRect.width + 12}
                  height={targetRect.height + 12}
                  rx="8"
                  fill="black"
                />
              </mask>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill="rgba(0,0,0,0.5)"
              mask="url(#coach-mask)"
            />
            {/* 타겟 하이라이트 테두리 */}
            <rect
              x={targetRect.left - 6}
              y={targetRect.top - 6}
              width={targetRect.width + 12}
              height={targetRect.height + 12}
              rx="8"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
              className="animate-pulse"
            />
          </svg>
        )}
      </div>

      {/* 툴팁 */}
      <div
        ref={tooltipRef}
        className="fixed z-[9999] bg-white rounded-xl shadow-2xl border border-gray-100 w-[380px] max-w-[calc(100vw-32px)]"
        style={tooltipStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 화살표 */}
        {targetRect && arrowSvg()}

        <div className="p-5">
          {/* 헤더 */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center text-[13px] font-bold">
                {currentStep + 1}
              </div>
              <h3 className="font-bold text-[15px] text-gray-900">{step.title}</h3>
            </div>
            <button
              onClick={handleFinish}
              className="text-gray-400 hover:text-gray-600 transition-colors p-0.5"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* 설명 */}
          <p className="text-[13px] text-gray-600 leading-relaxed mb-4 whitespace-pre-line">
            {step.description}
          </p>

          {/* 하단 네비게이션 */}
          <div className="flex items-center justify-between gap-4">
            {/* 스텝 인디케이터 */}
            <div className="flex items-center gap-1.5">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === currentStep
                      ? "bg-blue-500"
                      : i < currentStep
                      ? "bg-blue-300"
                      : "bg-gray-200"
                  }`}
                />
              ))}
            </div>

            {/* 버튼 */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {currentStep > 0 && (
                <button
                  onClick={handlePrev}
                  className="flex items-center gap-1 px-3 py-1.5 text-[13px] text-gray-500 hover:text-gray-700 transition-colors rounded-md hover:bg-gray-50"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  이전
                </button>
              )}
              <button
                onClick={handleNext}
                className="flex items-center gap-1 px-4 py-1.5 text-[13px] text-white bg-blue-500 hover:bg-blue-600 transition-colors rounded-md font-medium"
              >
                {currentStep === steps.length - 1 ? (
                  "완료"
                ) : (
                  <>
                    다음
                    <ChevronRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 스텝 카운터 */}
          <p className="text-[11px] text-gray-400 mt-3 text-center">
            {currentStep + 1} / {steps.length}
          </p>
        </div>
      </div>
    </>,
    document.body
  );
}

/**
 * 코치마크 훅 - 페이지별로 투어 상태 관리
 * @param storageKey localStorage 키
 * @param autoStart 첫 방문 시 자동 시작 여부 (기본 true)
 */
export function useCoachMark(storageKey: string, autoStart: boolean = true) {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (autoStart) {
      const completed = localStorage.getItem(storageKey);
      if (!completed) {
        // 페이지 로드 후 약간의 딜레이
        const timer = setTimeout(() => setIsActive(true), 800);
        return () => clearTimeout(timer);
      }
    }
  }, [storageKey, autoStart]);

  const startTour = () => setIsActive(true);
  const endTour = () => setIsActive(false);
  const resetTour = () => {
    localStorage.removeItem(storageKey);
    setIsActive(true);
  };

  return { isActive, startTour, endTour, resetTour };
}

/**
 * 통일된 ? 도움말 버튼 컴포넌트
 * 호버 시 "페이지 사용법을 안내합니다" 툴팁 표시
 */
export function TourHelpButton({ onClick }: { onClick: () => void }) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={onClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="flex items-center justify-center h-8 w-8 rounded-full border border-border bg-background hover:bg-accent transition-colors"
        title="페이지 가이드"
      >
        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
      {showTooltip && (
        <div className="absolute right-0 top-full mt-2 z-50 whitespace-nowrap rounded-md bg-gray-900 px-3 py-1.5 text-xs text-white shadow-lg">
          페이지 사용법을 안내합니다
          <div className="absolute -top-1 right-3 h-2 w-2 rotate-45 bg-gray-900" />
        </div>
      )}
    </div>
  );
}
