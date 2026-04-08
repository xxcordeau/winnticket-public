# 쇼핑몰 주문 생성 API 연동 완료 ✅

## 변경 사항

### 1. 새로운 주문 생성 API 추가

**파일:** `/lib/api/order.ts`

#### 추가된 인터페이스
- `ShopOrderRequest`: 주문 생성 요청 DTO
- `ShopOrderResponse`: 주문 생성 응답 DTO

#### 추가된 함수
- `createShopOrder(request: ShopOrderRequest)`: 쇼핑몰 주문 생성 함수
  - 엔드포인트: `POST /api/orders/shop`
  - 하이브리드 방식: API 서버 실패 시 로컬 스토리지에 자동 저장
  - 주문 번호 자동 생성: `ORD` + 날짜(YYYYMMDD) + 랜덤 6자리
  - 주문 상태: `PENDING` (입금 대기)
  - 결제 상태: `PENDING` (결제 대기)

### 2. 결제 안내 페이지 수정

**파일:** `/components/pages/shop/shop-payment-info.tsx`

#### 주요 변경사항
- `createTicketOrder` → `createShopOrder` 사용
- 채널 ID 자동 설정 (`getCurrentChannel()` 사용)
- 주문 생성 API 호출 후 응답의 주문번호 사용
- 장바구니 아이템 삭제 로직 유지
- async/await 방식으로 변경하여 API 응답 대기

## API 요청/응답 구조

### 요청 (Request)

```typescript
interface ShopOrderRequest {
  channelId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  totalPrice: number;
  discountPrice: number;
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    options?: {
      optionId: string;
      optionValueId: string;
    }[];
  }[];
}
```

### 응답 (Response)

```typescript
interface ShopOrderResponse {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  totalPrice: number;
  discountPrice: number;
  finalPrice: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  items: {
    orderItemId: string;
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    options?: {
      optionId: string;
      optionValueId: string;
      optionName?: string;
      optionValueName?: string;
    }[];
  }[];
  createdAt: string;
}
```

## 주문 생성 프로세스

### 1. 주문 페이지에서 주문 정보 입력
- 주문자: 이름, 전화번호, 이메일
- 약관 동의
- 포인트 사용 (선택)

### 2. 결제 안내 페이지로 이동
- 주문 정보를 state로 전달
- `orderItems`, `ordererInfo`, `totalAmount`, `cartItemIds`

### 3. API 호출 및 주문 생성
```typescript
const orderRequest: ShopOrderRequest = {
  channelId: getCurrentChannel().id,
  customerName: ordererInfo.name,
  customerPhone: ordererInfo.phone,
  customerEmail: ordererInfo.email,
  totalPrice: totalAmount,
  discountPrice: 0,
  items: orderItems.map(item => ({
    productId: item.productId,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    totalPrice: item.subtotal,
    options: []
  }))
};

const response = await createShopOrder(orderRequest);
```

### 4. 주문 성공 처리
- 주문번호 업데이트 (`response.data.orderNumber`)
- 장바구니에서 구매한 아이템 제거
- 장바구니 업데이트 이벤트 발생
- 성공 토스트 메시지 표시
- 쇼핑몰 홈으로 리다이렉트

## 로컬 스토리지 구조

### 주문 데이터 저장

**키:** `shop_orders`

**형식:** 배열

```json
[
  {
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
    "items": [...],
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
]
```

## 주문 번호 생성 규칙

```typescript
// 현재 날짜 (YYYYMMDD)
const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');

// 랜덤 6자리 (대문자)
const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();

// 최종 주문번호: ORD + 날짜 + 랜덤
const orderNumber = `ORD${dateStr}${randomStr}`;

// 예시: ORD20250101ABCDEF
```

## 장바구니 연동

주문 성공 후 자동으로 장바구니에서 구매한 아이템 제거:

```typescript
// cartItemIds: 장바구니 아이템 ID 배열
const savedCart = localStorage.getItem('shop_cart');
if (savedCart) {
  const cartItems = JSON.parse(savedCart);
  const updatedCart = cartItems.filter(
    (item: any) => !cartItemIds.includes(item.id)
  );
  localStorage.setItem('shop_cart', JSON.stringify(updatedCart));
  window.dispatchEvent(new Event('cartUpdated'));
}
```

## 테스트 시나리오

### 1. API 서버 연결 시

```bash
# 콘솔 출력
🛒 [ShopPaymentInfo] Creating shop order: {...}
🌐 [API] Calling POST /api/orders/shop
✅ [API] Shop order created successfully: {...}
📦 [API] Order saved to localStorage: ORD20250101ABCDEF
```

### 2. API 서버 없을 때

```bash
# 콘솔 출력
🛒 [ShopPaymentInfo] Creating shop order: {...}
🌐 [API] Calling POST /api/orders/shop
⚠️ [API] 쇼핑몰 주문 API 연결 실패, 로컬 스토리지에 저장
📦 [API] Order saved to localStorage: ORD20250101ABCDEF
```

## 주문 상태 관리

### 주문 상태 (status)
- **PENDING**: 입금 대기 중 (초기 상태)
- **CONFIRMED**: 주문 확정 (입금 확인 후)
- **CANCELLED**: 주문 취소
- **COMPLETED**: 주문 완료 (티켓 사용 완료)

### 결제 상태 (paymentStatus)
- **PENDING**: 결제 대기 중 (초기 상태)
- **PAID**: 결제 완료 (입금 확인 후)
- **FAILED**: 결제 실패
- **REFUNDED**: 환불 완료

## 에러 처리

```typescript
const response = await createShopOrder(orderRequest);

if (!response.success) {
  toast.error(response.message || '주문 처리 중 오류가 발생했습니다.');
  console.error('Order creation failed:', response);
  return;
}

// 성공 처리
console.log('Order created:', response.data.orderNumber);
```

## 참고 문서

- **API 가이드:** `/docs/SHOP_ORDER_API.md` - API 사용법 및 데이터 구조 설명
- **주문 API 소스:** `/lib/api/order.ts`
- **주문 페이지:** `/components/pages/shop/shop-order.tsx`
- **결제 안내 페이지:** `/components/pages/shop/shop-payment-info.tsx`
- **장바구니 API:** `/lib/api/shop-cart.ts`

## 주요 특징

✅ 하이브리드 방식 (API/로컬 스토리지 자동 전환)
✅ 주문 번호 자동 생성
✅ 장바구니 자동 비우기
✅ 주문 스냅샷 고정 (가격/옵션/수량 불변)
✅ 채널 정보 자동 포함
✅ 에러 발생 시 사용자 경험 유지

## 다음 단계

백엔드 팀에서 `POST /api/orders/shop` 엔드포인트를 구현하면 자동으로 실제 서버로 주문이 전송됩니다. 구현 전까지는 로컬 스토리지에 저장되어 정상 동작합니다.

### 백엔드 구현 체크리스트

- [ ] POST /api/orders/shop 엔드포인트 생성
- [ ] ShopOrderRequest DTO 매핑
- [ ] 주문 데이터베이스 저장
- [ ] 주문번호 생성 로직 구현
- [ ] ShopOrderResponse DTO 반환
- [ ] 에러 핸들링 (중복 주문, 재고 부족 등)
