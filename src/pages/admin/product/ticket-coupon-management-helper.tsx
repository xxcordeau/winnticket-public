import type { TicketCouponStatus } from "@/data/dto/ticket-coupon.dto";

export function getCouponStatusBadgeClass(status: TicketCouponStatus): string {
  const baseClass = "text-xs";
  
  switch (status) {
    case "ACTIVE":
      return `${baseClass} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100`;
    case "USED":
      return `${baseClass} bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100`;
    case "EXPIRED":
      return `${baseClass} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100`;
    case "CANCELLED":
      return `${baseClass} bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100`;
    default:
      return baseClass;
  }
}

export function getCouponStatusLabel(status: TicketCouponStatus): string {
  switch (status) {
    case "ACTIVE":
      return "사용가능";
    case "USED":
      return "사용완료";
    case "EXPIRED":
      return "기간만료";
    case "CANCELLED":
      return "취소됨";
    default:
      return status;
  }
}
