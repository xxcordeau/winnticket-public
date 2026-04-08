import { useState } from "react";
import { useNavigate } from "@/lib/channel-context";
import { ShopHeader } from "@/components/shop-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Search, MessageCircle, Calendar, User, Phone, Mail, Package, FileText, Copy, CheckCircle2, Clock, ArrowLeft } from "lucide-react";
import { getInquiryByNumber } from "@/data/community";
import type { QnaPost } from "@/data/dto/community.dto";
import { toast } from "sonner";
import { copyToClipboard } from "@/lib/clipboard";

type Language = "ko" | "en";

interface ShopInquiryLookupProps {
  language: Language;
}

export function ShopInquiryLookup({ language }: ShopInquiryLookupProps) {
  const navigate = useNavigate();
  const [inquiryNumber, setInquiryNumber] = useState("");
  const [inquiry, setInquiry] = useState<QnaPost | null>(null);
  const [searched, setSearched] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const text = {
    ko: {
      pageTitle: "문의 조회",
      subtitle: "문의번호로 답변을 확인하세요",
      backButton: "쇼핑 홈으로",
      newInquiry: "새 문의하기",
      inquiryNumberLabel: "문의번호",
      inquiryNumberPlaceholder: "문의번호를 입력하세요 (예: INQ-2025-001)",
      searchButton: "조회",
      notFound: "문의 내역을 찾을 수 없습니다",
      notFoundDesc: "입력하신 문의번호를 다시 확인해주세요",
      demoTitle: "데모 문의번호",
      demoDesc: "아래 문의번호를 클릭하면 해당 문의를 조회할 수 있습니다",
      inquiryInfo: "문의 정보",
      inquiryNumber: "문의번호",
      inquiryDate: "문의일시",
      inquiryStatus: "답변상태",
      statusPending: "답변대기",
      statusAnswered: "답변완료",
      category: "문의유형",
      categoryOrder: "주문/결제",
      categoryTicket: "티켓",
      categoryCancel: "취소/환불",
      categoryEtc: "기타",
      contactInfo: "연락처 정보",
      name: "이름",
      phone: "연락처",
      email: "이메일",
      relatedOrder: "관련 주문번호",
      inquiryContent: "문의 내용",
      title: "제목",
      content: "내용",
      answerSection: "답변",
      answerWaiting: "답변을 기다리고 있습니다",
      answerWaitingDesc: "빠른 시일 내에 답변드리겠습니다",
      answeredBy: "답변자",
      answeredAt: "답변일시",
      copied: "복사되었습니다",
    },
    en: {
      pageTitle: "Inquiry Lookup",
      subtitle: "Check your inquiry status and response",
      backButton: "Back to Shop",
      newInquiry: "New Inquiry",
      inquiryNumberLabel: "Inquiry Number",
      inquiryNumberPlaceholder: "Enter inquiry number (e.g., INQ-2025-001)",
      searchButton: "Search",
      notFound: "Inquiry not found",
      notFoundDesc: "Please check your inquiry number again",
      demoTitle: "Demo Inquiry Numbers",
      demoDesc: "Click an inquiry number below to view the inquiry",
      inquiryInfo: "Inquiry Information",
      inquiryNumber: "Inquiry Number",
      inquiryDate: "Inquiry Date",
      inquiryStatus: "Status",
      statusPending: "Pending",
      statusAnswered: "Answered",
      category: "Category",
      categoryOrder: "Order/Payment",
      categoryTicket: "Ticket",
      categoryCancel: "Cancel/Refund",
      categoryEtc: "Others",
      contactInfo: "Contact Information",
      name: "Name",
      phone: "Phone",
      email: "Email",
      relatedOrder: "Related Order Number",
      inquiryContent: "Inquiry Details",
      title: "Title",
      content: "Content",
      answerSection: "Answer",
      answerWaiting: "Waiting for answer",
      answerWaitingDesc: "We will respond as soon as possible",
      answeredBy: "Answered by",
      answeredAt: "Answered at",
      copied: "Copied",
    },
  };

  const t = text[language];

  // ( )
  const demoInquiries = [
    { inquiryNumber: "INQ-2025-001", description: "티켓 예매 관련 문의" },
    { inquiryNumber: "INQ-2025-002", description: "주문 취소 문의" },
    { inquiryNumber: "INQ-2025-003", description: "결제 오류 문의" },
  ];

  const handleSearch = () => {
    if (!inquiryNumber.trim()) {
      toast.error(language === "ko" ? "문의번호를 입력하세요" : "Please enter inquiry number");
      return;
    }

    setSearched(true);
    const foundInquiry = getInquiryByNumber(inquiryNumber.trim());
    setInquiry(foundInquiry);
    
    if (!foundInquiry) {
      toast.error(t.notFound);
    }
  };

  const handleDemoInquiryClick = (demoInquiryNumber: string) => {
    setInquiryNumber(demoInquiryNumber);
    setSearched(true);
    
    const foundInquiry = getInquiryByNumber(demoInquiryNumber);
    setInquiry(foundInquiry);
  };

  const copyToClipboardWithToast = (text: string, field: string) => {
    copyToClipboard(text);
    setCopiedField(field);
    toast.success(t.copied);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(language === "ko" ? "ko-KR" : "en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCategoryName = (category?: string) => {
    switch (category) {
      case "ORDER":
        return t.categoryOrder;
      case "TICKET":
        return t.categoryTicket;
      case "CANCEL":
        return t.categoryCancel;
      case "ETC":
        return t.categoryEtc;
      default:
        return category || "-";
    }
  };

  const getStatusBadge = (status?: string) => {
    if (status === "ANSWERED") {
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          {t.statusAnswered}
        </Badge>
      );
    }
    return (
      <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
        <Clock className="h-3 w-3 mr-1" />
        {t.statusPending}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ShopHeader language={language} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t.backButton}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/inquiries")}
            >
              {t.newInquiry}
            </Button>
          </div>

          <div className="text-center">
            <h1 className="text-3xl mb-2">{t.pageTitle}</h1>
            <p className="text-muted-foreground">{t.subtitle}</p>
          </div>
        </div>

        {/* Search Box */}
        <Card className="p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                type="text"
                placeholder={t.inquiryNumberPlaceholder}
                value={inquiryNumber}
                onChange={(e) => setInquiryNumber(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="h-12"
              />
            </div>
            <Button onClick={handleSearch} size="lg" className="sm:w-auto w-full">
              <Search className="h-4 w-4 mr-2" />
              {t.searchButton}
            </Button>
          </div>
        </Card>

        {/* Demo Inquiry Numbers */}
        {!searched && (
          <Card className="p-6 mb-8 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3 mb-4">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  {t.demoTitle}
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                  {t.demoDesc}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {demoInquiries.map((demo) => (
                    <button
                      key={demo.inquiryNumber}
                      onClick={() => handleDemoInquiryClick(demo.inquiryNumber)}
                      className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors text-left group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-sm font-semibold text-blue-900 dark:text-blue-100">
                          {demo.inquiryNumber}
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400 truncate">
                          {demo.description}
                        </p>
                      </div>
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboardWithToast(demo.inquiryNumber, demo.inquiryNumber);
                        }}
                        className="ml-2 p-1.5 rounded hover:bg-blue-200 dark:hover:bg-blue-800 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        {copiedField === demo.inquiryNumber ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                        ) : (
                          <Copy className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Search Results */}
        {searched && !inquiry && (
          <Card className="p-12 text-center">
            <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl mb-2">{t.notFound}</h3>
            <p className="text-muted-foreground mb-6">{t.notFoundDesc}</p>
            <Button onClick={() => setSearched(false)} variant="outline">
              {language === "ko" ? "다시 검색" : "Search Again"}
            </Button>
          </Card>
        )}

        {/* Inquiry Details */}
        {inquiry && (
          <div className="space-y-6">
            {/* Inquiry Info */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                {t.inquiryInfo}
              </h2>
              <Separator className="mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t.inquiryNumber}</p>
                  <p className="font-mono font-semibold">{inquiry.inquiryNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t.inquiryDate}</p>
                  <p className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(inquiry.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t.inquiryStatus}</p>
                  {getStatusBadge(inquiry.status)}
                </div>
                {inquiry.category && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{t.category}</p>
                    <p>{getCategoryName(inquiry.category)}</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Contact Info */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <User className="h-5 w-5" />
                {t.contactInfo}
              </h2>
              <Separator className="mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t.name}</p>
                  <p>{inquiry.authorName}</p>
                </div>
                {inquiry.contactPhone && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{t.phone}</p>
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {inquiry.contactPhone}
                    </p>
                  </div>
                )}
                {inquiry.contactEmail && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{t.email}</p>
                    <p className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {inquiry.contactEmail}
                    </p>
                  </div>
                )}
                {inquiry.relatedOrderNumber && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{t.relatedOrder}</p>
                    <p className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      {inquiry.relatedOrderNumber}
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Inquiry Content */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">{t.inquiryContent}</h2>
              <Separator className="mb-4" />
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">{t.title}</p>
                  <p className="font-semibold">{inquiry.title}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">{t.content}</p>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 whitespace-pre-wrap">
                    {inquiry.content}
                  </div>
                </div>
              </div>
            </Card>

            {/* Answer */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                {t.answerSection}
              </h2>
              <Separator className="mb-4" />
              {inquiry.answer ? (
                <div className="space-y-4">
                  <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                    <div className="whitespace-pre-wrap">{inquiry.answer}</div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {inquiry.answeredBy && (
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>{t.answeredBy}: {inquiry.answeredBy}</span>
                      </div>
                    )}
                    {inquiry.answeredAt && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{t.answeredAt}: {formatDate(inquiry.answeredAt)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-orange-500 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold mb-2">{t.answerWaiting}</h3>
                  <p className="text-muted-foreground">{t.answerWaitingDesc}</p>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
export default ShopInquiryLookup;
