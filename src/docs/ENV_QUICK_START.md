# ⚡ 환경 설정 빠른 시작 가이드

## 🎯 선택: 두 가지 방법 중 하나 선택

`.env` 파일이 생성되지 않는 환경에서는 **방법 2**를 사용하세요!

---

## 방법 1️⃣: .env 파일 사용 (권장)

### 📁 위치
```
프로젝트 루트/
├── .env          ⭐ 이 파일 생성
├── package.json
└── vite.config.ts
```

### ✍️ 내용
프로젝트 루트에 `.env` 파일을 만들고 아래 내용 복사:

```bash
VITE_API_BASE_URL=http://<YOUR_SERVER_IP>
VITE_APP_URL=https://www.winnticket.store
```

> ⚠️ **주의**: IP 주소는 SSL 인증서가 없으므로 `http://`를 사용합니다!

### 🚀 실행
```bash
npm run dev
```

---

## 방법 2️⃣: env.config.ts 파일 사용 (대안)

### 📁 위치
```
프로젝트 루트/
├── env.config.ts       ⭐ 이미 생성됨
├── package.json
└── vite.config.ts
```

### ✍️ 수정
`/env.config.ts` 파일을 열고 아래 부분만 수정:

```typescript
export const ENV_CONFIG = {
  API_BASE_URL: 'http://<YOUR_SERVER_IP>',      // ← 여기 수정
  APP_URL: 'https://www.winnticket.store',    // ← 여기 수정
};
```

### 🚀 실행
```bash
npm run dev
```

---

## 🔍 확인 방법

개발 서버를 실행하면 콘솔에 다음과 같이 표시됩니다:

```
📝 ENV_CONFIG loaded:
  - API_BASE_URL: http://<YOUR_SERVER_IP>
  - APP_URL: https://www.winnticket.store

🔧 Vite Config - API Proxy Target: http://<YOUR_SERVER_IP>
```

---

## 🛠️ 환경별 설정

### 로컬 개발
```typescript
API_BASE_URL: 'http://localhost:8080',
APP_URL: 'http://localhost:3000',
```

### 프로덕션 (IP 접근)
```typescript
API_BASE_URL: 'http://<YOUR_SERVER_IP>',      // http 사용 (SSL 없음)
APP_URL: 'https://www.winnticket.store',
```

### 프로덕션 (도메인)
```typescript
API_BASE_URL: 'https://api.winnticket.store',  // https 사용 (SSL 있음)
APP_URL: 'https://www.winnticket.store',
```

---

## ⚠️ 주의사항

1. **수정 후 재시작**: 설정 변경 후 `npm run dev` 재실행
2. **Git 커밋 금지**: `.env`와 `env.config.ts`는 `.gitignore`에 포함됨
3. **템플릿 사용**: `env.config.example.ts` 파일 참고
4. **HTTP vs HTTPS**:
   - IP 주소 (`<YOUR_SERVER_IP>`): `http://` 사용
   - 도메인 (`api.winnticket.store`): `https://` 사용 가능

---

## 📚 더 자세한 내용

전체 가이드는 `/ENV_CONFIG_GUIDE.md` 파일을 참고하세요!

---

**작성일**: 2025-02-17  
**마지막 수정**: 2025-02-17 (http:// 변경)
