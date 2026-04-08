import { useParams, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Mail, Phone, Building2, User, Calendar, Badge } from "lucide-react";
import { authStore } from "@/data/auth";
import { employeeStore } from "@/data/employees";
import { getSupervisor } from "@/data/supervisors";
import { getCurrentUser } from "@/lib/api/auth";
import { PageHeader } from "@/components/page-header";
import { toast } from "sonner";

type Language = "ko" | "en";

interface EmployeeDetailProps {
  language: Language;
}

interface ProfileData {
  id: string;
  name: string;
  username?: string;
  accountId?: string;
  password?: string;
  email: string;
  phone: string;
  organization?: string;
  partnerName?: string;
  position?: string;
  active?: boolean;
  status?: string;
  joinDate?: string;
  avatarUrl?: string;
  logoUrl?: string;
  createdAt?: string;
  userType: "employee" | "supervisor" | "admin";
}

export function EmployeeDetail({ language }: EmployeeDetailProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);


  useEffect(() => {
    // API 
    const currentUser = getCurrentUser();
    
    if (!currentUser) {
      toast.error('로그인 정보를 찾을 수 없습니다.');
      navigate('/login');
      return;
    }


    // API ProfileData 
    const profileData: ProfileData = {
      id: currentUser.id,
      name: currentUser.name,
      accountId: currentUser.accountId,
      username: currentUser.accountId,
      password: '********', // 
      email: '', // API 
      phone: '', // API 
      avatarUrl: currentUser.avatarUrl || '',
      organization: '',
      position: currentUser.roleId === 'ROLE001' ? '관리자' : '직원',
      status: 'active',
      active: true,
      joinDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      userType: currentUser.userType === 'supervisor' ? 'supervisor' : 'admin',
      partnerName: '',
    };

    setProfile(profileData);
  }, [id, navigate]);

  const text = {
    ko: {
      title: "내 프로필",
      subtitle: "내 정보를 확인합니다.",
      back: "뒤로 가기",
      basicInfo: "기본 정보",
      name: "이름",
      username: "아이디",
      accountId: "계정 ID",
      password: "비밀번호",
      email: "이메일",
      phone: "전화번호",
      notFound: "프로필 정보를 찾을 수 없습니다.",
    },
    en: {
      title: "My Profile",
      subtitle: "View my information.",
      back: "Back",
      basicInfo: "Basic Information",
      name: "Name",
      username: "Username",
      accountId: "Account ID",
      password: "Password",
      email: "Email",
      phone: "Phone",
      notFound: "Profile not found.",
    },
  };

  const t = text[language];

  if (!profile) {
    return (
      <div className="space-y-6">
        <PageHeader title={t.title} subtitle={t.subtitle} language={language} />
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">{t.notFound}</p>
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="mt-4 cursor-pointer hover:scale-105 transition-all"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t.back}
          </Button>
        </Card>
      </div>
    );
  }

  const avatarSrc = profile.avatarUrl || profile.logoUrl;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <PageHeader title={t.title} subtitle={t.subtitle} language={language} />
        <Button 
          variant="outline" 
          onClick={() => navigate(-1)}
          className="cursor-pointer hover:scale-105 transition-all"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t.back}
        </Button>
      </div>

      {/* Profile Card */}
      <Card className="p-6">
        <div className="space-y-6">
          {/* Header with Avatar */}
          <div className="flex items-center gap-4">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={profile.name}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl font-semibold text-primary">
                  {profile.name.charAt(0)}
                </span>
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-2xl font-semibold">{profile.name}</h2>
              {profile.username && (
                <p className="text-muted-foreground">@{profile.username}</p>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t" />

          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t.basicInfo}</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {/* Username */}
              {profile.username && (
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t.username}</p>
                    <p className="font-medium">{profile.username}</p>
                  </div>
                </div>
              )}

              {/* Password */}
              {profile.password && (
                <div className="flex items-start gap-3">
                  <Badge className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t.password}</p>
                    <p className="font-medium">{profile.password}</p>
                  </div>
                </div>
              )}

              {/* Email */}
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">{t.email}</p>
                  <p className="font-medium">{profile.email}</p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">{t.phone}</p>
                  <p className="font-medium">{profile.phone}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
export default EmployeeDetail;
