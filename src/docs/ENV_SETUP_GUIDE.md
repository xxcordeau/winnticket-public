# 🔧 환경 변수 설정 가이드

위너티켓 티켓몰 프로젝트의 환경 변수 설정 방법입니다.

## 📁 환경 변수 파일

### `.env` (현재 환경 설정)
실제 사용할 환경 변수를 설정합니다.

```env
# API 서버 URL (백엔드 서버 주소)
VITE_API_BASE_URL=https://<YOUR_SERVER_IP>

# 프론트엔드 도메인 (쇼핑몰 도메인)
VITE_APP_URL=https://www.winnticket.store
```

### `.env.example` (예시 파일)
환경 변수 예시와 설명을 포함한 템플릿 파일입니다.

---

## 🌍 환경별 설정

### 개발 환경 (Development)

`.env` 파일:
```env
VITE_API_BASE_URL=http://localhost:8080
VITE_APP_URL=http://localhost:3000
```

또는 `.env.development` 파일 생성:
```env
VITE_API_BASE_URL=http://localhost:8080
VITE_APP_URL=http://localhost:3000
```

### 프로덕션 환경 (Production)

`.env.production` 파일:
```env
VITE_API_BASE_URL=https://<YOUR_SERVER_IP>
VITE_APP_URL=https://www.winnticket.store
```

---

## 📝 환경 변수 설명

### `VITE_API_BASE_URL`
- **설명**: 백엔드 API 서버의 기본 URL
- **용도**: 모든 API 호출 시 사용
- **예시**:
  - 로컬: `http://localhost:8080`
  - 개발 서버: `https://<YOUR_SERVER_IP>`
  - 프로덕션: `https://api.winnticket.store`

### `VITE_APP_URL`
- **설명**: 프론트엔드 쇼핑몰의 도메인
- **용도**: 채널별 URL 생성 시 사용 (`?channel=ABC`)
- **예시**:
  - 로컬: `http://localhost:3000`
  - 프로덕션: `https://www.winnticket.store`

---

## 🚀 빌드 및 실행

### 개발 모드 실행
```bash
# .env 파일 또는 .env.development 파일을 사용
npm run dev
```

### 프로덕션 빌드
```bash
# .env.production 파일을 사용
npm run build

# 빌드된 파일 미리보기
npm run preview
```

### 환경별 빌드
```bash
# 개발 환경 빌드
npm run build -- --mode development

# 프로덕션 환경 빌드
npm run build -- --mode production
```

---

## 🔍 코드에서 환경 변수 사용하기

### 직접 사용 (권장하지 않음)
```typescript
const apiUrl = import.meta.env.VITE_API_BASE_URL;
const appUrl = import.meta.env.VITE_APP_URL;
```

### 유틸리티 함수 사용 (권장)
```typescript
import { getApiBaseUrl, getAppUrl, getChannelUrl } from './lib/config';

// API URL 가져오기
const apiUrl = getApiBaseUrl();
console.log(apiUrl); // https://<YOUR_SERVER_IP>

// 앱 URL 가져오기
const appUrl = getAppUrl();
console.log(appUrl); // https://www.winnticket.store

// 채널 URL 생성
const channelUrl = getChannelUrl('ABC');
console.log(channelUrl); // https://www.winnticket.store/?channel=ABC
```

### API 클라이언트 사용 (자동으로 환경 변수 사용)
```typescript
import { api } from './lib/api';

// GET 요청
const response = await api.get('/api/products');

// POST 요청
const response = await api.post('/api/orders', orderData);
```

---

## ⚙️ 환경 변수 우선순위

1. **로컬스토리지** - `api_endpoint` 키 (자동 감지된 엔드포인트)
2. **환경 변수** - `.env` 파일의 `VITE_API_BASE_URL`
3. **폴백 (Fallback)**
   - 프로덕션 모드: `https://<YOUR_SERVER_IP>`
   - 개발 모드: `http://localhost:8080`

---

## 🔐 보안 주의사항

1. **`.env` 파일은 절대 Git에 커밋하지 마세요!**
   - `.gitignore`에 이미 추가되어 있습니다.

2. **민감한 정보는 환경 변수에 저장하지 마세요**
   - API 키, 비밀번호 등은 서버에서 관리하세요.

3. **프론트엔드 환경 변수는 클라이언트에 노출됩니다**
   - `VITE_` 접두사가 붙은 변수만 브라우저에서 접근 가능합니다.
   - 민감한 정보는 절대 포함하지 마세요.

---

## 📚 참고 문서

- [Vite 환경 변수 공식 문서](https://vitejs.dev/guide/env-and-mode.html)
- [프로젝트 API 연동 가이드](/API-SETUP-README.md)
- [환경 설정 체크리스트](/CHECKLIST.md)

---

## ❓ 자주 묻는 질문 (FAQ)

### Q: 환경 변수 변경 후 반영이 안 돼요
A: 개발 서버를 재시작해야 합니다.
```bash
# Ctrl+C로 서버 종료 후
npm run dev
```

### Q: 빌드 시 환경 변수가 적용 안 돼요
A: `.env.production` 파일이 있는지 확인하고, 빌드 명령어에 `--mode` 옵션을 추가하세요.
```bash
npm run build -- --mode production
```

### Q: API URL을 동적으로 변경할 수 있나요?
A: 네, 로컬스토리지에 `api_endpoint`를 저장하면 우선적으로 사용됩니다.
```javascript
localStorage.setItem('api_endpoint', 'https://new-api-server.com/api/menu/menuListAll');
```

---

**마지막 업데이트**: 2025-02-17  
**작성자**: Winnticket Dev Team
