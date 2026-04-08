# 🚀 Winnticket API 서브도메인 설정 - 빠른 시작

**목표**: https://api.winnticket.store에서 HTTPS API 서비스 제공

---

## 📋 준비사항 체크리스트

- [ ] 도메인: winnticket.store 보유
- [ ] 서버: <YOUR_SERVER_IP> (SSH 접근 가능)
- [ ] Spring Boot 앱이 8080 포트에서 실행 중
- [ ] 도메인 관리 페이지 접근 가능 (DNS 설정용)

---

## ⏱️ 예상 소요 시간: 20-30분

---

# 단계별 진행

## 1단계: DNS 설정 (5분) ⭐ 가장 먼저!

### 도메인 관리 페이지에서 설정

**가비아, 호스팅케이알, AWS Route53 등에서:**

```
레코드 타입: A
호스트(이름): api
값(Value): <YOUR_SERVER_IP>
TTL: 600 (또는 기본값)
```

### 예시 (가비아):
- 호스트: `api`
- 타입: `A`
- 값/위치: `<YOUR_SERVER_IP>`
- TTL: `600`

### DNS 전파 확인 (5-10분 대기 후)

```bash
# Windows
nslookup api.winnticket.store

# Mac/Linux
dig api.winnticket.store

# 또는 온라인 도구
# https://dnschecker.org
```

✅ **`<YOUR_SERVER_IP>`이 표시되면 다음 단계로!**

---

## 2단계: 서버 SSH 접속 (1분)

```bash
ssh ubuntu@<YOUR_SERVER_IP>
# 또는
ssh root@<YOUR_SERVER_IP>
```

---

## 3단계: Nginx 설치 (3분)

```bash
# 시스템 업데이트
sudo apt update

# Nginx 설치
sudo apt install nginx -y

# Nginx 시작
sudo systemctl start nginx
sudo systemctl enable nginx

# 상태 확인
sudo systemctl status nginx
# (q를 눌러 종료)
```

✅ **Active (running)이 표시되면 성공!**

---

## 4단계: Nginx 설정 파일 업로드 (3분)

### 방법 1: SCP로 파일 전송 (권장)

**로컬 터미널에서** (프로젝트 폴더):
```bash
scp nginx-api.winnticket.store.conf ubuntu@<YOUR_SERVER_IP>:~/
```

**서버에서**:
```bash
sudo mv ~/nginx-api.winnticket.store.conf /etc/nginx/sites-available/api.winnticket.store
```

### 방법 2: 직접 생성 (복사/붙여넣기)

**서버에서**:
```bash
sudo nano /etc/nginx/sites-available/api.winnticket.store
```

`nginx-api.winnticket.store.conf` 파일 내용을 복사해서 붙여넣고:
- `Ctrl + O` (저장)
- `Enter` (확인)
- `Ctrl + X` (종료)

---

## 5단계: Nginx 설정 활성화 (2분)

```bash
# 심볼릭 링크 생성
sudo ln -s /etc/nginx/sites-available/api.winnticket.store /etc/nginx/sites-enabled/

# 기본 사이트 비활성화 (선택사항)
sudo rm /etc/nginx/sites-enabled/default

# 설정 파일 문법 검사
sudo nginx -t
```

✅ **"test is successful"이 표시되면 성공!**

```bash
# Nginx 재시작
sudo systemctl reload nginx
```

---

## 6단계: 방화벽 설정 (2분)

```bash
# 방화벽 상태 확인
sudo ufw status

# HTTP/HTTPS 포트 허용
sudo ufw allow 'Nginx Full'

# SSH 포트 허용 (아직 안했다면)
sudo ufw allow OpenSSH

# 방화벽 활성화
sudo ufw enable
# (y 입력)

# 상태 재확인
sudo ufw status
```

✅ **80, 443 포트가 ALLOW로 표시되면 성공!**

---

## 7단계: SSL 인증서 설치 (5분) ⭐ 중요!

```bash
# Certbot 설치
sudo apt install certbot python3-certbot-nginx -y

# SSL 인증서 발급
sudo certbot --nginx -d api.winnticket.store
```

### 대화형 질문 응답:

1️⃣ **이메일 주소 입력**:
```
your-email@example.com
```

2️⃣ **약관 동의** (Terms of Service):
```
A (동의)
```

3️⃣ **EFF 이메일 수신 여부**:
```
N (거부)
```

4️⃣ **HTTP를 HTTPS로 리다이렉트?**:
```
2 (Redirect - 권장!)
```

✅ **"Successfully deployed certificate"가 표시되면 성공!**

---

## 8단계: 테스트 (2분) ✅

### 서버에서 테스트:
```bash
# 로컬 테스트
curl http://localhost:8080/api/test

# HTTPS 테스트
curl https://api.winnticket.store/api/test
```

### 브라우저에서 테스트:
```
https://api.winnticket.store/api/menu/menuListAll
```

✅ **JSON 응답이 보이면 성공!**  
🔒 **브라우저 주소창에 자물쇠 아이콘이 보이면 SSL 성공!**

---

## 9단계: Spring Boot CORS 설정 (5분)

### Spring Boot 프로젝트에 파일 추가

**파일**: `src/main/java/com/winnticket/config/WebConfig.java`

프로젝트의 `spring-boot-cors-config.java` 파일 내용을 복사하여 추가

### 또는 application.yml에 추가:

```yaml
spring:
  web:
    cors:
      allowed-origins:
        - http://localhost:5173
        - http://localhost:3000
        - https://winnticket.store
        - https://www.winnticket.store
        - https://api.winnticket.store
      allowed-methods:
        - GET
        - POST
        - PUT
        - PATCH
        - DELETE
        - OPTIONS
      allowed-headers: "*"
      allow-credentials: true
      max-age: 3600
```

### Spring Boot 재시작:
```bash
# 서버에서
sudo systemctl restart spring-boot-app
# 또는 실행 중인 방법에 따라 재시작
```

---

## 10단계: 최종 확인 ✅

### ✅ 체크리스트:

- [ ] DNS 설정 완료: `nslookup api.winnticket.store` → `43.201.12.36`
- [ ] Nginx 실행 중: `sudo systemctl status nginx`
- [ ] SSL 인증서 설치됨: `sudo certbot certificates`
- [ ] 방화벽 80, 443 포트 오픈: `sudo ufw status`
- [ ] Spring Boot CORS 설정 완료
- [ ] API 테스트 성공: `https://api.winnticket.store/api/test`

---

## 🎉 완료!

이제 프론트엔드에서 다음과 같이 API를 호출할 수 있습니다:

```javascript
// .env 설정
VITE_API_BASE_URL=https://api.winnticket.store

// 사용 예시
const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/menu/menuListAll`);
```

---

## 🔧 자주 사용하는 명령어

### Nginx 관련:
```bash
# Nginx 재시작
sudo systemctl restart nginx

# Nginx 리로드 (다운타임 없음)
sudo systemctl reload nginx

# Nginx 상태 확인
sudo systemctl status nginx

# 설정 파일 테스트
sudo nginx -t

# 에러 로그 확인
sudo tail -f /var/log/nginx/api_winnticket_error.log

# 접근 로그 확인
sudo tail -f /var/log/nginx/api_winnticket_access.log
```

### SSL 인증서 관련:
```bash
# 인증서 목록 확인
sudo certbot certificates

# 수동 갱신
sudo certbot renew

# 갱신 테스트
sudo certbot renew --dry-run
```

### 방화벽 관련:
```bash
# 방화벽 상태
sudo ufw status verbose

# 포트 추가
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

---

## ❓ 트러블슈팅

### 1. DNS가 전파되지 않음
```bash
# 시간이 더 필요할 수 있음 (최대 1시간)
# DNS 캐시 삭제 (Windows)
ipconfig /flushdns

# DNS 캐시 삭제 (Mac)
sudo dscacheutil -flushcache

# 다른 DNS로 확인
nslookup api.winnticket.store 8.8.8.8
```

### 2. 502 Bad Gateway
```bash
# Spring Boot가 실행 중인지 확인
sudo netstat -tuln | grep 8080

# Nginx 에러 로그 확인
sudo tail -f /var/log/nginx/api_winnticket_error.log

# Spring Boot 로그 확인
sudo journalctl -u spring-boot-app -f
```

### 3. CORS 에러
- Spring Boot CORS 설정 확인
- `allowedOrigins`에 `https://winnticket.store` 포함 확인
- Spring Boot 재시작 필요

### 4. SSL 인증서 발급 실패
```bash
# DNS 전파 확인 필수!
nslookup api.winnticket.store

# Certbot 로그 확인
sudo cat /var/log/letsencrypt/letsencrypt.log

# 80 포트가 열려있는지 확인
sudo netstat -tuln | grep :80
```

---

## 📞 추가 도움

더 자세한 내용은 다음 파일 참고:
- **server-setup-guide.md** - 전체 상세 가이드
- **nginx-api.winnticket.store.conf** - Nginx 설정 파일
- **spring-boot-cors-config.java** - Spring Boot CORS 설정

---

**설정 성공을 축하합니다! 🎉**

이제 https://winnticket.store에서 https://api.winnticket.store로 안전하게 API를 호출할 수 있습니다!
