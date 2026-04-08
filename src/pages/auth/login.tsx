import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Eye,
  EyeOff,
  LogIn,
  ShoppingBag,
  Store,
  ChevronDown,
} from "lucide-react";
import { authStore } from "@/data/auth";
import { login as apiLogin } from "@/lib/api/auth";
import { toast } from "sonner";
import logoImage from "@/assets/1e9c9bc30e0ca074f3b3154198e56d5fc9accd11.png";
import { getChannels as getChannelsLocal } from "@/data/channels"; // 로컬 폴백
import * as ChannelAPI from "@/lib/api/channel"; // ⭐ 실제 채널 API
import type { Channel } from "@/data/dto/channel.dto";
import { isApiOnlyMode } from "@/lib/data-mode"; // ⭐ 추가

type Language = "ko" | "en";

interface LoginProps {
  language: Language;
  onLoginSuccess: () => void;
}

export function Login({
  language,
  onLoginSuccess,
}: LoginProps) {
  const navigate = useNavigate();
  const [accountId, setAccountId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordField, setShowPasswordField] =
    useState(false);
  const [showLoginButton, setShowLoginButton] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [channels, setChannels] = useState<Channel[]>([]);
  const [showDemoAccounts, setShowDemoAccounts] =
    useState(false);

  const text = {
    ko: {
      title: "관리자 로그인",
      subtitle: "계정 정보를 입력하세요",
      accountId: "계정 ID",
      password: "비밀번호",
      login: "로그인",
      accountIdPlaceholder: "계정 ID를 입력하세요",
      passwordPlaceholder: "비밀번호를 입력하세요",
      demoAccounts: "데모 계정",
      channelDemo: "채널별 쇼핑몰",
      admin: "관리자",
      loginSuccess: "로그인 성공",
      fillFields: "계정 ID와 비밀번호를 입력하세요",
      goToShop: "쇼핑몰 바로가기",
      channelInfo:
        "각 채널은 동일한 서비스지만 브랜딩이 다르게 적용됩니다",
      loginFailed: "계정 정보를 다시 확인해주세요.",
      loginError:
        "로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
    },
    en: {
      title: "Admin Login",
      subtitle: "Enter your account information",
      accountId: "Account ID",
      password: "Password",
      login: "Login",
      accountIdPlaceholder: "Enter account ID",
      passwordPlaceholder: "Enter password",
      demoAccounts: "Demo Account",
      channelDemo: "Channel Shops",
      admin: "Admin",
      loginSuccess: "Login successful",
      fillFields: "Please enter account ID and password",
      goToShop: "Go to Shop",
      channelInfo:
        "Each channel shows different branding for the same service",
      loginFailed: "Please check your account information.",
      loginError:
        "An error occurred during login. Please try again later.",
    },
  };

  const t = text[language];

  const demoAccounts = [
    {
      label: t.admin,
      accountId: "admin",
      password: "demo",
      role: "관리자",
      description: "전체 시스템 관리",
    },
    {
      label: "테스트 계정",
      accountId: "demo",
      password: "demo",
      role: "관리자",
      description: "토큰 없이 테스트",
    },
    {
      label: "현장관리자",
      accountId: "field",
      password: "demo",
      role: "현장관리자",
      description: "샤롯데씨어터",
    },
    {
      label: "현장관리자2",
      accountId: "manager",
      password: "demo",
      role: "현장관리자",
      description: "하이브 엔터테인먼트",
    },
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!accountId || !password) {
      toast.error(t.fillFields);
      return;
    }

    setIsLoading(true);
    setHasError(false);
    setErrorMessage("");

    try {
      // ⭐ API_ONLY 모드가 아닐 때만 테스트 로그인 허용
      if (
        !isApiOnlyMode() &&
        accountId === "demo" &&
        password === "demo"
      ) {
        const testUser = {
          id: "test-user-001",
          name: "테스트 관리자",
          accountId: "token",
          roleId: "ROLE001",
          userType: "admin",
          partnerId: undefined,
        };

        localStorage.setItem(
          "auth-user",
          JSON.stringify(testUser),
        );
        localStorage.setItem(
          "access_token",
          "test_access_token_" + Date.now(),
        ); // ⭐ auth-token → access_token

        toast.success(
          `${t.loginSuccess}! ${testUser.name}님 환영합니다.`,
        );
        onLoginSuccess();
        navigate("/admin");
        setIsLoading(false);
        return;
      }

      // API 로그인 시도
      const apiResult = await apiLogin({ accountId, password });

      if (apiResult.success && apiResult.data) {
        // API 로그인 성공 - 사용자 정보를 authStore에 직접 저장
        const user: any = {
          id: apiResult.data.user.id,
          name: apiResult.data.user.name,
          accountId: apiResult.data.user.accountId,
          roleId: apiResult.data.user.roleId,
          userType: apiResult.data.user.userType,
          partnerId: apiResult.data.user.partnerId,
        };

        localStorage.setItem("auth-user", JSON.stringify(user));
        localStorage.setItem(
          "access_token",
          apiResult.data.accessToken,
        ); // ⭐ auth-token → access_token
        if (apiResult.data.refreshToken) {
          localStorage.setItem(
            "refresh_token",
            apiResult.data.refreshToken,
          ); // ⭐ auth-refresh-token → refresh_token
        }

        toast.success(
          `${t.loginSuccess}! ${apiResult.data.user.name}님 환영합니다.`,
        );
        onLoginSuccess();

        // ROLE001 (관리자)는 관리자 페이지로, ROLE002 (현장관리자)는 handleLoginSuccess에서 주문관리로 리디렉트
        if (apiResult.data.user.roleId === "ROLE001") {
          navigate("/admin");
        }
        // ROLE002는 handleLoginSuccess에서 /admin/orders로 리다이렉트됨
      } else {
        // 로그인 실패 - API 에러 메시지를 한국어로 변환
        const errorMsg = apiResult.message || "";
        let koreanErrorMsg = t.loginFailed;

        // API 에러 메시지 한국어 매핑
        if (errorMsg.includes("Account not found") || errorMsg.includes("not found")) {
          koreanErrorMsg = "계정 정보를 찾을 수 없습니다.";
        } else if (errorMsg.includes("Invalid password") || errorMsg.includes("password")) {
          koreanErrorMsg = "비밀번호가 일치하지 않습니다.";
        } else if (errorMsg.includes("Account is disabled") || errorMsg.includes("disabled")) {
          koreanErrorMsg = "비활성화된 계정입니다.";
        } else if (errorMsg.includes("Account is locked") || errorMsg.includes("locked")) {
          koreanErrorMsg = "잠긴 계정입니다. 관리자에게 문의하세요.";
        }

        setHasError(true);
        setErrorMessage(koreanErrorMsg);
        toast.error(koreanErrorMsg);
      }
    } catch (error) {
      console.error("로그인 오류:", error);
      setHasError(true);
      setErrorMessage(t.loginError);
      toast.error(t.loginError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = (account: {
    accountId: string;
    password: string;
  }) => {
    setAccountId(account.accountId);
    setPassword(account.password);
    // 데모 버튼 클릭 시 모든 필드 즉시 표시
    setShowPasswordField(true);
    setShowLoginButton(true);

    // 자동 로그인
    setTimeout(() => {
      const event = new Event("submit", {
        bubbles: true,
        cancelable: true,
      });
      document.querySelector("form")?.dispatchEvent(event);
    }, 100);
  };

  // 아이디 입력 감지
  const handleAccountIdChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = e.target.value;
    setAccountId(value);
    setHasError(false); // 입력 시 에러 초기화
    setErrorMessage("");

    // 아이디가 입력되면 비밀번호 필드 표시
    if (value.length > 0) {
      setShowPasswordField(true);
    } else {
      setShowPasswordField(false);
      setShowLoginButton(false);
      setPassword("");
    }
  };

  // 비밀번호 입력 감지
  const handlePasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = e.target.value;
    setPassword(value);
    setHasError(false); // 입력 시 에러 초기화
    setErrorMessage("");

    // 비밀번호가 입력되면 로그인 버튼 표시
    if (value.length > 0) {
      setShowLoginButton(true);
    } else {
      setShowLoginButton(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* 로고 및 타이틀 */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-2 h-12 overflow-hidden">
            <img
              src={logoImage}
              alt="WinnTicket"
              className="h-6 object-contain"
            />
          </div>
          <h1 className="text-3xl">{t.title}</h1>
          <p className="text-muted-foreground mt-2">
            {t.subtitle}
          </p>
        </div>

        {/* 로그인 폼 */}
        <Card className="p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="accountId" className="text-base">
                {t.accountId}
              </Label>
              <Input
                id="accountId"
                type="text"
                value={accountId}
                onChange={handleAccountIdChange}
                placeholder={t.accountIdPlaceholder}
                autoComplete="username"
                className={`h-12 text-base ${hasError ? "border-red-500 focus-visible:ring-red-500" : ""}`}
              />
            </div>

            {showPasswordField && (
              <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                <Label htmlFor="password" className="text-base">
                  {t.password}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={handlePasswordChange}
                    placeholder={t.passwordPlaceholder}
                    autoComplete="current-password"
                    className={`pr-10 h-12 text-lg font-medium ${hasError ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* 에러 메시지 */}
            {hasError && errorMessage && (
              <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-3 animate-in slide-in-from-top-2 duration-300">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {errorMessage}
                </p>
              </div>
            )}

            {showLoginButton && (
              <Button
                type="submit"
                className="w-full bg-[#0c8ce9] hover:bg-[#0c8ce9]/90 animate-in slide-in-from-top-2 duration-300 h-12 text-lg hover:scale-100"
                disabled={isLoading}
              >
                <LogIn className="h-5 w-5 mr-2" />
                {isLoading ? "..." : t.login}
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              className="w-full h-12 text-lg hover:scale-100"
              onClick={() => navigate("/")}
            >
              <ShoppingBag className="h-5 w-5 mr-2" />
              {t.goToShop}
            </Button>
          </form>
        </Card>

        {/* 데모 계정 안내 */}
        {/* <Card className="p-6">
          <button
            type="button"
            onClick={() => setShowDemoAccounts(!showDemoAccounts)}
            className="w-full flex items-center justify-between mb-3 hover:opacity-70 transition-opacity"
          >
            <h3 className="font-medium">{t.demoAccounts}</h3>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${showDemoAccounts ? 'rotate-180' : ''}`}
            />
          </button>
          {showDemoAccounts && (
            <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
              {demoAccounts.map((account, index) => (
                <button
                  key={index}
                  onClick={() => handleDemoLogin(account)}
                  className="w-full text-left p-3 rounded-lg border hover:bg-accent hover:border-[#0c8ce9] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{account.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {account.accountId} / {account.password}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {account.description}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {account.role}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card> */}
      </div>
    </div>
  );
}

function Badge({
  children,
  variant,
  className,
}: {
  children: React.ReactNode;
  variant?: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${className}`}
    >
      {children}
    </span>
  );
}

export default Login;