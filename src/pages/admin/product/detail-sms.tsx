import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Info, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { CoachMark, useCoachMark, type TourStep } from "@/components/coach-mark";
import type { Product } from "@/data/dto/product.dto";
import { updateProduct } from "@/data/products";
import {
  getProductSmsTemplates,
  updateProductSmsTemplates,
  getDefaultSmsTemplate,
  SMS_TEMPLATE_NAMES,
  SMS_TEMPLATE_CODES,
  type SmsTemplate,
} from "@/lib/api/sms-template";

interface ProductDetailSmsProps {
  product: Product;
  onUpdate: (product: Product) => void;
}

export function ProductDetailSms({
  product,
  onUpdate,
}: ProductDetailSmsProps) {
  const [templates, setTemplates] = useState<Record<string, { title: string; content: string }>>({
    ORDER_RECEIVED: { title: "", content: "" },
    PAYMENT_CONFIRMED: { title: "", content: "" },
    TICKET_ISSUED: { title: "", content: "" },
    ORDER_CANCELLED: { title: "", content: "" },
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // SMS 투어
  const smsTourSteps: TourStep[] = [
    { target: "pd-sms-info", title: "SMS 자동 발송 안내", description: "주문 상태가 변경될 때 자동으로 SMS가 발송됩니다.\n4가지 상태별 템플릿을 설정할 수 있습니다:\n주문접수 / 입금확인 / 발권완료 / 취소완료", placement: "bottom" },
    { target: "pd-sms-variables", title: "변수 삽입", description: "버튼을 클릭하면 메시지에 변수가 삽입됩니다.\n예: {주문자명} → 실제 주문자 이름으로 자동 치환\n{상품명}, {주문번호}, {주문금액} 등 사용 가능", placement: "bottom", waitForTarget: 500 },
    { target: "pd-sms-template", title: "메시지 작성", description: "템플릿 내용을 직접 작성합니다.\n'기본 템플릿' 버튼으로 샘플을 불러올 수 있습니다.\n바이트 수에 따라 SMS/LMS 요금이 달라집니다.", placement: "top", waitForTarget: 500 },
  ];

  const { isActive: isSmsTourActive, startTour: startSmsTour, endTour: endSmsTour } = useCoachMark("product_detail_sms", false);

  // 첫 방문 시 자동 시작
  useEffect(() => {
    const seen = localStorage.getItem("product_detail_sms");
    if (!seen) {
      const timer = setTimeout(() => startSmsTour(), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const handler = () => startSmsTour();
    window.addEventListener("startTabTour", handler);
    return () => window.removeEventListener("startTabTour", handler);
  }, [startSmsTour, templates]);

  // 컴포넌트 마운트 시 템플릿 로드
  useEffect(() => {
    loadTemplates();
  }, [product.id]);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const response = await getProductSmsTemplates(product.id);
      
      if (response.success && response.data && response.data.length > 0) {
        // API에서 받은 템플릿으로 상태 업데이트
        const loadedTemplates: Record<string, { title: string; content: string }> = {
          ORDER_RECEIVED: { title: "", content: "" },
          PAYMENT_CONFIRMED: { title: "", content: "" },
          TICKET_ISSUED: { title: "", content: "" },
          ORDER_CANCELLED: { title: "", content: "" },
        };
        
        response.data.forEach((template) => {
          loadedTemplates[template.templateCode] = {
            title: template.title,
            content: template.content,
          };
        });
        setTemplates(loadedTemplates);
        console.log('✅ SMS 템플릿 로드 성공:', loadedTemplates);
      } else {
        // 템플릿이 없으면 빈 상태 유지
        console.log('📭 SMS 템플릿이 없습니다. 빈 템플릿 상태를 유지합니다.');
      }
    } catch (error) {
      console.log('⚠️ SMS 템플릿 로드 실패 (서버 미지원 가능성):', error instanceof Error ? error.message : error);
      // 에러가 발생해도 사용자에게 알리지 않고 빈 템플릿으로 시작
      // 서버가 아직 SMS 템플릿 API를 지원하지 않을 수 있음
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // API 형식에 맞게 변환
      const templatesArray: SmsTemplate[] = Object.entries(templates)
        .filter(([_, value]) => value.content) // 내용이 있는 템플릿만
        .map(([code, value]) => {
          // title이 없으면 템플릿 코드 이름을 사용
          const templateMeta = templates_data.find(t => t.key === code);
          const defaultTitle = templateMeta?.title || SMS_TEMPLATE_NAMES[code as SmsTemplate['templateCode']] || code;
          
          return {
            templateCode: code as SmsTemplate['templateCode'],
            title: value.title || defaultTitle,
            content: value.content,
          };
        });

      console.log('📤 SMS 템플릿 저장 요청:', templatesArray);

      const response = await updateProductSmsTemplates(product.id, {
        templates: templatesArray,
      });

      if (response.success) {
        toast.success("SMS 템플릿이 저장되었습니다.");
        
        // 로컬 상태도 업데이트 (Product DTO와 호환)
        const updatedProduct: Product = {
          ...product,
          smsTemplates: {
            orderReceived: templates.ORDER_RECEIVED?.content || "",
            paymentConfirmed: templates.PAYMENT_CONFIRMED?.content || "",
            ticketIssued: templates.TICKET_ISSUED?.content || "",
            orderCancelled: templates.ORDER_CANCELLED?.content || "",
          },
        };
        updateProduct(updatedProduct);
        onUpdate(updatedProduct);
      } else {
        toast.error(response.message || 'SMS 템플릿 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('SMS 템플릿 저장 실패:', error);
      toast.error('SMS 템플릿 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const loadDefaultTemplate = async (code: SmsTemplate['templateCode']) => {
    try {
      const response = await getDefaultSmsTemplate(code);
      
      if (response.success && response.data) {
        setTemplates({
          ...templates,
          [code]: {
            title: response.data.title,
            content: response.data.content,
          },
        });
        toast.success("기본 템플릿이 적용되었습니다.");
      } else {
        toast.error('기본 템플릿을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('기본 템플릿 로드 실패:', error);
      toast.error('기본 템플릿을 불러오는데 실패했습니다.');
    }
  };

  const insertVariable = (templateCode: string, variable: string) => {
    setTemplates({
      ...templates,
      [templateCode]: {
        ...templates[templateCode],
        content: (templates[templateCode]?.content || "") + variable,
      },
    });
  };

  const getCharCount = (text: string) => {
    const byteLength = new Blob([text]).size;
    return {
      chars: text.length,
      bytes: byteLength,
      smsCount: Math.ceil(byteLength / 90), // 한글 기준 SMS 계산
    };
  };

  const commonVariables = [
    { label: "주문자명", value: "{주문자명}" },
    { label: "상품명", value: "{상품명}" },
    { label: "주문번호", value: "{주문번호}" },
    { label: "주문수량", value: "{주문수량}" },
    { label: "주문금액", value: "{주문금액}" },
    { label: "입금계좌", value: "{입금계좌}" },
    { label: "고객센터", value: "{고객센터}" },
  ];

  const ticketVariables = [
    ...commonVariables,
    { label: "옵션명", value: "{옵션명}" },
    { label: "티켓링크", value: "{티켓링크}" },
  ];

  // 템플릿별 사용 가능 변수 (주문접수/입금확인에는 티켓링크 없음)
  const getVariablesForTemplate = (templateKey: string) => {
    if (templateKey === "TICKET_ISSUED") return ticketVariables;
    return commonVariables;
  };

  const templates_data = [
    {
      key: "ORDER_RECEIVED" as const,
      title: "주문접수 (주문접수시)",
      description: "고객이 주문을 완료했을 때 전송되는 메시지",
      defaultTemplate: `[{상품명}] 주문이 접수되었습니다.

주문번호: {주문번호}
주문수량: {주문수량}
결제금액: {주문금액}원

입금계좌: {입금계좌}
입금확인 후 티켓이 발송됩니다.

문의: {고객센터}`,
    },
    {
      key: "PAYMENT_CONFIRMED" as const,
      title: "입금확인 (주문 입금확인)",
      description: "입금이 확인되었을 때 전송되는 메시지",
      defaultTemplate: `[{상품명}] 입금이 확인되었습니다.

주문번호: {주문번호}
{주문자명}님의 결제가 완료되었습니다.
티켓 발권 준비 중입니다.

문의: {고객센터}`,
    },
    {
      key: "TICKET_ISSUED" as const,
      title: "발권완료 (배송완료 상태로 변경시)",
      description: "티켓이 발권되어 전송되었을 때의 메시지",
      defaultTemplate: `[{상품명}] 티켓이 발권되었습니다.

주문번호: {주문번호}
{주문자명}님, 티켓이 발권되었습니다.

티켓 확인: {티켓링크}

현장에서 모바일 티켓을 제시해주세요.
문의: {고객센터}`,
    },
    {
      key: "ORDER_CANCELLED" as const,
      title: "취소완료 (취소완료시)",
      description: "주문이 취소되었을 때 전송되는 메시지",
      defaultTemplate: `[{상품명}] 주문이 취소되었습니다.

주문번호: {주문번호}
{주문자명}님의 주문 취소가 완료되었습니다.
환불은 2-3 영업일 소요됩니다.

문의: {고객센터}`,
    },
  ];

  return (
    <div className="space-y-6 py-2 pb-4">
      {/* 안내 메시지 */}
      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4" data-tour="pd-sms-info">
        <div className="flex gap-3">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1 text-sm">
            <p className="font-medium text-blue-900 dark:text-blue-100">
              SMS 자동 발송 템플릿
            </p>
            <p className="text-blue-700 dark:text-blue-300">
              주문 상태가 변경될 때마다 수령자 전화번호로 자동 발송됩니다. 변수를 사용하여 개인화된 메시지를 작성하세요.
            </p>
          </div>
        </div>
      </div>

      {/* 템플릿 목록 */}
      {templates_data.map((template, templateIndex) => {
        const stats = getCharCount(templates[template.key].content);

        return (
          <div
            key={template.key}
            className="border border-border rounded-lg p-4 sm:p-6 bg-background overflow-hidden"
            {...(templateIndex === 0 ? { "data-tour": "pd-sms-template" } : {})}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <h3 className="text-sm font-medium">{template.title}</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  {template.description}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="flex-shrink-0"
                onClick={() => {
                  loadDefaultTemplate(template.key);
                }}
              >
                기본 템플릿
              </Button>
            </div>

            {/* 변수 버튼 */}
            <div className="mb-3" {...(templateIndex === 0 ? { "data-tour": "pd-sms-variables" } : {})}>
              <Label className="text-xs mb-2 block">변수 삽입</Label>
              <div className="flex flex-wrap gap-2">
                {getVariablesForTemplate(template.key).map((variable) => (
                  <Button
                    key={variable.value}
                    size="sm"
                    variant="secondary"
                    onClick={() => insertVariable(template.key, variable.value)}
                    className="h-7 text-xs"
                  >
                    {variable.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* 템플릿 입력 */}
            <div className="space-y-2">
              <Label className="text-xs">메시지 내용</Label>
              <Textarea
                value={templates[template.key].content}
                onChange={(e) =>
                  setTemplates({ ...templates, [template.key]: { title: templates[template.key].title, content: e.target.value } })
                }
                placeholder={template.defaultTemplate}
                rows={8}
                className="font-mono text-sm"
              />
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <div className="flex gap-3">
                  <span>{stats.chars}자</span>
                  <span>{stats.bytes}byte</span>
                  <Badge variant="outline" className="text-xs">
                    {stats.smsCount} SMS
                  </Badge>
                </div>
                {stats.bytes > 90 && (
                  <span className="text-orange-600 shrink-0">장문 메시지 (추가 요금 발생)</span>
                )}
              </div>
            </div>

            {/* 미리보기 */}
            {templates[template.key].content && (
              <div className="mt-4 pt-4 border-t" {...(templateIndex === 0 ? { "data-tour": "pd-sms-preview" } : {})}>
                <Label className="text-xs mb-2 block">미리보기 (실제 발송 예시)</Label>
                <div className="bg-muted/50 rounded-lg p-4 text-sm whitespace-pre-wrap font-mono break-all overflow-hidden">
                  {templates[template.key].content
                    .replaceAll("{주문자명}", "홍길동")
                    .replaceAll("{상품명}", product.name)
                    .replaceAll("{주문번호}", "2025010812345")
                    .replaceAll("{주문수량}", "2")
                    .replaceAll("{주문금액}", "150,000")
                    .replaceAll("{입금계좌}", "KB국민 123-456-789 (주)티켓")
                    .replaceAll("{옵션명}", product.options?.[0]?.values?.[0]?.value || "성인")
                    .replaceAll("{티켓링크}", "https://ticket.com/t/abc123")
                    .replaceAll("{고객센터}", "1588-0000")}
                </div>
                {template.key === "TICKET_ISSUED" && (
                  <p className="text-xs text-muted-foreground mt-2">
                    * 위 주문 정보는 미리보기용 예시입니다. 실제 문자는 주문자 정보로 발송됩니다.
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* 저장 버튼 */}
      <div className="flex justify-end pt-4 border-t">
        <Button onClick={handleSave} size="lg" disabled={isSaving}>
          <MessageSquare className="h-4 w-4 mr-2" />
          SMS 템플릿 저장
        </Button>
      </div>

      <CoachMark steps={smsTourSteps} isActive={isSmsTourActive} onFinish={endSmsTour} storageKey="product_detail_sms" />
    </div>
  );
}