# 🎯 API 서브도메인 설정 - 명령어 모음

**복사해서 바로 사용할 수 있는 명령어 모음**

---

## 📝 1단계: DNS 설정

### DNS 레코드 추가 (도메인 관리 페이지에서)
```
타입: A
호스트: api
값: 43.201.12.36
TTL: 600
```

### DNS 확인
```bash
nslookup api.winnticket.store
```

---

## 🔧 2단계: 서버 접속 및 준비

```bash
# SSH 접속
ssh ubuntu@43.201.12.36

# 시스템 업데이트
sudo apt update && sudo apt upgrade -y
```

---

## 📦 3단계: Nginx 설치

```bash
# Nginx 설치 및 시작
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
sudo systemctl status nginx
```

---

## ⚙️ 4단계: Nginx 설정

### 방법 A: SCP로 파일 전송
```bash
# 로컬 터미널에서 (프로젝트 폴더)
scp nginx-api.winnticket.store.conf ubuntu@43.201.12.36:~/

# 서버에서
sudo mv ~/nginx-api.winnticket.store.conf /etc/nginx/sites-available/api.winnticket.store
```

### 방법 B: 직접 생성
```bash
sudo nano /etc/nginx/sites-available/api.winnticket.store
# (파일 내용 붙여넣기 후 Ctrl+O, Enter, Ctrl+X)
```

### 설정 활성화
```bash
# 심볼릭 링크 생성
sudo ln -s /etc/nginx/sites-available/api.winnticket.store /etc/nginx/sites-enabled/

# 기본 사이트 비활성화 (선택)
sudo rm /etc/nginx/sites-enabled/default

# 설정 테스트
sudo nginx -t

# 재시작
sudo systemctl reload nginx
```

---

## 🔥 5단계: 방화벽 설정

```bash
# 포트 허용
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH

# 방화벽 활성화
sudo ufw enable

# 상태 확인
sudo ufw status verbose
```

---

## 🔒 6단계: SSL 인증서 설치

```bash
# Certbot 설치
sudo apt install certbot python3-certbot-nginx -y

# SSL 인증서 발급
sudo certbot --nginx -d api.winnticket.store

# 대화형 프롬프트:
# 이메일: your-email@example.com
# 약관 동의: A
# EFF 이메일: N
# 리다이렉트: 2 (Redirect)
```

---

## 🧪 7단계: 테스트

```bash
# 로컬 테스트
curl http://localhost:8080/api/menu/menuListAll

# HTTPS 테스트
curl https://api.winnticket.store/api/menu/menuListAll

# 헤더 확인
curl -I https://api.winnticket.store/api/menu/menuListAll
```

---

## 🔍 유용한 명령어

### Nginx 관리
```bash
# 상태 확인
sudo systemctl status nginx

# 재시작 (다운타임 있음)
sudo systemctl restart nginx

# 리로드 (다운타임 없음)
sudo systemctl reload nginx

# 설정 테스트
sudo nginx -t

# 에러 로그
sudo tail -f /var/log/nginx/api_winnticket_error.log

# 접근 로그
sudo tail -f /var/log/nginx/api_winnticket_access.log

# 로그 실시간 보기
sudo journalctl -u nginx -f
```

### SSL 관리
```bash
# 인증서 목록
sudo certbot certificates

# 인증서 갱신
sudo certbot renew

# 갱신 테스트 (실제 갱신 안함)
sudo certbot renew --dry-run

# 강제 갱신
sudo certbot renew --force-renewal

# 인증서 삭제
sudo certbot delete --cert-name api.winnticket.store
```

### 방화벽 관리
```bash
# 상태 확인
sudo ufw status
sudo ufw status verbose
sudo ufw status numbered

# 포트 허용
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 8080/tcp

# 포트 차단
sudo ufw deny 8080/tcp

# 규칙 삭제 (번호로)
sudo ufw status numbered
sudo ufw delete [번호]

# 방화벽 비활성화
sudo ufw disable

# 방화벽 활성화
sudo ufw enable
```

### Spring Boot 관리
```bash
# 포트 확인
sudo netstat -tuln | grep 8080

# 프로세스 확인
ps aux | grep java

# 포트 사용 프로세스 확인
sudo lsof -i :8080

# systemd로 관리하는 경우
sudo systemctl status spring-boot-app
sudo systemctl restart spring-boot-app
sudo systemctl stop spring-boot-app
sudo systemctl start spring-boot-app

# 로그 확인 (systemd)
sudo journalctl -u spring-boot-app -f
sudo journalctl -u spring-boot-app --since "10 minutes ago"
```

### 시스템 관리
```bash
# 디스크 사용량
df -h

# 메모리 사용량
free -h

# CPU 및 프로세스
top
htop

# 네트워크 연결
sudo netstat -tuln
sudo ss -tuln

# 시스템 리부트
sudo reboot
```

---

## 🚨 트러블슈팅 명령어

### 502 Bad Gateway
```bash
# Spring Boot 실행 확인
curl http://localhost:8080

# Nginx 에러 로그
sudo tail -f /var/log/nginx/api_winnticket_error.log

# Nginx 설정 테스트
sudo nginx -t

# Spring Boot 로그
sudo journalctl -u spring-boot-app -n 100
```

### DNS 문제
```bash
# DNS 조회
nslookup api.winnticket.store

# 상세 DNS 정보
dig api.winnticket.store

# 특정 DNS 서버로 조회
nslookup api.winnticket.store 8.8.8.8

# DNS 캐시 클리어 (Mac)
sudo dscacheutil -flushcache

# DNS 캐시 클리어 (Windows - CMD)
ipconfig /flushdns
```

### SSL 문제
```bash
# SSL 인증서 확인
sudo certbot certificates

# Let's Encrypt 로그
sudo cat /var/log/letsencrypt/letsencrypt.log
sudo tail -100 /var/log/letsencrypt/letsencrypt.log

# SSL 테스트 (온라인)
# https://www.ssllabs.com/ssltest/

# OpenSSL로 인증서 확인
openssl s_client -connect api.winnticket.store:443
```

### 연결 문제
```bash
# 포트 열림 확인
telnet api.winnticket.store 80
telnet api.winnticket.store 443

# ping 테스트
ping api.winnticket.store

# traceroute
traceroute api.winnticket.store

# 서버에서 외부 접속 확인
curl -I https://api.winnticket.store
```

### CORS 문제
```bash
# CORS 헤더 확인
curl -I -X OPTIONS https://api.winnticket.store/api/menu/menuListAll \
  -H "Origin: https://winnticket.store" \
  -H "Access-Control-Request-Method: GET"

# 응답 헤더 확인
curl -I https://api.winnticket.store/api/menu/menuListAll \
  -H "Origin: https://winnticket.store"
```

---

## 📋 설정 파일 위치

```bash
# Nginx 설정
/etc/nginx/sites-available/api.winnticket.store
/etc/nginx/sites-enabled/api.winnticket.store
/etc/nginx/nginx.conf

# Nginx 로그
/var/log/nginx/api_winnticket_access.log
/var/log/nginx/api_winnticket_error.log
/var/log/nginx/access.log
/var/log/nginx/error.log

# SSL 인증서
/etc/letsencrypt/live/api.winnticket.store/fullchain.pem
/etc/letsencrypt/live/api.winnticket.store/privkey.pem
/etc/letsencrypt/renewal/api.winnticket.store.conf

# Let's Encrypt 로그
/var/log/letsencrypt/letsencrypt.log
```

---

## 🎯 원라이너 (한 줄 명령어)

```bash
# 전체 Nginx 재시작
sudo nginx -t && sudo systemctl reload nginx

# 로그 실시간 모니터링 (둘 다)
sudo tail -f /var/log/nginx/api_winnticket_{access,error}.log

# SSL 인증서 갱신 테스트
sudo certbot renew --dry-run && echo "갱신 테스트 성공!"

# Spring Boot + Nginx 상태 확인
sudo systemctl status nginx && sudo netstat -tuln | grep 8080

# 모든 로그 실시간 보기
sudo journalctl -f
```

---

## 🔐 보안 체크

```bash
# 열린 포트 확인
sudo netstat -tuln

# 방화벽 규칙 확인
sudo ufw status verbose

# SSL 등급 확인 (외부 도구)
# https://www.ssllabs.com/ssltest/analyze.html?d=api.winnticket.store

# 헤더 보안 확인
curl -I https://api.winnticket.store
```

---

## 📦 백업 및 복원

```bash
# Nginx 설정 백업
sudo cp /etc/nginx/sites-available/api.winnticket.store ~/api.winnticket.store.backup

# SSL 인증서 백업 (선택)
sudo tar -czf ~/letsencrypt-backup.tar.gz /etc/letsencrypt

# 설정 복원
sudo cp ~/api.winnticket.store.backup /etc/nginx/sites-available/api.winnticket.store
sudo nginx -t && sudo systemctl reload nginx
```

---

## 🎉 성공 확인 원라이너

```bash
# 전체 체크 (한 번에)
echo "=== DNS ===" && nslookup api.winnticket.store && \
echo "=== Nginx ===" && sudo systemctl status nginx | grep Active && \
echo "=== SSL ===" && sudo certbot certificates | grep api.winnticket.store && \
echo "=== Firewall ===" && sudo ufw status | grep -E "(80|443)" && \
echo "=== Spring Boot ===" && sudo netstat -tuln | grep 8080 && \
echo "=== API Test ===" && curl -I https://api.winnticket.store/api/menu/menuListAll && \
echo "=== 모든 설정 완료! ==="
```

---

## 💡 팁

### 자주 사용하는 명령어 별칭 만들기
```bash
# ~/.bashrc 또는 ~/.zshrc에 추가
echo 'alias nginx-reload="sudo nginx -t && sudo systemctl reload nginx"' >> ~/.bashrc
echo 'alias nginx-logs="sudo tail -f /var/log/nginx/api_winnticket_error.log"' >> ~/.bashrc
echo 'alias check-api="curl -I https://api.winnticket.store/api/menu/menuListAll"' >> ~/.bashrc

# 적용
source ~/.bashrc
```

사용:
```bash
nginx-reload
nginx-logs
check-api
```

---

**이 파일을 북마크하고 필요할 때마다 참고하세요! 📌**
