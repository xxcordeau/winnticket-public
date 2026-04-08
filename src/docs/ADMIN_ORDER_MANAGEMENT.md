# 관리자 주문 관리 시스템 ✅

## 개요

쇼핑몰 주문을 관리자가 조회하고 결제 완료 처리할 수 있는 시스템입니다. PG 결제 콜백 처리와 티켓 자동 발급 기능을 포함합니다.

## 주문 처리 프로세스 (정확한 플로우)

### 1. 장바구니 → 주문 생성
- **프론트엔드:** 사용자 정보 + 상품 정보 전송 (`POST /api/orders/shop`)
- **백엔드:** 주문 데이터 수신

### 2. 백엔드 검증 및 저장
- 가격 재계산 및 검증 (포인트, 베네피아 연동 시 처리 예정)
- **DB 저장:**
  - `주문(Order)` 테이블
  - `주문상품(OrderItem)` 테이블
  - `주문상품별옵션(OrderItemOption)` 테이블
- **상태:** `status = PENDING_PAYMENT`, `paymentStatus = READY`

### 3. 결제 완료 처리
- **트리거:** 관리자 또는 PG API 콜백 (`POST /api/order/{id}/pay`)
- **처리:**
  - `paymentStatus`: `READY` → `PAID`
  - `status`: `PENDING_PAYMENT` → `COMPLETED`
  - `paidAt`: 현재 시간 기록

### 4. 티켓 자동 생성
- 결제 완료 시 상품별로 티켓 생성
- 티켓 발송 (API 연동 시 이메일/SMS 발송 예정)
- `ticketIssuedAt`: 티켓 발송일시 기록

### 5. 주문 상태 업데이트
- 주문 상태, 결제 상태, 티켓발송일시 등 정보 갱신

## 구현된 기능

### 1. 결제 완료 처리 (PG 콜백용)

**엔드포인트:** `POST /api/order/{id}/pay`

PG(카드사·결제모듈)에서 결제 성공 시 서버가 호출하는 API입니다.

#### 처리 내용
- `paymentStatus`: `READY` → `PAID`
- `status`: `PENDING_PAYMENT` → `COMPLETED`
- `paidAt`: 현재 시간 기록
- 티켓 자동 발급

#### 사용 예시
```typescript
import { payOrder } from '@/lib/api/order';

const response = await payOrder(orderId);
if (response.success) {
  console.log('결제 완료, 티켓 발급됨');
}
```

### 2. 관리자 주문 목록 조회

**엔드포인트:** `GET /api/order/admin`

**페이지:** `/admin/orders`

#### 필터 파라미터
| 파라미터 | 의미 |
|---------|------|
| `srchWord` | 주문번호 / 고객명 / 상품명 검색 |
| `begDate` | 시작일 (YYYY-MM-DD) |
| `endDate` | 종료일 (YYYY-MM-DD) |
| `status` | 주문 상태 필터 |

#### 주문 상태 (status)
- `ALL` - 전체
- `PENDING_PAYMENT` - 입금 대기
- `COMPLETED` - 주문 완료
- `CANCEL_REQUESTED` - 취소 요청
- `CANCELED` - 취소 완료
- `REFUNDED` - 환불 완료

#### 응답 데이터
```typescript
{
  orderNumber: "WT20251230001",
  orderedAt: "2025-12-30T01:13:51",
  partnerName: "롯데월드",
  customerName: "홍길동",
  productName: "야구 티켓",
  productCnt: 2,
  totalPrice: 60000,
  discountPrice: 10000,
  finalPrice: 50000,
  status: "PENDING_PAYMENT",
  paymentStatus: "READY",
  paymentMethod: "CARD"
}
```

### 3. 주문 상세 조회 (관리자)

**엔드포인트:** `GET /api/order/admin/{id}`

**페이지:** `/admin/orders/:id`

#### 주문 기본 정보
| 필드 | 의미 |
|------|------|
| `orderNumber` | 주문번호 |
| `channelName` | 판매 채널 |
| `status` | 주문 상태 |
| `paymentStatus` | 결제 상태 |
| `paymentMethod` | CARD / BANK / etc |
| `finalPrice` | 실결제 금액 |
| `paidAt` | 결제일시 |
| `ticketIssuedAt` | 티켓 발송일시 |

#### 주문 상품
```typescript
products: [
  {
    productName: "콘서트 A석",
    partnerName: "예술의전당",
    optionName: "VIP",
    quantity: 2,
    unitPrice: 30000,
    totalPrice: 60000
  }
]
```

#### 발급된 티켓
```typescript
tickets: [
  {
    ticketNumber: "TK20251230A123",
    productName: "콘서트 A석",
    ticketUsed: false
  }
]
```

> 💡 공연·입장형 상품은 결제 완료 시 자동으로 티켓 생성됨

### 4. 주문 상태 요약 (대시보드용)

**엔드포인트:** `GET /api/order/admin/status`

**용도:** 관리자 홈 "매출 요약 카드"용

#### 응답 데이터
```typescript
{
  unpaidCnt: 3,              // 미결제 건수
  unpaidTotalPrice: 120000,  // 미결제 총액
  completedCnt: 10,          // 완료 건수
  completedTotalPrice: 580000, // 완료 총액
  canceledCnt: 2,            // 취소 건수
  canceledTotalPrice: 70000  // 취소 총액
}
```

## 주문 생명주기

### 1. 장바구니 → 주문 생성
```
POST /api/orders/shop
status = PENDING_PAYMENT
paymentStatus = READY
```

### 2. 결제 성공 (PG)
```
POST /api/order/{id}/pay
status = COMPLETED
paymentStatus = PAID
티켓 자동 생성
```

### 3. 관리자 관리
```
GET /api/order/admin       - 주문 목록
GET /api/order/admin/{id}  - 주문 상세
```

### 4. 취소/환불
```
status: CANCEL_REQUESTED → CANCELED → REFUNDED
```

## 관리자 페이지

### 주문 목록 페이지 (`/admin/orders`)

#### 기능
- ✅ 주문 검색 (주문번호, 고객명, 상품명)
- ✅ 기간 필터 (시작일~종료일)
- ✅ 상태 필터 (입금 대기, 완료, 취소 등)
- ✅ 페이지네이션 (20건씩)
- ✅ 매출 요약 카드 (미결제/완료/취소)

#### UI 구성
1. **매출 요약 카드** - 미결제/완료/취소 건수 및 금액
2. **검색 및 필터** - 검색어, 상태, 날짜 범위
3. **주문 목록 테이블** - 주문 정보, 상태, 결제 정보
4. **페이지네이션** - 이전/다음 버튼

### 주문 상세 페이지 (`/admin/orders/:id`)

#### 기능
- ✅ 주문 정보 조회
- ✅ 고객 정보 조회
- ✅ 주문 상품 목록
- ✅ 발급된 티켓 목���
- ✅ 결제 완료 처리 (입금 대기 → 결제 완료)
- ✅ 주문 타임라인

#### UI 구성
1. **주문 정보 카드** - 주문번호, 채널, 날짜, 상태
2. **고객 정보 카드** - 이름, 전화번호, 이메일
3. **주문 상품 카드** - 상품명, 파트너, 옵션, 수량, 가격
4. **티켓 카드** - 티켓번호, 상품명, 사용 여부 (결제 완료 시에만 표시)
5. **결제 정보 카드** - 상품 금액, 할인, 실결제
6. **관리자 액션 카드** - 결제 완료 처리, 인쇄 등
7. **주문 타임라인** - 주문 접수, 결제 완료 기록

## 하이브리드 방식

### API 서버 연결 시
```bash
🌐 [API] Calling GET /api/order/admin?page=0&size=20
✅ [API] Orders loaded successfully
```

### API 서버 없을 때
```bash
⚠️ [API] 관리자 주문 목록 API 연결 실패, 로컬 스토리지 사용
📦 Loaded 5 orders from localStorage
```

로컬 스토리지 키: `shop_orders`

## 프론트엔드 사용법

### 주문 목록 조회
```typescript
import { getAdminOrders } from '@/lib/api/order';

const response = await getAdminOrders(
  0,                    // page
  20,                   // size
  '홍길동',              // srchWord (검색어)
  '2025-01-01',        // begDate
  '2025-12-31',        // endDate
  'PENDING_PAYMENT'    // status
);

if (response.success && response.data) {
  const orders = response.data.content;
  const totalPages = response.data.totalPages;
}
```

### 주문 상세 조회
```typescript
import { getAdminOrderDetail } from '@/lib/api/order';

const response = await getAdminOrderDetail(orderId);

if (response.success && response.data) {
  const order = response.data;
  console.log('주문번호:', order.orderNumber);
  console.log('고객명:', order.customerName);
  console.log('티켓:', order.tickets);
}
```

### 결제 완료 처리
```typescript
import { payOrder } from '@/lib/api/order';

const response = await payOrder(orderId);

if (response.success) {
  toast.success('결제가 완료되었습니다. 티켓이 발급되었습니다.');
  // 주문 상세 다시 로드
  loadOrderDetail();
}
```

### 주문 상태 요약
```typescript
import { getOrderStatusSummary } from '@/lib/api/order';

const response = await getOrderStatusSummary();

if (response.success && response.data) {
  const { unpaidCnt, completedCnt, canceledCnt } = response.data;
}
```

## 관련 파일

### API
- `/lib/api/order.ts` - 주문 API 함수
  - `getAdminOrders()` - 주문 목록 조회
  - `getAdminOrderDetail()` - 주문 상세 조회
  - `payOrder()` - 결제 완료 처리
  - `getOrderStatusSummary()` - 상태 요약

### 페이지
- `/components/pages/admin-orders.tsx` - 주문 목록 페이지
- `/components/pages/admin-order-detail.tsx` - 주문 상세 페이지

### 라우팅
- `/admin/orders` - 주문 목록
- `/admin/orders/:id` - 주문 상세

## 주문 상태 및 결제 상태

### 주문 상태 (status)
| 상태 | 설명 | 뱃지 색상 |
|------|------|----------|
| `PENDING_PAYMENT` | 입금 대기 | 노란색 |
| `COMPLETED` | 주문 완료 | 초록색 |
| `CANCEL_REQUESTED` | 취소 요청 | 주황색 |
| `CANCELED` | 취소 완료 | 회색 |
| `REFUNDED` | 환불 완료 | 파란색 |

### 결제 상태 (paymentStatus)
| 상태 | 설명 | 뱃지 색상 |
|------|------|----------|
| `READY` | 결제 대기 | 회색 |
| `PAID` | 결제 완료 | 초록색 |
| `FAILED` | 결제 실패 | 빨간색 |
| `REFUNDED` | 환불 | 파란색 |

## 티켓 자동 발급

결제 완료 처리 시 주문 아이템 개수만큼 티켓이 자동으로 생성됩니다.

### 티켓 번호 형식
```
TK + 주문번호(ORD 제외) + 순번(A, B, C...)
예: TK20251230ABCDEFA
```

### 티켓 데이터 구조
```typescript
{
  ticketNumber: "TK20251230ABCDEFA",
  productName: "콘서트 A석",
  ticketUsed: false  // 사용 여부
}
```

## 매출 요약 카드

### 미결제 주문
- 건수: `unpaidCnt`
- 금액: `unpaidTotalPrice`
- 색상: 노란색
- 아이콘: CreditCard

### 완료된 주문
- 건수: `completedCnt`
- 금액: `completedTotalPrice`
- 색상: ���록색
- 아이콘: CreditCard

### 취소/환불
- 건수: `canceledCnt`
- 금액: `canceledTotalPrice`
- 색상: 회색
- 아이콘: CreditCard

## 검색 및 필터 기능

### 검색어 (srchWord)
- 주문번호 검색
- 고객명 검색
- 상품명 검색
- 대소문자 구분 없음

### 날짜 범위
- 시작일 (begDate): YYYY-MM-DD
- 종료일 (endDate): YYYY-MM-DD 23:59:59까지 포함

### 상태 필터
- 전체 (ALL): 모든 주문
- 입금 대기 (PENDING_PAYMENT): 결제 전
- 주문 완료 (COMPLETED): 결제 완료
- 취소 요청 (CANCEL_REQUESTED): 고객이 취소 요청
- 취소 완료 (CANCELED): 관리자가 취소 승인
- 환불 완료 (REFUNDED): 환불 처리 완료

## 다음 단계

백엔드 팀에서 아래 엔드포인트를 구현하면 자동으로 실제 서버로 연동됩니다:

- [ ] `POST /api/order/{id}/pay` - 결제 완료 처리
- [ ] `GET /api/order/admin` - 주문 목록 조회
- [ ] `GET /api/order/admin/{id}` - 주문 상세 조회
- [ ] `GET /api/order/admin/status` - 주문 상태 요약

구현 전까지는 로컬 스토리지(`shop_orders`)를 사용하여 정상 작동합니다.

## 테스트 시나리오

### 1. 주문 생성
1. 쇼핑몰에서 상품 주문
2. 장바구니 → 주문 생성
3. 로컬 스토리지에 저장 확인

### 2. 주문 목록 조회
1. `/admin/orders` 접속
2. 요약 카드 확인 (미결제/완료/취소)
3. 검색 필터 테스트
4. 페이지네이션 테스트

### 3. 주문 상세 조회
1. 주문 목록에서 "보기" 버튼 클릭
2. 주문 정보 확인
3. 고객 정보 확인
4. 주문 상품 목록 확인

### 4. 결제 완료 처리
1. 입금 대기 주문 상세 페이지
2. "결제 완료 처리" 버튼 클릭
3. 확인 다이얼로그 확인
4. 처리 완료 후 티켓 발급 확인
5. 주문 상태 변경 확인 (PENDING_PAYMENT → COMPLETED)
6. 결제 상태 변경 확인 (READY → PAID)

## 주의사항

1. **권한 체크**: 관리자만 접근 가능
2. **티켓 중복 발급 방지**: 이미 PAID 상태면 재발급 불가
3. **로컬 스토리지 동기화**: API 실패 시 로컬 데이터 사용
4. **주문 번호 고유성**: 날짜 + 랜덤 문자열로 중복 방지

## 참고 문서

- [쇼핑몰 주문 생성 API](/docs/SHOP_ORDER_API.md)
- [API 통합 가이드](/docs/SHOP_ORDER_API_INTEGRATION.md)