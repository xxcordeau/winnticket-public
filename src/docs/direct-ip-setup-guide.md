# 직접 IP 사용 시 설정 가이드
**API 서버: http://<YOUR_SERVER_IP>:8080**

## ⚠️ 주의사항

직접 IP:포트를 사용하는 경우:
- ✅ 설정이 간단함
- ✅ Nginx, SSL 설정 불필요
- ❌ **HTTPS → HTTP 통신 시 브라우저 보안 경고 발생**
- ❌ Mixed Content 에러 (HTTPS 사이트에서 HTTP API 호출)
- ❌ CORS 문제 발생 가능
- ❌ 프로덕션 환경에 적합하지 않음

---

## 1. 프론트엔드 설정

### .env 파일:
```env
VITE_API_BASE_URL=http://<YOUR_SERVER_IP>:8080
```

---

## 2. Spring Boot 서버 CORS 설정

### WebConfig.java:
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
                .allowedOrigins("*")  // 모든 origin 허용 (개발용)
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(false)  // credentials 사용 안함
                .maxAge(3600);
    }
}
```

또는 더 구체적으로:
```java
.allowedOrigins(
    "http://localhost:5173",
    "http://localhost:3000",
    "https://winnticket.store",
    "https://www.winnticket.store",
    "http://<YOUR_SERVER_IP>:8080"
)
.allowCredentials(true)
```

---

## 3. 서버 방화벽 설정

```bash
# SSH 접속
ssh ubuntu@<YOUR_SERVER_IP>

# 방화벽에서 8080 포트 오픈 (외부 접근 허용)
sudo ufw allow 8080/tcp

# 방화벽 상태 확인
sudo ufw status
```

---

## 4. Spring Boot 서버 외부 접근 허용

### application.properties 또는 application.yml:

```properties
# application.properties
server.port=8080
server.address=0.0.0.0  # 모든 IP에서 접근 허용
```

또는

```yaml
# application.yml
server:
  port: 8080
  address: 0.0.0.0  # 모든 IP에서 접근 허용
```

---

## 5. 테스트

### 로컬에서 API 테스트:
```bash
# GET 요청 테스트
curl http://<YOUR_SERVER_IP>:8080/api/menu/menuListAll

# Health check (있는 경우)
curl http://<YOUR_SERVER_IP>:8080/actuator/health
```

### 브라우저에서 테스트:
```
http://<YOUR_SERVER_IP>:8080/api/menu/menuListAll
```

---

## 6. Mixed Content 문제 해결

프론트엔드가 HTTPS(https://winnticket.store)이고 API가 HTTP인 경우, 브라우저에서 Mixed Content 에러가 발생합니다.

### 해결 방법:

#### 방법 1: 개발 환경에서만 HTTP 사용
```bash
# 로컬 개발 시 HTTP로 실행
npm run dev -- --host --no-https
```

#### 방법 2: 브라우저 설정 (크롬 개발자용)
```bash
# 크롬 실행 시 Mixed Content 허용 (개발 전용!)
# Windows
chrome.exe --disable-web-security --user-data-dir="C:/temp/chrome"

# Mac
open -na "Google Chrome" --args --disable-web-security --user-data-dir="/tmp/chrome"

# Linux
google-chrome --disable-web-security --user-data-dir="/tmp/chrome"
```

⚠️ **이 방법은 개발 전용이며 보안상 위험합니다!**

#### 방법 3: API 서브도메인 + HTTPS 사용 (권장!)
`server-setup-guide.md` 참고하여 https://api.winnticket.store 설정

---

## 7. 프로덕션 배포 시 주의사항

### ❌ 권장하지 않는 구성:
```
프론트엔드: HTTPS (https://winnticket.store)
API: HTTP (http://<YOUR_SERVER_IP>:8080)
→ Mixed Content 에러!
```

### ✅ 권장하는 구성:
```
프론트엔드: HTTPS (https://winnticket.store)
API: HTTPS (https://api.winnticket.store)
→ 안전하고 에러 없음!
```

---

## 8. Spring Boot 실행 확인

```bash
# 서버 접속
ssh ubuntu@<YOUR_SERVER_IP>

# Spring Boot 실행 확인
sudo netstat -tuln | grep 8080

# 프로세스 확인
ps aux | grep java

# 로그 확인 (실행 방법에 따라 다름)
sudo journalctl -u spring-boot-app -f
# 또는
tail -f /var/log/spring-boot/application.log
```

---

## 9. 체크리스트

- [ ] Spring Boot 서버 8080 포트에서 실행 중
- [ ] `server.address=0.0.0.0` 설정 완료
- [ ] 방화벽 8080 포트 오픈
- [ ] CORS 설정 완료 (allowedOrigins)
- [ ] 프론트엔드 .env 파일: `VITE_API_BASE_URL=http://<YOUR_SERVER_IP>:8080`
- [ ] 로컬에서 curl 테스트 성공
- [ ] 브라우저에서 API 직접 접근 테스트 성공
- [ ] Mixed Content 문제 해결 방안 확인

---

## 10. 권장 사항

**개발 단계**: 직접 IP 사용 가능
**프로덕션 단계**: API 서브도메인 + HTTPS 사용 필수

프로덕션 배포 전에 `server-setup-guide.md`를 참고하여 HTTPS 설정을 완료하세요!

```bash
# 프로덕션으로 전환 시
1. DNS 설정: api.winnticket.store → <YOUR_SERVER_IP>
2. Nginx 설치 및 리버스 프록시 설정
3. SSL 인증서 발급 (Let's Encrypt)
4. .env 파일 변경: VITE_API_BASE_URL=https://api.winnticket.store
```

---

## 트러블슈팅

### 연결 거부 (Connection Refused)
```bash
# Spring Boot 서버가 실행 중인지 확인
curl http://localhost:8080  # 서버에서 실행

# 방화벽 확인
sudo ufw status | grep 8080
```

### CORS 에러
```bash
# Spring Boot 로그 확인
# CORS 설정이 제대로 되었는지 확인
# allowedOrigins에 프론트엔드 도메인이 포함되어 있는지 확인
```

### Mixed Content 에러
```
https://winnticket.store에서 http://<YOUR_SERVER_IP>:8080 호출 시 발생
→ API도 HTTPS로 변경 필요 (api.winnticket.store)
```

---

**현재 설정**:
- API: http://<YOUR_SERVER_IP>:8080 ✅
- 개발/테스트 용도로 적합 ✅
- 프로덕션 배포 시 HTTPS 전환 필요 ⚠️
