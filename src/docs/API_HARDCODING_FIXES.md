# 🔧 API 하드코딩 수정 완료 보고서

## ✅ 수정 완료된 파일들

### 1. 핵심 설정 파일
- **`/.env`** - 환경 변수 파일 생성 ✅
  - `VITE_API_BASE_URL=https://<YOUR_SERVER_IP>`
  - `VITE_APP_URL=https://www.winnticket.store`

- **`/.env.example`** - 환경 변수 템플릿 ✅

- **`/.gitignore`** - Git 제외 파일 (새로 생성) ✅
  - `.env` 파일을 Git에서 제외하여 보안 유지

- **`/lib/config.ts`** - 중앙 설정 관리 (새로 생성) ✅
  - `getApiBaseUrl()` - API 서버 URL
  - `getAppUrl()` - 프론트엔드 URL
  - `getChannelUrl(code)` - 채널 URL 생성

### 2. 빌드 설정 파일
- **`/vite.config.ts`** ✅
  - ~~`proxy.target: 'https://api.winnticket.store'` 하드코딩~~
  - `loadEnv()`로 환경 변수 로드
  - 프록시 타겟이 `VITE_API_BASE_URL` 사용
  - 디버깅 로그 추가

- **`/index.html`** ✅
  - ~~`<link rel="icon" href="https://api.winnticket.store/..."` 하드코딩~~
  - `href="%VITE_API_BASE_URL%/uploads/..."` 환경 변수 사용

### 3. API 클라이언트 파일
- **`/lib/api.ts`** ✅
  - ~~`function getApiBaseUrl()` 제거~~
  - `import { getApiBaseUrl } from './config'` 추가
  - 모든 API 호출이 환경 변수 사용

- **`/lib/api/auth.ts`** ✅
  - ~~`function getAuthApiBaseUrl()` 제거~~
  - `import { getApiBaseUrl } from '../config'` 추가
  - `export const API_BASE_URL = getApiBaseUrl()`

- **`/lib/api/popup.ts`** ✅
  - ~~`function getPopupApiBaseUrl()` 제거~~
  - `import { getApiBaseUrl } from '../config'` 추가
  - `const API_BASE_URL = getApiBaseUrl()`

- **`/lib/api/shop-cart.ts`** ✅
  - 이미 `import { API_BASE_URL } from './auth'` 사용
  - auth.ts가 환경 변수 사용하므로 자동으로 적용됨

### 4. 컴포넌트 파일
- **`/components/server-diagnostic.tsx`** ✅
  - `import { getApiBaseUrl } from '../lib/config'` 추가
  - 서버 진단 시 환경 변수 사용

- **`/components/pages/channel-detail.tsx`** ✅
  - `import { getChannelUrl } from '../../lib/config'` 추가
  - 채널 URL 복사/열기 기능에 사용

- **`/components/pages/channel-management.tsx`** ✅
  - `import { getChannelUrl } from '../../lib/config'` 추가
  - 채널 URL 복사/열기 기능에 사용

### 5. 자동으로 환경 변수 사용하는 파일들
다음 파일들은 `/lib/api.ts`의 `api` 클라이언트를 사용하므로 별도 수정 불필요:
- `/lib/api/channel.ts` ✅
- `/lib/api/file.ts` ✅
- `/lib/api/product.ts` ✅
- `/lib/api/partner.ts` ✅
- `/lib/api/order.ts` ✅
- `/lib/api/banner.ts` ✅
- `/lib/api/menu.ts` ✅
- `/lib/api/admin-menu.ts` ✅
- `/lib/api/section.ts` ✅
- `/lib/api/notice.ts` ✅
- `/lib/api/event.ts` ✅
- `/lib/api/faq.ts` ✅
- `/lib/api/qna.ts` ✅
- `/lib/api/sms-template.ts` ✅
- 기타 모든 `/lib/api/*` 파일들

---

## 🎯 하드코딩되어 있지만 수정 불필요한 것들

### 1. 플레이스홀더 및 예시 URL
- `https://example.com` - 폼 입력 예시
- 배너/팝업 이미지 URL 플레이스홀더

### 2. 외부 서비스 URL (고정값)
- **카카오톡 채널**: `https://pf.kakao.com/_sxeSvxl`
  - 위치: `/components/shop-header.tsx:428`
  - 고정된 카카오톡 채널 URL

### 3. SVG XML Namespace
- `xmlns="http://www.w3.org/2000/svg"` - SVG 표준 속성

### 4. 이미지 CDN URL
- Unsplash 이미지 URL - 샘플 데이터용 이미지

### 5. API 엔드포인트 상대 경로
- `/lib/api-config.ts` - 상대 경로만 정의 (괜찮음)
  - 예: `/api/auth/login`, `/api/products` 등

### 6. 서버 인프라 설정 파일 (참고용 문서)
- `/nginx-api.winnticket.store.conf.tsx` - Nginx 설정
- `/spring-boot-cors-config.java.tsx` - Spring Boot CORS 설정
- 이 파일들은 백엔드 서버 설정 참고용이며 프론트엔드 코드가 아님

### 7. TypeScript 및 빌드 설정 (괜찮음)
- `/tsconfig.json` - TypeScript 설정
- `/tsconfig.node.json` - Vite용 TypeScript 설정
- `/postcss.config.js` - PostCSS 설정
- `/package.json` - NPM 패키지 설정

---

## 📊 환경 변수 우선순위

1. **로컬스토리지** (자동 탐지)
   ```javascript
   localStorage.getItem('api_endpoint')
   ```

2. **환경 변수 (.env)**
   ```javascript
   import.meta.env.VITE_API_BASE_URL
   ```

3. **폴백 (하드코딩)**
   - 프로덕션: `https://<YOUR_SERVER_IP>`
   - 개발: `http://localhost:8080`

---

## 🔍 검증 방법

### 1. 환경 변수 확인
```bash
# .env 파일이 있는지 확인
cat .env

# 출력 예시:
# VITE_API_BASE_URL=https://<YOUR_SERVER_IP>
# VITE_APP_URL=https://www.winnticket.store
```

### 2. 브라우저 콘솔에서 확인
```javascript
// 개발자 도구 콘솔
console.log('API URL:', import.meta.env.VITE_API_BASE_URL);
console.log('App URL:', import.meta.env.VITE_APP_URL);
```

### 3. 네트워크 탭에서 확인
- 개발자 도구 > Network 탭
- API 호출 시 Request URL 확인
- `https://<YOUR_SERVER_IP>/api/...` 형식으로 호출되는지 확인

### 4. Vite 개발 서버 콘솔 확인
```bash
npm run dev

# 콘솔 출력:
# 🔧 Vite Config - API Proxy Target: https://<YOUR_SERVER_IP>
# 🔄 Proxying: GET /api/products → https://<YOUR_SERVER_IP>/api/products
# ✅ Proxy response: /api/products → 200
```

---

## 📝 사용 예시

### API 호출
```typescript
import { api } from './lib/api';

// 자동으로 VITE_API_BASE_URL 사용
const response = await api.get('/api/products');
```

### 채널 URL 생성
```typescript
import { getChannelUrl } from './lib/config';

const url = getChannelUrl('ABC123');
// 결과: https://www.winnticket.store/?channel=ABC123
```

### 직접 환경 변수 접근
```typescript
import { getApiBaseUrl, getAppUrl } from './lib/config';

console.log(getApiBaseUrl()); // https://<YOUR_SERVER_IP>
console.log(getAppUrl());     // https://www.winnticket.store
```

---

## ✨ 개선 사항

### Before (하드코딩)
```typescript
// vite.config.ts
const API_BASE_URL = 'https://api.winnticket.store';

// index.html
<link rel="icon" href="https://api.winnticket.store/uploads/..." />

// lib/api.ts
const channelUrl = `${window.location.origin}/?channel=${code}`;
```

### After (환경 변수)
```typescript
// vite.config.ts
import { loadEnv } from 'vite';
const apiBaseUrl = env.VITE_API_BASE_URL || 'https://<YOUR_SERVER_IP>';

// index.html
<link rel="icon" href="%VITE_API_BASE_URL%/uploads/..." />

// lib/config.ts
import { getApiBaseUrl, getChannelUrl } from './lib/config';
const API_BASE_URL = getApiBaseUrl();
const channelUrl = getChannelUrl(code);
```

---

## 🚀 배포 시 주의사항

### 개발 환경
```bash
# .env 파일
VITE_API_BASE_URL=http://localhost:8080
VITE_APP_URL=http://localhost:3000

# 개발 서버 실행
npm run dev
```

### 프로덕션 환경
```bash
# .env 파일
VITE_API_BASE_URL=https://<YOUR_SERVER_IP>
VITE_APP_URL=https://www.winnticket.store

# 빌드
npm run build

# 프리뷰
npm run preview
```

### CI/CD 환경
빌드 시스템에서 환경 변수를 주입:
```bash
# GitHub Actions, Vercel, Netlify 등
VITE_API_BASE_URL=https://<YOUR_SERVER_IP> npm run build
```

---

## 🎉 완료!

모든 API 하드코딩을 환경 변수로 마이그레이션했습니다.
이제 `.env` 파일만 수정하면 URL을 변경할 수 있습니다!

**수정된 파일 요약**:
- ✅ 환경 변수 파일: `.env`, `.env.example`, `.gitignore`
- ✅ 빌드 설정: `vite.config.ts`, `index.html`
- ✅ 중앙 설정: `/lib/config.ts` (신규)
- ✅ API 클라이언트: `/lib/api.ts`, `/lib/api/auth.ts`, `/lib/api/popup.ts`
- ✅ 컴포넌트: 3개 파일
- ✅ 자동 적용: 모든 `/lib/api/*` 파일들

**작성일**: 2025-02-17  
**작업자**: AI Assistant