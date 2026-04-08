import { useState, useEffect } from "react";
import { ShopHeader } from "@/components/shop-header";
import { getCompanyIntro, type CompanyIntroResponse } from "@/lib/api/site-info";
import { Building2, Phone, Mail, FileText, MapPin, Calendar } from "lucide-react";

type Language = "ko" | "en";

interface ShopCompanyInfoProps {
  language: Language;
}

export function ShopCompanyInfo({ language }: ShopCompanyInfoProps) {
  const [companyInfo, setCompanyInfo] = useState<CompanyIntroResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompanyInfo = async () => {
      setLoading(true);
      const response = await getCompanyIntro();
      if (response.success && response.data) {
        setCompanyInfo(response.data);
      }
      setLoading(false);
    };

    fetchCompanyInfo();
  }, []);

  const text = {
    ko: {
      title: "회사소개",
      basicInfo: "기본 정보",
      companyName: "회사명",
      ceoName: "대표자",
      businessNumber: "사업자등록번호",
      establishedDate: "설립일",
      contactInfo: "연락처 정보",
      phone: "전화번호",
      email: "이메일",
      address: "주소",
      companyIntro: "회사 소개",
      loading: "로딩 중...",
      noData: "회사 정보가 없습니다.",
    },
    en: {
      title: "Company Information",
      basicInfo: "Basic Information",
      companyName: "Company Name",
      ceoName: "CEO",
      businessNumber: "Business Number",
      establishedDate: "Established Date",
      contactInfo: "Contact Information",
      phone: "Phone",
      email: "Email",
      address: "Address",
      companyIntro: "Company Introduction",
      loading: "Loading...",
      noData: "No company information available.",
    },
  };

  const t = text[language];

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <ShopHeader language={language} />
        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">{t.loading}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <ShopHeader language={language} />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="h-8 w-8 text-primary" />
            <h1 className="text-3xl">{t.title}</h1>
          </div>
        </div>

        {companyInfo ? (
          <div className="space-y-8">
            {/* 회사 소개 */}
            {companyInfo.companyIntroduction && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {t.companyIntro}
                </h2>
                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {companyInfo.companyIntroduction}
                  </p>
                </div>
              </div>
            )}

            {/* 기본 정보 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl mb-4">{t.basicInfo}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-muted-foreground mb-1">{t.companyName}</dt>
                  <dd className="font-medium">{companyInfo.companyName}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground mb-1">{t.ceoName}</dt>
                  <dd className="font-medium">{companyInfo.ceoName}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground mb-1">{t.businessNumber}</dt>
                  <dd className="font-medium">{companyInfo.businessNumber}</dd>
                </div>
                {companyInfo.establishedDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <dt className="text-sm text-muted-foreground mb-1">{t.establishedDate}</dt>
                      <dd className="font-medium">{companyInfo.establishedDate}</dd>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 연락처 정보 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl mb-4">{t.contactInfo}</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <dt className="text-sm text-muted-foreground mb-1">{t.phone}</dt>
                    <dd className="font-medium">{companyInfo.tel}</dd>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <dt className="text-sm text-muted-foreground mb-1">{t.email}</dt>
                    <dd className="font-medium">{companyInfo.email}</dd>
                  </div>
                </div>
                {companyInfo.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-1" />
                    <div>
                      <dt className="text-sm text-muted-foreground mb-1">{t.address}</dt>
                      <dd className="font-medium">{companyInfo.address}</dd>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">{t.noData}</p>
          </div>
        )}
      </main>
    </div>
  );
}
export default ShopCompanyInfo;
