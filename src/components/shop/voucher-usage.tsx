import { useState, useRef } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card } from "../ui/card";
import { Separator } from "../ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Gift, Search, Coins, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { getBenepiaPoint } from "../../lib/api/benepia";

type Language = "ko" | "en";

// 
export interface BenepiaInfo {
  benepiaId: string;
  benepiaPwd: string;
  memcorpCd: string;
}

interface VoucherUsageProps {
  language: Language;
  itemsTotal: number;
  onVoucherApplied: (amount: number, benepiaInfo: BenepiaInfo) => void;
}

export function VoucherUsage({ language, itemsTotal, onVoucherApplied }: VoucherUsageProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [voucherSerial, setVoucherSerial] = useState("");
  const [voucherBalance, setVoucherBalance] = useState(0);
  const [voucherAmount, setVoucherAmount] = useState(0);
  const [voucherApplied, setVoucherApplied] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  
  // 
  const [accountId, setAccountId] = useState("");
  const [accountPwd, setAccountPwd] = useState("");
  
  // 4 ( = memcorpCd)
  const [part1, setPart1] = useState("");
  const [part2, setPart2] = useState("");
  const [part3, setPart3] = useState("");
  const [part4, setPart4] = useState("");
  
  // ref
  const input1Ref = useRef<HTMLInputElement>(null);
  const input2Ref = useRef<HTMLInputElement>(null);
  const input3Ref = useRef<HTMLInputElement>(null);
  const input4Ref = useRef<HTMLInputElement>(null);

  const text = {
    ko: {
      title: "상품권 사용",
      openButton: "상품권 등록",
      modalTitle: "상품권 사용",
      serialLabel: "상품권 일련번호",
      serialPlaceholder: "0000",
      checkButton: "조회",
      balanceLabel: "상품권 잔액",
      useAmountLabel: "사용 금액",
      applyButton: "적용",
      cancelButton: "취소",
      appliedMessage: "상품권이 적용되었습니다",
      removeButton: "삭제",
      benepiaIdLabel: "베네피아 계정 ID",
      benepiaIdPlaceholder: "계정 ID 입력",
      benepiaPwdLabel: "베네피아 계정 비밀번호",
      benepiaPwdPlaceholder: "비밀번호 입력",
    },
    en: {
      title: "Use Voucher",
      openButton: "Register Voucher",
      modalTitle: "Use Voucher",
      serialLabel: "Voucher Serial Number",
      serialPlaceholder: "0000",
      checkButton: "Check",
      balanceLabel: "Voucher Balance",
      useAmountLabel: "Amount to Use",
      applyButton: "Apply",
      cancelButton: "Cancel",
      appliedMessage: "Voucher applied",
      removeButton: "Remove",
      benepiaIdLabel: "Benepia Account ID",
      benepiaIdPlaceholder: "Enter account ID",
      benepiaPwdLabel: "Benepia Account Password",
      benepiaPwdPlaceholder: "Enter password",
    },
  };

  const t = text[language];

  // 
  const handleInputChange = (
    value: string,
    setter: (v: string) => void,
    nextRef: React.RefObject<HTMLInputElement> | null
  ) => {
    // 
    const numericValue = value.replace(/\D/g, "").slice(0, 4);
    setter(numericValue);

    // 4 
    if (numericValue.length === 4 && nextRef?.current) {
      nextRef.current.focus();
    }

    // 
    setIsChecked(false);
    setVoucherBalance(0);
    setVoucherAmount(0);
  };

  // 
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    currentValue: string,
    prevRef: React.RefObject<HTMLInputElement> | null
  ) => {
    if (e.key === "Backspace" && currentValue === "" && prevRef?.current) {
      prevRef.current.focus();
    }
  };

  // ( )
  const handleCheckVoucher = async () => {
    // 
    if (!accountId.trim() || !accountPwd.trim()) {
      toast.error(language === "ko" ? "계정 정보를 입력해주세요" : "Please enter account information");
      return;
    }

    const loadingToast = toast.loading(language === "ko" ? "조회 중..." : "Checking...");

    try {
      // ( )
      const fullSerial = part1 && part2 && part3 && part4 
        ? `${part1}-${part2}-${part3}-${part4}` 
        : "";
      
      // amount 10 ( )
      const response = await getBenepiaPoint({
        amount: 10,
        benepiaId: accountId,
        benepiaPwd: accountPwd,
        memcorpCd: fullSerial, // ()
      });

      toast.dismiss(loadingToast);

      if (response.success && response.data) {
        const balance = response.data.rsv_pnt;
        setVoucherBalance(balance);
        setVoucherAmount(Math.min(balance, itemsTotal));
        setIsChecked(true);
        setVoucherSerial(fullSerial || accountId); // ID 
        toast.success(
          language === "ko" 
            ? `사용 가능 금액: ${balance.toLocaleString()}원` 
            : `Available: ${balance.toLocaleString()} KRW`
        );
      } else {
        toast.error(response.message || (language === "ko" ? "조회에 실패했습니다" : "Failed to check"));
        setVoucherBalance(0);
        setVoucherAmount(0);
        setIsChecked(false);
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error(language === "ko" ? "조회 중 오류가 발생했습니다" : "Error occurred");
      setVoucherBalance(0);
      setVoucherAmount(0);
      setIsChecked(false);
    }
  };

  // 
  const handleApplyVoucher = () => {
    if (!voucherSerial || voucherBalance === 0) {
      toast.error(language === "ko" ? "상품권을 먼저 조회해주세요" : "Please check voucher first");
      return;
    }

    if (voucherAmount === 0 || voucherAmount > voucherBalance) {
      toast.error(language === "ko" ? "사용 금액을 확인해주세요" : "Please check amount");
      return;
    }

    if (voucherAmount > itemsTotal) {
      toast.error(language === "ko" ? "주문 금액보다 많이 사용할 수 없습니다" : "Cannot exceed order amount");
      return;
    }

    setVoucherApplied(true);
    setDialogOpen(false);
    onVoucherApplied(voucherAmount, { benepiaId: accountId, benepiaPwd: accountPwd, memcorpCd: voucherSerial });
    toast.success(language === "ko" ? `${voucherAmount.toLocaleString()}원 상품권이 적용되었습니다` : `${voucherAmount.toLocaleString()} KRW voucher applied`);
  };

  // 
  const handleRemoveVoucher = () => {
    setVoucherSerial("");
    setVoucherBalance(0);
    setVoucherAmount(0);
    setVoucherApplied(false);
    setIsChecked(false);
    onVoucherApplied(0, { benepiaId: "", benepiaPwd: "", memcorpCd: "" });
    toast.success(language === "ko" ? "상품권이 삭제되었습니다" : "Voucher removed");
  };

  return (
    <>
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Gift className="h-5 w-5" />
          {t.title}
        </h2>
        <Separator className="mb-4" />

        <div className="space-y-4">
          {voucherApplied ? (
            <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg border-2 border-green-400 dark:border-green-500">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <span className="block font-bold text-green-700 dark:text-green-300 text-lg">✓ 적용 완료</span>
                    <span className="text-xs font-mono text-muted-foreground">{voucherSerial}</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={handleRemoveVoucher} className="text-muted-foreground hover:text-foreground">
                  {t.removeButton}
                </Button>
              </div>
              <Separator className="my-3" />
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">{language === "ko" ? "할인 금액" : "Discount Amount"}</div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {voucherAmount.toLocaleString()}{language === "ko" ? "원" : " KRW"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground mb-1">{language === "ko" ? "잔액" : "Balance"}</div>
                  <div className="text-sm font-semibold">
                    {voucherBalance.toLocaleString()}{language === "ko" ? "원" : " KRW"}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <Button variant="outline" className="w-full" onClick={() => setDialogOpen(true)}>
              <Gift className="h-4 w-4 mr-2" />
              {t.openButton}
            </Button>
          )}
        </div>
      </Card>

      {/* 상품권 등록 모달 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t.modalTitle}</DialogTitle>
            <DialogDescription className="sr-only">
              상품권 일련번호를 입력하고 사용할 금액을 설정하세요.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* 베네피아 계정 정보 입력 */}
            <div className="space-y-2">
              <Label htmlFor="benepiaId">{t.benepiaIdLabel}</Label>
              <Input
                id="benepiaId"
                type="text"
                value={accountId}
                onChange={(e) => {
                  setAccountId(e.target.value);
                  setIsChecked(false);
                  setVoucherBalance(0);
                  setVoucherAmount(0);
                }}
                placeholder={t.benepiaIdPlaceholder}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="benepiaPwd">{t.benepiaPwdLabel}</Label>
              <Input
                id="benepiaPwd"
                type="password"
                value={accountPwd}
                onChange={(e) => {
                  setAccountPwd(e.target.value);
                  setIsChecked(false);
                  setVoucherBalance(0);
                  setVoucherAmount(0);
                }}
                placeholder={t.benepiaPwdPlaceholder}
              />
            </div>

            {/* 일련번호 입력 */}
            <div className="space-y-2">
              <Label>{t.serialLabel}</Label>
              <div className="flex gap-2">
                <Input
                  ref={input1Ref}
                  type="text"
                  value={part1}
                  onChange={(e) => handleInputChange(e.target.value, setPart1, input2Ref)}
                  onKeyDown={(e) => handleKeyDown(e, part1, null)}
                  placeholder={t.serialPlaceholder}
                  className="w-1/4"
                />
                <Input
                  ref={input2Ref}
                  type="text"
                  value={part2}
                  onChange={(e) => handleInputChange(e.target.value, setPart2, input3Ref)}
                  onKeyDown={(e) => handleKeyDown(e, part2, input1Ref)}
                  placeholder={t.serialPlaceholder}
                  className="w-1/4"
                />
                <Input
                  ref={input3Ref}
                  type="text"
                  value={part3}
                  onChange={(e) => handleInputChange(e.target.value, setPart3, input4Ref)}
                  onKeyDown={(e) => handleKeyDown(e, part3, input2Ref)}
                  placeholder={t.serialPlaceholder}
                  className="w-1/4"
                />
                <Input
                  ref={input4Ref}
                  type="text"
                  value={part4}
                  onChange={(e) => handleInputChange(e.target.value, setPart4, null)}
                  onKeyDown={(e) => handleKeyDown(e, part4, input3Ref)}
                  placeholder={t.serialPlaceholder}
                  className="w-1/4"
                />
              </div>
            </div>

            <Button 
              onClick={handleCheckVoucher} 
              className="w-full"
              disabled={!accountId.trim() || !accountPwd.trim()}
            >
              <Search className="h-4 w-4 mr-2" />
              {t.checkButton}
            </Button>

            {/* 포인트 조회 후 정보 표시 */}
            {isChecked && voucherBalance > 0 && (
              <>
                <div className="space-y-2">
                  <Label>{t.balanceLabel}</Label>
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-lg font-semibold text-blue-700 dark:text-blue-300">
                      {voucherBalance.toLocaleString()}{language === "ko" ? "원" : " KRW"}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="voucherAmount">{t.useAmountLabel}</Label>
                  <div className="relative">
                    <Input
                      id="voucherAmount"
                      type="number"
                      value={voucherAmount}
                      onChange={(e) => {
                        const value = Math.min(
                          Number(e.target.value),
                          Math.min(voucherBalance, itemsTotal)
                        );
                        setVoucherAmount(value);
                      }}
                      max={Math.min(voucherBalance, itemsTotal)}
                      min={0}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      {language === "ko" ? "원" : "KRW"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {language === "ko"
                      ? `최대 ${Math.min(voucherBalance, itemsTotal).toLocaleString()}원까지 사용 가능`
                      : `Max ${Math.min(voucherBalance, itemsTotal).toLocaleString()} KRW`}
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>
              {t.cancelButton}
            </Button>
            <Button className="flex-1" onClick={handleApplyVoucher} disabled={!isChecked || voucherBalance === 0}>
              {t.applyButton}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}