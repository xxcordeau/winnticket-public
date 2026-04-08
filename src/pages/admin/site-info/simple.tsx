import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Building2,
  Phone,
  Mail,
  FileText,
  Landmark,
} from "lucide-react";
import {
  getSiteInfo as getSiteInfoAPI,
  updateSiteInfo as updateSiteInfoAPI,
  type SiteInfoResponse,
  type SiteInfoRequest,
} from "@/lib/api/site-info";
import { toast } from "sonner";

type Language = "ko" | "en";

interface SiteInfoPageProps {
  language: Language;
}

export function SiteInfoPage({ language }: SiteInfoPageProps) {
  const [siteInfo, setSiteInfo] = useState<SiteInfoResponse | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 
  const [formData, setFormData] = useState<Partial<SiteInfoRequest>>({
    companyName: "",
    businessNumber: "",
    ceoName: "",
    establishedDate: "",
    address: "",
    addressDetail: "",
    postalCode: "",
    tel: "",
    fax: "",
    email: "",
    customerServiceTel: "",
    customerServiceEmail: "",
    businessHours: "",
    onlineMarketingNumber: "",
    privacyOfficerName: "",
    privacyOfficerEmail: "",
    companyIntroduction: "",
    termsOfService: "",
    privacyPolicy: "",
    refundPolicy: "",
    bankName: "",
    accountNumber: "",
    accountHolder: "",
  });

  const text = {
    ko: {
      title: "사이트 정보 관리",
      subtitle: "사이트 기본 정보를 관리합니다.",
      basicInfo: "기본 정보",
      companyName: "회사명",
      businessNumber: "사업자등록번호",
      ceoName: "대표자명",
      establishedDate: "설립일",
      contactInfo: "연락처 정보",
      address: "주소",
      addressDetail: "상세주소",
      postalCode: "우편번호",
      tel: "대표전화",
      fax: "팩스번호",
      email: "대표이메일",
      customerServiceInfo: "고객센터 정보",
      customerServiceTel: "고객센터 전화번호",
      customerServiceEmail: "고객센터 이메일",
      businessHours: "운영시간",
      legalInfo: "법적 정보",
      onlineMarketingNumber: "통신판매업신고번호",
      privacyOfficerName: "개인정보보호책임자",
      privacyOfficerEmail: "개인정보보호책임자 이메일",
      additionalInfo: "추가 정보",
      companyIntroduction: "회사소개",
      termsOfService: "이용약관",
      privacyPolicy: "개인정보처리방침",
      refundPolicy: "환불정책",
      bankInfo: "은행계좌 정보",
      bankName: "은행명",
      accountNumber: "계좌번호",
      accountHolder: "예금주",
      edit: "수정",
      cancel: "취소",
      save: "저장",
      lastUpdated: "최종 수정",
      loading: "로딩 중...",
      noData: "데이터가 없습니다. 백엔드 API를 먼저 구현해주세요.",
    },
    en: {
      title: "Site Information",
      subtitle: "Manage basic site information.",
      basicInfo: "Basic Information",
      companyName: "Company Name",
      businessNumber: "Business Number",
      ceoName: "CEO Name",
      establishedDate: "Established Date",
      contactInfo: "Contact Information",
      address: "Address",
      addressDetail: "Address Detail",
      postalCode: "Postal Code",
      tel: "Phone",
      fax: "Fax",
      email: "Email",
      customerServiceInfo: "Customer Service",
      customerServiceTel: "CS Phone",
      customerServiceEmail: "CS Email",
      businessHours: "Business Hours",
      legalInfo: "Legal Information",
      onlineMarketingNumber: "E-commerce License",
      privacyOfficerName: "Privacy Officer",
      privacyOfficerEmail: "Privacy Officer Email",
      additionalInfo: "Additional Information",
      companyIntroduction: "Company Introduction",
      termsOfService: "Terms of Service",
      privacyPolicy: "Privacy Policy",
      refundPolicy: "Refund Policy",
      bankInfo: "Bank Account Information",
      bankName: "Bank Name",
      accountNumber: "Account Number",
      accountHolder: "Account Holder",
      edit: "Edit",
      cancel: "Cancel",
      save: "Save",
      lastUpdated: "Last Updated",
      loading: "Loading...",
      noData: "No data. Please implement backend API first.",
    },
  };

  const t = text[language];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const response = await getSiteInfoAPI();
      if (response.success && response.data) {
        setSiteInfo(response.data);
        setFormData({
          companyName: response.data.companyName || "",
          businessNumber: response.data.businessNumber || "",
          ceoName: response.data.ceoName || "",
          establishedDate: response.data.establishedDate || "",
          address: response.data.address || "",
          addressDetail: response.data.addressDetail || "",
          postalCode: response.data.postalCode || "",
          tel: response.data.tel || "",
          fax: response.data.fax || "",
          email: response.data.email || "",
          customerServiceTel: response.data.customerServiceTel || "",
          customerServiceEmail: response.data.customerServiceEmail || "",
          businessHours: response.data.businessHours || "",
          onlineMarketingNumber: response.data.onlineMarketingNumber || "",
          privacyOfficerName: response.data.privacyOfficerName || "",
          privacyOfficerEmail: response.data.privacyOfficerEmail || "",
          companyIntroduction: response.data.companyIntroduction || "",
          termsOfService: response.data.termsOfService || "",
          privacyPolicy: response.data.privacyPolicy || "",
          refundPolicy: response.data.refundPolicy || "",
          bankName: response.data.bankName || "",
          accountNumber: response.data.accountNumber || "",
          accountHolder: response.data.accountHolder || "",
        });
      }
    } catch (error) {
      toast.error(language === "ko" ? "데이터 로딩에 실패했습니다." : "Failed to load data.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (siteInfo) {
      setFormData({
        companyName: siteInfo.companyName || "",
        businessNumber: siteInfo.businessNumber || "",
        ceoName: siteInfo.ceoName || "",
        establishedDate: siteInfo.establishedDate || "",
        address: siteInfo.address || "",
        addressDetail: siteInfo.addressDetail || "",
        postalCode: siteInfo.postalCode || "",
        tel: siteInfo.tel || "",
        fax: siteInfo.fax || "",
        email: siteInfo.email || "",
        customerServiceTel: siteInfo.customerServiceTel || "",
        customerServiceEmail: siteInfo.customerServiceEmail || "",
        businessHours: siteInfo.businessHours || "",
        onlineMarketingNumber: siteInfo.onlineMarketingNumber || "",
        privacyOfficerName: siteInfo.privacyOfficerName || "",
        privacyOfficerEmail: siteInfo.privacyOfficerEmail || "",
        companyIntroduction: siteInfo.companyIntroduction || "",
        termsOfService: siteInfo.termsOfService || "",
        privacyPolicy: siteInfo.privacyPolicy || "",
        refundPolicy: siteInfo.refundPolicy || "",
        bankName: siteInfo.bankName || "",
        accountNumber: siteInfo.accountNumber || "",
        accountHolder: siteInfo.accountHolder || "",
      });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await updateSiteInfoAPI(formData as SiteInfoRequest);
      if (response.success) {
        toast.success(
          language === "ko" ? "저장되었습니다." : "Saved successfully."
        );
        await loadData();
        setIsEditing(false);
      } else {
        toast.error(response.message || "Failed to save.");
      }
    } catch (error) {
      toast.error("An error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (
    field: keyof SiteInfoRequest,
    value: string
  ) => {
    setFormData({ ...formData, [field]: value });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title={t.title} subtitle={t.subtitle} language={language} />
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">{t.loading}</p>
        </Card>
      </div>
    );
  }

  if (!siteInfo && !isLoading) {
    // 
    if (isEditing) {
      // ( return )
    } else {
      return (
        <div className="space-y-6">
          <PageHeader title={t.title} subtitle={t.subtitle} language={language} />
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">{t.noData}</p>
            <p className="text-sm text-muted-foreground mb-6">
              API 엔드포인트: /api/admin/site-info
            </p>
            <Button onClick={() => {
              setIsEditing(true);
              // 
            }}>
              <Building2 className="h-4 w-4 mr-2" />
              {language === "ko" ? "사이트 정보 등록" : "Create Site Info"}
            </Button>
          </Card>
        </div>
      );
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <PageHeader title={t.title} subtitle={t.subtitle} language={language} />
        <div className="flex gap-2">
          {!isEditing ? (
            <Button onClick={handleEdit}>
              <FileText className="h-4 w-4 mr-2" />
              {t.edit}
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleCancel}>
                {t.cancel}
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : t.save}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 기본 정보 */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Building2 className="h-5 w-5 text-muted-foreground" />
          <h3>{t.basicInfo}</h3>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="companyName">{t.companyName}</Label>
            <Input
              id="companyName"
              value={formData.companyName || ""}
              onChange={(e) => handleInputChange("companyName", e.target.value)}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessNumber">{t.businessNumber}</Label>
            <Input
              id="businessNumber"
              value={formData.businessNumber || ""}
              onChange={(e) => handleInputChange("businessNumber", e.target.value)}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ceoName">{t.ceoName}</Label>
            <Input
              id="ceoName"
              value={formData.ceoName || ""}
              onChange={(e) => handleInputChange("ceoName", e.target.value)}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="establishedDate">{t.establishedDate}</Label>
            <Input
              id="establishedDate"
              type="date"
              value={formData.establishedDate || ""}
              onChange={(e) => handleInputChange("establishedDate", e.target.value)}
              disabled={!isEditing}
            />
          </div>
        </div>
      </Card>

      {/* 연락처 정보 */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Phone className="h-5 w-5 text-muted-foreground" />
          <h3>{t.contactInfo}</h3>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2 col-span-2">
            <Label htmlFor="address">{t.address}</Label>
            <Input
              id="address"
              value={formData.address || ""}
              onChange={(e) => handleInputChange("address", e.target.value)}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="addressDetail">{t.addressDetail}</Label>
            <Input
              id="addressDetail"
              value={formData.addressDetail || ""}
              onChange={(e) => handleInputChange("addressDetail", e.target.value)}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="postalCode">{t.postalCode}</Label>
            <Input
              id="postalCode"
              value={formData.postalCode || ""}
              onChange={(e) => handleInputChange("postalCode", e.target.value)}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tel">{t.tel}</Label>
            <Input
              id="tel"
              value={formData.tel || ""}
              onChange={(e) => handleInputChange("tel", e.target.value)}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fax">{t.fax}</Label>
            <Input
              id="fax"
              value={formData.fax || ""}
              onChange={(e) => handleInputChange("fax", e.target.value)}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2 col-span-2">
            <Label htmlFor="email">{t.email}</Label>
            <Input
              id="email"
              type="email"
              value={formData.email || ""}
              onChange={(e) => handleInputChange("email", e.target.value)}
              disabled={!isEditing}
            />
          </div>
        </div>
      </Card>

      {/* 고객센터 정보 */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Mail className="h-5 w-5 text-muted-foreground" />
          <h3>{t.customerServiceInfo}</h3>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="customerServiceTel">{t.customerServiceTel}</Label>
            <Input
              id="customerServiceTel"
              value={formData.customerServiceTel || ""}
              onChange={(e) => handleInputChange("customerServiceTel", e.target.value)}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerServiceEmail">{t.customerServiceEmail}</Label>
            <Input
              id="customerServiceEmail"
              type="email"
              value={formData.customerServiceEmail || ""}
              onChange={(e) => handleInputChange("customerServiceEmail", e.target.value)}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2 col-span-2">
            <Label htmlFor="businessHours">{t.businessHours}</Label>
            <Input
              id="businessHours"
              value={formData.businessHours || ""}
              onChange={(e) => handleInputChange("businessHours", e.target.value)}
              disabled={!isEditing}
              placeholder="예: 평일 09:00-18:00 (주말 및 공휴일 휴무)"
            />
          </div>
        </div>
      </Card>

      {/* 법적 정보 */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <h3>{t.legalInfo}</h3>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2 col-span-2">
            <Label htmlFor="onlineMarketingNumber">{t.onlineMarketingNumber}</Label>
            <Input
              id="onlineMarketingNumber"
              value={formData.onlineMarketingNumber || ""}
              onChange={(e) => handleInputChange("onlineMarketingNumber", e.target.value)}
              disabled={!isEditing}
              placeholder="예: 제2024-서울강남-12345호"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="privacyOfficerName">{t.privacyOfficerName}</Label>
            <Input
              id="privacyOfficerName"
              value={formData.privacyOfficerName || ""}
              onChange={(e) => handleInputChange("privacyOfficerName", e.target.value)}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="privacyOfficerEmail">{t.privacyOfficerEmail}</Label>
            <Input
              id="privacyOfficerEmail"
              type="email"
              value={formData.privacyOfficerEmail || ""}
              onChange={(e) => handleInputChange("privacyOfficerEmail", e.target.value)}
              disabled={!isEditing}
            />
          </div>
        </div>
      </Card>

      {/* 추가 정보 */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <h3>{t.additionalInfo}</h3>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="companyIntroduction">{t.companyIntroduction}</Label>
            <Textarea
              id="companyIntroduction"
              value={formData.companyIntroduction || ""}
              onChange={(e) => handleInputChange("companyIntroduction", e.target.value)}
              disabled={!isEditing}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="termsOfService">{t.termsOfService}</Label>
            <Textarea
              id="termsOfService"
              value={formData.termsOfService || ""}
              onChange={(e) => handleInputChange("termsOfService", e.target.value)}
              disabled={!isEditing}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="privacyPolicy">{t.privacyPolicy}</Label>
            <Textarea
              id="privacyPolicy"
              value={formData.privacyPolicy || ""}
              onChange={(e) => handleInputChange("privacyPolicy", e.target.value)}
              disabled={!isEditing}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="refundPolicy">{t.refundPolicy}</Label>
            <Textarea
              id="refundPolicy"
              value={formData.refundPolicy || ""}
              onChange={(e) => handleInputChange("refundPolicy", e.target.value)}
              disabled={!isEditing}
              rows={4}
            />
          </div>
        </div>
      </Card>

      {/* 은행계좌 정보 */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Landmark className="h-5 w-5 text-muted-foreground" />
          <h3>{t.bankInfo}</h3>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="bankName">{t.bankName}</Label>
            <Input
              id="bankName"
              value={formData.bankName || ""}
              onChange={(e) => handleInputChange("bankName", e.target.value)}
              disabled={!isEditing}
              placeholder="예: 신한은행"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountNumber">{t.accountNumber}</Label>
            <Input
              id="accountNumber"
              value={formData.accountNumber || ""}
              onChange={(e) => handleInputChange("accountNumber", e.target.value)}
              disabled={!isEditing}
              placeholder="예: 110-123-456789"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountHolder">{t.accountHolder}</Label>
            <Input
              id="accountHolder"
              value={formData.accountHolder || ""}
              onChange={(e) => handleInputChange("accountHolder", e.target.value)}
              disabled={!isEditing}
              placeholder="예: 티켓박스"
            />
          </div>
        </div>
      </Card>

      {/* 최종 수정일 */}
      {siteInfo && (
        <div className="text-sm text-muted-foreground text-right">
          {t.lastUpdated}: {new Date(siteInfo.updatedAt).toLocaleString()}
        </div>
      )}
    </div>
  );
}