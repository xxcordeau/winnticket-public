# 🌐 환경 구분 완료: 개발 vs 운영

## 📋 환경 정의

### 개발 환경 (Development)
- **프론트엔드**: `http://localhost:3000`
- **API 서버**: `http://<YOUR_SERVER_IP>` (HTTP IP)
- **용도**: 로컬 개발 및 테스트

### 운영 환경 (Production)
- **프론트엔드**: `https://www.winnticket.store`
- **API 서버**: `https://api.winnticket.store` (HTTPS 도메인)
- **용도**: 실제 서비스 운영

---

## ✅ 자동 환경 감지

### 1️⃣ Hostname 기반 감지 (최우선)

```typescript
// /lib/config.ts
if (hostname === 'www.winnticket.store') {
  return 'https://api.winnticket.store'; // 운영 API
}

if (hostname === 'localhost') {
  return 'http://<YOUR_SERVER_IP>'; // 개발 API
}
```

### 2️⃣ 환경 변수 파일

#### `.env.development` (개발 자동 로드)
```bash
VITE_API_BASE_URL=http://<YOUR_SERVER_IP>
VITE_APP_URL=http://localhost:3000
```

#### `.env.production` (운영 자동 로드)
```bash
VITE_API_BASE_URL=https://api.winnticket.store
VITE_APP_URL=https://www.winnticket.store
```

---

## 🚀 사용 방법

### 로컬 개발 실행
```bash
# 개발 모드 (자동으로 .env.development 로드)
npm run dev

# 결과:
# - Frontend: http://localhost:3000
# - API: http://<YOUR_SERVER_IP>
# - Mixed Content 문제 없음 (둘 다 HTTP)
```

### 운영 배포 빌드
```bash
# 프로덕션 빌드 (자동으로 .env.production 로드)
npm run build

# 결과:
# - Frontend: https://www.winnticket.store
# - API: https://api.winnticket.store
# - Mixed Content 문제 없음 (둘 다 HTTPS)
```

---

## 🔧 환경 설정 우선순위

1. **.env 파일** (최우선)
   - `.env.development` (개발 모드)
   - `.env.production` (프로덕션 모드)
   - `.env.local` (로컬 오버라이드)

2. **/env.config.ts** (TypeScript 설정)
   ```typescript
   export const ENV_CONFIG = {
     API_BASE_URL: '', // 비워두면 자동 감지
     APP_URL: '',
   };
   ```

3. **자동 감지** (/lib/config.ts)
   - Hostname 체크 → 환경 구분
   - Build mode 체크 → development/production

4. **폴백 (Fallback)**
   - 개발: `http://<YOUR_SERVER_IP>`
   - 운영: `https://api.winnticket.store`

---

## 📁 파일 구조

```
프로젝트 루트/
├── .env.development      # 개발 환경 변수 (Git 추적)
├── .env.production       # 운영 환경 변수 (Git 추적)
├── .env.example          # 환경 변수 예제
├── .env                  # 로컬 오버라이드 (Git 무시)
├── .gitignore            # .env 파일 무시 설정
├── env.config.ts         # TypeScript 환경 설정
├── vite.config.ts        # Vite 설정 (프록시 포함)
└── lib/
    └── config.ts         # 환경 감지 로직
```

---

## 🔍 환경 확인 방법

### 브라우저 콘솔
```javascript
// 개발자 도구 > Console
console.log('현재 API URL:', import.meta.env.VITE_API_BASE_URL);
console.log('현재 모드:', import.meta.env.MODE);
```

### 네트워크 탭
개발자 도구 > Network 탭
- ✅ 개발: `http://<YOUR_SERVER_IP>/api/...`
- ✅ 운영: `https://api.winnticket.store/api/...`

### 터미널 출력
```bash
# npm run dev 실행 시
🔧 Vite Config: {
  mode: 'development',
  apiBaseUrl: 'http://<YOUR_SERVER_IP>'
}

# npm run build 실행 시
🔧 Vite Config: {
  mode: 'production',
  apiBaseUrl: 'https://api.winnticket.store'
}
```

---

## 🎯 환경별 동작 흐름

### 개발 환경 (localhost)
```mermaid
localhost:3000 (HTTP)
    ↓ (프록시 또는 직접 호출)
<YOUR_SERVER_IP> (HTTP)
    ↓
✅ 정상 동작 (Mixed Content 없음)
```

### 운영 환경 (www.winnticket.store)
```mermaid
www.winnticket.store (HTTPS)
    ↓
api.winnticket.store (HTTPS)
    ↓
✅ 정상 동작 (Mixed Content 없음)
```

### ❌ Mixed Content 에러 발생 케이스
```mermaid
www.winnticket.store (HTTPS)
    ↓
<YOUR_SERVER_IP> (HTTP) ← ❌ 브라우저 차단!
```

---

## 🛠️ 수동 환경 전환

개발 중에 운영 API를 테스트하고 싶다면:

### 방법 1: `.env.local` 파일 생성
```bash
# 로컬 개발에서 운영 API 사용
VITE_API_BASE_URL=https://api.winnticket.store
```

### 방법 2: `/env.config.ts` 직접 수정
```typescript
export const ENV_CONFIG = {
  API_BASE_URL: 'https://api.winnticket.store', // 운영 API 사용
  APP_URL: 'http://localhost:3000',
};
```

⚠️ **주의**: 수동 변경 후 반드시 개발 서버 재시작!

---

## 📊 환경 비교표

| 항목 | 개발 환경 | 운영 환경 |
|------|----------|----------|
| **프론트엔드 URL** | `http://localhost:3000` | `https://www.winnticket.store` |
| **API URL** | `http://<YOUR_SERVER_IP>` | `https://api.winnticket.store` |
| **프로토콜** | HTTP | HTTPS |
| **도메인/IP** | IP 주소 | 도메인 |
| **SSL 인증서** | 없음 | 있음 |
| **실행 명령** | `npm run dev` | `npm run build` |
| **환경 변수 파일** | `.env.development` | `.env.production` |
| **Mixed Content** | ✅ 문제 없음 | ✅ 문제 없음 |

---

## 🔒 보안 고려사항

### HTTPS 통신 (운영 환경)
- ✅ 데이터 암호화
- ✅ 중간자 공격 방지
- ✅ SEO 및 브라우저 신뢰도 향상

### HTTP 통신 (개발 환경)
- ⚠️ 로컬 네트워크에서만 사용
- ⚠️ 실제 사용자 데이터 사용 금지
- ⚠️ 테스트 데이터만 사용 권장

---

## ✅ 최종 체크리스트

- [x] `/lib/config.ts` - 자동 환경 감지 로직
- [x] `/env.config.ts` - TypeScript 환경 설정
- [x] `/.env.development` - 개발 환경 변수
- [x] `/.env.production` - 운영 환경 변수
- [x] `/.env.example` - 환경 변수 예제
- [x] `/.gitignore` - .env 파일 제외
- [x] `/vite.config.ts` - Vite 프록시 설정
- [x] Mixed Content 에러 해결
- [x] Authorization 헤더 정상 전송
- [x] Content-Type 헤더 정상 전송

---

## 🎉 완료!

이제 개발과 운영 환경이 완전히 분리되어 자동으로 올바른 API를 호출합니다!

### 개발자 경험
- ✅ 로컬 개발 시 자동으로 개발 API 연결
- ✅ 프로덕션 빌드 시 자동으로 운영 API 연결
- ✅ 환경 변수로 손쉽게 설정 변경
- ✅ Mixed Content 걱정 없음

### 사용자 경험
- ✅ HTTPS로 안전한 통신
- ✅ 빠른 응답 속도
- ✅ 신뢰할 수 있는 서비스

**작성일**: 2025-02-17  
**해결 사항**: 개발/운영 환경 완전 분리 및 자동 감지 시스템 구축
