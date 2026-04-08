# ✅ API 서브도메인 설정 체크리스트

**목표**: https://api.winnticket.store 설정 완료

---

## 📅 설정 전 (로컬)

### 환경 변수 설정
- [ ] `.env` 파일: `VITE_API_BASE_URL=https://api.winnticket.store`
- [ ] 프론트엔드 코드에서 API URL 확인

---

## 🌐 1단계: DNS 설정 (5분)

### 도메인 관리 페이지
- [ ] DNS 레코드 추가: `api.winnticket.store` → `43.201.12.36`
- [ ] TTL 설정: 600초
- [ ] 저장/적용 버튼 클릭

### DNS 전파 확인 (5-10분 대기)
- [ ] `nslookup api.winnticket.store` 실행
- [ ] `43.201.12.36` IP 주소 확인
- [ ] 온라인 도구로 재확인: https://dnschecker.org

---

## 🖥️ 2단계: 서버 접속 및 준비 (5분)

### SSH 접속
- [ ] `ssh ubuntu@43.201.12.36` 접속 성공

### 시스템 준비
- [ ] `sudo apt update` 실행
- [ ] `sudo apt upgrade -y` 실행 (선택사항)

---

## 📦 3단계: Nginx 설치 (3분)

### 설치
- [ ] `sudo apt install nginx -y` 실행
- [ ] `sudo systemctl start nginx` 실행
- [ ] `sudo systemctl enable nginx` 실행

### 확인
- [ ] `sudo systemctl status nginx` → "Active (running)" 확인
- [ ] 브라우저에서 `http://43.201.12.36` 접속 → Nginx 기본 페이지 확인

---

## ⚙️ 4단계: Nginx 설정 (5분)

### 설정 파일 업로드
- [ ] 로컬: `scp nginx-api.winnticket.store.conf ubuntu@43.201.12.36:~/`
- [ ] 서버: `sudo mv ~/nginx-api.winnticket.store.conf /etc/nginx/sites-available/api.winnticket.store`

또는

- [ ] `sudo nano /etc/nginx/sites-available/api.winnticket.store`
- [ ] 설정 파일 내용 복사/붙여넣기
- [ ] 저장 후 종료

### 설정 활성화
- [ ] `sudo ln -s /etc/nginx/sites-available/api.winnticket.store /etc/nginx/sites-enabled/`
- [ ] `sudo rm /etc/nginx/sites-enabled/default` (선택사항)
- [ ] `sudo nginx -t` → "test is successful" 확인
- [ ] `sudo systemctl reload nginx`

---

## 🔥 5단계: 방화벽 설정 (2분)

### 포트 오픈
- [ ] `sudo ufw allow 'Nginx Full'`
- [ ] `sudo ufw allow OpenSSH`
- [ ] `sudo ufw enable`

### 확인
- [ ] `sudo ufw status` → 80, 443 포트 "ALLOW" 확인

---

## 🔒 6단계: SSL 인증서 설치 (5분)

### Certbot 설치
- [ ] `sudo apt install certbot python3-certbot-nginx -y`

### 인증서 발급
- [ ] `sudo certbot --nginx -d api.winnticket.store` 실행
- [ ] 이메일 주소 입력
- [ ] 약관 동의: `A`
- [ ] EFF 이메일 수신: `N`
- [ ] HTTPS 리다이렉트: `2` (Redirect)

### 확인
- [ ] "Successfully deployed certificate" 메시지 확인
- [ ] `sudo certbot certificates` → 인증서 정보 확인
- [ ] 브라우저에서 `https://api.winnticket.store` 접속 → 🔒 자물쇠 아이콘 확인

---

## 🧪 7단계: API 테스트 (3분)

### 서버에서 테스트
- [ ] `curl http://localhost:8080/api/test` → 응답 확인
- [ ] `curl https://api.winnticket.store/api/test` → 응답 확인

### 브라우저에서 테스트
- [ ] `https://api.winnticket.store/api/menu/menuListAll` 접속
- [ ] JSON 응답 확인
- [ ] 🔒 SSL 자물쇠 아이콘 확인

---

## ☕ 8단계: Spring Boot 설정 (5분)

### CORS 설정
- [ ] `WebConfig.java` 파일 생성/수정
- [ ] `allowedOrigins`에 `https://winnticket.store` 추가
- [ ] `allowedOrigins`에 `https://api.winnticket.store` 추가
- [ ] `allowedMethods` 설정 확인
- [ ] `allowCredentials(true)` 설정 확인

### 재시작
- [ ] Spring Boot 애플리케이션 재시작
- [ ] `sudo netstat -tuln | grep 8080` → 포트 활성화 확인

---

## ✅ 9단계: 최종 확인

### 인프라 확인
- [ ] DNS: `nslookup api.winnticket.store` → `43.201.12.36`
- [ ] Nginx: `sudo systemctl status nginx` → "Active"
- [ ] SSL: `sudo certbot certificates` → 유효한 인증서
- [ ] 방화벽: `sudo ufw status` → 80, 443 "ALLOW"
- [ ] Spring Boot: `sudo netstat -tuln | grep 8080` → "LISTEN"

### API 테스트
- [ ] HTTPS 접속: `https://api.winnticket.store/api/menu/menuListAll`
- [ ] JSON 응답 수신 확인
- [ ] SSL 인증서 유효 확인 (🔒)
- [ ] CORS 에러 없음 확인

### 프론트엔드 연동
- [ ] `.env`: `VITE_API_BASE_URL=https://api.winnticket.store`
- [ ] 프론트엔드 빌드: `npm run build`
- [ ] API 호출 테스트
- [ ] 네트워크 탭에서 HTTPS 요청 확인
- [ ] 콘솔에 CORS 에러 없음 확인

---

## 🎯 완료 기준

### ✅ 모든 항목 완료 시:

```bash
# 최종 테스트 명령어
curl -I https://api.winnticket.store/api/menu/menuListAll
```

**성공 예시**:
```
HTTP/2 200
content-type: application/json
access-control-allow-origin: https://winnticket.store
access-control-allow-credentials: true
...
```

**브라우저 콘솔**:
```javascript
fetch('https://api.winnticket.store/api/menu/menuListAll')
  .then(res => res.json())
  .then(data => console.log(data));
// ✅ JSON 데이터 출력
// ❌ CORS 에러 없음
```

---

## 📊 진행 상황 추적

총 단계: 9개  
예상 소요 시간: 30분

- [ ] DNS 설정
- [ ] 서버 접속
- [ ] Nginx 설치
- [ ] Nginx 설정
- [ ] 방화벽 설정
- [ ] SSL 설치
- [ ] API 테스트
- [ ] Spring Boot 설정
- [ ] 최종 확인

**진행률**: ___/9 완료

---

## 🚨 문제 발생 시

### DNS 문제
→ `QUICK-START.md` 트러블슈팅 섹션 참고

### Nginx 문제
→ `sudo tail -f /var/log/nginx/api_winnticket_error.log`

### SSL 문제
→ `sudo cat /var/log/letsencrypt/letsencrypt.log`

### CORS 문제
→ Spring Boot CORS 설정 재확인

---

## 🎉 완료!

모든 체크박스에 ✅가 표시되면 설정 완료입니다!

이제 프론트엔드에서 안전하게 API를 호출할 수 있습니다:
- **프론트엔드**: https://winnticket.store
- **API**: https://api.winnticket.store
- **프로토콜**: HTTPS (보안 연결)
- **CORS**: 허용됨
