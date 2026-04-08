# Winnticket.store 서버 설정 가이드

## 개요
- **메인 도메인**: https://winnticket.store (프론트엔드)
- **API 서브도메인**: https://api.winnticket.store (백엔드 API)
- **서버 IP**: <YOUR_SERVER_IP>
- **백엔드 포트**: 8080 (Spring Boot)

---

## 1. DNS 설정 (먼저 완료 필요)

도메인 등록 업체(가비아, 호스팅케이알 등)에서 DNS 설정:

```
Type: A
Name: api
Value: <YOUR_SERVER_IP>
TTL: 600 (또는 자동)
```

설정 후 전파 확인:
```bash
# 로컬에서 확인
nslookup api.winnticket.store

# 또는
dig api.winnticket.store
```

---

## 2. 서버 접속 및 기본 설정

```bash
# SSH 접속
ssh ubuntu@<YOUR_SERVER_IP>
# 또는
ssh root@<YOUR_SERVER_IP>

# 시스템 업데이트
sudo apt update && sudo apt upgrade -y
```

---

## 3. Nginx 설치

```bash
# Nginx 설치
sudo apt install nginx -y

# Nginx 시작
sudo systemctl start nginx
sudo systemctl enable nginx

# 상태 확인
sudo systemctl status nginx
```

---

## 4. 방화벽 설정 (UFW 사용시)

```bash
# 방화벽 상태 확인
sudo ufw status

# 필요한 포트 허용
sudo ufw allow 'Nginx Full'    # HTTP(80) + HTTPS(443)
sudo ufw allow OpenSSH          # SSH(22)
sudo ufw allow 8080             # Spring Boot (localhost만 접근하게 하려면 생략)

# 방화벽 활성화
sudo ufw enable

# 상태 재확인
sudo ufw status verbose
```

---

## 5. Nginx 리버스 프록시 설정

### 5-1. 설정 파일 생성

```bash
# 설정 파일 생성 (nano 또는 vi 사용)
sudo nano /etc/nginx/sites-available/api.winnticket.store
```

### 5-2. 설정 파일 내용 복사

프로젝트의 `nginx-api.winnticket.store.conf` 파일 내용을 복사하여 붙여넣기

또는 직접 서버에서:
```bash
# 로컬 파일을 서버로 복사 (로컬 터미널에서)
scp nginx-api.winnticket.store.conf ubuntu@<YOUR_SERVER_IP>:~/

# 서버에서 파일 이동
sudo mv ~/nginx-api.winnticket.store.conf /etc/nginx/sites-available/api.winnticket.store
```

### 5-3. 설정 활성화

```bash
# 심볼릭 링크 생성
sudo ln -s /etc/nginx/sites-available/api.winnticket.store /etc/nginx/sites-enabled/

# 기본 사이트 비활성화 (필요시)
sudo rm /etc/nginx/sites-enabled/default

# 설정 테스트
sudo nginx -t

# 설정 적용
sudo systemctl reload nginx
```

---

## 6. SSL 인증서 설치 (Let's Encrypt)

### 6-1. Certbot 설치

```bash
# Certbot 설치
sudo apt install certbot python3-certbot-nginx -y
```

### 6-2. SSL 인증서 발급

```bash
# 이메일 주소를 실제 이메일로 변경
sudo certbot --nginx -d api.winnticket.store --email your-email@example.com --agree-tos --no-eff-email

# 또는 대화형으로 진행
sudo certbot --nginx -d api.winnticket.store
```

발급 과정에서:
1. 이메일 입력
2. 약관 동의 (A)
3. EFF 이메일 수신 여부 (N)
4. HTTP를 HTTPS로 리다이렉트? **2번 선택 (Redirect)**

### 6-3. 자동 갱신 설정

```bash
# 자동 갱신 테스트
sudo certbot renew --dry-run

# 타이머 확인 (자동으로 설정됨)
sudo systemctl status certbot.timer
```

---

## 7. Spring Boot CORS 설정

Spring Boot 서버에서 CORS를 허용해야 합니다.

### WebConfig.java 파일 생성/수정:

```java
package com.winnticket.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins(
                    "http://localhost:5173",           // 로컬 개발
                    "http://localhost:3000",           // 로컬 개발
                    "https://winnticket.store",        // 프로덕션
                    "https://www.winnticket.store",    // www 서브도메인
                    "https://api.winnticket.store"     // API 서브도메인
                )
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }
}
```

### 또는 application.properties/yml에서:

```yaml
# application.yml
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

---

## 8. 서비스 확인 및 테스트

### 8-1. Spring Boot 서버 실행 확인

```bash
# 서버에서 Spring Boot 실행 확인
sudo netstat -tuln | grep 8080
# 또는
curl http://localhost:8080/api/health  # health 엔드포인트가 있다면
```

### 8-2. Nginx 상태 확인

```bash
# Nginx 상태
sudo systemctl status nginx

# 로그 확인
sudo tail -f /var/log/nginx/api_winnticket_access.log
sudo tail -f /var/log/nginx/api_winnticket_error.log
```

### 8-3. API 테스트

```bash
# HTTP 테스트 (SSL 전)
curl http://api.winnticket.store/api/test

# HTTPS 테스트 (SSL 후)
curl https://api.winnticket.store/api/test
```

브라우저에서:
- https://api.winnticket.store/api/menu/menuListAll

---

## 9. 프론트엔드 배포

프론트엔드를 winnticket.store에 배포하려면:

1. **빌드**:
```bash
# 로컬에서
npm run build
# 또는
yarn build
```

2. **배포 옵션**:
   - Vercel: https://vercel.com
   - Netlify: https://netlify.com
   - AWS S3 + CloudFront
   - Nginx 정적 호스팅

### Vercel 배포 (추천):

```bash
# Vercel CLI 설치
npm install -g vercel

# 로그인
vercel login

# 배포
vercel --prod

# 도메인 연결 (Vercel 대시보드에서)
# winnticket.store → Vercel 프로젝트에 연결
```

---

## 10. 트러블슈팅

### 502 Bad Gateway
```bash
# Spring Boot 서버가 실행 중인지 확인
curl http://localhost:8080

# Nginx 에러 로그 확인
sudo tail -f /var/log/nginx/api_winnticket_error.log
```

### CORS 에러
- Spring Boot CORS 설정 확인
- Nginx CORS 헤더 확인
- 브라우저 콘솔에서 상세 에러 확인

### SSL 인증서 에러
```bash
# 인증서 상태 확인
sudo certbot certificates

# 갱신 시도
sudo certbot renew --force-renewal
```

### DNS 전파 안됨
```bash
# DNS 확인
nslookup api.winnticket.store
dig api.winnticket.store

# TTL 대기 (보통 5-60분)
```

---

## 11. 체크리스트

- [ ] DNS 설정: api.winnticket.store → <YOUR_SERVER_IP>
- [ ] Nginx 설치 및 실행
- [ ] Nginx 리버스 프록시 설정
- [ ] SSL 인증서 발급 (Certbot)
- [ ] Spring Boot CORS 설정
- [ ] 방화벽 포트 오픈 (80, 443)
- [ ] 프론트엔드 .env 파일 업데이트
- [ ] API 테스트: https://api.winnticket.store
- [ ] 프론트엔드 빌드 및 배포

---

## 12. 유용한 명령어

```bash
# Nginx 재시작
sudo systemctl restart nginx

# Nginx 설정 리로드 (다운타임 없음)
sudo systemctl reload nginx

# SSL 인증서 갱신
sudo certbot renew

# Spring Boot 재시작 (systemd 사용 시)
sudo systemctl restart spring-boot-app

# 로그 실시간 확인
sudo tail -f /var/log/nginx/api_winnticket_error.log
sudo journalctl -u nginx -f
```

---

## 문의 및 지원

문제가 발생하면:
1. 에러 로그 확인
2. 각 서비스 상태 확인
3. 네트워크/방화벽 확인
4. DNS 전파 확인

---

**설정 완료 후 테스트 URL**:
- API: https://api.winnticket.store/api/menu/menuListAll
- 프론트엔드: https://winnticket.store