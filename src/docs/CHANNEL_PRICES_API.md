# 채널별 가격 관리 API 문서

## 개요
관리자 페이지에서 상품별로 각 채널(파트너사)마다 다른 판매 가격을 설정할 수 있는 기능입니다.
- 경로: 관리자 > 상품 관리 > 상품 상세 > 채널별 가격
- 컴포넌트: `/components/pages/product-detail-channel-prices.tsx`

## 주요 기능
1. **채널별 기본 가격 설정**: 각 채널마다 상품의 기본가/할인가를 개별 설정
2. **옵션별 가격 설정**: 각 채널마다 상품 옵션의 추가 금액을 개별 설정
3. **채널 활성화/비활성화**: 특정 채널에서 상품 판매 여부 제어
4. **가격 미설정 시**: 상품의 기본 가격/할인가/옵션 추가금 자동 적용

---

## 데이터 스키마

### 1. ChannelPrice (채널별 가격 설정)

**위치**: `/components/pages/product-detail-channel-prices.tsx`

```typescript
export interface ChannelPrice {
  channelId: string;        // 채널 UUID
  channelCode: string;      // 채널 코드 (예: MAIN, PARTNER1)
  channelName: string;      // 채널명 (예: 메인 채널, 파트너 채널 A)
  enabled: boolean;         // 이 채널에서 판매 활성화 여부
  basePrice?: number;       // 채널별 기본 판매가 (미설정 시 상품 기본가 사용)
  discountPrice?: number;   // 채널별 할인가 (미설정 시 상품 할인가 사용)
  optionPrices: {
    optionId: string;       // 옵션 ID
    optionValueId: string;  // 옵션값 ID
    price?: number;         // 옵션 추가 가격 (미설정 시 옵션 기본 추가금 사용)
  }[];
}
```

**필드 상세 설명**:
- `channelId`: 채널의 고유 ID (UUID 형식)
- `channelCode`: 채널 식별 코드 (URL 파라미터, API 요청 등에 사용)
- `channelName`: 사용자에게 표시되는 채널 이름
- `enabled`: `true`이면 해당 채널에서 이 상품을 판매, `false`이면 비활성화
- `basePrice`: 
  - 값이 있으면 해당 가격으로 판매
  - `undefined`이면 상품의 `product.price` 사용
- `discountPrice`:
  - 값이 있으면 할인가로 표시 및 적용
  - `undefined`이면 상품의 `product.discountPrice` 사용 (없으면 할인 없음)
- `optionPrices[]`: 각 옵션값별 추가 가격
  - `price`가 있으면 해당 추가금 적용
  - `undefined`이면 옵션값의 `value.additionalPrice` 사용

---

### 2. ChannelListItem (채널 목록)

**위치**: `/lib/api/channel.ts`

```typescript
export interface ChannelListItem {
  id: string;            // 채널 UUID
  code: string;          // 채널 코드 (예: MAIN, PARTNER1, PARTNER2)
  name: string;          // 채널명 (예: 메인 채널, 파트너 채널 A)
  logoUrl: string;       // 채널 로고 이미지 URL
  companyName: string;   // 운영 회사명
  visible: boolean;      // 채널 노출 여부 (true: 활성, false: 비활성)
  domain: string;        // 채널 전용 도메인
  useCard: boolean;      // 카드 결제 사용 여부
}
```

**필드 상세 설명**:
- `id`: 채널의 고유 식별자 (UUID)
- `code`: 채널 코드 (URL 파라미터 `?channel=코드`에 사용)
- `name`: 관리자 페이지 및 사용자에게 표시되는 채널명
- `logoUrl`: 채널 로고 이미지 URL (S3 등 저장소 경로)
- `companyName`: 채널 운영사 이름
- `visible`: 
  - `true`: 채널이 활성화되어 상품 판매 가능
  - `false`: 채널이 비활성화되어 숨김 처리
- `domain`: 채널 전용 도메인 주소
- `useCard`: 카드 결제 사용 여부

---

### 3. ChannelRequest (채널 등록/수정 요청)

**위치**: `/lib/api/channel.ts`

```typescript
export interface ChannelRequest {
  code: string;              // 채널 코드 (필수, 고유값)
  name: string;              // 채널명 (필수)
  companyName: string;       // 운영 회사명 (필수)
  commissionRate: number;    // 수수료율 (필수, 예: 0.15 = 15%)
  logoUrl: string;           // 로고 이미지 URL (필수)
  faviconUrl: string;        // 파비콘 URL (필수)
  email: string;             // 채널 담당자 이메일 (필수)
  phone: string;             // 채널 담당자 전화번호 (필수)
  domain: string;            // 채널 도메인 (필수)
  description: string;       // 채널 설명 (필수)
  visible: boolean;          // 노출 여부 (필수)
  useCard: boolean;          // 카드 결제 사용 여부 (필수)
}
```

**필드 상세 설명**:
- `code`: 채널 고유 코드 (영문, 숫자, 언더스코어만 허용)
- `commissionRate`: 수수료율 (0.0 ~ 1.0 범위, 예: 0.15 = 15%)
- `logoUrl`: 채널 로고 이미지 경로
- `faviconUrl`: 채널 파비콘 이미지 경로
- `email`: 채널 관리 담당자 이메일
- `phone`: 채널 관리 담당자 연락처
- `domain`: 채널 접속 도메인 (예: partner1.winnticket.store)
- `description`: 채널 설명 텍스트
- `visible`: 채널 활성화 여부
- `useCard`: 카드 결제 기능 활성화 여부

---

### 4. ChannelDetailResponse (채널 상세 정보)

**위치**: `/lib/api/channel.ts`

```typescript
export interface ChannelDetailResponse {
  id?: string;               // 채널 UUID (선택)
  code: string;              // 채널 코드 (필수)
  name: string;              // 채널명 (필수)
  companyName: string;       // 운영 회사명 (필수)
  commissionRate: number;    // 수수료율 (필수)
  visible: boolean;          // 노출 여부 (필수)
  description?: string;      // 채널 설명 (선택)
  logoUrl?: string;          // 로고 URL (선택)
  faviconUrl?: string;       // 파비콘 URL (선택)
  email?: string;            // 이메일 (선택)
  phone?: string;            // 전화번호 (선택)
  domain?: string;           // 도메인 (선택)
  useCard: boolean;          // 카드 사용 여부 (필수)
  createdAt: string;         // 생성일시 (ISO 8601)
  updatedAt: string;         // 수정일시 (ISO 8601)
}
```

**필드 상세 설명**:
- `id`: 채널 UUID (있으면 사용, 없으면 `code` 사용)
- `createdAt`: 채널 생성 일시 (ISO 8601 형식 문자열)
- `updatedAt`: 채널 마지막 수정 일시 (ISO 8601 형식 문자열)

---

### 5. PublicChannelResponse (공개 채널 정보)

**위치**: `/lib/api/channel.ts`

**API**: `GET /api/channels/{code}` (토큰 불필요)

```typescript
export interface PublicChannelResponse {
  code: string;              // 채널 코드
  name: string;              // 채널명
  companyName: string;       // 운영 회사명
  commissionRate: number;    // 수수료율
  visible: boolean;          // 노출 여부
  description?: string;      // 채널 설명
  logoUrl?: string;          // 로고 URL
  faviconUrl?: string;       // 파비콘 URL
  email?: string;            // 이메일
  phone?: string;            // 전화번호
  domain?: string;           // 도메인
  useCard: boolean;          // 카드 사용 여부
  createdAt: string;         // 생성일시
  updatedAt: string;         // 수정일시
  id?: string;               // 채널 UUID (선택)
}
```

**용도**: 주문 페이지 등에서 채널 정보를 조회할 때 사용 (인증 불필요)

---

### 6. ProductDetailChannelPricesProps (컴포넌트 Props)

**위치**: `/components/pages/product-detail-channel-prices.tsx`

```typescript
interface ProductDetailChannelPricesProps {
  product: Product;                   // 상품 정보
  options: ProductOption[];           // 상품 옵션 목록
  channels?: ChannelListItem[];       // 채널 목록 (부모로부터 전달)
  onSave: (channelPrices: ChannelPrice[]) => Promise<void>;  // 저장 콜백
}
```

**필드 상세 설명**:
- `product`: 현재 편집 중인 상품 정보 객체
- `options`: 상품에 설정된 옵션 목록 (색상, 사이즈 등)
- `channels`: 
  - 부모 컴포넌트에서 전달받은 채널 목록
  - 전달되지 않으면 컴포넌트 내부에서 API 호출
- `onSave`: 
  - 채널별 가격 저장 시 호출되는 콜백 함수
  - 부모 컴포넌트에서 실제 저장 로직 구현

---

## API 엔드포인트

### 1. 채널 목록 조회 (관리자)

```
GET /api/admin/channels
```

**Request Headers**:
```
Authorization: Bearer {access_token}
```

**Query Parameters** (선택):
- `code`: 채널 코드로 필터링
- `name`: 채널명으로 필터링 (부분 일치)
- `companyName`: 회사명으로 필터링 (부분 일치)

**Response**:
```typescript
ApiResponse<ChannelListItem[]>

// 실제 응답 예시
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "code": "MAIN",
      "name": "메인 채널",
      "logoUrl": "https://s3.winnticket.store/logos/main.png",
      "companyName": "위너티켓 본사",
      "visible": true,
      "domain": "shop.winnticket.store",
      "useCard": true
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "code": "PARTNER1",
      "name": "파트너 채널 A",
      "logoUrl": "https://s3.winnticket.store/logos/partner1.png",
      "companyName": "파트너사 A",
      "visible": true,
      "domain": "partner1.winnticket.store",
      "useCard": false
    }
  ],
  "message": "채널 목록 조회 성공"
}
```

---

### 2. 공개 채널 조회 (인증 불필요)

```
GET /api/channels/{code}
```

**Request Headers**: 없음 (토큰 불필요)

**Path Parameters**:
- `code`: 채널 코드 (예: MAIN, PARTNER1)

**Response**:
```typescript
ApiResponse<PublicChannelResponse>

// 실제 응답 예시
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "code": "MAIN",
    "name": "메인 채널",
    "companyName": "위너티켓 본사",
    "commissionRate": 0.15,
    "visible": true,
    "description": "위너티켓 메인 쇼핑몰",
    "logoUrl": "https://s3.winnticket.store/logos/main.png",
    "faviconUrl": "https://s3.winnticket.store/favicons/main.ico",
    "email": "admin@winnticket.store",
    "phone": "02-1234-5678",
    "domain": "shop.winnticket.store",
    "useCard": true,
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-02-01T12:30:00Z"
  },
  "message": "채널 정보 조회 성공"
}
```

---

### 3. 채널 등록

```
POST /api/admin/channels
```

**Request Headers**:
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body**:
```typescript
ChannelRequest

// 실제 요청 예시
{
  "code": "PARTNER2",
  "name": "파트너 채널 B",
  "companyName": "파트너사 B",
  "commissionRate": 0.12,
  "logoUrl": "https://s3.winnticket.store/logos/partner2.png",
  "faviconUrl": "https://s3.winnticket.store/favicons/partner2.ico",
  "email": "contact@partner2.com",
  "phone": "02-9876-5432",
  "domain": "partner2.winnticket.store",
  "description": "파트너사 B 전용 채널",
  "visible": true,
  "useCard": false
}
```

**Response**:
```typescript
ApiResponse<ChannelDetailResponse>

{
  "success": true,
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "code": "PARTNER2",
    "name": "파트너 채널 B",
    "companyName": "파트너사 B",
    "commissionRate": 0.12,
    "visible": true,
    "description": "파트너사 B 전용 채널",
    "logoUrl": "https://s3.winnticket.store/logos/partner2.png",
    "faviconUrl": "https://s3.winnticket.store/favicons/partner2.ico",
    "email": "contact@partner2.com",
    "phone": "02-9876-5432",
    "domain": "partner2.winnticket.store",
    "useCard": false,
    "createdAt": "2025-02-07T14:30:00Z",
    "updatedAt": "2025-02-07T14:30:00Z"
  },
  "message": "채널 등록 성공"
}
```

---

### 4. 채널 수정

```
PUT /api/admin/channels/{id}
```

**Request Headers**:
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Path Parameters**:
- `id`: 채널 UUID

**Request Body**:
```typescript
ChannelRequest

// 수정 예시 (수수료율 변경)
{
  "code": "PARTNER2",
  "name": "파트너 채널 B",
  "companyName": "파트너사 B",
  "commissionRate": 0.10,  // 12% → 10%로 변경
  "logoUrl": "https://s3.winnticket.store/logos/partner2.png",
  "faviconUrl": "https://s3.winnticket.store/favicons/partner2.ico",
  "email": "contact@partner2.com",
  "phone": "02-9876-5432",
  "domain": "partner2.winnticket.store",
  "description": "파트너사 B 전용 채널",
  "visible": true,
  "useCard": false
}
```

**Response**:
```typescript
ApiResponse<ChannelDetailResponse>

{
  "success": true,
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "code": "PARTNER2",
    "name": "파트너 채널 B",
    "commissionRate": 0.10,  // 변경됨
    "updatedAt": "2025-02-07T15:00:00Z"  // 업데이트 시간 갱신
    // ... 기타 필드
  },
  "message": "채널 수정 성공"
}
```

---

### 5. 채널 삭제

```
DELETE /api/admin/channels/{id}
```

**Request Headers**:
```
Authorization: Bearer {access_token}
```

**Path Parameters**:
- `id`: 채널 UUID

**Response**:
```typescript
ApiResponse<null>

{
  "success": true,
  "data": null,
  "message": "채널 삭제 성공"
}
```

---

## 데이터 흐름

### 1. 초기 로딩
```
1. ProductDetailPage 컴포넌트에서 채널 목록 로드
   → getChannels() 호출
   → ChannelListItem[] 반환

2. ProductDetailChannelPrices 컴포넌트에 props 전달
   - product: 현재 상품 정보
   - options: 상품 옵션 목록
   - channels: 채널 목록

3. 컴포넌트 내부에서 초기화
   - localStorage에서 저장된 채널별 가격 확인
   - 없으면 기본값으로 초기화:
     * basePrice = product.price
     * discountPrice = product.discountPrice
     * optionPrices[] = 각 옵션의 additionalPrice
```

### 2. 가격 설정
```
1. 사용자가 특정 채널 행 클릭
   → 모달 오픈

2. 모달에서 가격 입력
   - 기본가 입력 (선택)
   - 할인가 입력 (선택)
   - 각 옵션값별 추가금 입력 (선택)

3. "저장" 버튼 클릭
   → handleModalSave() 실행
   → localStorage에 임시 저장
   → onSave() 콜백 호출 (부모 컴포넌트에서 처리)
```

### 3. 채널 활성화/비활성화
```
1. 테이블의 스위치 토글
   → handleChannelToggle() 실행
   → ChannelPrice.enabled 값 변경

2. "전체 저장" 버튼 클릭
   → handleSaveAll() 실행
   → 모든 채널 가격 설정 저장
```

---

## 로컬 스토리지 스키마

**키**: `channel_prices_{productId}`

**값**: `ChannelPrice[]` JSON 문자열

**예시**:
```json
[
  {
    "channelId": "550e8400-e29b-41d4-a716-446655440000",
    "channelCode": "MAIN",
    "channelName": "메인 채널",
    "enabled": true,
    "basePrice": 50000,
    "discountPrice": 45000,
    "optionPrices": [
      {
        "optionId": "OPT001",
        "optionValueId": "VAL001",
        "price": 5000
      },
      {
        "optionId": "OPT001",
        "optionValueId": "VAL002",
        "price": 7000
      }
    ]
  },
  {
    "channelId": "660e8400-e29b-41d4-a716-446655440001",
    "channelCode": "PARTNER1",
    "channelName": "파트너 채널 A",
    "enabled": false,
    "optionPrices": []
  }
]
```

---

## 사용 예시

### 1. 채널별로 다른 가격 설정

**시나리오**: 메인 채널은 50,000원, 파트너 A는 48,000원으로 판매

```typescript
const channelPrices: ChannelPrice[] = [
  {
    channelId: "CH001",
    channelCode: "MAIN",
    channelName: "메인 채널",
    enabled: true,
    basePrice: 50000,  // 메인 채널 가격
    optionPrices: []
  },
  {
    channelId: "CH002",
    channelCode: "PARTNER1",
    channelName: "파트너 채널 A",
    enabled: true,
    basePrice: 48000,  // 파트너 A 할인 가격
    optionPrices: []
  }
];
```

### 2. 옵션별로 다른 추가금 설정

**시나리오**: 메인 채널은 빨강 옵션 +5,000원, 파트너 A는 +3,000원

```typescript
const channelPrices: ChannelPrice[] = [
  {
    channelId: "CH001",
    channelCode: "MAIN",
    channelName: "메인 채널",
    enabled: true,
    basePrice: 50000,
    optionPrices: [
      {
        optionId: "COLOR",
        optionValueId: "RED",
        price: 5000  // 메인 채널: 빨강 +5,000원
      }
    ]
  },
  {
    channelId: "CH002",
    channelCode: "PARTNER1",
    channelName: "파트너 채널 A",
    enabled: true,
    basePrice: 48000,
    optionPrices: [
      {
        optionId: "COLOR",
        optionValueId: "RED",
        price: 3000  // 파트너 A: 빨강 +3,000원
      }
    ]
  }
];
```

### 3. 특정 채널에서만 판매

**시나리오**: 메인 채널에서만 판매, 파트너 채널은 비활성화

```typescript
const channelPrices: ChannelPrice[] = [
  {
    channelId: "CH001",
    channelCode: "MAIN",
    channelName: "메인 채널",
    enabled: true,  // 판매 활성화
    basePrice: 50000,
    optionPrices: []
  },
  {
    channelId: "CH002",
    channelCode: "PARTNER1",
    channelName: "파트너 채널 A",
    enabled: false,  // 판매 비활성화
    basePrice: undefined,
    optionPrices: []
  }
];
```

---

## 주요 함수

### 1. loadChannels()
```typescript
const loadChannels = async () => {
  // 1. 부모로부터 전달받은 채널 데이터 확인
  if (channelsProp && channelsProp.length > 0) {
    const visibleChannels = channelsProp.filter(ch => ch.visible);
    setChannels(visibleChannels);
    return;
  }
  
  // 2. API 호출 (fallback)
  const response = await getChannels();
  const visibleChannels = response.data.filter(ch => ch.visible);
  setChannels(visibleChannels);
};
```

### 2. initializeChannelPrices()
```typescript
const initializeChannelPrices = () => {
  // 1. localStorage에서 저장된 데이터 확인
  const storedPrices = localStorage.getItem(`channel_prices_${product.id}`);
  if (storedPrices) {
    setChannelPrices(JSON.parse(storedPrices));
    return;
  }
  
  // 2. 기본값 설정
  const defaultPrices = channels.map(channel => ({
    channelId: channel.id,
    channelCode: channel.channelCode,
    channelName: channel.channelName,
    enabled: false,
    basePrice: product.price,
    discountPrice: product.discountPrice,
    optionPrices: []
  }));
  
  setChannelPrices(defaultPrices);
};
```

### 3. handleModalSave()
```typescript
const handleModalSave = async () => {
  // 1. 상태 업데이트
  const updatedChannelPrices = channelPrices.map(cp =>
    cp.channelId === modalData.channelId ? modalData : cp
  );
  
  setChannelPrices(updatedChannelPrices);
  
  // 2. localStorage에 저장
  localStorage.setItem(
    `channel_prices_${product.id}`,
    JSON.stringify(updatedChannelPrices)
  );
  
  // 3. 부모 컴포넌트 저장 함수 호출
  await onSave(updatedChannelPrices);
  
  toast.success(`${modalData.channelName} 가격이 저장되었습니다.`);
};
```

---

## 에러 처리

### 1. 채널 목록 로드 실패
```typescript
try {
  const response = await getChannels();
  if (response.success && response.data) {
    setChannels(response.data);
  } else {
    setChannels([]); // 빈 배열로 초기화
  }
} catch (error) {
  console.error('채널 로드 실패:', error);
  setChannels([]); // 빈 배열로 초기화
}
```

### 2. 가격 저장 실패
```typescript
try {
  await onSave(channelPrices);
  toast.success('저장되었습니다.');
} catch (error) {
  console.error('저장 실패:', error);
  toast.error('저장에 실패했습니다.');
}
```

---

## 주의사항

1. **필수 필드**: 모든 ChannelRequest 필드는 필수입니다.
2. **가격 미설정**: 채널별 가격을 설정하지 않으면 상품의 기본 가격이 적용됩니다.
3. **활성화 여부**: `enabled: false`인 채널은 해당 채널에서 상품이 표시되지 않습니다.
4. **옵션 가격**: 옵션 추가금을 설정하지 않으면 옵션의 기본 `additionalPrice`가 적용됩니다.
5. **localStorage**: 채널별 가격은 임시로 localStorage에 저장되며, 실제 저장은 `onSave` 콜백을 통해 처리됩니다.
6. **채널 필터링**: `visible: true`인 채널만 표시됩니다.

---

## 관련 파일

- **컴포넌트**: `/components/pages/product-detail-channel-prices.tsx`
- **API**: `/lib/api/channel.ts`
- **DTO**: 
  - `/data/dto/product.dto.ts` (Product, ProductOption)
  - 컴포넌트 내부 정의 (ChannelPrice)
