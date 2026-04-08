import { useParams, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  User,
  Key,
  Calendar,
  Edit,
  Save,
  X,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { getSupervisor, updateSupervisor } from "@/data/supervisors";
import { getCurrentUser } from "@/lib/api/auth";
import { getPartnerDetail } from "@/lib/api/partner";
import { PageHeader } from "@/components/page-header";
import { Supervisor } from "@/data/dto/supervisor.dto";

type Language = "ko" | "en";

interface SupervisorDetailProps {
  language: Language;
}

export function SupervisorDetail({ language }: SupervisorDetailProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [supervisor, setSupervisor] = useState<Supervisor | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  useEffect(() => {
    const loadUserData = async () => {
      // API 
      const currentUser = getCurrentUser();
      
      if (!currentUser) {
        toast.error('로그인 정보를 찾을 수 없습니다.');
        navigate('/login');
        return;
      }


      // API Supervisor 
      let supervisorData: Supervisor = {
        id: currentUser.id,
        username: currentUser.accountId,
        password: '********', // 
        name: currentUser.name,
        email: '', // API 
        phone: '', // API 
        logoUrl: currentUser.avatarUrl || '',
        partnerId: currentUser.partnerId || '',
        partnerName: '', // API 
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // partnerId 
      if (currentUser.partnerId) {
        try {
          const partnerResponse = await getPartnerDetail(currentUser.partnerId);
          
          if (partnerResponse.success && partnerResponse.data) {
            const partner = partnerResponse.data;
            
            // 
            supervisorData = {
              ...supervisorData,
              name: partner.name, // 
              logoUrl: partner.logoUrl || supervisorData.logoUrl,
              partnerName: partner.name,
              email: partner.email || supervisorData.email,
              phone: partner.phone || supervisorData.phone,
            };
          }
        } catch (error) {
        }
      }

      setSupervisor(supervisorData);
      setEditFormData({
        name: supervisorData.name,
        email: supervisorData.email,
        phone: supervisorData.phone,
        password: supervisorData.password,
      });
    };

    loadUserData();
  }, [id, navigate]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (supervisor) {
      setEditFormData({
        name: supervisor.name,
        email: supervisor.email,
        phone: supervisor.phone,
        password: supervisor.password,
      });
    }
    setIsEditing(false);
  };

  const handleSave = () => {
    if (!id) return;

    const response = updateSupervisor(id, editFormData);
    if (response.success) {
      toast.success("현장관리자 정보가 수정되었습니다.");
      setSupervisor(response.data);
      setIsEditing(false);
    } else {
      toast.error(response.message);
    }
  };

  const text = {
    ko: {
      title: "현장관리자 상세",
      subtitle: "현장관리자 정보를 확인합니다.",
      back: "뒤로 가기",
      basicInfo: "기본 정보",
      accountInfo: "계정 정보",
      name: "이름",
      username: "아이디",
      password: "비밀번호",
      email: "이메일",
      phone: "전화번호",
      partner: "소속 파트너",
      role: "권한",
      status: "상태",
      active: "활성",
      inactive: "비활성",
      createdAt: "등록일",
      notFound: "현장관리자 정보를 찾을 수 없습니다.",
      edit: "수정",
      save: "저장",
      cancel: "취소",
      supervisor: "현장관리자",
    },
    en: {
      title: "Supervisor Detail",
      subtitle: "View supervisor information.",
      back: "Back",
      basicInfo: "Basic Information",
      accountInfo: "Account Information",
      name: "Name",
      username: "Username",
      password: "Password",
      email: "Email",
      phone: "Phone",
      partner: "Partner",
      role: "Role",
      status: "Status",
      active: "Active",
      inactive: "Inactive",
      createdAt: "Created At",
      notFound: "Supervisor not found.",
      edit: "Edit",
      save: "Save",
      cancel: "Cancel",
      supervisor: "Supervisor",
    },
  };

  const t = text[language];

  if (!supervisor) {
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === "ko" ? "ko-KR" : "en-US");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <PageHeader
          title={supervisor.name}
          subtitle={`${t.username}: ${supervisor.username}`}
          language={language}
          actions={
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-500/10 text-blue-500">
                <Shield className="h-3 w-3 mr-1" />
                {t.supervisor}
              </Badge>
              <Badge
                className={
                  supervisor.active
                    ? "bg-green-500/10 text-green-500"
                    : "bg-gray-500/10 text-gray-500"
                }
              >
                {supervisor.active ? t.active : t.inactive}
              </Badge>
            </div>
          }
        />
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="cursor-pointer hover:scale-105 transition-all"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t.back}
        </Button>
      </div>

      {/* 기본 정보 카드 */}
      <Card className="p-6">
        <div className="space-y-6">
          {/* Header with Avatar and Edit Button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {supervisor.logoUrl ? (
                <img
                  src={supervisor.logoUrl}
                  alt={supervisor.name}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl font-semibold text-primary">
                    {supervisor.name.charAt(0)}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-2xl font-semibold">{supervisor.name}</h2>
                <p className="text-muted-foreground">@{supervisor.username}</p>
              </div>
            </div>
            {!isEditing ? (
              <Button
                onClick={handleEdit}
                className="cursor-pointer hover:scale-105 transition-all"
              >
                <Edit className="h-4 w-4 mr-2" />
                {t.edit}
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="cursor-pointer hover:scale-105 transition-all"
                >
                  <X className="h-4 w-4 mr-2" />
                  {t.cancel}
                </Button>
                <Button
                  onClick={handleSave}
                  className="cursor-pointer hover:scale-105 transition-all"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {t.save}
                </Button>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t" />

          {/* Account Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t.accountInfo}</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {/* Username */}
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">{t.username}</p>
                  <p className="font-medium">{supervisor.username}</p>
                </div>
              </div>

              {/* Password */}
              <div className="flex items-start gap-3">
                <Key className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <Label className="text-sm text-muted-foreground">
                    {t.password}
                  </Label>
                  {isEditing ? (
                    <Input
                      type="text"
                      value={editFormData.password}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          password: e.target.value,
                        })
                      }
                      className="mt-1"
                    />
                  ) : (
                    <p className="font-medium">{supervisor.password}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t" />

          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t.basicInfo}</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {/* Name */}
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <Label className="text-sm text-muted-foreground">
                    {t.name}
                  </Label>
                  {isEditing ? (
                    <Input
                      value={editFormData.name}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          name: e.target.value,
                        })
                      }
                      className="mt-1"
                    />
                  ) : (
                    <p className="font-medium">{supervisor.name}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <Label className="text-sm text-muted-foreground">
                    {t.email}
                  </Label>
                  {isEditing ? (
                    <Input
                      type="email"
                      value={editFormData.email}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          email: e.target.value,
                        })
                      }
                      className="mt-1"
                    />
                  ) : (
                    <p className="font-medium">{supervisor.email}</p>
                  )}
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <Label className="text-sm text-muted-foreground">
                    {t.phone}
                  </Label>
                  {isEditing ? (
                    <Input
                      type="tel"
                      value={editFormData.phone}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          phone: e.target.value,
                        })
                      }
                      className="mt-1"
                    />
                  ) : (
                    <p className="font-medium">{supervisor.phone}</p>
                  )}
                </div>
              </div>

              {/* Partner */}
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">{t.partner}</p>
                  <p className="font-medium">{supervisor.partnerName}</p>
                </div>
              </div>

              {/* Role */}
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">{t.role}</p>
                  <Badge className="bg-blue-500/10 text-blue-500 mt-1">
                    {t.supervisor}
                  </Badge>
                </div>
              </div>

              {/* Created At */}
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">{t.createdAt}</p>
                  <p className="font-medium">{formatDate(supervisor.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
export default SupervisorDetail;
