# 🎫 WinnTicket Store

프론트엔드 전용 티켓 판매 사이트 데모 프로젝트

---

## 🌐 환경 구분

### 개발 환경 (Development)
- **프론트엔드**: `http://localhost:3000`
- **API 서버**: `http://<YOUR_SERVER_IP>`

### 운영 환경 (Production)
- **프론트엔드**: `https://www.winnticket.store`
- **API 서버**: `https://api.winnticket.store`

---

## 🚀 시작하기

### 설치
```bash
npm install
```

### 개발 서버 실행
```bash
npm run dev
```
- 자동으로 `.env.development` 환경 변수 로드
- 개발 API(`http://<YOUR_SERVER_IP>`) 연결
- `http://localhost:3000`에서 실행

### 프로덕션 빌드
```bash
# 일반 빌드 (프로덕션)
npm run build

# 명시적 프로덕션 빌드
npm run build:prod

# 개발용 빌드 (테스트용)
npm run build:dev
```

### 빌드 미리보기
```bash
npm run preview
```

---

## 📁 프로젝트 구조

```
winnticket-store/
├── components/          # React 컴포넌트
│   ├── admin/          # 관리자 페이지 컴포넌트
│   ├── shop/           # 쇼핑몰 컴포넌트
│   └── ui/             # 공통 UI 컴포넌트
├── lib/                # 유틸리티 & 설정
│   ├── api.ts          # API 클라이언트
│   ├── auth.ts         # 인증 관리
│   └── config.ts       # 환경 설정
├── pages/              # 페이지 컴포넌트
│   ├── admin/          # 관리자 페이지 (/admin/*)
│   └── shop/           # 쇼핑몰 페이지 (/)
├── .env.development    # 개발 환경 변수
├── .env.production     # 운영 환경 변수
├── env.config.ts       # TypeScript 환경 설정
└── vite.config.ts      # Vite 설정
```

---

## 🔧 환경 변수

### `.env.development` (개발)
```bash
VITE_API_BASE_URL=http://<YOUR_SERVER_IP>
VITE_APP_URL=http://localhost:3000
```

### `.env.production` (운영)
```bash
VITE_API_BASE_URL=https://api.winnticket.store
VITE_APP_URL=https://www.winnticket.store
```

### 환경 변수 우선순위
1. `.env.development` / `.env.production` (모드별 자동 로드)
2. `.env.local` (로컬 오버라이드, Git 무시)
3. `/env.config.ts` (TypeScript 설정)
4. 자동 감지 (/lib/config.ts)

---

## 🎨 주요 기능

### 쇼핑몰 (/)
- 홈페이지 & 상품 목록
- 상품 상세 페이지
- 장바구니 & 결제
- 티켓 조회 & 입장

### 관리자 (/admin/*)
- 대시보드
- 채널 관리
- 메뉴 관리
- 배너 관리
- 상품 관리
- 티켓 관리
- 주문 관리

---

## 🔐 권한 시스템

- **ADMIN (ROLE001)**: 전체 관리 권한
- **SUPERVISOR (ROLE002)**: 현장 관리 권한

---

## 🌈 멀티 채널 시스템

URL 파라미터로 채널별 브랜딩 적용:
```
https://www.winnticket.store/?channel=CHANNEL01
https://www.winnticket.store/?channel=CHANNEL02
```

---

## 🛠️ 기술 스택

- **Frontend**: React 18 + TypeScript
- **Routing**: React Router v7 (Data Mode)
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI
- **Build Tool**: Vite
- **State Management**: React Context
- **Form**: React Hook Form
- **Charts**: Recharts
- **Icons**: Lucide React
- **Animation**: Motion (Framer Motion)

---

## 📋 개발 가이드

### API 호출 예제
```typescript
import { api } from './lib/api';

// GET 요청
const response = await api.get('/api/products');

// POST 요청
const response = await api.post('/api/orders', {
  productId: 'PROD001',
  quantity: 1
});
```

### 인증 관리
```typescript
import { login, logout, checkAuth } from './lib/auth';

// 로그인
await login('admin@example.com', 'password');

// 로그아웃
logout();

// 인증 상태 확인
const user = checkAuth();
```

---

## 🐛 트러블슈팅

### Mixed Content 에러
HTTPS 사이트에서 HTTP API를 호출할 수 없습니다.
- ✅ 해결: 환경 변수에서 HTTPS API URL 사용

### CORS 에러
서버에서 CORS 설정이 필요합니다.
- ✅ 해결: Vite 프록시 사용 (개발 환경)

### 헤더가 전송되지 않음
Mixed Content 차단으로 요청 자체가 막힙니다.
- ✅ 해결: 프로토콜 일치 (HTTP ↔ HTTP, HTTPS ↔ HTTPS)

자세한 내용: `/ENV_SETUP_COMPLETE.md` 참고

---

## 📝 문서

- [환경 설정 가이드](./ENV_SETUP_COMPLETE.md)
- [Mixed Content 해결](./MIXED_CONTENT_FIX.md)

---

## 📄 라이센스

이 프로젝트는 데모 목적으로 제작되었습니다.

---

## 🙋‍♂️ 지원

문제가 발생하면 이슈를 등록해 주세요.

---

**버전**: 1.0.0  
**최종 업데이트**: 2025-02-17
