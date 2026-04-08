# ✅ 환경 변수 설정 완료 - https → http 변경

## 🎯 작업 내용

IP 주소 `<YOUR_SERVER_IP>`에 대해 SSL 인증서가 없으므로 **`https://`를 `http://`로 변경**했습니다.

---

## 📝 변경된 파일 (9개)

### 1️⃣ 핵심 설정 파일
- ✅ `/lib/config.ts` - 폴백값 `http://<YOUR_SERVER_IP>`로 변경
- ✅ `/vite.config.ts` - 프록시 기본값 `http://<YOUR_SERVER_IP>`로 변경
- ✅ `/env.config.ts` - 기본 설정 `http://<YOUR_SERVER_IP>`로 변경
- ✅ `/env.config.example.ts` - 템플릿 `http://<YOUR_SERVER_IP>`로 변경
- ✅ `/.env.example` - 예시 `http://<YOUR_SERVER_IP>`로 변경

### 2️⃣ 문서 파일
- ✅ `/ENV_CONFIG_GUIDE.md` - 전체 가이드 업데이트 (HTTP vs HTTPS 설명 추가)
- ✅ `/ENV_QUICK_START.md` - 빠른 시작 가이드 업데이트
- ✅ `/ENVIRONMENT_VARIABLES.md` - 환경 변수 문서 업데이트

---

## 🔑 핵심 변경 사항

### Before (잘못됨 ❌)
```typescript
// IP 주소에 https 사용 (SSL 인증서 없어서 오류 발생)
VITE_API_BASE_URL=https://<YOUR_SERVER_IP>
```

### After (올바름 ✅)
```typescript
// IP 주소는 http 사용 (SSL 인증서 불필요)
VITE_API_BASE_URL=http://<YOUR_SERVER_IP>
```

---

## 📚 HTTP vs HTTPS 가이드

### IP 주소 사용 시
```bash
# ✅ 올바른 방법
VITE_API_BASE_URL=http://<YOUR_SERVER_IP>

# ❌ 잘못된 방법 (SSL 인증서 오류)
VITE_API_BASE_URL=https://<YOUR_SERVER_IP>
```

### 도메인 사용 시
```bash
# ✅ SSL 인증서가 있으면 https 사용
VITE_API_BASE_URL=https://api.winnticket.store

# ✅ SSL 인증서가 없으면 http 사용
VITE_API_BASE_URL=http://api.winnticket.store
```

---

## 🚀 현재 설정

### `/env.config.ts` 파일
```typescript
export const ENV_CONFIG = {
  API_BASE_URL: 'http://<YOUR_SERVER_IP>',      // ✅ http 사용
  APP_URL: 'https://www.winnticket.store',   // ✅ https 사용 (도메인)
};
```

### `.env` 파일 (수동 생성 필요)
```bash
VITE_API_BASE_URL=http://<YOUR_SERVER_IP>
VITE_APP_URL=https://www.winnticket.store
```

---

## ⚠️ 중요 포인트

1. **IP 주소**: SSL 인증서 없음 → `http://` 사용
2. **도메인**: SSL 인증서 있음 → `https://` 사용
3. **프론트엔드**: 도메인이므로 → `https://` 사용

---

## 🔍 확인 방법

개발 서버 실행 시 콘솔에 표시:
```bash
npm run dev

# 출력:
# 📝 ENV_CONFIG loaded:
#   - API_BASE_URL: http://<YOUR_SERVER_IP>        ✅ http
#   - APP_URL: https://www.winnticket.store     ✅ https
# 
# 🔧 Vite Config - API Proxy Target: http://<YOUR_SERVER_IP>  ✅ http
```

---

## 📖 참고 문서

자세한 내용은 아래 문서를 참고하세요:

- **빠른 시작**: `/ENV_QUICK_START.md`
- **전체 가이드**: `/ENV_CONFIG_GUIDE.md`
- **마이그레이션 정보**: `/ENVIRONMENT_VARIABLES.md`

---

## ✨ 완료!

이제 모든 파일에서 IP 주소는 `http://`를, 도메인은 `https://`를 올바르게 사용합니다! 🎉

**작성일**: 2025-02-17  
**변경 사유**: SSL 인증서 없는 IP 주소에 https 사용 오류 수정
