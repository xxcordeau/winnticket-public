# API 통합 가이드

이 문서는 로컬 더미 데이터에서 실제 서버 API로 전환하는 방법을 설명합니다.

## 목차

1. [환경 설정](#환경-설정)
2. [API 모드 전환](#api-모드-전환)
3. [서비스 레이어 사용법](#서비스-레이어-사용법)
4. [기존 코드 마이그레이션](#기존-코드-마이그레이션)
5. [API 엔드포인트 추가](#api-엔드포인트-추가)

## 환경 설정

### 1. 환경 변수 설정

`.env` 파일에 서버 URL을 설정합니다:

```env
VITE_API_BASE_URL=https://api.winnticket.store
```

### 2. API 클라이언트

`/lib/api.ts` 파일에 API 클라이언트가 구현되어 있습니다:

```typescript
import { api } from './lib/api';

// GET 요청
const response = await api.get('/api/products');

// POST 요청
const response = await api.post('/api/products', { name: '새 상품' });

// PUT 요청
const response = await api.put('/api/products/123', { name: '수정된 상품' });

// DELETE 요청
const response = await api.delete('/api/products/123');

// 파일 업로드
const response = await api.upload('/api/products/upload', file, 'image');
```

### 3. API 설정

`/lib/api-config.ts` 파일에서 API 모드와 엔드포인트를 관리합니다.

## API 모드 전환

### 대시보드에서 전환

대시보드 페이지에 `ApiModeSwitcher` 컴포넌트가 추가되어 있습니다:

- **로컬 모드**: 브라우저 로컬스토리지의 더미 데이터 사용
- **서버 모드**: 실제 백엔드 서버의 API 호출

모드를 전환하면 페이지가 자동으로 새로고침됩니다.

### 프로그래밍 방식으로 전환

```typescript
import { setApiMode } from './lib/api-config';

// 서버 모드로 전환
setApiMode('server');

// 로컬 모드로 전환
setApiMode('local');
```

### 현재 모드 확인

```typescript
import { getApiMode, isServerMode, isLocalMode } from './lib/api-config';

const currentMode = getApiMode(); // 'local' | 'server'

if (isServerMode()) {
  console.log('서버 API를 사용 중입니다');
}

if (isLocalMode()) {
  console.log('로컬 데이터를 사용 중입니다');
}
```

## 서비스 레이어 사용법

서비스 레이어는 로컬/서버 모드를 자동으로 전환합니다.

### 상품 서비스 예제

`/lib/services/product-service.ts` 파일을 참고하세요:

```typescript
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from './lib/services/product-service';

// 상품 목록 조회
const response = await getProducts(0, 20);
if (response.success) {
  const products = response.data?.content;
}

// 상품 상세 조회
const response = await getProduct('product-id');
if (response.success) {
  const product = response.data;
}

// 상품 생성
const response = await createProduct({
  name: '새 상품',
  price: 10000,
  // ... 기타 필드
});

// 상품 수정
const response = await updateProduct('product-id', {
  name: '수정된 상품',
});

// 상품 삭제
const response = await deleteProduct('product-id');
```

## 기존 코드 마이그레이션

### Before (로컬 데이터만 사용)

```typescript
import { getProducts } from '../../data/products';

function ProductList() {
  const response = getProducts(0, 20);
  const products = response.data?.content || [];
  
  return (
    <div>
      {products.map(product => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  );
}
```

### After (서비스 레이어 사용)

```typescript
import { getProducts } from '../../lib/services/product-service';

function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      const response = await getProducts(0, 20);
      if (response.success) {
        setProducts(response.data?.content || []);
      }
      setLoading(false);
    }
    loadProducts();
  }, []);

  if (loading) return <div>로딩 중...</div>;
  
  return (
    <div>
      {products.map(product => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  );
}
```

## API 엔드포인트 추가

### 1. API 엔드포인트 정의

`/lib/api-config.ts` 파일의 `API_ENDPOINTS`에 추가:

```typescript
export const API_ENDPOINTS = {
  // ... 기존 엔드포인트
  
  // 새로운 엔드포인트
  MY_FEATURE: {
    LIST: '/api/my-feature',
    DETAIL: (id: string) => `/api/my-feature/${id}`,
    CREATE: '/api/my-feature',
    UPDATE: (id: string) => `/api/my-feature/${id}`,
    DELETE: (id: string) => `/api/my-feature/${id}`,
  },
};
```

### 2. 서비스 파일 생성

`/lib/services/my-feature-service.ts`:

```typescript
import { api } from '../api';
import { apiConfig, API_ENDPOINTS } from '../api-config';
import type { MyFeature, MyFeatureListResponse } from '../../data/dto/my-feature.dto';
import { getMyFeatures as getMyFeaturesLocal } from '../../data/my-feature';

export async function getMyFeatures(): Promise<MyFeatureListResponse> {
  // 로컬 모드
  if (apiConfig.isLocalMode()) {
    return getMyFeaturesLocal();
  }

  // 서버 모드
  try {
    const response = await api.get<MyFeatureListResponse['data']>(
      API_ENDPOINTS.MY_FEATURE.LIST
    );

    return {
      success: response.success,
      data: response.data,
      message: response.message,
      timestamp: response.timestamp,
    };
  } catch (error: any) {
    return {
      success: false,
      data: null,
      message: error.message || '데이터를 불러오는데 실패했습니다.',
      timestamp: new Date().toISOString(),
    };
  }
}
```

### 3. 컴포넌트에서 사용

```typescript
import { getMyFeatures } from './lib/services/my-feature-service';

function MyFeatureList() {
  const [data, setData] = useState([]);

  useEffect(() => {
    async function loadData() {
      const response = await getMyFeatures();
      if (response.success) {
        setData(response.data || []);
      }
    }
    loadData();
  }, []);

  return (
    <div>
      {/* 렌더링 로직 */}
    </div>
  );
}
```

## 인증 토큰

API 클라이언트는 자동으로 로컬스토리지의 인증 토큰을 읽어 요청 헤더에 포함합니다.

### 토큰 저장 형식

```typescript
// 로컬스토리지 키: 'erp_auth'
{
  "token": "your-jwt-token",
  "user": {
    "id": "user-id",
    "name": "사용자명",
    // ... 기타 사용자 정보
  }
}
```

### 수동으로 토큰 설정

```typescript
const authData = {
  token: 'your-jwt-token',
  user: {
    id: 'user-id',
    name: '홍길동',
  },
};

localStorage.setItem('erp_auth', JSON.stringify(authData));
```

## 에러 처리

### ApiError 클래스

```typescript
import { ApiError } from './lib/api';

try {
  const response = await api.get('/api/products');
} catch (error) {
  if (error instanceof ApiError) {
    console.error('Status:', error.status);
    console.error('Error Code:', error.errorCode);
    console.error('Message:', error.message);
  }
}
```

### 서비스 레이어의 에러 처리

서비스 레이어는 에러를 자동으로 처리하고 일관된 응답 형식을 반환합니다:

```typescript
const response = await getProducts();

if (!response.success) {
  // 에러 처리
  console.error(response.message);
  toast.error(response.message);
}
```

## 서버 API 요구사항

서버는 다음과 같은 응답 형식을 따라야 합니다:

### 성공 응답

```json
{
  "success": true,
  "data": { /* 응답 데이터 */ },
  "message": "성공 메시지",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### 에러 응답

```json
{
  "success": false,
  "data": null,
  "message": "에러 메시지",
  "errorCode": "ERROR_CODE",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### 페이지네이션 응답

```json
{
  "success": true,
  "data": {
    "content": [/* 아이템 배열 */],
    "page": 0,
    "size": 20,
    "totalElements": 100,
    "totalPages": 5
  },
  "message": "조회 성공",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

## 개발 팁

### 1. 로컬 개발

로컬에서 개발할 때는 로컬 모드를 사용하여 서버 없이도 작업할 수 있습니다.

### 2. 서버 연결 테스트

대시보드의 `ApiModeSwitcher` 컴포넌트에서 서버 상태를 확인할 수 있습니다.

### 3. 디버깅

브라우저 개발자 도구의 Network 탭에서 API 요청을 확인하세요.

### 4. CORS 설정

서버에서 CORS를 허용해야 합니다:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

## 다음 단계

1. 각 도메인별로 서비스 파일 생성 (주문, 파트너, 배너 등)
2. 기존 컴포넌트를 서비스 레이어 사용으로 마이그레이션
3. 서버 API 엔드포인트와 통신 테스트
4. 에러 처리 및 사용자 피드백 개선

## 문의

추가 질문이나 도움이 필요하면 개발팀에 문의하세요.