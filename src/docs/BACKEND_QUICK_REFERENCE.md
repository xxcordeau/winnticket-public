# 🚀 백엔드 개발자를 위한 빠른 참조 가이드

## 📌 핵심 요약

### ⭐ 가장 중요한 포인트

```
이미지 파일 업로드 → 서버 저장 → URL 반환 → 마크다운에 포함 → DB 저장
```

### 필수 구현 API (2개)

1. **이미지 업로드**: `POST /api/image/upload`
2. **상품 상세내용 수정**: `PATCH /api/product/admin/{id}/detailContent`

---

## 1️⃣ 이미지 업로드 API

### 요청
```http
POST /api/image/upload
Content-Type: multipart/form-data

FormData:
  image: [파일]
```

### 응답
```json
{
  "success": true,
  "data": {
    "imageUrl": "https://api.winnticket.store/uploads/image-1734567890123.jpg"
  },
  "message": "이미지가 업로드되었습니다.",
  "timestamp": "2025-12-04T10:30:00Z"
}
```

### Spring Boot 구현 예시
```java
@PostMapping("/api/image/upload")
public ApiResponse<ImageUploadResponse> uploadImage(
    @RequestParam("image") MultipartFile file
) {
    // 1. 파일 검증
    if (file.isEmpty()) {
        throw new BadRequestException("파일이 비어있습니다.");
    }
    
    // 2. 파일명 생성
    String fileName = "image-" + System.currentTimeMillis() + 
                     getExtension(file.getOriginalFilename());
    
    // 3. 저장 경로
    Path uploadPath = Paths.get("/var/www/uploads/");
    Files.createDirectories(uploadPath);
    
    // 4. 파일 저장
    Path filePath = uploadPath.resolve(fileName);
    Files.copy(file.getInputStream(), filePath, 
               StandardCopyOption.REPLACE_EXISTING);
    
    // 5. URL 반환
    String imageUrl = "https://api.winnticket.store/uploads/" + fileName;
    return ApiResponse.success(new ImageUploadResponse(imageUrl));
}

private String getExtension(String filename) {
    return filename.substring(filename.lastIndexOf("."));
}
```

---

## 2️⃣ 상품 상세내용 수정 API

### 요청
```http
PATCH /api/product/admin/{id}/detailContent
Content-Type: application/json

{
  "detailContent": "## 제품 소개\n\n![헤드폰](https://api.winnticket.store/uploads/image123.jpg)\n\n고급 소재..."
}
```

### 응답
```json
{
  "success": true,
  "data": null,
  "message": "상세내용이 수정되었습니다.",
  "timestamp": "2025-12-04T10:35:00Z"
}
```

### Spring Boot 구현 예시
```java
@PatchMapping("/api/product/admin/{id}/detailContent")
public ApiResponse<Void> updateDetailContent(
    @PathVariable String id,
    @RequestBody ProductDetailContentRequest request
) {
    Product product = productRepository.findById(id)
        .orElseThrow(() -> new NotFoundException("상품을 찾을 수 없습니다."));
    
    // 마크다운 텍스트 그대로 저장 (이미지 URL 포함)
    product.setDetailContent(request.getDetailContent());
    
    productRepository.save(product);
    
    return ApiResponse.success(null, "상세내용이 수정되었습니다.");
}
```

---

## 데이터베이스 스키마

### products 테이블

```sql
CREATE TABLE products (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    
    -- ⭐ 상세 설명: 마크다운 형식
    detail_content TEXT,
    
    -- 기타 필드들...
    price DECIMAL(10, 2) NOT NULL,
    stock INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Entity 클래스

```java
@Entity
@Table(name = "products")
public class Product {
    
    @Id
    @Column(length = 50)
    private String id;
    
    @Column(nullable = false, unique = true, length = 50)
    private String code;
    
    @Column(nullable = false)
    private String name;
    
    // ⭐ 마크다운 형식의 상세 설명 (이미지 URL 포함)
    @Column(name = "detail_content", columnDefinition = "TEXT")
    private String detailContent;
    
    // Getters and Setters...
}
```

---

## 파일 서빙 설정

### Nginx 설정

```nginx
server {
    listen 80;
    server_name api.winnticket.store;
    
    # 이미지 정적 파일 서빙
    location /uploads/ {
        alias /var/www/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    # API 요청
    location /api/ {
        proxy_pass http://localhost:8080;
        # ... 기타 프록시 설정
    }
}
```

### Spring Boot 설정 (대안)

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry
            .addResourceHandler("/uploads/**")
            .addResourceLocations("file:/var/www/uploads/");
    }
}
```

---

## 마크다운에서 이미지 URL 추출 (선택사항)

백엔드에서 `detailContent`에서 이미지 URL을 추출하고 싶은 경우:

```java
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public List<String> extractImageUrls(String markdown) {
    List<String> urls = new ArrayList<>();
    
    // 정규식: ![alt](url) 형식에서 url 추출
    Pattern pattern = Pattern.compile("!\\[.*?\\]\\((https?://[^\\)]+)\\)");
    Matcher matcher = pattern.matcher(markdown);
    
    while (matcher.find()) {
        urls.add(matcher.group(1));
    }
    
    return urls;
}
```

---

## 전체 플로우

```
┌─────────────┐
│  관리자     │
│  이미지 선택  │
└──────┬──────┘
       │ 파일
       ↓
┌─────────────────────────────┐
│ POST /api/image/upload      │
│ - 파일 저장                  │
│ - URL 반환                   │
└──────┬──────────────────────┘
       │ { "imageUrl": "https://..." }
       ↓
┌─────────────────────────────┐
│ 프론트엔드                    │
│ - 에디터에 URL 삽입           │
│ - 마크다운 작성               │
└──────┬──────────────────────┘
       │ detailContent (마크다운)
       ↓
┌─────────────────────────────┐
│ PATCH /api/product/.../     │
│ detailContent               │
│ - 마크다운 DB 저장            │
└──────┬──────────────────────┘
       │
       ↓
┌─────────────────────────────┐
│ 데이터베이스                  │
│ products.detail_content     │
│ = "## 제품\n![](url)..."    │
└─────────────────────────────┘
```

---

## DTO 클래스

### ImageUploadResponse
```java
public class ImageUploadResponse {
    private String imageUrl;
    
    // Constructor, Getters, Setters
}
```

### ProductDetailContentRequest
```java
public class ProductDetailContentRequest {
    private String detailContent;
    
    // Getters, Setters
}
```

### ApiResponse (공통)
```java
public class ApiResponse<T> {
    private boolean success;
    private T data;
    private String message;
    private String timestamp;
    
    public static <T> ApiResponse<T> success(T data) {
        return success(data, "성공");
    }
    
    public static <T> ApiResponse<T> success(T data, String message) {
        ApiResponse<T> response = new ApiResponse<>();
        response.success = true;
        response.data = data;
        response.message = message;
        response.timestamp = LocalDateTime.now().toString();
        return response;
    }
    
    // Getters, Setters
}
```

---

## 체크리스트

### ✅ 필수 구현
- [ ] 이미지 업로드 API (`POST /api/image/upload`)
- [ ] 파일 저장 디렉토리 생성 (`/var/www/uploads/`)
- [ ] 고유한 파일명 생성
- [ ] 이미지 URL 반환
- [ ] 이미지 파일 서빙 (Nginx 또는 Spring Boot)
- [ ] 상품 상세내용 수정 API
- [ ] `detail_content` 필드를 TEXT 타입으로 저장

### 📋 권장 사항
- [ ] 파일 크기 제한 (최대 10MB)
- [ ] 파일 형식 검증 (JPG, PNG, GIF, WebP)
- [ ] 이미지 리사이징/압축
- [ ] 파일명 특수문자 제거
- [ ] 경로 traversal 방지
- [ ] 업로드 이력 로깅

---

## 테스트

### cURL 테스트: 이미지 업로드

```bash
curl -X POST https://api.winnticket.store/api/image/upload \
  -F "image=@/path/to/image.jpg"
```

### cURL 테스트: 상품 상세내용 수정

```bash
curl -X PATCH https://api.winnticket.store/api/product/admin/prod-001/detailContent \
  -H "Content-Type: application/json" \
  -d '{
    "detailContent": "## 제품 소개\n\n![이미지](https://api.winnticket.store/uploads/image-123.jpg)\n\n최고급 소재..."
  }'
```

---

## 관련 문서

- 📖 [PRODUCT_API_GUIDE.md](./PRODUCT_API_GUIDE.md) - 전체 API 상세 가이드
- 📋 [PRODUCT_DATA_SAMPLES.md](./PRODUCT_DATA_SAMPLES.md) - 데이터 샘플 및 스키마

---

## 문의

추가 질문이나 도움이 필요하면 개발팀에 문의하세요.