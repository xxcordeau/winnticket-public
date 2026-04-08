# 🔧 환경 설정 가이드

## 📁 설정 파일 위치

프로젝트에는 **두 가지 방법**으로 환경 변수를 설정할 수 있습니다:

### 방법 1: `.env` 파일 (권장)
```
프로젝트 루트/
├── .env                 ⭐ 이 파일 생성 (권장)
├── package.json
└── vite.config.ts
```

### 방법 2: `env.config.ts` 파일 (대안)
```
프로젝트 루트/
├── env.config.ts        ⭐ 이 파일 수정 (이미 존재)
├── package.json
└── vite.config.ts
```

---

## 🚀 빠른 시작

### ✅ 방법 1: .env 파일 사용 (권장)

프로젝트 루트에 `.env` 파일을 만들고 아래 내용을 붙여넣으세요:

```bash
# API 서버 URL (백엔드)
VITE_API_BASE_URL=http://<YOUR_SERVER_IP>

# 프론트엔드 URL
VITE_APP_URL=https://www.winnticket.store
```

**터미널에서 빠르게 생성:**
```bash
cat > .env << 'EOF'
VITE_API_BASE_URL=http://<YOUR_SERVER_IP>
VITE_APP_URL=https://www.winnticket.store
EOF
```

### ✅ 방법 2: env.config.ts 파일 사용 (대안)

**이미 생성된 `/env.config.ts` 파일**을 열고 아래 부분을 수정하세요:

```typescript
// ⭐ 여기를 수정하세요! ⭐
export const ENV_CONFIG = {
  API_BASE_URL: 'http://<YOUR_SERVER_IP>',  // ← 이 부분 수정
  APP_URL: 'https://www.winnticket.store', // ← 이 부분 수정
};
```

---

## 🎯 우선순위

설정이 여러 곳에 있을 때 **우선순위**는 다음과 같습니다:

1. **`.env` 파일** (최우선)
2. **`env.config.ts` 파일**
3. **기본 폴백값** (하드코딩)

예시:
- `.env`에 `VITE_API_BASE_URL=http://localhost:8080`이 있으면 이게 사용됨
- `.env`가 없고 `env.config.ts`에 `API_BASE_URL='http://<YOUR_SERVER_IP>'`이 있으면 이게 사용됨
- 둘 다 없으면 코드에 하드코딩된 폴백값 사용

---

## 📝 설정 값 설명

### `VITE_API_BASE_URL` / `API_BASE_URL`
백엔드 API 서버 주소입니다.

**프로덕션:**
```
http://<YOUR_SERVER_IP>        (IP 직접 접근 - SSL 없음)
https://api.winnticket.store (도메인 - SSL 있음)
```

**개발 (로컬):**
```
http://localhost:8080
```

> ⚠️ **주의**: IP 주소는 SSL 인증서가 없으므로 `http://`를 사용합니다. 도메인은 `https://`를 사용할 수 있습니다.

### `VITE_APP_URL` / `APP_URL`
프론트엔드 웹 애플리케이션 주소입니다.

**프로덕션:**
```
https://www.winnticket.store
https://winnticket.store
```

**개발 (로컬):**
```
http://localhost:3000
http://localhost:5173
```

---

## 🔍 설정 확인 방법

### 1. 개발 서버 콘솔 확인
```bash
npm run dev
```

콘솔에 다음과 같이 표시됩니다:
```
📝 ENV_CONFIG loaded:
  - API_BASE_URL: http://<YOUR_SERVER_IP>
  - APP_URL: https://www.winnticket.store

🔧 Vite Config - API Proxy Target: http://<YOUR_SERVER_IP>
```

### 2. 브라우저 개발자 도구에서 확인
```javascript
// 개발자 도구 > Console
console.log('API URL:', import.meta.env.VITE_API_BASE_URL);
```

### 3. 네트워크 탭에서 API 호출 확인
- 개발자 도구 > Network 탭
- API 호출 URL이 올바른지 확인
- 예: `http://<YOUR_SERVER_IP>/api/products`

---

## 🛠️ 환경별 설정 예시

### 로컬 개발 환경

**`.env` 파일:**
```bash
VITE_API_BASE_URL=http://localhost:8080
VITE_APP_URL=http://localhost:3000
```

**또는 `env.config.ts` 파일:**
```typescript
export const ENV_CONFIG = {
  API_BASE_URL: 'http://localhost:8080',
  APP_URL: 'http://localhost:3000',
};
```

### 프로덕션 환경 (IP 직접 접근)

**`.env` 파일:**
```bash
VITE_API_BASE_URL=http://<YOUR_SERVER_IP>
VITE_APP_URL=https://www.winnticket.store
```

**또는 `env.config.ts` 파일:**
```typescript
export const ENV_CONFIG = {
  API_BASE_URL: 'http://<YOUR_SERVER_IP>',
  APP_URL: 'https://www.winnticket.store',
};
```

### 프로덕션 환경 (도메인 사용)

**`.env` 파일:**
```bash
VITE_API_BASE_URL=https://api.winnticket.store
VITE_APP_URL=https://www.winnticket.store
```

**또는 `env.config.ts` 파일:**
```typescript
export const ENV_CONFIG = {
  API_BASE_URL: 'https://api.winnticket.store',
  APP_URL: 'https://www.winnticket.store',
};
```

---

## ⚠️ 주의사항

### .env 파일을 사용할 때
1. **파일명**: 정확히 `.env` (점으로 시작)
2. **위치**: `package.json`과 같은 폴더 (프로젝트 루트)
3. **재시작 필수**: `.env` 수정 후 `npm run dev` 재실행
4. **Git 커밋 금지**: `.env`는 `.gitignore`에 포함되어 커밋되지 않음

### env.config.ts 파일을 사용할 때
1. **TypeScript 파일**: 문법 오류 주의
2. **재시작 필수**: 수정 후 개발 서버 재시작
3. **Git 커밋 금지**: `env.config.ts`는 `.gitignore`에 포함됨
4. **백업 권장**: `env.config.example.ts` 파일로 템플릿 보관

### HTTP vs HTTPS
- **IP 주소** (`<YOUR_SERVER_IP>`): `http://` 사용 (SSL 인증서 없음)
- **도메인** (`api.winnticket.store`): `https://` 사용 가능 (SSL 인증서 있음)

---

## 🎯 추천 방법

### 개발 팀에서 사용할 때
1. **`env.config.example.ts`** 파일을 Git에 커밋 (템플릿)
2. 각 개발자가 **`env.config.ts`** 파일을 복사해서 사용
3. 로컬 설정은 각자 관리

```bash
# 템플릿 복사
cp env.config.example.ts env.config.ts

# env.config.ts 수정
# API_BASE_URL과 APP_URL을 원하는 값으로 변경
```

### CI/CD 배포 시
빌드 시스템에서 환경 변수를 주입:

```bash
# GitHub Actions, Jenkins 등
VITE_API_BASE_URL=http://<YOUR_SERVER_IP> \
VITE_APP_URL=https://www.winnticket.store \
npm run build
```

---

## 📚 관련 파일

| 파일 | 설명 | Git 커밋 |
|------|------|---------|
| `.env` | 환경 변수 실제 파일 | ❌ 금지 |
| `.env.example` | 환경 변수 템플릿 | ✅ 가능 |
| `env.config.ts` | TypeScript 설정 파일 | ❌ 금지 |
| `env.config.example.ts` | TypeScript 템플릿 | ✅ 가능 |
| `/lib/config.ts` | 설정 로더 (수정 금지) | ✅ 가능 |
| `.gitignore` | Git 제외 목록 | ✅ 가능 |

---

## 🆘 문제 해결

### Q: `.env` 파일을 만들었는데 적용이 안 돼요!
**A:** 개발 서버를 재시작하세요.
```bash
# Ctrl+C로 중지 후
npm run dev
```

### Q: `env.config.ts` 파일을 수정했는데 변경이 안 돼요!
**A:** 브라우저를 새로고침하거나 개발 서버를 재시작하세요.

### Q: 두 파일 다 만들면 어떻게 돼요?
**A:** `.env` 파일이 우선순위가 높아서 먼저 적용됩니다.

### Q: Git에 `.env` 파일이 커밋됐어요!
**A:** 즉시 삭제하고 `.gitignore`에 추가하세요.
```bash
git rm --cached .env
git commit -m "Remove .env file"
```

### Q: IP 주소에 https를 쓰면 안 되나요?
**A:** IP 주소는 SSL 인증서를 발급받을 수 없으므로 `http://`를 사용해야 합니다. 도메인 이름을 사용하면 SSL 인증서를 발급받아 `https://`를 사용할 수 있습니다.

---

## ✨ 완료!

이제 URL 변경이 필요할 때:
1. `.env` 파일 또는 `env.config.ts` 파일 수정
2. 개발 서버 재시작
3. 끝! 🎉

**작성일**: 2025-02-17  
**마지막 수정**: 2025-02-17 (http:// 변경)
