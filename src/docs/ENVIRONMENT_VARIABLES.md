# 🌍 환경 변수 마이그레이션 완료

## ✅ 완료된 작업

### 1. 환경 변수 파일 생성
- ✅ `.env` - 현재 사용 중인 환경 변수
- ✅ `.env.example` - 환경 변수 템플릿

### 2. 설정 유틸리티 생성
- ✅ `/lib/config.ts` - 중앙 집중식 환경 변수 관리
  - `getApiBaseUrl()` - API 서버 URL
  - `getAppUrl()` - 프론트엔드 앱 URL  
  - `getChannelUrl(channelCode)` - 채널별 URL 생성

### 3. 수정된 API 파일들

#### 핵심 파일
- ✅ `/lib/api.ts` - API 클라이언트 (config.ts 사용)
- ✅ `/lib/api/auth.ts` - 인증 API (config.ts 사용)
- ✅ `/lib/api/channel.ts` - 채널 API (이미 api.ts 사용)
- ✅ `/lib/api/file.ts` - 파일 API (이미 api.ts 사용)
- ✅ `/lib/api/product.ts` - 상품 API (이미 api.ts 사용)
- ✅ 기타 모든 `/lib/api/*` 파일들 (이미 api.ts 사용)

#### 컴포넌트 파일
- ✅ `/components/server-diagnostic.tsx` - 서버 진단 (config.ts 사용)
- ✅ `/components/pages/channel-detail.tsx` - 채널 상세 (config.ts 사용)
- ✅ `/components/pages/channel-management.tsx` - 채널 관리 (config.ts 사용)

### 4. 문서 작성
- ✅ `/ENV_SETUP_GUIDE.md` - 환경 변수 설정 가이드
- ✅ `/ENVIRONMENT_VARIABLES.md` - 이 문서

---

## 📦 현재 환경 변수

### `.env` 파일 내용
```env
# API 서버 URL (백엔드)
VITE_API_BASE_URL=http://<YOUR_SERVER_IP>

# 프론트엔드 도메인 (쇼핑몰)
VITE_APP_URL=https://www.winnticket.store
```

---

## 🔄 마이그레이션 전/후 비교

### ❌ 이전 방식 (하드코딩)
```typescript
// 나쁜 예시 - URL이 여기저기 하드코딩됨
const API_BASE_URL = 'https://api.winnticket.store';
const channelUrl = `${window.location.origin}/?channel=${code}`;
```

### ✅ 현재 방식 (환경 변수)
```typescript
// 좋은 예시 - 환경 변수 사용
import { getApiBaseUrl, getChannelUrl } from './lib/config';

const API_BASE_URL = getApiBaseUrl();
const channelUrl = getChannelUrl(code);
```

---

## 🎯 장점

1. **환경 분리**
   - 개발/스테이징/프로덕션 환경별로 다른 URL 사용 가능
   - `.env.development`, `.env.production` 파일로 분리

2. **유지보수 용이**
   - URL 변경 시 `.env` 파일만 수정
   - 코드 수정 불필요

3. **보안 강화**
   - 민감한 정보를 코드에 하드코딩하지 않음
   - `.gitignore`에 `.env` 추가하여 Git 커밋 방지

4. **팀 협업**
   - 개발자마다 다른 로컬 환경 설정 가능
   - `.env.example`로 필요한 환경 변수 안내

---

## 🚀 사용 방법

### API 호출
```typescript
import { api } from './lib/api';

// 자동으로 VITE_API_BASE_URL 사용
const response = await api.get('/api/products');
```

### 채널 URL 생성
```typescript
import { getChannelUrl } from './lib/config';

// 자동으로 VITE_APP_URL 사용
const url = getChannelUrl('ABC');
// 결과: https://www.winnticket.store/?channel=ABC
```

### 직접 환경 변수 접근
```typescript
import { getApiBaseUrl, getAppUrl } from './lib/config';

console.log(getApiBaseUrl()); // https://<YOUR_SERVER_IP>
console.log(getAppUrl());     // https://www.winnticket.store
```

---

## 📋 체크리스트

### 개발자 설정
- [ ] `.env` 파일 생성 (`.env.example` 참고)
- [ ] 로컬 개발 환경에 맞게 URL 수정
- [ ] 개발 서버 재시작 (`npm run dev`)

### 배포 전 확인
- [ ] `.env.production` 파일 확인
- [ ] 프로덕션 URL이 올바른지 확인
- [ ] 빌드 테스트 (`npm run build`)

### 보안 확인
- [ ] `.env` 파일이 `.gitignore`에 있는지 확인
- [ ] Git 히스토리에 `.env` 파일이 없는지 확인
- [ ] 민감한 정보가 환경 변수에 없는지 확인

---

## 🔧 트러블슈팅

### 환경 변수가 적용되지 않을 때
1. 개발 서버 재시작
   ```bash
   # Ctrl+C로 종료 후
   npm run dev
   ```

2. 환경 변수 이름 확인
   - `VITE_` 접두사가 있는지 확인
   - 오타가 없는지 확인

3. 캐시 삭제
   ```bash
   rm -rf node_modules/.vite
   npm run dev
   ```

### 빌드 시 문제 발생
1. 올바른 `.env` 파일 사용 확인
   ```bash
   npm run build -- --mode production
   ```

2. 환경 변수 값 확인
   ```bash
   cat .env.production
   ```

---

## 📚 관련 문서

- [환경 변수 설정 가이드](/ENV_SETUP_GUIDE.md)
- [API 연동 가이드](/lib/api/README.md)
- [Vite 환경 변수 공식 문서](https://vitejs.dev/guide/env-and-mode.html)

---

**마이그레이션 완료일**: 2025-02-17  
**작업자**: AI Assistant  
**상태**: ✅ 완료