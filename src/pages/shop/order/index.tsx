import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router";
import { useNavigate } from "@/lib/channel-context";
import { ShopHeader } from "@/components/shop-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MessageSquare,
  ShoppingBag,
  CreditCard,
  CheckCircle2,
  XCircle,
  Gift,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import { getSiteInfo } from "@/data/site-info";
import {
  getVisibleTerms,
  type TermsResponse,
} from "@/lib/api/terms";
import {
  createShopOrder,
  type ShopOrderRequest,
} from "@/lib/api/order";
import { getPublicChannelByCode } from "@/lib/api/channel"; // ⭐ 공개 API 사용
import { getProductById } from "@/lib/api/product"; // ⭐ 옵션 매칭용
import {
  syncChannelFromUrl,
  getCurrentChannel,
  setCurrentChannel,
} from "@/data/hooks/useShopStore"; // ⭐ 채널 관리 유틸
import {
  getBenepiaPoint,
} from "@/lib/api/benepia"; // ⭐ 베네피아 포인트 조회 API

type Language = "ko" | "en";

interface OrderItem {
  productId: string;
  productName: string;
  productCode: string;
  categoryName: string;
  optionName?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  thumbnailUrl?: string;
  options?: Array<{
    // ⭐ 옵션 정보 추가 (API 요청용)
    optionName: string;
    optionValue: string;
    optionId?: string; // UUID
    optionValueId?: string; // UUID
  }>;
  stayDates?: string[]; // ⭐ 숙박형 상품의 날짜 배열 (YYYY-MM-DD 형식)
}

interface ShopOrderProps {
  language: Language;
}

export function ShopOrder({ language }: ShopOrderProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // ⭐ location.state와 sessionStorage 둘 다 확인
  const getOrderItems = (): OrderItem[] => {
    // 1. location.state에서 먼저 확인
    if (
      location.state?.items &&
      location.state.items.length > 0
    ) {
      console.log(
        "📦 [주문 페이지] location.state에서 주문 데이터 로드",
      );
      return location.state.items;
    }

    // 2. sessionStorage에서 확인 (폴)
    try {
      const savedItems = sessionStorage.getItem(
        "shop_order_items",
      );
      if (savedItems) {
        const items = JSON.parse(savedItems);
        console.log(
          "📦 [주문 페이지] sessionStorage에서 주문 데이터 로드:",
          items,
        );
        // 사용 후 삭제
        sessionStorage.removeItem("shop_order_items");
        return items;
      }
    } catch (error) {
      console.error("sessionStorage 파싱 실패:", error);
    }

    console.log(
      "⚠️ [주문 페이지] 주문 데이터를 찾을 수 없습니다",
    );
    return [];
  };

  const orderItems: OrderItem[] = getOrderItems();
  const cartItemIds: string[] =
    location.state?.cartItemIds || []; // 장바구니에서 온 아이템 ID들

  // ⭐ 옵션 ID 매칭이 완료된 orderItems
  const [enrichedOrderItems, setEnrichedOrderItems] =
    useState<OrderItem[]>(orderItems);
  const [isLoadingOptions, setIsLoadingOptions] =
    useState(false);

  // ⭐ 디버깅: 주문 페이지 로드 시 orderItems 확인 및 옵션 ID 매칭
  useEffect(() => {
    console.log(
      "🛒 [주문 페이지] 초기 orderItems:",
      orderItems,
    );
    orderItems.forEach((item, index) => {
      console.log(
        `  [${index}] productId: ${item.productId}, name: ${item.productName}, options:`,
        item.options,
      );
    });

    // URL에서 채널 코드 가져오기
    const searchParams = new URLSearchParams(
      window.location.search,
    );
    const channelCode =
      searchParams.get("channel") || "DEFAULT"; // ⭐ 없으면 DEFAULT 사용
    // ⭐ 베네피아 계정 정보는 나중에 세션에서 가져올 예정 (현재는 빈값)
    const benepiaId = "";
    const benepiaPwd = "";
    console.log("🔑 [주문 페이지] 채널 코드:", channelCode);

    // ⭐ 옵션 ID 매칭 작업
    const enrichOptions = async () => {
      setIsLoadingOptions(true);

      const enrichedItems = await Promise.all(
        orderItems.map(async (item) => {
          // ⭐ 모든 상품에 대해 상세 정보를 조회하여 UUID 가져오기
          try {
            console.log(
              `🔍 [상품 조회] ${item.productName}: productId = ${item.productId}, channelCode = ${channelCode}`,
            );
            const productDetail = await getProductById(
              item.productId,
              channelCode,
            ); // ⭐ 채널 코드 전달

            if (productDetail.success && productDetail.data) {
              console.log(
                `✅ [상품 UUID] ${item.productName}: ${item.productId} -> ${productDetail.data.id}`,
              );

              // ⭐ 실제 UUID로 변경
              let updatedItem = {
                ...item,
                productId: productDetail.data.id, // "PRD4" -> "fc6635e8-0bf6-4a4b-a565-a0e89c9c6ead"
              };

              // 이미 optionId와 optionValueId가 있으면 그대로 사용
              if (
                item.options &&
                item.options.every(
                  (opt) => opt.optionId && opt.optionValueId,
                )
              ) {
                console.log(
                  `✅ [옵션 매칭] ${item.productName}: 이미 ID가 있음`,
                );
                return updatedItem;
              }

              // optionId가 없으면 상품 상세 정보에서 매칭
              if (
                item.options &&
                item.options.length > 0 &&
                productDetail.data?.productOptions
              ) {
                console.log(
                  `🔍 [옵션 매칭] ${item.productName}: 옵션 ID 매칭 중...`,
                );
                console.log(
                  `📦 [옵션 매칭] ${item.productName}: 상품 옵션 정보`,
                  productDetail.data.productOptions,
                );

                // optionName과 optionValue를 매칭하여 ID 찾기
                const matchedOptions = item.options.map(
                  (cartOption) => {
                    // 상품의 옵션 그룹에서 이름이 일치하는 것 찾기
                    const matchingGroup =
                      productDetail.data!.productOptions!.find(
                        (opt) =>
                          opt.optionName ===
                          cartOption.optionName,
                      );

                    if (matchingGroup) {
                      // 옵션값에서 값이 일치하는 것 찾기
                      const matchingValue =
                        matchingGroup.productOptionValues?.find(
                          (val) =>
                            val.optionValue ===
                            cartOption.optionValue,
                        );

                      if (matchingValue) {
                        console.log(
                          `  ✅ 매칭 성공: ${cartOption.optionName}=${cartOption.optionValue} -> optionId=${matchingGroup.id}, optionValueId=${matchingValue.id}`,
                        );
                        return {
                          ...cartOption,
                          optionId: matchingGroup.id,
                          optionValueId: matchingValue.id,
                        };
                      } else {
                        console.warn(
                          `  ⚠️ 옵션값 매칭 실패: ${cartOption.optionName}=${cartOption.optionValue}`,
                        );
                      }
                    } else {
                      console.warn(
                        `  ⚠️ 옵션 그룹 매칭 실패: ${cartOption.optionName}`,
                      );
                    }

                    // 매칭 실패 시 원본 반환
                    return cartOption;
                  },
                );

                return {
                  ...updatedItem,
                  options: matchedOptions,
                };
              }

              return updatedItem;
            } else {
              console.warn(
                `⚠️ [상품 UUID] ${item.productName}: 상품 상세 정보 조회 실패`,
              );
            }
          } catch (error) {
            console.error(
              `❌ [상품 UUID] ${item.productName}: 예외 발생`,
              error,
            );
          }

          return item;
        }),
      );

      console.log(
        "🎯 [최종 enrichedItems with UUID]:",
        enrichedItems,
      );
      setEnrichedOrderItems(enrichedItems);
      setIsLoadingOptions(false);
    };

    enrichOptions();
  }, []);

  // URL에서 채널 코드 가져오기
  const searchParams = new URLSearchParams(
    window.location.search,
  );
  const channelCode = searchParams.get("channel") || "DEFAULT"; // ⭐ 없으면 DEFAULT 사용

  // 주문자 정보
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [emailId, setEmailId] = useState("");
  const [emailDomain, setEmailDomain] = useState(""); // 직접입력이 기본
  const [customDomain, setCustomDomain] = useState("");
  const [requestMessage, setRequestMessage] = useState("");

  // ⭐ 채널 정 (useCard 확인용)
  const [channelInfo, setChannelInfo] = useState<{
    id: string;
    code: string;
    name: string;
    useCard: boolean;
    usePoint: boolean; // ⭐ 상품권 사용 여부 추가
  } | null>(null);

  // ⭐ 남은 금액 결제 방법 (카드 또는 무통장입금)
  const [paymentMethod, setPaymentMethod] = useState<
    "CARD" | "VIRTUAL_ACCOUNT"
  >("VIRTUAL_ACCOUNT");

  // ⭐ 카드 결제 정보
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardHolder, setCardHolder] = useState("");

  // 포인트 사용 (별도 섹션 - 부분 결제 가능)
  const [usePointPayment, setUsePointPayment] = useState(false);
  const [pointUserId, setPointUserId] = useState("");
  const [pointUserPwd, setPointUserPwd] = useState("");
  const [pointBalance, setPointBalance] = useState(0);
  const [pointAmount, setPointAmount] = useState(0);
  const [pointApplied, setPointApplied] = useState(false);

  // 상품권 사용 (별도 섹션 - 부분 결제 가능)
  const [useVoucherPayment, setUseVoucherPayment] =
    useState(false);
  const [voucherDialogOpen, setVoucherDialogOpen] =
    useState(false);
  const [voucherSerial, setVoucherSerial] = useState("");
  const [voucherBalance, setVoucherBalance] = useState(0);
  const [voucherAmount, setVoucherAmount] = useState(0);
  const [voucherApplied, setVoucherApplied] = useState(false);

  // ⭐ 베네피아 계정 정보 저장
  const [benepiaInfo, setBenepiaInfo] = useState<{
    benepiaId: string;
    benepiaPwd: string;
    memcorpCd: string;
  }>({
    benepiaId: "",
    benepiaPwd: "",
    memcorpCd: "",
  });

  // ⭐ 상품권 일련번호 4칸 분리 관리
  const [serialParts, setSerialParts] = useState<
    [string, string, string, string]
  >(["", "", "", ""]);
  const serialInputRef0 = useRef<HTMLInputElement>(null);
  const serialInputRef1 = useRef<HTMLInputElement>(null);
  const serialInputRef2 = useRef<HTMLInputElement>(null);
  const serialInputRef3 = useRef<HTMLInputElement>(null);
  const serialInputRefs = [
    serialInputRef0,
    serialInputRef1,
    serialInputRef2,
    serialInputRef3,
  ];

  // 약관 동의
  const [agreeAll, setAgreeAll] = useState(false);
  const [terms, setTerms] = useState<TermsResponse[]>([]);
  const [termsAgreements, setTermsAgreements] = useState<
    Record<number, boolean>
  >({});
  const [termsDialog, setTermsDialog] = useState<{
    open: boolean;
    title: string;
    content: string;
  }>({
    open: false,
    title: "",
    content: "",
  });

  //   실패 다이얼로그
  const [orderFailDialog, setOrderFailDialog] = useState<{
    open: boolean;
    message: string;
  }>({
    open: false,
    message: "",
  });

  // 결제 처리 중
  const [isProcessing, setIsProcessing] = useState(false);

  // 사이트 정보 로드
  const [siteInfo, setSiteInfo] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      // 사이트 정보 로
      const siteResponse = getSiteInfo();
      if (siteResponse.success && siteResponse.data) {
        setSiteInfo(siteResponse.data);
      }

      // 약관 목록 로드
      const termsResponse = await getVisibleTerms();
      if (termsResponse.success && termsResponse.data) {
        setTerms(termsResponse.data);
        // 초기 약관 동의 상태 설정
        const initialAgreements: Record<number, boolean> = {};
        termsResponse.data.forEach((term) => {
          initialAgreements[term.id] = false;
        });
        setTermsAgreements(initialAgreements);
      }

      // ⭐ 채널 정보 로드 (useCard 확인용)
      const urlChannelCode =
        channelCode || syncChannelFromUrl();
      if (urlChannelCode) {
        const channelResponse =
          await getPublicChannelByCode(urlChannelCode);
        if (channelResponse.success && channelResponse.data) {
          setChannelInfo({
            id:
              channelResponse.data.id ||
              channelResponse.data.code,
            code: channelResponse.data.code,
            name: channelResponse.data.name,
            useCard: channelResponse.data.useCard || false,
            usePoint: channelResponse.data.usePoint || false, // ⭐ 상품권 사용 여부 추가
          });
          console.log(
            "📍 [채널 정보] 채널 useCard:",
            channelResponse.data.useCard,
          );
        }
      }
    };

    loadData();
  }, []);

  // 상품 데이터 없으면 쇼핑몰 홈으로 리다이렉트
  useEffect(() => {
    console.log(
      "🔍 [주문 페이지] orderItems 체크:",
      orderItems,
    );
    console.log(
      "🔍 [주 페이지] orderItems.length:",
      orderItems.length,
    );

    if (!orderItems.length) {
      console.log(
        "⚠️ [주문 페이지] orderItems가 비어있어서 홈으로 리다이렉트합니다",
      );
      toast.error("주문할 상품이 없습니다");
      navigate("/");
    }
  }, [orderItems.length, navigate]);

  // ⭐ 이메일 조합
  useEffect(() => {
    if (emailId && emailDomain) {
      setEmail(`${emailId}@${emailDomain}`);
    } else {
      setEmail("");
    }
  }, [emailId, emailDomain]);

  // ⭐ 전화번호 입력 핸들러 (숫자와 -만 허용)
  const handlePhoneChange = (value: string) => {
    const filtered = value.replace(/[^0-9-]/g, "");
    setPhone(filtered);
  };

  // ⭐ 이메일 아이디 입력 핸들러 (영어만 허용)
  const handleEmailIdChange = (value: string) => {
    // 한글 또는 기타 특수문자 입력  감지
    const hasKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(value);
    if (hasKorean) {
      toast.error(
        "한글 입력은 안됩니다. 영문으로 입력해주세요.",
      );
    }
    const filtered = value.replace(/[^a-zA-Z0-9._-]/g, "");
    setEmailId(filtered);
  };

  // ⭐ 직접입력 도메인 핸들러 (영어와 숫자, 점, 하이픈만 허용)
  const handleCustomDomainChange = (value: string) => {
    // 한글 또는 기타 특수문자 입력 시도 감지
    const hasKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(value);
    if (hasKorean) {
      toast.error(
        "한글 입력은 안됩니다. 영문으로 입력해주세요.",
      );
    }
    const filtered = value.replace(/[^a-zA-Z0-9.-]/g, "");
    setEmailDomain(filtered);
  };

  // ⭐ 상품권 일련번호 입력 핸들러 (4자리마다 자동 이동)
  const handleSerialInput = (index: number, value: string) => {
    // 숫자만 허용
    const filtered = value.replace(/[^0-9]/g, "");

    // 최대 4자리
    const truncated = filtered.slice(0, 4);

    // 상태 업데이트
    const newParts: [string, string, string, string] = [
      ...serialParts,
    ] as [string, string, string, string];
    newParts[index] = truncated;
    setSerialParts(newParts);

    // memcorpCd 업데이트
    setBenepiaInfo({
      ...benepiaInfo,
      memcorpCd: newParts.join("-"),
    });

    // 4자리 입력 완료 시 다음 칸으로 이동
    if (truncated.length === 4 && index < 3) {
      serialInputRefs[index + 1].current?.focus();
    }
  };

  // ⭐ 백스페이스로 이전 칸으로 이동
  const handleSerialKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (
      e.key === "Backspace" &&
      serialParts[index] === "" &&
      index > 0
    ) {
      serialInputRefs[index - 1].current?.focus();
    }
  };

  const text = {
    ko: {
      title: "주문/결제",
      subtitle: "주문 정보를 입력해주세요",
      backButton: "이전",
      ordererInfo: "주문자 정보",
      name: "이름",
      namePlaceholder: "이름 입력하세요",
      companyName: "기관명(회사명)",
      companyNamePlaceholder: "기관명 또는 회사명 입력",
      phone: "전화번호",
      phonePlaceholder: "010-0000-0000",
      email: "이메일",
      emailPlaceholder: "example@email.com",
      requestMessage: "요청사항",
      requestPlaceholder:
        "배송 시 요청사항을 입력하세요 (선택)",
      paymentMethodSection: "결제 방법 선택",
      paymentMethodCard: "카드 결제",
      paymentMethodCardDesc: "신용카드로 결제합니다",
      paymentMethodVirtual: "무통장 입금",
      paymentMethodVirtualDesc:
        "무통장 입금으로 결제합니다",
      paymentMethodVoucher: "상품권 사용",
      paymentMethodVoucherDesc:
        "베네피아 상품권으로 결제합니다",
      cardPayment: "카드 결제 정보",
      cardNumber: "카드 번호",
      cardNumberPlaceholder: "1234-5678-9012-3456",
      cardExpiry: "유효기간",
      cardExpiryPlaceholder: "MM/YY",
      cardCvc: "CVC",
      cardCvcPlaceholder: "123",
      cardHolder: "카드 소유자",
      cardHolderPlaceholder: "카드에 표시된 이름",
      orderItems: "주문 상품",
      option: "옵션",
      quantity: "수량",
      price: "가격",
      pointSection: "포인트 사용",
      pointDescription: "보유한 포인트로 할인받으세요",
      usePoint: "포인트 사용",
      noPoint: "사용 가능한 포인트가 없습니다",
      selectPoint: "포인트 선택",
      pointDiscount: "포인트 할인",
      termsSection: "이용약관 동의",
      agreeAll: "전체 동의",
      viewTerms: "보기",
      paymentSummary: "결제 정보",
      itemsTotal: "상품 금액",
      discount: "할인",
      totalAmount: "총 결제 금액",
      paymentButton: "결제하기",
      requiredFields: "필수 항목을 모두 입력해주세요",
      requiredTerms: "필수 약관에 동���해주세요",
      requiredCardInfo: "카드 정보를 모두 입력해주세요",
      orderSuccess: "주문이 완료되었습니다",
      orderError: "주문 처리 중 오류가 발생했습니다",
      won: "원",
      items: "건",
    },
    en: {
      title: "Order/Payment",
      subtitle: "Please enter your order information",
      backButton: "Back",
      ordererInfo: "Orderer Information",
      name: "Name",
      namePlaceholder: "Enter your name",
      companyName: "Company/Organization",
      companyNamePlaceholder: "Enter company or organization name",
      phone: "Phone",
      phonePlaceholder: "010-0000-0000",
      email: "Email",
      emailPlaceholder: "example@email.com",
      requestMessage: "Request",
      requestPlaceholder: "Enter delivery request (optional)",
      paymentMethodSection: "Select Payment Method",
      paymentMethodCard: "Card Payment",
      paymentMethodCardDesc: "Pay with credit or debit card",
      paymentMethodVirtual: "Bank Transfer",
      paymentMethodVirtualDesc:
        "Pay via virtual account transfer",
      paymentMethodVoucher: "Voucher Usage",
      paymentMethodVoucherDesc: "Pay with Benepia voucher",
      cardPayment: "Card Payment Information",
      cardNumber: "Card Number",
      cardNumberPlaceholder: "1234-5678-9012-3456",
      cardExpiry: "Expiry Date",
      cardExpiryPlaceholder: "MM/YY",
      cardCvc: "CVC",
      cardCvcPlaceholder: "123",
      cardHolder: "Card Holder",
      cardHolderPlaceholder: "Name on card",
      orderItems: "Order Items",
      option: "Option",
      quantity: "Qty",
      price: "Price",
      pointSection: "Use Points",
      pointDescription: "Get discount with your points",
      usePoint: "Use Points",
      noPoint: "No available points",
      selectPoint: "Select Points",
      pointDiscount: "Points Discount",
      termsSection: "Terms & Conditions",
      agreeAll: "Agree to All",
      viewTerms: "View",
      paymentSummary: "Payment Summary",
      itemsTotal: "Items Total",
      discount: "Discount",
      totalAmount: "Total Amount",
      paymentButton: "Pay Now",
      requiredFields: "Please fill in all required fields",
      requiredTerms: "Please agree to required terms",
      requiredCardInfo: "Please fill in all card information",
      orderSuccess: "Order completed successfully",
      orderError:
        "An error occurred while processing your order",
      won: "KRW",
      items: "items",
    },
  };

  const t = text[language];

  // 금액 계산
  const itemsTotal = orderItems.reduce(
    (sum, item) => sum + item.subtotal,
    0,
  );
  const pointDiscount = pointApplied ? pointAmount : 0;
  const voucherDiscount = voucherApplied ? voucherAmount : 0;
  const totalDiscount = pointDiscount + voucherDiscount;
  const remainingAmount = Math.max(
    0,
    itemsTotal - totalDiscount,
  ); // 남은 금액
  const totalAmount = itemsTotal - totalDiscount;

  // ⭐ 결제하기 버튼 활성화 조건 검사
  const isPaymentButtonDisabled = () => {
    // 1. 처리 중인 경우
    if (isProcessing) return true;

    // 2. 필수 입력 항목 확인
    if (!name || !phone || !email) return true;

    // 3. 필수 약관 동의 확인
    const requiredTerms = terms.filter((term) => term.required);
    const allRequiredAgreed = requiredTerms.every(
      (term) => termsAgreements[term.id],
    );
    if (!allRequiredAgreed) return true;

    // 4. 결제 금액이 0 이하인 경우 (모두 상품권으로 결제했을 때는 허용)
    // 상품권 사용 중이고 아직 적용 안 된 경우는 제외
    if (
      useVoucherPayment &&
      !voucherApplied &&
      totalAmount > 0
    ) {
      // 상품권 사용하려는데 아직 적용 안 함
      // 하지만 ��른 결제 방법과 병행할 수 있으므로 허용
    }

    return false;
  };

  // 전체 동의 처리
  const handleAgreeAll = (checked: boolean) => {
    setAgreeAll(checked);
    const newAgreements: Record<number, boolean> = {};
    terms.forEach((term) => {
      newAgreements[term.id] = checked;
    });
    setTermsAgreements(newAgreements);
  };

  // 개별 약관 동의 처리
  const handleTermAgreement = (
    termId: number,
    checked: boolean,
  ) => {
    const newAgreements = {
      ...termsAgreements,
      [termId]: checked,
    };
    setTermsAgreements(newAgreements);

    // 모든 약관이 동의되었는지 확인
    const allAgreed = terms.every(
      (term) => newAgreements[term.id],
    );
    setAgreeAll(allAgreed);
  };

  // 상품권 일련호 조회 (모의)
  const handleCheckVoucher = () => {
    if (!voucherSerial) {
      toast.error(
        language === "ko"
          ? "일련번호를 입력해주세요"
          : "Please enter serial number",
      );
      return;
    }

    // 모의 상품권 조회 (실제로는 API 호출)
    const mockVouchers: Record<string, number> = {
      "V001-1234": 50000,
      "V002-5678": 100000,
      "V003-9012": 30000,
    };

    const balance = mockVouchers[voucherSerial];

    if (balance) {
      setVoucherBalance(balance);
      setVoucherAmount(Math.min(balance, itemsTotal)); // 최대 주문 금액까지만
      toast.success(
        language === "ko"
          ? "상품권이 조회되었습니다"
          : "Voucher found",
      );
    } else {
      toast.error(
        language === "ko"
          ? "유효하지 않은 일련번호입니다"
          : "Invalid serial number",
      );
      setVoucherBalance(0);
      setVoucherAmount(0);
    }
  };

  // 상품권 적용
  const handleApplyVoucher = () => {
    if (!voucherSerial || voucherBalance === 0) {
      toast.error(
        language === "ko"
          ? "상품권을 먼저 조회해주세요"
          : "Please check voucher first",
      );
      return;
    }

    if (voucherAmount === 0 || voucherAmount > voucherBalance) {
      toast.error(
        language === "ko"
          ? "사용 금액을 확인해주세요"
          : "Please check amount",
      );
      return;
    }

    setVoucherApplied(true);
    setVoucherDialogOpen(false);
    toast.success(
      language === "ko"
        ? `${voucherAmount.toLocaleString()}원 상품권이 적용되었습니다`
        : `${voucherAmount.toLocaleString()} KRW voucher applied`,
    );
  };

  // 유효성 검사
  const validateForm = () => {
    if (!name || !phone || !email) {
      toast.error(t.requiredFields);
      return false;
    }

    // 필수 약관 동의 확인
    const requiredTerms = terms.filter((term) => term.required);
    const allRequiredAgreed = requiredTerms.every(
      (term) => termsAgreements[term.id],
    );

    if (!allRequiredAgreed) {
      toast.error(t.requiredTerms);
      return false;
    }

    return true;
  };

  // 주문 처리
  const handleSubmitOrder = async () => {
    if (!validateForm()) {
      return;
    }

    setIsProcessing(true);

    try {
      // ⭐ 채널 ID(UUID) 가져오기
      let channelId: string | null = null;

      // 1. URL에서 채널 코드 확인 (최우선)
      const urlChannelCode =
        channelCode || syncChannelFromUrl();

      console.log(
        "🔍 [주문 생성] URL 채널 코드:",
        urlChannelCode,
      );

      // 2. 채널 코드가 있으면 API로 조회
      if (urlChannelCode) {
        const channelResponse =
          await getPublicChannelByCode(urlChannelCode);
        console.log(
          "📍 [주문 생성] 채널 정보 조회:",
          channelResponse,
        );

        if (channelResponse.success && channelResponse.data) {
          // ⭐ 공개 API는 id 필드로 UUID를 반환 (없으면 code 사용)
          channelId =
            channelResponse.data.id ||
            channelResponse.data.code;
          // ⭐ 채널 정보 저장 (다음에도 사용)
          setCurrentChannel(
            urlChannelCode,
            channelId!,
            channelResponse.data.name,
          );
          console.log(
            "✅ [주문 생성] API에서 채널 ID 획득:",
            channelId,
          );
        }
      }

      // 3. API에서 UUID를 받지 못한 경우 로컬 데이터에서 가져오기
      if (!channelId) {
        console.log(
          "⚠️ [주문 생성] API에서 channelId를 받지 못함, 로컬 데이터 시도",
        );
        const { getChannels } = await import(
          "@/data/channels"
        );
        const localChannelsResponse = getChannels();
        console.log(
          "📍 [주문 생성] 로컬 채널 답:",
          localChannelsResponse,
        );

        // ⭐ data가 배열인지 또는 페이지네이션 구조인지 확인
        let channelsArray: any[] = [];

        if (localChannelsResponse.success) {
          // data가 직접 배열인 경우
          if (Array.isArray(localChannelsResponse.data)) {
            channelsArray = localChannelsResponse.data;
          }
          // data.content가 배열인 경우 (페이지네이션 구조)
          else if (
            localChannelsResponse.data?.content &&
            Array.isArray(localChannelsResponse.data.content)
          ) {
            channelsArray = localChannelsResponse.data.content;
          }
        }

        console.log(
          "📋 [주문 생성] 추출된 채널 배열:",
          channelsArray,
        );

        if (channelsArray.length > 0) {
          // channelCode가 있으면 해당 코드로 찾고, 없으면 첫 번째 채널 사용
          const localChannel = urlChannelCode
            ? channelsArray.find(
                (c) =>
                  c.code === urlChannelCode ||
                  c.channelCode === urlChannelCode,
              )
            : channelsArray[0]; // 첫 번째 채널 사용

          if (localChannel) {
            channelId = localChannel.id; // 로컬 채널의 UUID 사용
            console.log(
              "✅ [주문 생성] 로컬 채널 UUID:",
              channelId,
            );
          } else if (urlChannelCode) {
            console.error(
              "❌ [주문 생성] 채널을 찾을 수 없음:",
              urlChannelCode,
            );
            toast.error(
              language === "ko"
                ? "유효하지 않은 채널입니다."
                : "Invalid channel.",
            );
            setIsProcessing(false);
            return;
          }
        } else {
          console.error(
            "❌ [주문 생성] 사용 가능한 채널이 없습니다",
          );
          toast.error(
            language === "ko"
              ? "사용 가능한 채널이 없습니다."
              : "No available channels.",
          );
          setIsProcessing(false);
          return;
        }
      }

      // channelId가 여전히 없으면 에러
      if (!channelId) {
        console.error(
          "❌ [주문 생성] channelId를 가져올 수 없음",
        );
        toast.error(
          language === "ko"
            ? "채널 정보를 가져올 수 없습니다."
            : "Failed to get channel information.",
        );
        setIsProcessing(false);
        return;
      }

      console.log(
        "🔑 [주문 생성] 최종 채널 ID (UUID):",
        channelId,
      );
      console.log(
        "📦 [주문 생성] enrichedOrderItems:",
        enrichedOrderItems,
      ); // ⭐ 디버깅: enrichedOrderItems 확인
      console.log("💳 [주문 생성] 결제 방법:", paymentMethod); // ⭐ 선택한 결제 방법
      console.log("💰 [주문 생성] 포인트 할인:", pointDiscount);
      console.log(
        "🎫 [주문 생성] 상품권 할인:",
        voucherDiscount,
      );
      console.log("💸 [주문 생성] 총 할인:", totalDiscount);
      console.log("🔍 [디버깅] pointDiscount:", pointDiscount);
      console.log("🔍 [디버깅] benepiaInfo:", benepiaInfo);
      console.log("🔍 [디버깅] 조건 체크:", {
        pointDiscountCheck: pointDiscount > 0,
        benepiaIdCheck: !!benepiaInfo.benepiaId,
        benepiaPwdCheck: !!benepiaInfo.benepiaPwd,
        allCheck: pointDiscount > 0 && benepiaInfo.benepiaId && benepiaInfo.benepiaPwd,
      });

      // API 요청 형식에 맞게 변환
      const orderRequest: ShopOrderRequest = {
        channelId: channelId, // ⭐ 채널 UUID 사용
        customerName: name,
        customerPhone: phone,
        customerEmail: email,
        ...(companyName ? { companyName } : {}),
        totalPrice: itemsTotal,
        discountPrice: 0, // ⭐ discountPrice는 0으로 (pointAmount로 할인 처리)
        paymentMethod: remainingAmount === 0 
          ? "POINT" 
          : paymentMethod === "VIRTUAL_ACCOUNT" 
            ? "VIRTUAL_ACCOUNT" 
            : "CARD", // ⭐ 전액 포인트 결제 시 POINT, 무통장입금은 VIRTUAL_ACCOUNT
        // ⭐ 포인트 사용 시 베네피아 정보 추가
        ...(pointDiscount > 0 && benepiaInfo.benepiaId && benepiaInfo.benepiaPwd
          ? {
              pointAmount: pointDiscount,
              benepiaId: benepiaInfo.benepiaId,
              benepiaPwd: benepiaInfo.benepiaPwd,
            }
          : {}),
        ...(requestMessage ? { memo: requestMessage } : {}),
        items: enrichedOrderItems.map((item) => ({
          // ⭐ enrichedOrderItems 사용
          productId: item.productId, // ⭐ 이미 UUID여야 함 (장바구니에서)
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.subtotal,
          // ⭐ options 배열에��� optionId와 optionValueId만 전달
          options: (item.options || [])
            .filter((opt) => opt.optionId && opt.optionValueId) // ID가 있는 것만
            .map((opt) => ({
              optionId: opt.optionId!,
              optionValueId: opt.optionValueId!,
            })),
          // ⭐ 숙박형 품의 경우 stayDates 추가
          ...(item.stayDates && item.stayDates.length > 0
            ? { stayDates: item.stayDates }
            : {}),
        })),
      };

      console.log("🛒 [주문 생성] API 호출:", orderRequest);

      const response = await createShopOrder(orderRequest);

      console.log("📥 [주문 생성] API 응답:", {
        success: response.success,
        hasData: !!response.data,
        data: response.data,
        message: response.message,
      });

      if (response.success && response.data) {
        toast.success(t.orderSuccess);
        console.log("✅ [주��� 생성] 성공:", response.data);

        // ⭐ 포인트로 100% 결제된 경우 (finalPrice가 0이면 결제 완료)
        if (response.data.finalPrice === 0) {
          console.log(
            "✅ [100% 포인트 결제] payment-success 페이지로 이동",
            { finalPrice: response.data.finalPrice, paymentStatus: response.data.paymentStatus }
          );
          navigate("/payment-success", {
            state: {
              orderNumber: response.data.orderNumber,
              orderId: response.data.orderId,
              orderItems: orderItems,
              ordererInfo: {
                name,
                phone,
                email,
              },
              totalAmount: totalAmount,
              paymentMethod: response.data.paymentMethod || "POINT",
              pointAmount: pointDiscount,
            },
          });

          setIsProcessing(false);
          return;
        }

        // ⭐ PG 결제 URL이 있으면 리다이렉트
        if (
          response.data.pgOnlineUrl ||
          response.data.pgMobileUrl
        ) {
          console.log("💳 [PG 결제] URL로 리다이렉트");

          // 모바일 여부 감지
          const isMobile =
            /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
              navigator.userAgent,
            );
          const paymentUrl = isMobile
            ? response.data.pgMobileUrl
            : response.data.pgOnlineUrl;

          console.log(
            `📱 디바이스: ${isMobile ? "모바일" : "PC"}`,
          );
          console.log(`🔗 결제 URL: ${paymentUrl}`);

          // PG 결제 페이지로 이동
          window.location.href = paymentUrl;
          return;
        }

        // ⭐ 카드 결제 선택했지만 PG URL이 없는 경우 - 에러 처리
        if (paymentMethod === "CARD") {
          console.error(
            "❌ [카드 결제] PG URL이 없습니다 - 데모 모드로 결제 완료 처리",
          );

          // ⭐ 데모 환경: PG URL이 없어도 제 완료 페이지로 이���
          console.log(
            "✅ [데모 결제] payment-success 페이지로 이동",
          );
          navigate("/payment-success", {
            state: {
              orderNumber: response.data.orderNumber,
              orderId: response.data.orderId,
              orderItems: orderItems,
              ordererInfo: {
                name,
                phone,
                email,
              },
              totalAmount: totalAmount,
              paymentMethod: response.data.paymentMethod || "CARD",
              pointAmount: pointDiscount,
            },
          });

          setIsProcessing(false);
          return;
        }

        // ⭐ 무통장 입금 - 계좌번호 표
        console.log("🏦 [계좌이체] payment-info 페이지로 이동");
        navigate("/payment-info", {
          state: {
            orderNumber: response.data.orderNumber,
            orderId: response.data.orderId,
            orderItems: orderItems,
            ordererInfo: {
              name,
              phone,
              email,
            },
            totalAmount: totalAmount,
            cartItemIds: location.state?.cartItemIds || [], // 장바구니에서 온 아이템 ID들
          },
        });
      } else {
        toast.error(response.message || t.orderError);
        console.error("❌ [주문 생성] 실패:", response.message);

        // ⭐ 주문 실패 다이얼로그 열기
        setOrderFailDialog({
          open: true,
          message: response.message || t.orderError,
        });
      }
    } catch (error) {
      console.error("❌ [주문 생성] 예외 발생:", error);

      // 에러 메시지를 사용자에게 표시
      let errorMessage = t.orderError;

      if (error instanceof Error) {
        errorMessage = error.message;

        // 네트워크 에러인 경우 더 친절한 메시지
        if (error.message.includes("Failed to fetch")) {
          errorMessage =
            language === "ko"
              ? "서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요."
              : "Cannot connect to server. Please check your network connection.";
        }
      }

      toast.error(errorMessage);

      // ⭐ 주문 실패 다이얼로그 열기
      setOrderFailDialog({
        open: true,
        message: errorMessage,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ShopHeader language={language} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t.backButton}
          </Button>

          <div className="text-center">
            <h1 className="text-3xl mb-2">{t.title}</h1>
            <p className="text-muted-foreground">
              {t.subtitle}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 주문 정보 입력 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 주문자 정보 */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <User className="h-5 w-5" />
                {t.ordererInfo}
              </h2>
              <Separator className="mb-6" />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="companyName"
                    className="flex items-center gap-2"
                  >
                    <Building2 className="h-4 w-4" />
                    {t.companyName}
                  </Label>
                  <Input
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder={t.companyNamePlaceholder}
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="name"
                    className="flex items-center gap-2"
                  >
                    <User className="h-4 w-4" />
                    {t.name}{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t.namePlaceholder}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="phone"
                    className="flex items-center gap-2"
                  >
                    <Phone className="h-4 w-4" />
                    {t.phone}{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) =>
                      handlePhoneChange(e.target.value)
                    }
                    placeholder={t.phonePlaceholder}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="flex items-center gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    {t.email}{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex gap-1 items-center">
                    <Input
                      id="emailId"
                      value={emailId}
                      onChange={(e) =>
                        handleEmailIdChange(e.target.value)
                      }
                      placeholder="example"
                      className="flex-1"
                      required
                      autoComplete="off"
                    />
                    <span className="text-muted-foreground">
                      @
                    </span>
                    <div className="relative flex-1">
                      <Input
                        id="emailDomain"
                        value={emailDomain}
                        onChange={(e) =>
                          handleCustomDomainChange(
                            e.target.value,
                          )
                        }
                        placeholder="도메인 입력"
                        className="pr-10"
                        required
                      />
                      <Select
                        value={emailDomain || "custom"}
                        onValueChange={(value) => {
                          if (value === "custom") {
                            setEmailDomain("");
                          } else {
                            setEmailDomain(value);
                          }
                        }}
                      >
                        <SelectTrigger className="absolute right-0 top-0 h-full w-10 border-0 bg-transparent hover:bg-accent">
                          <SelectValue>
                            <span className="sr-only">
                              도메인 선택
                            </span>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="custom">
                            직접입력
                          </SelectItem>
                          <SelectItem value="naver.com">
                            naver.com
                          </SelectItem>
                          <SelectItem value="gmail.com">
                            gmail.com
                          </SelectItem>
                          <SelectItem value="daum.net">
                            daum.net
                          </SelectItem>
                          <SelectItem value="hanmail.net">
                            hanmail.net
                          </SelectItem>
                          <SelectItem value="nate.com">
                            nate.com
                          </SelectItem>
                          <SelectItem value="kakao.com">
                            kakao.com
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="request"
                    className="flex items-center gap-2"
                  >
                    <MessageSquare className="h-4 w-4" />
                    {t.requestMessage}
                  </Label>
                  <Textarea
                    id="request"
                    value={requestMessage}
                    onChange={(e) =>
                      setRequestMessage(e.target.value)
                    }
                    placeholder={t.requestPlaceholder}
                    rows={3}
                  />
                </div>
              </div>
            </Card>

            {/* 주문 상품 */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                {t.orderItems}
              </h2>
              <Separator className="mb-4" />

              <div className="space-y-4">
                {orderItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    {item.thumbnailUrl && (
                      <img
                        src={item.thumbnailUrl}
                        alt={item.productName}
                        className="w-20 h-20 object-cover rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1">
                        {item.productName}
                      </h3>
                      {item.optionName && (
                        <p className="text-sm text-muted-foreground mb-1">
                          {t.option}: {item.optionName}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {t.quantity}: {item.quantity} |{" "}
                        {t.price}: {formatPrice(item.unitPrice)}
                        {t.won}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatPrice(item.subtotal)}
                        {t.won}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* ⭐ 포인트 / 상품권 사용 (통합 섹션) */}
            {channelInfo?.usePoint && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  {language === "ko"
                    ? "포인트 / 상품권 사용"
                    : "Points / Voucher"}
                </h2>
                <Separator className="mb-4" />

                {/* 포인트 섹션 */}
                <div className="mb-6">
                  <h3 className="font-medium mb-4">
                    {language === "ko"
                      ? "포인트 사용"
                      : "Use Points"}
                  </h3>

                  <div className="space-y-4">
                    {!pointApplied ? (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="point-user-id">
                              {language === "ko"
                                ? "아이디"
                                : "User ID"}
                            </Label>
                            <Input
                              id="point-user-id"
                              value={pointUserId}
                              onChange={(e) =>
                                setPointUserId(e.target.value.replace(/\s/g, ''))
                              }
                              placeholder={
                                language === "ko"
                                  ? "아이디 입력"
                                  : "Enter User ID"
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="point-user-pwd">
                              {language === "ko"
                                ? "비밀번호"
                                : "Password"}
                            </Label>
                            <Input
                              id="point-user-pwd"
                              type="password"
                              value={pointUserPwd}
                              onChange={(e) =>
                                setPointUserPwd(e.target.value.replace(/\s/g, ''))
                              }
                              placeholder={
                                language === "ko"
                                  ? "비밀번호 입력"
                                  : "Enter Password"
                              }
                              autoComplete="new-password"
                            />
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={async () => {
                            if (!pointUserId || !pointUserPwd) {
                              toast.error(
                                language === "ko"
                                  ? "아이디와 비밀번호를 입력해주세요"
                                  : "Please enter ID and password",
                              );
                              return;
                            }

                            // 베네피아 포인트 조회 API 호출
                            try {
                              const response =
                                await getBenepiaPoint({
                                  amount: 100, // 임시 금액
                                  benepiaId: pointUserId,
                                  benepiaPwd: pointUserPwd,
                                  memcorpCd:
                                    benepiaInfo.memcorpCd || "5555",
                                });

                              if (
                                response.success &&
                                response.data &&
                                response.data.rsv_pnt !== null &&
                                response.data.rsv_pnt !== undefined
                              ) {
                                // ⭐ 포인트 조회 성공 시 베네피아 정보 저장
                                setBenepiaInfo({
                                  benepiaId: pointUserId,
                                  benepiaPwd: pointUserPwd,
                                  memcorpCd: benepiaInfo.memcorpCd || "5555",
                                });

                                const pointAmount = response.data.rsv_pnt || 0;
                                setPointBalance(pointAmount);
                                
                                toast.success(
                                  language === "ko"
                                    ? `포인트 조회 완료 (잔액: ${pointAmount.toLocaleString()}원)`
                                    : `Point lookup successful (Balance: ₩${pointAmount.toLocaleString()})`,
                                );
                              } else {
                                toast.error(
                                  language === "ko"
                                    ? "포인트 조회 실패"
                                    : "Point lookup failed",
                                );
                              }
                            } catch (error) {
                              console.error(
                                "포인트 조회 에러:",
                                error,
                              );
                              toast.error(
                                language === "ko"
                                  ? "포인트 조회 중 오류가 발생했습니다"
                                  : "An error occurred while looking up points",
                              );
                            }
                          }}
                        >
                          {language === "ko"
                            ? "조회하기"
                            : "Lookup"}
                        </Button>

                        {pointBalance > 0 && (
                          <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">
                                {language === "ko"
                                  ? "보유 포인트"
                                  : "Available Points"}
                              </span>
                              <span className="text-lg font-bold">
                                {pointBalance.toLocaleString()}
                                {language === "ko"
                                  ? "P"
                                  : " Points"}
                              </span>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="point-amount-input">
                                {language === "ko"
                                  ? "사용할 포인트"
                                  : "Points to Use"}
                              </Label>
                              <div className="flex gap-2">
                                <Input
                                  id="point-amount-input"
                                  type="number"
                                  value={pointAmount || ""}
                                  onChange={(e) => {
                                    const val =
                                      parseInt(
                                        e.target.value,
                                      ) || 0;
                                    setPointAmount(
                                      Math.min(
                                        val,
                                        pointBalance,
                                        itemsTotal,
                                      ),
                                    );
                                  }}
                                  placeholder="0"
                                  max={Math.min(
                                    pointBalance,
                                    itemsTotal,
                                  )}
                                />
                                <Button
                                  variant="secondary"
                                  onClick={() =>
                                    setPointAmount(
                                      Math.min(
                                        pointBalance,
                                        itemsTotal,
                                      ),
                                    )
                                  }
                                >
                                  {language === "ko"
                                    ? "전액사용"
                                    : "Use All"}
                                </Button>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {language === "ko"
                                  ? `최소 10P 이상 / 최대 ${Math.min(pointBalance, itemsTotal).toLocaleString()}P 사용 가능`
                                  : `Min 10 Points / Max ${Math.min(pointBalance, itemsTotal).toLocaleString()} Points`}
                              </p>
                            </div>

                            <Button
                              className="w-full"
                              onClick={() => {
                                if (pointAmount < 10) {
                                  toast.error(
                                    language === "ko"
                                      ? "최소 10P 이상 사용 가능합니다"
                                      : "Minimum 10 points required",
                                  );
                                  return;
                                }
                                setPointApplied(true);
                                toast.success(
                                  language === "ko"
                                    ? "포인트가 적용되었습니다"
                                    : "Points applied",
                                );
                              }}
                            >
                              {language === "ko"
                                ? "적용하기"
                                : "Apply"}
                            </Button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="space-y-3">
                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            <div className="flex-1">
                              <div className="flex items-baseline justify-between mb-1">
                                <span className="font-semibold text-green-700 dark:text-green-400">
                                  ✓ 포인트 적용 완료
                                </span>
                                <span className="font-bold text-green-600 dark:text-green-400">
                                  {pointAmount.toLocaleString()}
                                  {language === "ko"
                                    ? "P"
                                    : " Points"}
                                </span>
                              </div>
                              <div className="flex items-baseline justify-between text-xs text-muted-foreground">
                                <span>{pointUserId}</span>
                                <span>
                                  {language === "ko"
                                    ? "잔여"
                                    : "Remaining"}
                                  :{" "}
                                  {(
                                    pointBalance - pointAmount
                                  ).toLocaleString()}
                                  {language === "ko"
                                    ? "P"
                                    : " Points"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            setPointApplied(false);
                            setPointAmount(0);
                          }}
                        >
                          {language === "ko"
                            ? "재입력"
                            : "Re-enter"}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 상품권 섹션 */}
                <div>
                  <h3 className="font-medium mb-4">
                    {language === "ko"
                      ? "상품권 사용"
                      : "Use Voucher"}
                  </h3>

                  <div className="space-y-4">
                    {!voucherApplied ? (
                      <>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            setSerialParts(["", "", "", ""]);
                            setVoucherDialogOpen(true);
                          }}
                        >
                          <Gift className="h-4 w-4 mr-2" />
                          {language === "ko"
                            ? "상품권 조회하기"
                            : "Lookup Voucher"}
                        </Button>

                        {voucherBalance > 0 && (
                          <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">
                                {language === "ko"
                                  ? "상품권 잔액"
                                  : "Voucher Balance"}
                              </span>
                              <span className="text-lg font-bold">
                                {voucherBalance.toLocaleString()}
                                {language === "ko"
                                  ? "원"
                                  : " KRW"}
                              </span>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="voucher-amount-input">
                                {language === "ko"
                                  ? "사용할 ���액"
                                  : "Amount to Use"}
                              </Label>
                              <div className="flex gap-2">
                                <Input
                                  id="voucher-amount-input"
                                  type="number"
                                  value={voucherAmount || ""}
                                  onChange={(e) => {
                                    const val =
                                      parseInt(
                                        e.target.value,
                                      ) || 0;
                                    const maxUsage = Math.min(
                                      voucherBalance,
                                      itemsTotal -
                                        pointDiscount,
                                    );
                                    setVoucherAmount(
                                      Math.min(val, maxUsage),
                                    );
                                  }}
                                  placeholder="0"
                                />
                                <Button
                                  variant="secondary"
                                  onClick={() => {
                                    const maxUsage = Math.min(
                                      voucherBalance,
                                      itemsTotal -
                                        pointDiscount,
                                    );
                                    setVoucherAmount(maxUsage);
                                  }}
                                >
                                  {language === "ko"
                                    ? "전액사용"
                                    : "Use All"}
                                </Button>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {language === "ko"
                                  ? `최대 ${Math.min(voucherBalance, itemsTotal - pointDiscount).toLocaleString()}원 사용 가능`
                                  : `Max ${Math.min(voucherBalance, itemsTotal - pointDiscount).toLocaleString()} KRW`}
                              </p>
                            </div>

                            <Button
                              className="w-full"
                              onClick={() => {
                                if (voucherAmount <= 0) {
                                  toast.error(
                                    language === "ko"
                                      ? "사용할 금액을 입력해주세요"
                                      : "Please enter amount to use",
                                  );
                                  return;
                                }
                                setVoucherApplied(true);
                                toast.success(
                                  language === "ko"
                                    ? "상품권이 적용되었습니다"
                                    : "Voucher applied",
                                );
                              }}
                            >
                              {language === "ko"
                                ? "적용하기"
                                : "Apply"}
                            </Button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="space-y-3">
                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            <div className="flex-1">
                              <div className="flex items-baseline justify-between mb-1">
                                <span className="font-semibold text-green-700 dark:text-green-400">
                                  ✓ 상품권 적용 완료
                                </span>
                                <span className="font-bold text-green-600 dark:text-green-400">
                                  {voucherAmount.toLocaleString()}
                                  {language === "ko"
                                    ? "원"
                                    : " KRW"}
                                </span>
                              </div>
                              <div className="flex items-baseline justify-between text-xs text-muted-foreground">
                                <span>
                                  {benepiaInfo.memcorpCd}
                                </span>
                                <span>
                                  {language === "ko"
                                    ? "잔여"
                                    : "Remaining"}
                                  :{" "}
                                  {(
                                    voucherBalance -
                                    voucherAmount
                                  ).toLocaleString()}
                                  {language === "ko"
                                    ? "원"
                                    : " KRW"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            setVoucherApplied(false);
                            setVoucherAmount(0);
                          }}
                        >
                          {language === "ko"
                            ? "재조회"
                            : "Re-lookup"}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* ⭐ 결제 방법 */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                {language === "ko"
                  ? "결제 방법"
                  : "Payment Method"}
              </h2>
              <Separator className="mb-4" />

              {remainingAmount > 0 ? (
                <>
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        {language === "ko"
                          ? "결제할 금액"
                          : "Amount to Pay"}
                      </span>
                      <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                        {remainingAmount.toLocaleString()}
                        {language === "ko" ? "원" : " KRW"}
                      </span>
                    </div>
                  </div>

                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={(value) =>
                      setPaymentMethod(
                        value as "CARD" | "VIRTUAL_ACCOUNT",
                      )
                    }
                    className="space-y-3"
                  >
                    {/* ⭐ 카드 결제 - useCard가 true일 때만 표시 */}
                    {channelInfo?.useCard && (
                      <div
                        className={`relative flex items-start space-x-3 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                          paymentMethod === "CARD"
                            ? "border-primary bg-primary/5"
                            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                        }`}
                        onClick={() => {
                          setPaymentMethod("CARD");
                        }}
                      >
                        <RadioGroupItem
                          value="CARD"
                          id="payment-card"
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <Label
                            htmlFor="payment-card"
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <CreditCard className="h-5 w-5" />
                            <span className="font-semibold">
                              {t.paymentMethodCard}
                            </span>
                          </Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            {t.paymentMethodCardDesc}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* ⭐ 무통장 입금 - 항상 표시 (기본 결제 수단) */}
                    <div
                      className={`relative flex items-start space-x-3 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                        paymentMethod === "VIRTUAL_ACCOUNT"
                          ? "border-primary bg-primary/5"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                      onClick={() => {
                        setPaymentMethod("VIRTUAL_ACCOUNT");
                      }}
                    >
                      <RadioGroupItem
                        value="VIRTUAL_ACCOUNT"
                        id="payment-virtual"
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <Label
                          htmlFor="payment-virtual"
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <Building2 className="h-5 w-5" />
                          <span className="font-semibold">
                            {t.paymentMethodVirtual}
                          </span>
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {t.paymentMethodVirtualDesc}
                        </p>
                      </div>
                    </div>
                  </RadioGroup>
                </>
              ) : (
                <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 text-center">
                  <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-3" />
                  <p className="font-semibold text-green-700 dark:text-green-400 mb-1">
                    {language === "ko"
                      ? "전액 결제 완료"
                      : "Fully Paid"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {language === "ko"
                      ? "포인트/상품권으로 전액 결제되었습니다"
                      : "Fully paid with points/voucher"}
                  </p>
                </div>
              )}
            </Card>

            {/* 이용약관 동의 */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                {t.termsSection}
              </h2>
              <Separator className="mb-4" />

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="agreeAll"
                      checked={agreeAll}
                      onCheckedChange={handleAgreeAll}
                    />
                    <Label
                      htmlFor="agreeAll"
                      className="cursor-pointer font-semibold"
                    >
                      {t.agreeAll}
                    </Label>
                  </div>
                </div>

                <div className="space-y-3 pl-2">
                  {terms.map((term) => (
                    <div
                      key={term.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`term-${term.id}`}
                          checked={
                            termsAgreements[term.id] || false
                          }
                          onCheckedChange={(checked) =>
                            handleTermAgreement(
                              term.id,
                              checked as boolean,
                            )
                          }
                        />
                        <Label
                          htmlFor={`term-${term.id}`}
                          className="cursor-pointer"
                        >
                          {term.required ? (
                            <span>
                              <span className="text-red-500">
                                [필수]
                              </span>{" "}
                              {term.title}
                            </span>
                          ) : (
                            <span>
                              <span className="text-gray-500">
                                [선택]
                              </span>{" "}
                              {term.title}
                            </span>
                          )}
                        </Label>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setTermsDialog({
                            open: true,
                            title: term.title,
                            content: term.content,
                          })
                        }
                      >
                        {t.viewTerms}
                      </Button>
                    </div>
                  ))}

                  {terms.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {language === "ko"
                        ? "등록된 약관이 없습니다."
                        : "No terms available."}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* 결제 정보 (sticky) */}
          <div className="lg:col-span-1">
            <div className="sticky top-32">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">
                  {t.paymentSummary}
                </h2>
                <Separator className="mb-4" />

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t.itemsTotal} ({orderItems.length}
                      {t.items})
                    </span>
                    <span>
                      {formatPrice(itemsTotal)}
                      {t.won}
                    </span>
                  </div>

                  {pointDiscount > 0 && (
                    <div className="flex justify-between text-sm text-blue-600 dark:text-blue-400">
                      <span>
                        {language === "ko"
                          ? "포인트 사용"
                          : "Points Used"}
                      </span>
                      <span>
                        -{formatPrice(pointDiscount)}
                        {t.won}
                      </span>
                    </div>
                  )}

                  {voucherDiscount > 0 && (
                    <div className="flex justify-between text-sm text-purple-600 dark:text-purple-400">
                      <span>
                        {language === "ko"
                          ? "상품권 사용"
                          : "Voucher Used"}
                      </span>
                      <span>
                        -{formatPrice(voucherDiscount)}
                        {t.won}
                      </span>
                    </div>
                  )}
                </div>

                <Separator className="mb-4" />

                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">
                    {language === "ko"
                      ? "총 상품 금액"
                      : "Total Items"}
                  </span>
                  <span className="font-semibold">
                    {formatPrice(itemsTotal)}
                    {t.won}
                  </span>
                </div>

                {totalDiscount > 0 && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      {language === "ko"
                        ? "총 할인"
                        : "Total Discount"}
                    </span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      -{formatPrice(totalDiscount)}
                      {t.won}
                    </span>
                  </div>
                )}

                <Separator className="my-3" />

                <div className="flex justify-between items-center mb-6">
                  <span className="font-semibold">
                    {language === "ko"
                      ? "최종 결제 금액"
                      : "Final Amount"}
                  </span>
                  <span className="text-2xl font-bold text-primary">
                    {formatPrice(totalAmount)}
                    {t.won}
                  </span>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleSubmitOrder}
                  disabled={isPaymentButtonDisabled()}
                >
                  {isProcessing ? (
                    <span>
                      {language === "ko"
                        ? "처리 중..."
                        : "Processing..."}
                    </span>
                  ) : (
                    <span>{t.paymentButton}</span>
                  )}
                </Button>

                {/* ⭐ 비활성화 사유 표시 */}
                {!isProcessing && isPaymentButtonDisabled() && (
                  <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-xs text-yellow-800 dark:text-yellow-200 text-center">
                      {!name || !phone || !email
                        ? language === "ko"
                          ? "⚠️ 필수 정보를 입력해주세요"
                          : "⚠️ Please fill in required information"
                        : terms
                              .filter((term) => term.required)
                              .some(
                                (term) =>
                                  !termsAgreements[term.id],
                              )
                          ? language === "ko"
                            ? "⚠️ 필수 약관에 동의해주세요"
                            : "⚠️ Please agree to required terms"
                          : null}
                    </p>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* 약관 다이얼로그 */}
      <Dialog
        open={termsDialog.open}
        onOpenChange={() =>
          setTermsDialog({
            open: false,
            title: "",
            content: "",
          })
        }
      >
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {termsDialog.title || "약관"}
            </DialogTitle>
            <DialogDescription className="sr-only">
              약관 내용을 확인할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh] prose prose-sm dark:prose-invert">
            <div
              className="whitespace-pre-wrap break-words"
              dangerouslySetInnerHTML={{
                __html:
                  termsDialog.content ||
                  "약관 내용이 없습니다.",
              }}
            />
          </div>
          <div className="flex justify-end pt-4">
            <Button
              onClick={() =>
                setTermsDialog({
                  open: false,
                  title: "",
                  content: "",
                })
              }
            >
              닫기
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ⭐ 베네피아 상품권 등록 다이얼로그 */}
      <Dialog
        open={voucherDialogOpen}
        onOpenChange={setVoucherDialogOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <Gift className="h-5 w-5" />
              {language === "ko"
                ? "상품권 등록"
                : "Register Voucher"}
            </DialogTitle>
            <DialogDescription className="sr-only">
              상품권 일련번호를 입력하여 조회하세요.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>
                {language === "ko"
                  ? "상품권 일련번호"
                  : "Voucher Serial Number"}{" "}
                <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2 items-center">
                <Input
                  ref={serialInputRefs[0]}
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="0000"
                  value={serialParts[0]}
                  onChange={(e) =>
                    handleSerialInput(0, e.target.value)
                  }
                  onKeyDown={(e) => handleSerialKeyDown(0, e)}
                  className="text-center text-lg font-mono"
                />
                <span className="text-gray-400">-</span>
                <Input
                  ref={serialInputRefs[1]}
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="0000"
                  value={serialParts[1]}
                  onChange={(e) =>
                    handleSerialInput(1, e.target.value)
                  }
                  onKeyDown={(e) => handleSerialKeyDown(1, e)}
                  className="text-center text-lg font-mono"
                />
                <span className="text-gray-400">-</span>
                <Input
                  ref={serialInputRefs[2]}
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="0000"
                  value={serialParts[2]}
                  onChange={(e) =>
                    handleSerialInput(2, e.target.value)
                  }
                  onKeyDown={(e) => handleSerialKeyDown(2, e)}
                  className="text-center text-lg font-mono"
                />
                <span className="text-gray-400">-</span>
                <Input
                  ref={serialInputRefs[3]}
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="0000"
                  value={serialParts[3]}
                  onChange={(e) =>
                    handleSerialInput(3, e.target.value)
                  }
                  onKeyDown={(e) => handleSerialKeyDown(3, e)}
                  className="text-center text-lg font-mono"
                />
              </div>
            </div>

            {voucherBalance > 0 && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-semibold text-green-900 dark:text-green-100">
                    {language === "ko"
                      ? "조회 완료"
                      : "Lookup Successful"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">
                    {language === "ko"
                      ? "사용 가능 금액"
                      : "Available Balance"}
                  </span>
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">
                    {voucherBalance.toLocaleString()}
                    {language === "ko" ? "원" : " KRW"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {language === "ko"
                    ? "확인 버튼을 눌러 금액을 입력하세요"
                    : "Click OK to enter amount"}
                </p>
              </div>
            )}

            <div className="flex gap-2">
              {voucherBalance === 0 ? (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={async () => {
                    const serialNumber = serialParts.join("-");
                    if (serialParts.some((part) => !part)) {
                      toast.error(
                        language === "ko"
                          ? "일련번호를 모두 입력해주세요"
                          : "Please fill in serial number",
                      );
                      return;
                    }

                    const loadingToast = toast.loading(
                      language === "ko"
                        ? "조회 중..."
                        : "Checking...",
                    );

                    try {
                      // ⭐ 임시 아이디/비밀번호 설정 (API 호출용)
                      const tempId =
                        "temp_" +
                        serialNumber.replace(/-/g, "");
                      const tempPwd = "temp123";

                      setBenepiaInfo({
                        benepiaId: tempId,
                        benepiaPwd: tempPwd,
                        memcorpCd: serialNumber,
                      });

                      const response = await getBenepiaPoint({
                        amount: 10,
                        benepiaId: tempId,
                        benepiaPwd: tempPwd,
                        memcorpCd: serialNumber,
                      });

                      toast.dismiss(loadingToast);

                      if (response.success && response.data) {
                        const balance = response.data.rsv_pnt;
                        setVoucherBalance(balance);
                        toast.success(
                          language === "ko"
                            ? `사용 가능 금액: ${balance.toLocaleString()}원`
                            : `Available: ${balance.toLocaleString()} KRW`,
                        );
                      } else {
                        toast.error(
                          response.message ||
                            (language === "ko"
                              ? "조회에 실패했습니다"
                              : "Failed to check"),
                        );
                        setVoucherBalance(0);
                      }
                    } catch (error) {
                      toast.dismiss(loadingToast);
                      console.error("상품권 조회 에러:", error);
                      toast.error(
                        language === "ko"
                          ? "조회 중 오류가 발생했습니다"
                          : "Error occurred",
                      );
                      setVoucherBalance(0);
                    }
                  }}
                >
                  {language === "ko"
                    ? "조회하기"
                    : "Check Balance"}
                </Button>
              ) : (
                <Button
                  className="flex-1"
                  onClick={() => {
                    setVoucherDialogOpen(false);
                    toast.success(
                      language === "ko"
                        ? "상품권 정보가 저장되었습니다. 사용 금액을 입력하세요."
                        : "Voucher info saved. Please enter amount.",
                    );
                  }}
                >
                  {language === "ko" ? "확인" : "OK"}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ⭐ 주문 실패 다이얼로그 */}
      <Dialog
        open={orderFailDialog.open}
        onOpenChange={() =>
          setOrderFailDialog({ open: false, message: "" })
        }
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex flex-col items-center text-center mb-4">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4">
                <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
              </div>
              <DialogTitle className="text-2xl font-bold">
                {language === "ko"
                  ? "주문 실패"
                  : "Order Failed"}
              </DialogTitle>
            </div>
            <DialogDescription className="sr-only">
              주문 처리 중 오류가 발생했습니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-center text-red-700 dark:text-red-300">
                {orderFailDialog.message}
              </p>
            </div>

            <p className="text-center text-muted-foreground text-sm">
              {language === "ko"
                ? "주문이 정상적으로 처리되지 않았습니다. 잠시 후 다시 시도해주세요."
                : "Your order was not processed. Please try again later."}
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setOrderFailDialog({
                  open: false,
                  message: "",
                });
                navigate(-1);
              }}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {language === "ko" ? "이전으로" : "Go Back"}
            </Button>
            <Button
              variant="default"
              className="flex-1"
              onClick={() =>
                setOrderFailDialog({ open: false, message: "" })
              }
            >
              {language === "ko" ? "다시 시도" : "Try Again"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
export default ShopOrder;
