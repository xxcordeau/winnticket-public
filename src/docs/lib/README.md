# API Services

API 호출 함수들을 주제별로 모아둔 디렉토리입니다.

## 구조

```
/lib/api/
├── index.ts          # 모든 API 함수를 한 곳에서 export
├── menu.ts           # 메뉴 관리 API
├── notice.ts         # 공지사항 API
├── faq.ts            # FAQ API
├── event.ts          # 이벤트 API
├── inquiry.ts        # 문의 API
├── banner.ts         # 배너 API
├── channel.ts        # 채널 API
├── product.ts        # 상품 API
└── order.ts          # 주문 API
```

## 사용 방법

### 1. 개별 import

```typescript
import { getNotices, createNotice } from '@/lib/api/notice';
import { getMenuList, updateMenu } from '@/lib/api/menu';
```

### 2. 통합 import (권장)

```typescript
import { getNotices, createNotice, getMenuList, updateMenu } from '@/lib/api';
```

## API 함수 명명 규칙

- **조회 (목록)**: `get{Resource}s()` - 예: `getNotices()`, `getProducts()`
- **조회 (단건)**: `get{Resource}ById(id)` - 예: `getNoticeById(id)`, `getProductById(id)`
- **생성**: `create{Resource}(data)` - 예: `createNotice(data)`, `createProduct(data)`
- **수정**: `update{Resource}(id, data)` - 예: `updateNotice(id, data)`, `updateProduct(id, data)`
- **삭제**: `delete{Resource}(id)` - 예: `deleteNotice(id)`, `deleteProduct(id)`

## API 응답 형식

모든 API는 `ApiResponse<T>` 형식으로 응답합니다:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message?: string;
  timestamp?: string;
  errorCode?: string;
}
```

## 예제

### 공지사항 조회

```typescript
import { getNotices, getNoticeById } from '@/lib/api';

// 목록 조회
const response = await getNotices();
if (response.success && response.data) {
  console.log('공지사항:', response.data);
}

// 상세 조회
const detailResponse = await getNoticeById('NOTICE_001');
if (detailResponse.success && detailResponse.data) {
  console.log('공지사항 상세:', detailResponse.data);
}
```

### 메뉴 관리

```typescript
import { getMenuList, insertMenu, updateMenu } from '@/lib/api';

// 메뉴 목록 조회
const menus = await getMenuList();

// 메뉴 추가
const newMenu = await insertMenu({
  name: '콘서트',
  code: 'concert',
  level: 1,
  parentId: null,
  displayOrder: 1,
  visible: true,
  iconUrl: '',
  routePath: '/shop/concert',
});

// 메뉴 수정
const updated = await updateMenu({
  id: 'MENU_001',
  visible: false,
});
```

### 주문 관리

```typescript
import { getOrders, getOrderById, updateOrderStatus } from '@/lib/api';

// 주문 목록 조회 (페이징)
const orders = await getOrders(0, 20, 'PENDING');

// 주문 상세 조회
const order = await getOrderById('ORDER_001');

// 주문 상태 변경
const updated = await updateOrderStatus('ORDER_001', 'CONFIRMED');
```

## 에러 처리

모든 API 함수는 에러를 자동으로 처리하며, 실패 시 적절한 `ApiResponse`를 반환합니다:

```typescript
const response = await getNoticeById('INVALID_ID');

if (!response.success) {
  console.error('에러 메시지:', response.message);
  // UI에 에러 표시
  toast.error(response.message);
}
```

## 캐싱

일부 API는 캐싱을 지원합니다:

```typescript
import { loadMenuFromServer, invalidateMenuCache } from '@/data/hooks/useShopStore';

// 캐시된 데이터 로드 (1분간 캐시 유효)
const menus = await loadMenuFromServer(false);

// 강제 리로드
const freshMenus = await loadMenuFromServer(true);

// 캐시 무효화
invalidateMenuCache();
```

## 새로운 API 추가하기

1. `/lib/api/` 디렉토리에 새 파일 생성 (예: `coupon.ts`)
2. API 함수 작성:

```typescript
import { api } from '../api';
import type { ApiResponse } from '../api';

export interface Coupon {
  id: string;
  code: string;
  // ...
}

export async function getCoupons(): Promise<ApiResponse<Coupon[]>> {
  try {
    const response = await api.get<Coupon[]>('/api/coupon/list');
    return response;
  } catch (error) {
    return {
      success: false,
      data: null,
      message: '쿠폰 조회에 실패했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}
```

3. `/lib/api/index.ts`에 export 추가:

```typescript
export * from './coupon';
```

## 주의사항

- 모든 API 함수는 async/await를 사용합니다
- 에러는 조용히 처리되며, 콘솔에 불필요한 에러를 출력하지 않습니다
- API 타임아웃은 10초로 설정되어 있습니다 (`/lib/api-config.ts`)
- 서버 URL은 `https://api.winnticket.store`입니다
