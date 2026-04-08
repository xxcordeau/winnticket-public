# 📋 상품관리 데이터 샘플

## 목차
1. [기본 상품 데이터](#기본-상품-데이터)
2. [상품 상세내용 (마크다운)](#상품-상세내용-마크다운)
3. [상품 옵션 데이터](#상품-옵션-데이터)
4. [데이터베이스 스키마](#데이터베이스-스키마)

---

## 기본 상품 데이터

### 샘플 1: 콘서트 티켓

```json
{
  "id": "prod-001",
  "code": "T2025001",
  "name": "아이유 2025 콘서트 <The Golden Hour>",
  "categoryId": "3924a177-bd9f-4d63-a557-9c52b6ae8f67",
  "categoryName": "콘서트",
  "partnerId": "PARTNER-HYBE",
  "partnerName": "하이브 엔터테인먼트",
  "price": 132000,
  "discountPrice": 110000,
  "salesStatus": "판매중",
  "salesStartDate": "2025-01-01T00:00:00Z",
  "salesEndDate": "2025-12-31T23:59:59Z",
  "stock": 150,
  "description": "대한민국 대표 아티스트 아이유의 2025년 전국투어 콘서트! 최고의 무대와 감동을 선사합니다.",
  "imageUrl": "https://api.winnticket.store/uploads/concert-iu-main.jpg",
  "imageUrls": [
    "https://api.winnticket.store/uploads/concert-iu-1.jpg",
    "https://api.winnticket.store/uploads/concert-iu-2.jpg",
    "https://api.winnticket.store/uploads/concert-iu-3.jpg",
    "https://api.winnticket.store/uploads/concert-iu-4.jpg"
  ],
  "shippingInfo": "현장 수령 또는 모바일 티켓 발송",
  "warrantyInfo": "100% 정품 티켓 보장",
  "returnInfo": "공연일 7일 전까지 취소 가능 (취소 수수료 10%)",
  "isNew": true,
  "isBest": true,
  "isSale": false,
  "visible": true,
  "displayOrder": 1,
  "createdAt": "2025-01-15T00:00:00Z",
  "updatedAt": "2025-01-15T00:00:00Z"
}
```

### 샘플 2: 전자제품

```json
{
  "id": "prod-100",
  "code": "PROD-HEADPHONE-001",
  "name": "프리미엄 무선 헤드폰",
  "categoryId": "cat-electronics",
  "categoryName": "전자제품",
  "price": 150000,
  "discountPrice": 120000,
  "salesStatus": "판매중",
  "stock": 50,
  "description": "고음질 무선 헤드폰으로 최상의 음악 감상 경험을 제공합니다.",
  "imageUrl": "https://api.winnticket.store/uploads/headphone-main.jpg",
  "imageUrls": [
    "https://api.winnticket.store/uploads/headphone-1.jpg",
    "https://api.winnticket.store/uploads/headphone-2.jpg"
  ],
  "shippingInfo": "무료 배송 (50,000원 이상 구매 시)",
  "warrantyInfo": "1년 무상 AS",
  "returnInfo": "7일 이내 무료 반품",
  "isNew": false,
  "isBest": true,
  "isSale": true,
  "visible": true,
  "displayOrder": 2,
  "createdAt": "2025-02-01T00:00:00Z",
  "updatedAt": "2025-02-01T00:00:00Z"
}
```

---

## 상품 상세내용 (마크다운)

### ⭐ 중요: detailContent 필드

`detailContent` 필드는 **마크다운 형식**으로 저장되며, **이미지 URL이 포함**됩니다.

#### 저장 형식
```markdown
# 제목

![이미지 설명](https://api.winnticket.store/uploads/image-123.jpg)

## 소제목

본문 내용...

**볼드 텍스트**
*이탤릭 텍스트*

- 목록 항목 1
- 목록 항목 2
```

#### 렌더링 결과
```html
<h1>제목</h1>
<img src="https://api.winnticket.store/uploads/image-123.jpg" alt="이미지 설명" />
<h2>소제목</h2>
<p>본문 내용...</p>
<strong>볼드 텍스트</strong>
<em>이탤릭 텍스트</em>
<ul>
  <li>목록 항목 1</li>
  <li>목록 항목 2</li>
</ul>
```

---

### 샘플 1: 콘서트 티켓 상세내용

```json
{
  "detailContent": "# 아이유 2025 콘서트 <The Golden Hour> 완벽 가이드\n\n![콘서트 메인 포스터](https://api.winnticket.store/uploads/concert-iu-poster.jpg)\n\n## 🎤 공연 소개\n\n대한민국을 대표하는 아티스트 **아이유**가 2025년 전국투어 콘서트 <The Golden Hour>로 팬 여러분을 찾아갑니다!\n\n## 📍 공연 정보\n\n- **장소**: 올림픽 체조경기장\n- **일정**: 2025년 12월 5일(목) ~ 7일(토)\n- **공연시간**: 약 3시간 (인터미션 없음)\n- **관람등급**: 만 7세 이상 관람가\n\n![공연장 좌석배치도](https://api.winnticket.store/uploads/concert-iu-seating.jpg)\n\n## 🎵 세트리스트 (예상)\n\n1. Love Wins All\n2. 좋은날\n3. 팔레트\n4. Blueming\n5. 라일락\n\n... 및 히트곡 20곡 이상!\n\n![공연 무대 디자인](https://api.winnticket.store/uploads/concert-iu-stage.jpg)\n\n## ⚠️ 유의사항\n\n- 티켓은 1인 1매 구매 제한이 있습니다.\n- 공연 당일 신분증 확인이 필요합니다.\n- 사진/영상 촬영은 엄격히 금지됩니다.\n\n---\n\n**예매 문의**: 1544-1234 (평일 09:00-18:00)"
}
```

### 샘플 2: 전자제품 상세내용

```json
{
  "detailContent": "## 제품 소개\n\n![프리미엄 헤드폰](https://api.winnticket.store/uploads/headphone-detail-1.jpg)\n\n최고급 소재와 첨단 기술이 만나 탄생한 **프리미엄 무선 헤드폰**입니다.\n\n### 🎧 주요 특징\n\n1. **고음질 사운드**\n   - 40mm 다이내믹 드라이버\n   - Hi-Res Audio 인증\n   - AAC, aptX HD 코덱 지원\n\n2. **장시간 사용**\n   - 최대 30시간 재생 (ANC OFF)\n   - 고속 충전 지원 (10분 충전 = 5시간 재생)\n\n3. **편안한 착용감**\n   - 메모리폼 이어패드\n   - 조절 가능한 헤드밴드\n\n![제품 세부 사진](https://api.winnticket.store/uploads/headphone-detail-2.jpg)\n\n### 📦 구성품\n\n- 헤드폰 본체\n- USB-C 충전 케이블\n- 3.5mm 오디오 케이블\n- 휴대용 파우치\n- 사용 설명서\n\n![구성품 사진](https://api.winnticket.store/uploads/headphone-detail-3.jpg)\n\n### 🔧 제품 사양\n\n| 항목 | 사양 |\n|------|------|\n| 무게 | 250g |\n| 배터리 | 리튬이온 1000mAh |\n| 블루투스 | 5.3 |\n| 충전 시간 | 약 2시간 |\n\n---\n\n**고객센터**: 1588-9999 (연중무휴)"
}
```

---

## 상품 옵션 데이터

### 옵션 구조

```json
{
  "options": [
    {
      "id": "opt-001",
      "name": "좌석 등급",
      "code": "SEAT_GRADE",
      "required": true,
      "displayOrder": 1,
      "visible": true,
      "values": [
        {
          "id": "val-001",
          "optionId": "opt-001",
          "value": "VIP석",
          "code": "SEAT_VIP",
          "additionalPrice": 50000,
          "displayOrder": 1,
          "visible": true
        },
        {
          "id": "val-002",
          "optionId": "opt-001",
          "value": "R석",
          "code": "SEAT_R",
          "additionalPrice": 0,
          "displayOrder": 2,
          "visible": true
        },
        {
          "id": "val-003",
          "optionId": "opt-001",
          "value": "S석",
          "code": "SEAT_S",
          "additionalPrice": -30000,
          "displayOrder": 3,
          "visible": true
        }
      ]
    },
    {
      "id": "opt-002",
      "name": "색상",
      "code": "COLOR",
      "required": false,
      "displayOrder": 2,
      "visible": true,
      "values": [
        {
          "id": "val-004",
          "optionId": "opt-002",
          "value": "블랙",
          "code": "COLOR_BLACK",
          "additionalPrice": 0,
          "displayOrder": 1,
          "visible": true
        },
        {
          "id": "val-005",
          "optionId": "opt-002",
          "value": "화이트",
          "code": "COLOR_WHITE",
          "additionalPrice": 5000,
          "displayOrder": 2,
          "visible": true
        }
      ]
    }
  ]
}
```

### 옵션 설명

- **required**: `true`면 필수 선택, `false`면 선택사항
- **additionalPrice**: 기본 가격에서 추가/차감되는 금액
  - 양수: 추가 금액 (예: +50000원)
  - 0: 추가 금액 없음
  - 음수: 할인 금액 (예: -30000원)

### 최종 가격 계산 예시

```
기본 가격: 132,000원
선택 옵션:
  - VIP석 (+50,000원)
  - 화이트 색상 (+5,000원)

최종 가격 = 132,000 + 50,000 + 5,000 = 187,000원
```

---

## 데이터베이스 스키마

### products 테이블

```sql
CREATE TABLE products (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    category_id VARCHAR(50) NOT NULL,
    partner_id VARCHAR(50),
    price DECIMAL(10, 2) NOT NULL,
    discount_price DECIMAL(10, 2),
    sales_status VARCHAR(20) NOT NULL,
    sales_start_date DATETIME,
    sales_end_date DATETIME,
    stock INT DEFAULT 0,
    description TEXT,
    image_url VARCHAR(500),
    
    -- ⭐ 상세 설명: 마크다운 형식, 이미지 URL 포함
    detail_content TEXT,
    
    shipping_info VARCHAR(500),
    warranty_info VARCHAR(500),
    return_info VARCHAR(500),
    is_new BOOLEAN DEFAULT FALSE,
    is_best BOOLEAN DEFAULT FALSE,
    is_sale BOOLEAN DEFAULT FALSE,
    visible BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_category (category_id),
    INDEX idx_partner (partner_id),
    INDEX idx_sales_status (sales_status),
    INDEX idx_visible (visible)
);
```

### product_images 테이블 (선택사항)

이미지 URL을 배열이 아닌 별도 테이블로 관리하는 경우:

```sql
CREATE TABLE product_images (
    id VARCHAR(50) PRIMARY KEY,
    product_id VARCHAR(50) NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    image_type VARCHAR(20) DEFAULT 'GALLERY', -- 'THUMBNAIL', 'GALLERY', 'DETAIL'
    display_order INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_product (product_id)
);
```

### product_options 테이블

```sql
CREATE TABLE product_options (
    id VARCHAR(50) PRIMARY KEY,
    product_id VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    required BOOLEAN DEFAULT FALSE,
    display_order INT DEFAULT 0,
    visible BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_product (product_id)
);
```

### product_option_values 테이블

```sql
CREATE TABLE product_option_values (
    id VARCHAR(50) PRIMARY KEY,
    option_id VARCHAR(50) NOT NULL,
    value VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    additional_price DECIMAL(10, 2) DEFAULT 0,
    display_order INT DEFAULT 0,
    visible BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (option_id) REFERENCES product_options(id) ON DELETE CASCADE,
    INDEX idx_option (option_id)
);
```

---

## Spring Boot Entity 예시

### Product.java

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
    
    @Column(name = "category_id", nullable = false, length = 50)
    private String categoryId;
    
    @Column(name = "partner_id", length = 50)
    private String partnerId;
    
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;
    
    @Column(name = "discount_price", precision = 10, scale = 2)
    private BigDecimal discountPrice;
    
    @Column(name = "sales_status", nullable = false, length = 20)
    private String salesStatus;
    
    @Column(nullable = false)
    private Integer stock;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "image_url", length = 500)
    private String imageUrl;
    
    // ⭐ 마크다운 형식의 상세 설명 (이미지 URL 포함)
    @Column(name = "detail_content", columnDefinition = "TEXT")
    private String detailContent;
    
    @Column(name = "shipping_info", length = 500)
    private String shippingInfo;
    
    @Column(name = "warranty_info", length = 500)
    private String warrantyInfo;
    
    @Column(name = "return_info", length = 500)
    private String returnInfo;
    
    @Column(name = "is_new")
    private Boolean isNew;
    
    @Column(name = "is_best")
    private Boolean isBest;
    
    @Column(name = "is_sale")
    private Boolean isSale;
    
    @Column(nullable = false)
    private Boolean visible;
    
    @Column(name = "display_order")
    private Integer displayOrder;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // Getters and Setters...
}
```

---

## 마크다운에서 이미지 URL 추출 (선택사항)

백엔드에서 `detailContent`에서 이미지 URL을 추출하고 싶은 경우:

### Java

```java
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

### JavaScript/TypeScript

```typescript
function extractImageUrls(markdown: string): string[] {
  const regex = /!\[.*?\]\((https?:\/\/[^\)]+)\)/g;
  const urls: string[] = [];
  let match;
  
  while ((match = regex.exec(markdown)) !== null) {
    urls.push(match[1]);
  }
  
  return urls;
}
```

---

## 정리

### ✅ 핵심 포인트

1. **이미지는 파일 업로드 방식**
   - 이미지 파일을 서버에 저장
   - 저장된 URL을 반환
   
2. **상세 설명은 마크다운 형식**
   - `detailContent` 필드에 마크다운 저장
   - 이미지는 `![alt](url)` 형식으로 포함
   
3. **프론트엔드에서 렌더링**
   - 마크다운을 HTML로 변환
   - `dangerouslySetInnerHTML`로 표시

4. **데이터베이스 저장**
   - `detailContent`: TEXT 타입
   - 마크다운 텍스트 그대로 저장

---

## 문의

추가 질문이나 도움이 필요하면 개발팀에 문의하세요.