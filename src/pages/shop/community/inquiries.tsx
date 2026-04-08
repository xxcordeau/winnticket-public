import { useState } from "react";
import { useNavigate } from "@/lib/channel-context";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { ArrowLeft, MessageCircle, Send, CheckCircle2, Ticket } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShopHeader } from "@/components/shop-header";
import { createInquiry, type InquiryInput } from "@/data/inquiries";
import { copyToClipboard } from "@/lib/clipboard";

type Language = "ko" | "en";

interface ShopInquiriesProps {
  language: Language;
}

export function ShopInquiries({ language }: ShopInquiriesProps) {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [generatedInquiryNumber, setGeneratedInquiryNumber] = useState("");
  
  // 폼 상태
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("");
  const [relatedOrderNumber, setRelatedOrderNumber] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const text = {
    ko: {
      pageTitle: "1:1 문의하기",
      pageDesc: "궁금하신 사항을 문의해주시면 빠르게 답변드리겠습니다",
      backButton: "쇼핑 홈으로",
      inquiryLookup: "문의 조회",
      sectionContact: "연락처 정보",
      sectionContactDesc: "답변을 받으실 연락처를 입력해주세요",
      labelName: "이름",
      placeholderName: "홍길동",
      labelPhone: "연락처",
      placeholderPhone: "010-1234-5678",
      labelEmail: "이메일",
      placeholderEmail: "example@email.com",
      emailOptional: "(선택)",
      sectionInquiry: "문의 내용",
      sectionInquiryDesc: "자세한 내용을 입력해주시면 정확한 답변을 드릴 수 있습니다",
      labelCategory: "문의 유형",
      placeholderCategory: "문의 유형 선택",
      categoryOrder: "주문/결제",
      categoryTicket: "티켓",
      categoryCancel: "취소/환불",
      categoryEtc: "기타",
      labelOrderNumber: "주문번호",
      placeholderOrderNumber: "ORD-2024-001 (주문 관련 문의인 경우)",
      orderNumberOptional: "(택)",
      labelTitle: "제목",
      placeholderTitle: "문의 제목을 입력하세요",
      labelContent: "내용",
      placeholderContent: "문의하실 내용을 자세히 입력해주세요",
      submitButton: "문의 등록",
      submitting: "등록 중...",
      successTitle: "문의가 접수되었습니다",
      successDesc: "아래 문의번호로 답변을 확인하실 수 있습니다",
      inquiryNumber: "문의번호",
      smsNotice: "입력하신 연락처로 문의번호가 발송됩니다",
      lookupButton: "문의 조회하기",
      closeButton: "닫기",
      errorRequired: "필수 항목을 모두 입력해주세요",
      errorPhone: "올바른 연락처 형식을 입력해주세요",
    },
    en: {
      pageTitle: "Contact Us",
      pageDesc: "Send us your inquiry and we'll respond as soon as possible",
      backButton: "Back to Shop",
      inquiryLookup: "Inquiry Lookup",
      sectionContact: "Contact Information",
      sectionContactDesc: "Please enter your contact information for our response",
      labelName: "Name",
      placeholderName: "John Doe",
      labelPhone: "Phone",
      placeholderPhone: "010-1234-5678",
      labelEmail: "Email",
      placeholderEmail: "example@email.com",
      emailOptional: "(Optional)",
      sectionInquiry: "Inquiry Details",
      sectionInquiryDesc: "Please provide detailed information for accurate assistance",
      labelCategory: "Category",
      placeholderCategory: "Select category",
      categoryOrder: "Order/Payment",
      categoryTicket: "Ticket",
      categoryCancel: "Cancel/Refund",
      categoryEtc: "Others",
      labelOrderNumber: "Order Number",
      placeholderOrderNumber: "ORD-2024-001 (if order-related)",
      orderNumberOptional: "(Optional)",
      labelTitle: "Title",
      placeholderTitle: "Enter inquiry title",
      labelContent: "Content",
      placeholderContent: "Please describe your inquiry in detail",
      submitButton: "Submit Inquiry",
      submitting: "Submitting...",
      successTitle: "Inquiry Submitted",
      successDesc: "You can check the response using the inquiry number below",
      inquiryNumber: "Inquiry Number",
      smsNotice: "The inquiry number will be sent to your phone",
      lookupButton: "Check Inquiry",
      closeButton: "Close",
      errorRequired: "Please fill in all required fields",
      errorPhone: "Please enter a valid phone number",
    },
  };

  const t = text[language];

  const validatePhone = (phone: string): boolean => {
    // 한국 전화번호 형식 간단 검증
    const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 유효성 검사
    if (!name.trim() || !phone.trim() || !category || !title.trim() || !content.trim()) {
      toast.error(t.errorRequired);
      return;
    }

    if (!validatePhone(phone)) {
      toast.error(t.errorPhone);
      return;
    }

    setIsSubmitting(true);

    try {
      const inquiryInput: InquiryInput = {
        name,
        phone,
        email: email || undefined,
        category,
        relatedOrderNumber: relatedOrderNumber || undefined,
        title,
        content,
      };

      const inquiryNumber = await createInquiry(inquiryInput);
      
      setGeneratedInquiryNumber(inquiryNumber);
      setShowSuccessDialog(true);
      
      // 폼 초기화
      setName("");
      setPhone("");
      setEmail("");
      setCategory("");
      setRelatedOrderNumber("");
      setTitle("");
      setContent("");
    } catch (error) {
      toast.error(language === "ko" ? "문의 등록 중 오류가 발생했습니다" : "Error submitting inquiry");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyInquiryNumber = () => {
    copyToClipboard(generatedInquiryNumber);
    toast.success(language === "ko" ? "문의번호가 복사되었습니다" : "Inquiry number copied");
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
              onClick={() => navigate("/inquiry-lookup")}
            >
              {t.inquiryLookup}
            </Button>
          </div>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <MessageCircle className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl mb-2">{t.pageTitle}</h1>
            <p className="text-muted-foreground">{t.pageDesc}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 연락처 정보 */}
          <Card className="p-6">
            <div className="mb-4">
              <h2 className="text-xl mb-1">{t.sectionContact}</h2>
              <p className="text-sm text-muted-foreground">{t.sectionContactDesc}</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name">{t.labelName} *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.placeholderName}
                  className="mt-2"
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone">{t.labelPhone} *</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t.placeholderPhone}
                  className="mt-2"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">{t.labelEmail} {t.emailOptional}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.placeholderEmail}
                  className="mt-2"
                />
              </div>
            </div>
          </Card>

          {/* 문의 내용 */}
          <Card className="p-6">
            <div className="mb-4">
              <h2 className="text-xl mb-1">{t.sectionInquiry}</h2>
              <p className="text-sm text-muted-foreground">{t.sectionInquiryDesc}</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="category">{t.labelCategory} *</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder={t.placeholderCategory} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ORDER">{t.categoryOrder}</SelectItem>
                    <SelectItem value="TICKET">{t.categoryTicket}</SelectItem>
                    <SelectItem value="CANCEL">{t.categoryCancel}</SelectItem>
                    <SelectItem value="ETC">{t.categoryEtc}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="orderNumber">{t.labelOrderNumber} {t.orderNumberOptional}</Label>
                <Input
                  id="orderNumber"
                  value={relatedOrderNumber}
                  onChange={(e) => setRelatedOrderNumber(e.target.value)}
                  placeholder={t.placeholderOrderNumber}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="title">{t.labelTitle} *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t.placeholderTitle}
                  className="mt-2"
                  required
                />
              </div>

              <div>
                <Label htmlFor="content">{t.labelContent} *</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={t.placeholderContent}
                  rows={8}
                  className="mt-2"
                  required
                />
              </div>
            </div>
          </Card>

          {/* 제출 버튼 */}
          <div className="flex justify-center">
            <Button 
              type="submit" 
              size="lg" 
              disabled={isSubmitting}
              className="w-full sm:w-auto min-w-[200px]"
            >
              {isSubmitting ? (
                <>
                  <Ticket className="mr-2 h-4 w-4 animate-spin text-white fill-white/40" strokeWidth={1.5} />
                  {t.submitting}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  {t.submitButton}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* 성공 Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">{t.successTitle}</DialogTitle>
            <DialogDescription className="text-center">
              {t.successDesc}
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-primary/5 rounded-lg p-4 border-2 border-primary/20">
              <p className="text-sm text-muted-foreground mb-2 text-center">
                {t.inquiryNumber}
              </p>
              <div className="flex items-center justify-center gap-2">
                <p className="text-2xl font-mono font-semibold text-primary">
                  {generatedInquiryNumber}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyInquiryNumber}
                  className="h-8"
                >
                  📋
                </Button>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-900 dark:text-blue-100 text-center">
                📱 {t.smsNotice}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowSuccessDialog(false)}
                className="flex-1"
              >
                {t.closeButton}
              </Button>
              <Button
                onClick={() => {
                  setShowSuccessDialog(false);
                  navigate("/inquiry-lookup");
                }}
                className="flex-1"
              >
                {t.lookupButton}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
export default ShopInquiries;
