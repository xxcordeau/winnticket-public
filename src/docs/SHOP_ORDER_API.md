# 쇼핑몰 주문 생성 API 가이드

## 개요

쇼핑몰에서 장바구니의 아이템을 주문으로 고정시키는 API입니다. 주문 생성 시점부터 가격, 옵션, 수량이 변하지 않으며, 하이브리드 방식으로 API 서버가 없을 때는 로컬 스토리지에 자동 저장됩니다.

## API 엔드포인트

### 쇼핑몰 주문 생성

```
POST /api/orders/shop
```

사용자의 장바구니 스냅샷을 주문으로 고정시킵니다.

## 요청 (Request)

### Request Body

```typescript
{
  channelId: string;        // 채널 ID (UUID)
  customerName: string;     // 고객 이름
  customerPhone: string;    // 고객 전화번호
  customerEmail: string;    // 고객 이메일
  totalPrice: number;       // 총 상품 금액
  discountPrice: number;    // 할인 금액
  items: [                  // 주문 아이템 배열
    {
      productId: string;    // 상품 ID (UUID)
      quantity: number;     // 수량
      unitPrice: number;    // 단가
      totalPrice: number;   // 총 금액 (단가 * 수량)
      options?: [           // 옵션 (선택사항)
        {
          optionId: string;       // 옵션 ID
          optionValueId: string;  // 옵션값 ID
        }
      ]
    }
  ]
}
```

### Request 예시

```json
{
  "channelId": "channel-uuid-1234",
  "customerName": "홍길동",
  "customerPhone": "01012345678",
  "customerEmail": "test@test.com",
  "totalPrice": 60000,
  "discountPrice": 10000,
  "items": [
    {
      "productId": "product-uuid-5678",
      "quantity": 2,
      "unitPrice": 30000,
      "totalPrice": 60000,
      "options": [
        {
          "optionId": "option-uuid-1",
          "optionValueId": "option-value-uuid-1"
        }
      ]
    }
  ]
}
```

## 응답 (Response)

### Response Body

```typescript
{
  success: boolean;
  data: {
    orderId: string;          // 주문 ID
    orderNumber: string;      // 주문 번호 (사용자용)
    customerName: string;     // 고객 이름
    customerEmail: string;    // 고객 이메일
    customerPhone: string;    // 고객 전화번호
    totalPrice: number;       // 총 상품 금액
    discountPrice: number;    // 할인 금액
    finalPrice: number;       // 최종 결제 금액
    status: string;           // 주문 상태 (PENDING/CONFIRMED/CANCELLED/COMPLETED)
    paymentStatus: string;    // 결제 상태 (PENDING/PAID/FAILED/REFUNDED)
    items: [                  // 주문 아이템 목록
      {
        orderItemId: string;       // 주문 아이템 ID
        productId: string;         // 상품 ID
        productName: string;       // 상품명
        quantity: number;          // 수량
        unitPrice: number;         // 단가
        totalPrice: number;        // 총 금액
        options?: [                // 옵션 정보
          {
            optionId: string;
            optionValueId: string;
            optionName?: string;
            optionValueName?: string;
          }
        ]
      }
    ];
    createdAt: string;        // 주문 생성일시 (ISO 8601)
  };
  message: string;
  timestamp: string;
}
```

### Response 예시 (성공)

```json
{
  "success": true,
  "data": {
    "orderId": "order-1704067200000-abc123",
    "orderNumber": "ORD20250101ABCDEF",
    "customerName": "홍길동",
    "customerEmail": "test@test.com",
    "customerPhone": "01012345678",
    "totalPrice": 60000,
    "discountPrice": 10000,
    "finalPrice": 50000,
    "status": "PENDING",
    "paymentStatus": "PENDING",
    "items": [
      {
        "orderItemId": "order-item-1",
        "productId": "product-uuid-5678",
        "productName": "아이유 콘서트 티켓",
        "quantity": 2,
        "unitPrice": 30000,
        "totalPrice": 60000,
        "options": [
          {
            "optionId": "option-uuid-1",
            "optionValueId": "option-value-uuid-1",
            "optionName": "좌석등급",
            "optionValueName": "VIP"
          }
        ]
      }
    ],
    "createdAt": "2025-01-01T00:00:00.000Z"
  },
  "message": "Order created successfully",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

## 프론트엔드 사용 방법

### 1. API 호출

```typescript
import { createShopOrder, type ShopOrderRequest } from '@/lib/api/order';
import { getCurrentChannel } from '@/data/channels';

// 주문 요청 데이터 구성
const orderRequest: ShopOrderRequest = {
  channelId: getCurrentChannel().id,
  customerName: "홍길동",
  customerPhone: "01012345678",
  customerEmail: "test@test.com",
  totalPrice: 60000,
  discountPrice: 10000,
  items: cartItems.map(item => ({
    productId: item.productId,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    totalPrice: item.quantity * item.unitPrice,
    options: item.options || []
  }))
};

// API 호출
const response = await createShopOrder(orderRequest);

if (response.success && response.data) {
  console.log('주문 번호:', response.data.orderNumber);
  console.log('최종 결제 금액:', response.data.finalPrice);
  
  // 주문 성공 처리
  // - 장바구니 비우기
  // - 주문 완료 페이지로 이동
} else {
  console.error('주문 실패:', response.message);
}
```

### 2. 장바구니 비우기 연동

```typescript
// 주문 성공 후 장바구니에서 구매한 아이템 제거
const cartItemIds = ['cart-item-1', 'cart-item-2'];

const savedCart = localStorage.getItem('shop_cart');
if (savedCart) {
  const cartItems = JSON.parse(savedCart);
  const updatedCart = cartItems.filter(
    (item: any) => !cartItemIds.includes(item.id)
  );
  localStorage.setItem('shop_cart', JSON.stringify(updatedCart));
  
  // 장바구니 업데이트 이벤트 발생
  window.dispatchEvent(new Event('cartUpdated'));
}
```

## 하이브리드 방식

API 서버 연결이 실패하면 자동으로 로컬 스토리지에 주문 데이터를 저장합니다.

### 로컬 스토리지 키

- `shop_orders`: 주문 목록 배열

### 주문 번호 생성 규칙

```typescript
// 형식: ORD + YYYYMMDD + 6자리 랜덤
// 예시: ORD20250101ABCDEF
const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
const orderNumber = `ORD${dateStr}${randomStr}`;
```

## 주문 상태

### status (주문 상태)
- `PENDING`: 입금 대기 중
- `CONFIRMED`: 주문 확정 (입금 완료)
- `CANCELLED`: 주문 취소
- `COMPLETED`: 주문 완료 (티켓 사용 완료)

### paymentStatus (결제 상태)
- `PENDING`: 결제 대기 중
- `PAID`: 결제 완료
- `FAILED`: 결제 실패
- `REFUNDED`: 환불 완료

## 주의사항

1. **주문 생성 시점 고정**: 주문이 생성되면 상품 가격, 옵션, 수량은 변경되지 않습니다.
2. **장바구니와 별도**: 주문은 장바구니의 스냅샷이므로, 장바구니 아이템을 수정해도 이미 생성된 주문에는 영향이 없습니다.
3. **자동 폴백**: API 서버가 없어도 로컬 스토리지에 주문이 저장되어 사용자 경험이 유지됩니다.
4. **주문번호 중복 방지**: 타임스탬프 + 랜덤 문자열로 주문번호를 생성하여 중복을 방지합니다.

## 에러 처리

```typescript
const response = await createShopOrder(orderRequest);

if (!response.success) {
  // 에러 메시지 표시
  toast.error(response.message || '주문 처리 중 오류가 발생했습니다.');
  
  // 에러 로깅
  console.error('Order creation failed:', response);
}
```

## 관련 파일

- API 소스: `/lib/api/order.ts`
- 주문 페이지: `/components/pages/shop/shop-order.tsx`
- 결제 안내 페이지: `/components/pages/shop/shop-payment-info.tsx`
- 장바구니 API: `/lib/api/shop-cart.ts`

## 다음 단계

백엔드 팀에서 `POST /api/orders/shop` 엔드포인트를 구현하면 자동으로 실제 서버로 주문이 전송됩니다. 구현 전까지는 로컬 스토리지에 저장되어 정상 동작합니다.
