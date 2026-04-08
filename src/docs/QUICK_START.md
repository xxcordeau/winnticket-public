# ⚡ 빠른 시작 가이드

## 🎯 1분 요약

### 개발 환경
```bash
npm install
npm run dev
```
→ `http://localhost:3000` + `http://<YOUR_SERVER_IP>` (개발 API)

### 운영 빌드
```bash
npm run build
```
→ `https://www.winnticket.store` + `https://api.winnticket.store` (운영 API)

---

## 🔍 환경 자동 감지

### localhost → 개발 API
```
localhost:3000 (HTTP)
    ↓
<YOUR_SERVER_IP> (HTTP)
```

### 운영 도메인 → 운영 API
```
www.winnticket.store (HTTPS)
    ↓
api.winnticket.store (HTTPS)
```

---

## 📝 환경 변수 파일

### `.env.development` (자동 로드)
```bash
VITE_API_BASE_URL=http://<YOUR_SERVER_IP>
VITE_APP_URL=http://localhost:3000
```

### `.env.production` (자동 로드)
```bash
VITE_API_BASE_URL=https://api.winnticket.store
VITE_APP_URL=https://www.winnticket.store
```

---

## 🚀 명령어

| 명령어 | 설명 | 환경 |
|--------|------|------|
| `npm run dev` | 개발 서버 | 개발 API |
| `npm run build` | 프로덕션 빌드 | 운영 API |
| `npm run build:dev` | 개발 빌드 | 개발 API |
| `npm run build:prod` | 명시적 운영 빌드 | 운영 API |
| `npm run preview` | 빌드 미리보기 | 빌드 설정 따름 |

---

## ✅ 체크리스트

- [x] 환경별 API URL 자동 감지
- [x] `.env.development` / `.env.production` 파일 생성
- [x] Mixed Content 에러 해결
- [x] Authorization 헤더 정상 전송
- [x] 개발/운영 환경 완전 분리

---

## 🎉 완료!

이제 **개발 환경에서는 개발 API**, **운영 환경에서는 운영 API**가 자동으로 연결됩니다!

### 확인 방법
```javascript
// 브라우저 콘솔
console.log('API URL:', import.meta.env.VITE_API_BASE_URL);
```

### 네트워크 탭
- 개발: `http://<YOUR_SERVER_IP>/api/...` ✅
- 운영: `https://api.winnticket.store/api/...` ✅

---

**작성일**: 2025-02-17
