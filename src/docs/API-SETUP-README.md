# 🎫 Winnticket API 설정 가이드

**https://winnticket.store/api 설정을 위한 완벽한 가이드**

---

## 📚 문서 구조

이 프로젝트에는 API 서브도메인 설정을 위한 여러 가이드 문서가 포함되어 있습니다:

### 🚀 [QUICK-START.md](./QUICK-START.md) - **여기서 시작!**
- **추천 대상**: 처음 설정하는 모든 사용자
- **내용**: 단계별 설정 가이드 (20-30분 소요)
- **특징**: 각 단계마다 명확한 설명과 확인 방법 제공

### ✅ [CHECKLIST.md](./CHECKLIST.md)
- **추천 대상**: 진행 상황을 체크하고 싶은 사용자
- **내용**: 체크박스 형식의 단계별 점검표
- **특징**: 완료 여부를 확인하며 진행 가능

### 🎯 [COMMANDS-CHEATSHEET.md](./COMMANDS-CHEATSHEET.md)
- **추천 대상**: 빠른 참조가 필요한 경험자
- **내용**: 복사/붙여넣기 가능한 명령어 모음
- **특징**: 트러블슈팅, 관리, 모니터링 명령어 포함

### 📖 [server-setup-guide.md](./server-setup-guide.md)
- **추천 대상**: 상세한 설명이 필요한 사용자
- **내용**: 모든 단계에 대한 상세 설명
- **특징**: 배경 지식, 원리, 옵션 설명 포함

### 🔧 [direct-ip-setup-guide.md](./direct-ip-setup-guide.md)
- **추천 대상**: 개발/테스트 환경 사용자
- **내용**: 직접 IP 사용 시 설정 방법
- **특징**: HTTP 직접 접근 방식 (프로덕션 비권장)

---

## 🎯 현재 설정

### 프론트엔드
```
도메인: https://winnticket.store
환경 변수: VITE_API_BASE_URL=https://winnticket.store/api
```

### 백엔드 API
```
IP: 43.201.12.36:8080 (Spring Boot)
서브도메인: https://winnticket.store/api (권장)
프로토콜: HTTPS (SSL 인증서 적용)
```

---

## 🚦 시작하기

### 1️⃣ 빠른 설정 (권장)
```bash
# 1. 문서 읽기
cat QUICK-START.md

# 2. 단계별 진행
# - DNS 설정
# - Nginx 설치
# - SSL 인증서 발급
# - Spring Boot CORS 설정
```

### 2️⃣ 체크리스트로 진행
```bash
# 진행 상황 확인하며 설정
cat CHECKLIST.md
```

### 3️⃣ 명령어만 빠르게 실행
```bash
# 경험이 있다면
cat COMMANDS-CHEATSHEET.md
```

---

## 📁 설정 파일

### `/nginx-api.winnticket.store.conf`
Nginx 리버스 프록시 설정 파일
- Spring Boot(8080) → Nginx(80/443) → 외부
- CORS 헤더 설정
- SSL 적용 준비

### `/spring-boot-cors-config.java`
Spring Boot CORS 설정
- 허용된 Origin 목록
- 허용된 HTTP 메서드
- Credentials 지원

### `/.env`
프론트엔드 환경 변수
```env
VITE_API_BASE_URL=https://winnticket.store/api
```

### `/.env.example`
환경 변수 예시 파일
- 프로덕션: HTTPS 서브도���인
- 개발: HTTP 직접 IP
- 로컬: localhost

---

## 🔄 설정 흐름

```
┌─────────────────────────────────────────────────────────────┐
│                     사용자 브라우저                          │
│              https://winnticket.store                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTPS 요청
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   DNS (도메인 네임 서버)                     │
│       api.winnticket.store → 43.201.12.36                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ IP 해석
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Nginx (43.201.12.36:443)                       │
│  - SSL 인증서 처리 (Let's Encrypt)                          │
│  - HTTPS → HTTP 변환                                        │
│  - CORS 헤더 추가                                           │
│  - 리버스 프록시                                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTP 전달
                         ▼
┌─────────────────────────────────────────────────────────────┐
│          Spring Boot API (localhost:8080)                   │
│  - 비즈니스 로직 처리                                        │
│  - 데이터베이스 연동                                         │
│  - JSON 응답 생성                                           │
└─────────────────────────────────────────────────────────────┘
```

---

## ⏱️ 예상 소요 시간

| 단계 | 작업 | 소요 시간 |
|------|------|-----------|
| 1 | DNS 설정 | 5분 (전파 대기: 5-10분) |
| 2 | 서버 접속 및 준비 | 2분 |
| 3 | Nginx 설치 | 3분 |
| 4 | Nginx 설정 | 5분 |
| 5 | 방화벽 설정 | 2분 |
| 6 | SSL 인증서 설치 | 5분 |
| 7 | API 테스트 | 3분 |
| 8 | Spring Boot 설정 | 5분 |
| 9 | 최종 확인 | 3분 |
| **총계** | | **약 30분** |

---

## ✅ 성공 기준

설정이 완료되면 다음을 확인할 수 있습니다:

### 1. DNS 응답
```bash
$ nslookup api.winnticket.store
Server:    8.8.8.8
Address:   8.8.8.8#53

Non-authoritative answer:
Name:   api.winnticket.store
Address: 43.201.12.36
```

### 2. SSL 인증서
```bash
$ curl -I https://api.winnticket.store
HTTP/2 200
...
```

### 3. API 응답
```bash
$ curl https://api.winnticket.store/api/menu/menuListAll
{"status":"success","data":[...]}
```

### 4. 브라우저 테스트
- 🔒 주소창에 자물쇠 아이콘
- ✅ JSON 응답 표시
- ❌ CORS 에러 없음

---

## 🔧 설정 후 관리

### 일상적인 관리
```bash
# Nginx 상태 확인
sudo systemctl status nginx

# 로그 모니터링
sudo tail -f /var/log/nginx/api_winnticket_error.log

# SSL 인증서 확인
sudo certbot certificates
```

### SSL 인증서 자동 갱신
Let's Encrypt 인증서는 **90일마다 갱신**이 필요하지만, Certbot이 **자동으로 갱신**합니다:
```bash
# 자동 갱신 확인
sudo systemctl status certbot.timer

# 수동 갱신 (필요시)
sudo certbot renew
```

### 정기 점검 (월 1회 권장)
```bash
# 1. SSL 인증서 유효기간 확인
sudo certbot certificates

# 2. 시스템 업데이트
sudo apt update && sudo apt upgrade -y

# 3. 로그 확인
sudo tail -100 /var/log/nginx/api_winnticket_error.log

# 4. 디스크 공간 확인
df -h
```

---

## 🚨 트러블슈팅

### 자주 발생하는 문제

#### 1. DNS가 전파되지 않음
- **증상**: `nslookup`에서 IP가 나오지 않음
- **해결**: DNS 전파 대기 (5분~1시간)
- **확인**: https://dnschecker.org

#### 2. 502 Bad Gateway
- **증상**: API 접속 시 502 에러
- **원인**: Spring Boot 서버 중단
- **해결**: Spring Boot 재시작

#### 3. CORS 에러
- **증상**: 브라우저 콘솔에 CORS 에러
- **원인**: Spring Boot CORS 설정 누락
- **해결**: `WebConfig.java` 추가 및 재시작

#### 4. SSL 인증서 발급 실패
- **증상**: Certbot 에러
- **원인**: DNS 미전파 또는 방화벽 차단
- **해결**: DNS 확인 및 80 포트 오픈

**더 자세한 트러블슈팅**: `QUICK-START.md` 참고

---

## 📞 추가 도움말

### 각 문서의 특징

| 문서 | 난이도 | 상세도 | 추천 대상 |
|------|--------|--------|-----------|
| QUICK-START.md | ⭐⭐ | ⭐⭐⭐⭐ | 초급~중급 |
| CHECKLIST.md | ⭐ | ⭐⭐⭐ | 모든 사용자 |
| COMMANDS-CHEATSHEET.md | ⭐⭐⭐ | ⭐⭐ | 중급~고급 |
| server-setup-guide.md | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 중급~고급 |
| direct-ip-setup-guide.md | ⭐⭐ | ⭐⭐⭐ | 개발자 |

### 권장 학습 경로

```
1. QUICK-START.md 읽기
   ↓
2. CHECKLIST.md로 진행 상황 체크하며 설정
   ↓
3. 문제 발생 시 COMMANDS-CHEATSHEET.md 참고
   ↓
4. 더 자세한 정보 필요 시 server-setup-guide.md
   ↓
5. 설정 완료 후 이 파일로 복습
```

---

## 🎉 설정 완료!

모든 설정이 완료되면:

### 프론트엔드에서 사용
```javascript
// API 호출
const response = await fetch(
  `${import.meta.env.VITE_API_BASE_URL}/api/menu/menuListAll`
);
const data = await response.json();
```

### 브라우저에서 직접 테스트
```
https://api.winnticket.store/api/menu/menuListAll
```

### 보안 확인
- ✅ HTTPS 프로토콜
- ✅ 유효한 SSL 인증서
- ✅ CORS 정책 적용
- ✅ 안전한 통신

---

## 📦 프로젝트 구조

```
winnticket/
├── .env                              # 환경 변수 (HTTPS 서브도메인)
├── .env.example                      # 환경 변수 예시
│
├── nginx-api.winnticket.store.conf   # Nginx 설정 파일
├── spring-boot-cors-config.java      # Spring Boot CORS 설정
│
├── API-SETUP-README.md               # 📍 이 파일 (전체 개요)
├── QUICK-START.md                    # 빠른 시작 가이드
├── CHECKLIST.md                      # 체크리스트
├── COMMANDS-CHEATSHEET.md            # 명령어 모음
├── server-setup-guide.md             # 상세 가이드
└── direct-ip-setup-guide.md          # 직접 IP 사용 가이드
```

---

## 🔐 보안 권장사항

1. **HTTPS 사용**: 항상 HTTPS로 통신 (완료 ✅)
2. **CORS 제한**: 특정 도메인만 허용 (설정됨 ✅)
3. **방화벽 설정**: 필요한 포트만 오픈 (80, 443, 22)
4. **SSL 인증서**: 자동 갱신 확인
5. **로그 모니터링**: 주기적인 로그 확인

---

## 💡 유용한 팁

### 개발 환경과 프로덕션 환경 분리
```env
# 개발: .env.development
VITE_API_BASE_URL=http://43.201.12.36:8080

# 프로덕션: .env.production
VITE_API_BASE_URL=https://winnticket.store/api
```

### 환경별 빌드
```bash
# 개발 빌드
npm run build -- --mode development

# 프로덕션 빌드
npm run build -- --mode production
```

---

## 📝 변경 이력

| 날짜 | 내용 | 비고 |
|------|------|------|
| 2024-11-18 | 초기 설정 | HTTPS 서브도메인 구성 |
| 2024-11-18 | 문서 작성 | 모든 가이드 완료 |

---

## 🎯 다음 단계

설정 완료 후:
1. ✅ 프론트엔드 빌드 및 배포 (Vercel/Netlify)
2. ✅ 데이터베이스 연동 확인
3. ✅ API 엔드포인트 테스트
4. ✅ 에러 모니터링 설정
5. ✅ 백업 전략 수립

---

**🎉 설정을 시작하려면 [QUICK-START.md](./QUICK-START.md)를 열어보세요!**

---

*마지막 업데이트: 2024-11-18*  
*API 서버: 43.201.12.36:8080 → https://winnticket.store/api*