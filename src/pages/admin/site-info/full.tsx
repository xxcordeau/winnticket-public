import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Building2,
  Phone,
  Mail,
  FileText,
  Landmark,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { CoachMark, useCoachMark, TourHelpButton, type TourStep } from "@/components/coach-mark";
import {
  getSiteInfo,
  updateSiteInfo,
  type SiteInfoResponse,
} from "@/lib/api/site-info";
import {
  getAllBankAccounts,
  createBankAccount,
  updateBankAccount as updateBankAccountAPI,
  deleteBankAccount as deleteBankAccountAPI,
  type BankAccountResponse,
  type BankAccountRequest,
} from "@/lib/api/bank-account";
import {
  getAllTerms,
  createTerms,
  updateTerms as updateTermsAPI,
  deleteTerms as deleteTermsAPI,
  type TermsResponse,
  type TermsRequest,
} from "@/lib/api/terms";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

type Language = "ko" | "en";

interface SiteInfoPageProps {
  language: Language;
}

export function SiteInfoPage({ language }: SiteInfoPageProps) {
  const [loading, setLoading] = useState(true);
  const [siteInfo, setSiteInfo] = useState<SiteInfoResponse | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccountResponse[]>([]);
  const [terms, setTerms] = useState<TermsResponse[]>([]);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 기본 정보 폼 상태
  const [formData, setFormData] = useState({
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
  });

  // 은행계좌 관리
  const [bankAccountDialog, setBankAccountDialog] = useState(false);
  const [editingBankAccount, setEditingBankAccount] = useState<BankAccountResponse | null>(null);
  const [bankAccountForm, setBankAccountForm] = useState<BankAccountRequest>({
    bankName: "",
    accountNumber: "",
    accountHolder: "",
    visible: true,
    displayOrder: 0,
  });
  const [deleteBankAccountId, setDeleteBankAccountId] = useState<number | null>(null);

  // 약관 관리
  const [termsDialog, setTermsDialog] = useState(false);
  const [editingTerms, setEditingTerms] = useState<TermsResponse | null>(null);
  const [termsForm, setTermsForm] = useState<TermsRequest>({
    title: "",
    content: "",
    required: false,
    displayOrder: 1,
    visible: true,
  });
  const [deleteTermsId, setDeleteTermsId] = useState<number | null>(null);

  // 투어 가이드
  const siteTourSteps: TourStep[] = [
    { target: "site-basic", title: "기본 정보", description: "회사명, 사업자번호, 대표자명, 주소 등\n사이트의 기본 정보를 관리합니다.\n우측 상단 수정 버튼으로 편집 모드로 전환합니다.", placement: "bottom" },
    { target: "site-bank", title: "계좌 정보", description: "입금 안내에 사용할 계좌 정보를 관리합니다.\n은행명, 계좌번호, 예금주를 등록하고\n표시 여부를 제어할 수 있습니다.", placement: "top", waitForTarget: 500 },
    { target: "site-terms", title: "약관 관리", description: "이용약관, 개인정보처리방침 등\n각종 약관을 관리합니다.\n약관 제목, 내용, 필수 여부를 설정할 수 있습니다.", placement: "top", waitForTarget: 500 },
  ];

  const { isActive: isTourActive, startTour, endTour } = useCoachMark("site_info_tour");

  const text = {
    ko: {
      title: "사이트 정보 관리",
      subtitle: "사이트 기본 정보, 은행계좌, 약관을 관리합니다.",
      basicInfo: "기본 정보",
      companyName: "회사명",
      businessNumber: "사업자등록번호",
      ceoName: "대표자명",
      establishedDate: "설립일",
      address: "주소",
      addressDetail: "상세주소",
      postalCode: "우편번호",
      tel: "대표전화",
      fax: "팩스번호",
      email: "대표이메일",
      customerServiceTel: "고객센터 전화번호",
      customerServiceEmail: "고객센터 이메일",
      businessHours: "운영시간",
      onlineMarketingNumber: "통신판매업신고번호",
      privacyOfficerName: "개인정보보호책임자",
      privacyOfficerEmail: "개인정보보호책임자 이메일",
      companyIntroduction: "회사소개",
      termsOfService: "이용약관",
      privacyPolicy: "개인정보처리방침",
      refundPolicy: "환불정책",
      bankAccounts: "은행계좌 정보",
      bankName: "은행명",
      accountNumber: "계좌번호",
      accountHolder: "예금주",
      visible: "활성화",
      displayOrder: "표시순서",
      terms: "약관 관리",
      termsTitle: "약관 제목",
      termsContent: "약관 내용",
      required: "필수",
      actions: "작업",
      add: "추가",
      edit: "수정",
      delete: "삭제",
      save: "저장",
      cancel: "취소",
      addBankAccount: "계좌 추가",
      editBankAccount: "계좌 수정",
      deleteBankAccountConfirm: "이 계좌를 삭제하시겠습니까?",
      addTerms: "약관 추가",
      editTerms: "약관 수정",
      deleteTermsConfirm: "이 약관을 삭제하시겠습니까?",
      lastUpdated: "최종 수정",
      loading: "로딩 중...",
      active: "활성",
      inactive: "비활성",
    },
    en: {
      title: "Site Information",
      subtitle: "Manage site info, bank accounts, and terms.",
      basicInfo: "Basic Information",
      companyName: "Company Name",
      businessNumber: "Business Number",
      ceoName: "CEO Name",
      establishedDate: "Established Date",
      address: "Address",
      addressDetail: "Address Detail",
      postalCode: "Postal Code",
      tel: "Phone",
      fax: "Fax",
      email: "Email",
      customerServiceTel: "Customer Service Tel",
      customerServiceEmail: "Customer Service Email",
      businessHours: "Business Hours",
      onlineMarketingNumber: "E-commerce License",
      privacyOfficerName: "Privacy Officer",
      privacyOfficerEmail: "Privacy Officer Email",
      companyIntroduction: "Company Introduction",
      termsOfService: "Terms of Service",
      privacyPolicy: "Privacy Policy",
      refundPolicy: "Refund Policy",
      bankAccounts: "Bank Accounts",
      bankName: "Bank Name",
      accountNumber: "Account Number",
      accountHolder: "Account Holder",
      visible: "Status",
      displayOrder: "Order",
      terms: "Terms Management",
      termsTitle: "Title",
      termsContent: "Content",
      required: "Required",
      actions: "Actions",
      add: "Add",
      edit: "Edit",
      delete: "Delete",
      save: "Save",
      cancel: "Cancel",
      addBankAccount: "Add Bank Account",
      editBankAccount: "Edit Bank Account",
      deleteBankAccountConfirm: "Delete this bank account?",
      addTerms: "Add Terms",
      editTerms: "Edit Terms",
      deleteTermsConfirm: "Delete this terms?",
      lastUpdated: "Last Updated",
      loading: "Loading...",
      active: "Active",
      inactive: "Inactive",
    },
  };

  const t = text[language];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    
    try {
      console.log('🔄 사이트 정보 로딩 시작...');
      
      // 사이트 정보 로드
      const siteResponse = await getSiteInfo();
      console.log('📊 사이트 정보 응답:', siteResponse);
    if (siteResponse.success && siteResponse.data) {
      setSiteInfo(siteResponse.data);
      setFormData({
        companyName: siteResponse.data.companyName,
        businessNumber: siteResponse.data.businessNumber,
        ceoName: siteResponse.data.ceoName,
        establishedDate: siteResponse.data.establishedDate,
        address: siteResponse.data.address,
        addressDetail: siteResponse.data.addressDetail,
        postalCode: siteResponse.data.postalCode,
        tel: siteResponse.data.tel,
        fax: siteResponse.data.fax,
        email: siteResponse.data.email,
        customerServiceTel: siteResponse.data.customerServiceTel,
        customerServiceEmail: siteResponse.data.customerServiceEmail,
        businessHours: siteResponse.data.businessHours,
        onlineMarketingNumber: siteResponse.data.onlineMarketingNumber,
        privacyOfficerName: siteResponse.data.privacyOfficerName,
        privacyOfficerEmail: siteResponse.data.privacyOfficerEmail,
        companyIntroduction: siteResponse.data.companyIntroduction,
        termsOfService: siteResponse.data.termsOfService,
        privacyPolicy: siteResponse.data.privacyPolicy,
        refundPolicy: siteResponse.data.refundPolicy,
      });
    }

      // 은행계좌 로드
      const bankResponse = await getAllBankAccounts();
      console.log('🏦 은행계좌 응답:', bankResponse);
      if (bankResponse.success && bankResponse.data) {
        // API 응답 데이터가 배열인지 확인
        const dataArray = Array.isArray(bankResponse.data) ? bankResponse.data : [];
        setBankAccounts(dataArray);
      }

      // 약관 로드
      const termsResponse = await getAllTerms();
      console.log('📄 약관 응답:', termsResponse);
      if (termsResponse.success && termsResponse.data) {
        // API 응답 데이터가 배열인지 확인
        const dataArray = Array.isArray(termsResponse.data) ? termsResponse.data : [];
        setTerms(dataArray);
      }
      
      console.log('✅ 데이터 로딩 완료');
    } catch (error) {
      console.error('❌ 데이터 로딩 오류:', error);
      // 에러 발생 시에도 빈 데이터로 표시
      setSiteInfo(null);
      setBankAccounts([]);
      setTerms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    const response = await updateSiteInfo(formData);
    if (response.success) {
      toast.success(language === "ko" ? "저장되었습니다." : "Saved successfully.");
      await loadData();
      setIsEditing(false);
    } else {
      toast.error(response.message);
    }
    setIsSaving(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    loadData();
  };

  // 은행계좌 관리
  const handleAddBankAccount = () => {
    setBankAccountForm({
      bankName: "",
      accountNumber: "",
      accountHolder: "",
      visible: true,
      displayOrder: bankAccounts.length + 1,
    });
    setEditingBankAccount(null);
    setBankAccountDialog(true);
  };

  const handleEditBankAccount = (account: BankAccountResponse) => {
    setBankAccountForm({
      bankName: account.bankName,
      accountNumber: account.accountNumber,
      accountHolder: account.accountHolder,
      visible: account.visible,
      displayOrder: account.displayOrder,
    });
    setEditingBankAccount(account);
    setBankAccountDialog(true);
  };

  const handleSaveBankAccount = async () => {
    if (!bankAccountForm.bankName || !bankAccountForm.accountNumber || !bankAccountForm.accountHolder) {
      toast.error(language === "ko" ? "모든 필드를 입력해주세요." : "Please fill all fields.");
      return;
    }

    let response;
    if (editingBankAccount) {
      response = await updateBankAccountAPI(editingBankAccount.id, bankAccountForm);
    } else {
      response = await createBankAccount(bankAccountForm);
    }

    if (response.success) {
      toast.success(language === "ko" ? "저장되었습니다." : "Saved successfully.");
      await loadData();
      setBankAccountDialog(false);
    } else {
      toast.error(response.message);
    }
  };

  const handleDeleteBankAccount = async (id: number) => {
    const response = await deleteBankAccountAPI(id);
    if (response.success) {
      toast.success(language === "ko" ? "삭제되었습니다." : "Deleted successfully.");
      await loadData();
      setDeleteBankAccountId(null);
    } else {
      toast.error(response.message);
    }
  };

  // 약관 관리
  const handleAddTerms = () => {
    setTermsForm({
      title: "",
      content: "",
      required: false,
      displayOrder: terms.length + 1,
      visible: true,
    });
    setEditingTerms(null);
    setTermsDialog(true);
  };

  const handleEditTerms = (term: TermsResponse) => {
    setTermsForm({
      title: term.title,
      content: term.content,
      required: term.required,
      displayOrder: term.displayOrder,
      visible: term.visible,
    });
    setEditingTerms(term);
    setTermsDialog(true);
  };

  const handleSaveTerms = async () => {
    if (!termsForm.title || !termsForm.content) {
      toast.error(language === "ko" ? "제목과 내용을 입력해주세요." : "Please fill title and content.");
      return;
    }

    let response;
    if (editingTerms) {
      response = await updateTermsAPI(editingTerms.id, termsForm);
    } else {
      response = await createTerms(termsForm);
    }

    if (response.success) {
      toast.success(language === "ko" ? "저장되었습니다." : "Saved successfully.");
      await loadData();
      setTermsDialog(false);
    } else {
      toast.error(response.message);
    }
  };

  const handleDeleteTerms = async (id: number) => {
    const response = await deleteTermsAPI(id);
    if (response.success) {
      toast.success(language === "ko" ? "삭제되었습니다." : "Deleted successfully.");
      await loadData();
      setDeleteTermsId(null);
    } else {
      toast.error(response.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">{t.loading}</p>
      </div>
    );
  }

  if (!siteInfo) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <PageHeader title={t.title} subtitle={t.subtitle} language={language}
          rightContent={
            <TourHelpButton onClick={startTour} />
          }
        />
        <div className="flex gap-2">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              <Pencil className="h-4 w-4 mr-2" />
              {t.edit}
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                {t.cancel}
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : t.save}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 기본 정보 */}
      <Card className="p-4 sm:p-6" data-tour="site-basic">
        <div className="flex items-center gap-2 mb-4 sm:mb-6">
          <Building2 className="h-5 w-5 text-muted-foreground" />
          <h3>{t.basicInfo}</h3>
        </div>

        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="companyName">{t.companyName}</Label>
            <Input
              id="companyName"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessNumber">{t.businessNumber}</Label>
            <Input
              id="businessNumber"
              value={formData.businessNumber}
              onChange={(e) => setFormData({ ...formData, businessNumber: e.target.value })}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ceoName">{t.ceoName}</Label>
            <Input
              id="ceoName"
              value={formData.ceoName}
              onChange={(e) => setFormData({ ...formData, ceoName: e.target.value })}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="establishedDate">{t.establishedDate}</Label>
            <Input
              id="establishedDate"
              type="date"
              value={formData.establishedDate}
              onChange={(e) => setFormData({ ...formData, establishedDate: e.target.value })}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="postalCode">{t.postalCode}</Label>
            <Input
              id="postalCode"
              value={formData.postalCode}
              onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tel">{t.tel}</Label>
            <Input
              id="tel"
              value={formData.tel}
              onChange={(e) => setFormData({ ...formData, tel: e.target.value })}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address">{t.address}</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="addressDetail">{t.addressDetail}</Label>
            <Input
              id="addressDetail"
              value={formData.addressDetail}
              onChange={(e) => setFormData({ ...formData, addressDetail: e.target.value })}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fax">{t.fax}</Label>
            <Input
              id="fax"
              value={formData.fax}
              onChange={(e) => setFormData({ ...formData, fax: e.target.value })}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t.email}</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerServiceTel">{t.customerServiceTel}</Label>
            <Input
              id="customerServiceTel"
              value={formData.customerServiceTel}
              onChange={(e) => setFormData({ ...formData, customerServiceTel: e.target.value })}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerServiceEmail">{t.customerServiceEmail}</Label>
            <Input
              id="customerServiceEmail"
              type="email"
              value={formData.customerServiceEmail}
              onChange={(e) => setFormData({ ...formData, customerServiceEmail: e.target.value })}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessHours">{t.businessHours}</Label>
            <Input
              id="businessHours"
              value={formData.businessHours}
              onChange={(e) => setFormData({ ...formData, businessHours: e.target.value })}
              disabled={!isEditing}
              placeholder="평일 09:00-18:00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="onlineMarketingNumber">{t.onlineMarketingNumber}</Label>
            <Input
              id="onlineMarketingNumber"
              value={formData.onlineMarketingNumber}
              onChange={(e) => setFormData({ ...formData, onlineMarketingNumber: e.target.value })}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="privacyOfficerName">{t.privacyOfficerName}</Label>
            <Input
              id="privacyOfficerName"
              value={formData.privacyOfficerName}
              onChange={(e) => setFormData({ ...formData, privacyOfficerName: e.target.value })}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="privacyOfficerEmail">{t.privacyOfficerEmail}</Label>
            <Input
              id="privacyOfficerEmail"
              type="email"
              value={formData.privacyOfficerEmail}
              onChange={(e) => setFormData({ ...formData, privacyOfficerEmail: e.target.value })}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="companyIntroduction">{t.companyIntroduction}</Label>
            <Textarea
              id="companyIntroduction"
              value={formData.companyIntroduction}
              onChange={(e) => setFormData({ ...formData, companyIntroduction: e.target.value })}
              disabled={!isEditing}
              rows={4}
            />
          </div>
        </div>
      </Card>

      {/* 은행계좌 정보 */}
      <Card className="p-4 sm:p-6" data-tour="site-bank">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-muted-foreground" />
            <h3>{t.bankAccounts}</h3>
          </div>
          <Button onClick={handleAddBankAccount} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            {t.add}
          </Button>
        </div>

        {/* 모바일 카드 리스트 */}
        {bankAccounts.length === 0 ? (
          <p className="md:hidden text-center text-muted-foreground py-8 text-sm">
            {language === "ko" ? "등록된 계좌가 없습니다." : "No bank accounts."}
          </p>
        ) : (
          <div className="md:hidden divide-y divide-border -mx-4 sm:mx-0">
            {bankAccounts.map((account) => (
              <div key={account.id} className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{account.bankName}</p>
                  <p className="text-sm text-muted-foreground">{account.accountNumber}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-muted-foreground">{account.accountHolder}</p>
                    {account.visible ? (
                      <Badge className="bg-green-500 text-white border-green-600 text-[10px]">
                        <CheckCircle className="h-3 w-3 mr-1" />{t.active}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-gray-500 text-white text-[10px]">
                        <XCircle className="h-3 w-3 mr-1" />{t.inactive}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => handleEditBankAccount(account)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleteBankAccountId(account.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 데스크톱 테이블 */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.bankName}</TableHead>
                <TableHead>{t.accountNumber}</TableHead>
                <TableHead>{t.accountHolder}</TableHead>
                <TableHead className="text-center">{t.visible}</TableHead>
                <TableHead className="text-center">{t.displayOrder}</TableHead>
                <TableHead className="text-right">{t.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bankAccounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    {language === "ko" ? "등록된 계좌가 없습니다." : "No bank accounts."}
                  </TableCell>
                </TableRow>
              ) : (
                bankAccounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell>{account.bankName}</TableCell>
                    <TableCell>{account.accountNumber}</TableCell>
                    <TableCell>{account.accountHolder}</TableCell>
                    <TableCell className="text-center">
                      {account.visible ? (
                        <Badge className="bg-green-500 text-white border-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {t.active}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-gray-500 text-white border-gray-600">
                          <XCircle className="h-3 w-3 mr-1" />
                          {t.inactive}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">{account.displayOrder}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditBankAccount(account)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteBankAccountId(account.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* 약관 관리 */}
      <Card className="p-4 sm:p-6" data-tour="site-terms">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <h3>{t.terms}</h3>
          </div>
          <Button onClick={handleAddTerms} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            {t.add}
          </Button>
        </div>

        {/* 모바일 카드 리스트 */}
        {terms.length === 0 ? (
          <p className="md:hidden text-center text-muted-foreground py-8 text-sm">
            {language === "ko" ? "등록된 약관이 없습니다." : "No terms."}
          </p>
        ) : (
          <div className="md:hidden divide-y divide-border -mx-4 sm:mx-0">
            {terms.map((term) => (
              <div key={term.id} className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{term.title}</p>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    {term.required ? (
                      <Badge className="bg-blue-500 text-white border-blue-600 text-[10px]">
                        <CheckCircle className="h-3 w-3 mr-1" />{t.required}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">선택</Badge>
                    )}
                    {term.visible ? (
                      <Badge className="bg-green-500 text-white border-green-600 text-[10px]">
                        <CheckCircle className="h-3 w-3 mr-1" />{t.active}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-gray-500 text-white text-[10px]">
                        <XCircle className="h-3 w-3 mr-1" />{t.inactive}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => handleEditTerms(term)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleteTermsId(term.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 데스크톱 테이블 */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.termsTitle}</TableHead>
                <TableHead className="text-center">{t.required}</TableHead>
                <TableHead className="text-center">{t.visible}</TableHead>
                <TableHead className="text-center">{t.displayOrder}</TableHead>
                <TableHead className="text-right">{t.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {terms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    {language === "ko" ? "등록된 약관이 없습니다." : "No terms."}
                  </TableCell>
                </TableRow>
              ) : (
                terms.map((term) => (
                  <TableRow key={term.id}>
                    <TableCell>{term.title}</TableCell>
                    <TableCell className="text-center">
                      {term.required ? (
                        <Badge className="bg-blue-500 text-white border-blue-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {t.required}
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          선택
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {term.visible ? (
                        <Badge className="bg-green-500 text-white border-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {t.active}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-gray-500 text-white border-gray-600">
                          <XCircle className="h-3 w-3 mr-1" />
                          {t.inactive}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">{term.displayOrder}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditTerms(term)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTermsId(term.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* 최종 수정일 */}
      <div className="text-sm text-muted-foreground text-right">
        {t.lastUpdated}: {new Date(siteInfo.updatedAt).toLocaleString()}
      </div>

      {/* 은행계좌 추가/수정 다이얼로그 */}
      <Dialog open={bankAccountDialog} onOpenChange={setBankAccountDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingBankAccount ? t.editBankAccount : t.addBankAccount}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dialog-bankName">{t.bankName}</Label>
              <Input
                id="dialog-bankName"
                value={bankAccountForm.bankName}
                onChange={(e) =>
                  setBankAccountForm({ ...bankAccountForm, bankName: e.target.value })
                }
                placeholder="예: 국민은행"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dialog-accountNumber">{t.accountNumber}</Label>
              <Input
                id="dialog-accountNumber"
                value={bankAccountForm.accountNumber}
                onChange={(e) =>
                  setBankAccountForm({ ...bankAccountForm, accountNumber: e.target.value })
                }
                placeholder="예: 123-456-789012"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dialog-accountHolder">{t.accountHolder}</Label>
              <Input
                id="dialog-accountHolder"
                value={bankAccountForm.accountHolder}
                onChange={(e) =>
                  setBankAccountForm({ ...bankAccountForm, accountHolder: e.target.value })
                }
                placeholder="예: (주)티켓박스"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bank-dialog-displayOrder">{t.displayOrder}</Label>
              <Input
                id="bank-dialog-displayOrder"
                type="number"
                min={1}
                value={bankAccountForm.displayOrder ?? ""}
                onChange={(e) =>
                  setBankAccountForm({ ...bankAccountForm, displayOrder: e.target.value === "" ? undefined : parseInt(e.target.value) })
                }
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">노출 상태</Label>
              <div className="border rounded-md p-3 bg-muted/30 flex items-center gap-2">
                <Switch
                  id="dialog-visible"
                  checked={bankAccountForm.visible}
                  onCheckedChange={(checked) =>
                    setBankAccountForm({ ...bankAccountForm, visible: checked })
                  }
                />
                <Label htmlFor="dialog-visible" className="cursor-pointer">
                  {bankAccountForm.visible ? "활성" : "비활성"}
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBankAccountDialog(false)}>
              {t.cancel}
            </Button>
            <Button onClick={handleSaveBankAccount}>{t.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 약관 추가/수정 다이얼로그 */}
      <Dialog open={termsDialog} onOpenChange={setTermsDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTerms ? t.editTerms : t.addTerms}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dialog-termsTitle">{t.termsTitle}</Label>
              <Input
                id="dialog-termsTitle"
                value={termsForm.title}
                onChange={(e) => setTermsForm({ ...termsForm, title: e.target.value })}
                placeholder="예: 이용약관"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dialog-termsContent">{t.termsContent}</Label>
              <Textarea
                id="dialog-termsContent"
                value={termsForm.content}
                onChange={(e) => setTermsForm({ ...termsForm, content: e.target.value })}
                rows={10}
                placeholder="HTML 형식으로 작성 가능합니다."
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="terms-dialog-displayOrder">{t.displayOrder}</Label>
                <Input
                  id="terms-dialog-displayOrder"
                  type="number"
                  min={1}
                  value={termsForm.displayOrder ?? ""}
                  onChange={(e) =>
                    setTermsForm({ ...termsForm, displayOrder: e.target.value === "" ? undefined : parseInt(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs">필수 여부</Label>
                  <div className="border rounded-md p-3 bg-muted/30 flex items-center gap-2">
                    <Switch
                      id="dialog-required"
                      checked={termsForm.required}
                      onCheckedChange={(checked) =>
                        setTermsForm({ ...termsForm, required: checked })
                      }
                    />
                    <Label htmlFor="dialog-required" className="cursor-pointer">
                      {termsForm.required ? "필수" : "선택"}
                    </Label>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">노출 상태</Label>
                  <div className="border rounded-md p-3 bg-muted/30 flex items-center gap-2">
                    <Switch
                      id="dialog-terms-visible"
                      checked={termsForm.visible}
                      onCheckedChange={(checked) =>
                        setTermsForm({ ...termsForm, visible: checked })
                      }
                    />
                    <Label htmlFor="dialog-terms-visible" className="cursor-pointer">
                      {termsForm.visible ? "활성" : "비활성"}
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTermsDialog(false)}>
              {t.cancel}
            </Button>
            <Button onClick={handleSaveTerms}>{t.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 은행계좌 삭제 확인 다이얼로그 */}
      <AlertDialog
        open={!!deleteBankAccountId}
        onOpenChange={() => setDeleteBankAccountId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.delete}</AlertDialogTitle>
            <AlertDialogDescription>{t.deleteBankAccountConfirm}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteBankAccountId && handleDeleteBankAccount(deleteBankAccountId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 약관 삭제 확인 다이얼로그 */}
      <AlertDialog open={!!deleteTermsId} onOpenChange={() => setDeleteTermsId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.delete}</AlertDialogTitle>
            <AlertDialogDescription>{t.deleteTermsConfirm}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTermsId && handleDeleteTerms(deleteTermsId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CoachMark steps={siteTourSteps} isActive={isTourActive} onFinish={endTour} storageKey="site_info_tour" />
    </div>
  );
}