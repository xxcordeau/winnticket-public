# 📦 상품관리 API 가이드

## 목차
1. [개요](#개요)
2. [상품 이미지 업로드 플로우](#상품-이미지-업로드-플로우)
3. [API 엔드포인트](#api-엔드포인트)
4. [데이터 스키마](#데이터-스키마)
5. [예제 코드](#예제-코드)

---

## 개요

상품관리 시스템은 **파일 업로드 방식**을 사용하여 이미지를 관리합니다.

### 핵심 원칙
- ✅ **이미지 파일**은 먼저 서버로 전송되어 저장됨
- ✅ 서버는 저장된 이미지의 **URL을 반환**
- ✅ 반환된 URL은 **마크다운 형식**으로 `detailContent` 필드에 포함됨
- ✅ 프론트엔드는 마크다운을 HTML로 렌더링하여 표시

### 주요 필드
- `imageUrls`: 상품 대표 이미지 (최대 4장)
- `detailContent`: 상품 상세 설명 (마크다운 형식, 이미지 URL 포함)

---

## 상품 이미지 업로드 플로우

### 1️⃣ WYSIWYG 에디터에서 이미지 업로드

```
[관리자] 이미지 선택
    ↓
[프론트] 파일을 FormData로 변환
    ↓
[프론트] POST /api/image/upload
    ↓
[백엔드] 파일을 서버 디렉토리에 저장 (예: /uploads/image123.jpg)
    ↓
[백엔드] 저장된 파일의 URL 반환
    {
      "success": true,
      "data": {
        "imageUrl": "https://api.winnticket.store/uploads/image123.jpg"
      }
    }
    ↓
[프론트] URL을 에디터에 삽입 (마크다운 형식)
    ![상품 이미지](https://api.winnticket.store/uploads/image123.jpg)
```

### 2️⃣ 상품 저장

```
[관리자] 저장 버튼 클릭
    ↓
[프론트] detailContent에 마크다운 텍스트 포함
    {
      "name": "프리미엄 헤드폰",
      "detailContent": "## 제품 소개\n![헤드폰](https://api.winnticket.store/uploads/image123.jpg)\n고급 소재..."
    }
    ↓
[백엔드] DB에 저장
    - detailContent 필드에 마크다운 텍스트 저장
    - 이미지 파일은 이미 /uploads/ 디렉토리에 존재
```

### 3️⃣ 쇼핑몰에서 렌더링

```
[사용자] 상품 상세 페이지 접속
    ↓
[프론트] GET /api/product/{id}
    ↓
[백엔드] 상품 정보 반환
    {
      "detailContent": "## 제품 소개\n![헤드폰](https://api.winnticket.store/uploads/image123.jpg)\n..."
    }
    ↓
[프론트] 마크다운 → HTML 변환
    <h2>제품 소개</h2>
    <img src="https://api.winnticket.store/uploads/image123.jpg" alt="헤드폰" />
    ↓
[사용자] 이미지와 함께 상세 설명 확인
```

---

## API 엔드포인트

### 1. 이미지 업로드 (Image Upload)

**URL**: `POST /api/image/upload`

**요청**:
```http
POST /api/image/upload HTTP/1.1
Host: api.winnticket.store
Content-Type: multipart/form-data

FormData:
  image: [파일]
```

**요청 예제 (JavaScript)**:
```javascript
const formData = new FormData();
formData.append('image', file);

const response = await fetch('https://api.winnticket.store/api/image/upload', {
  method: 'POST',
  body: formData,
  credentials: 'include',
});

const result = await response.json();
```

**응답**:
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

**백엔드 구현 가이드**:
```java
@PostMapping("/api/image/upload")
public ApiResponse<ImageUploadResponse> uploadImage(@RequestParam("image") MultipartFile file) {
    // 1. 파일 유효성 검증
    if (file.isEmpty()) {
        throw new BadRequestException("파일이 비어있습니다.");
    }
    
    // 2. 파일 저장 경로 생성
    String fileName = "image-" + System.currentTimeMillis() + getExtension(file.getOriginalFilename());
    Path uploadPath = Paths.get("/var/www/uploads/");
    Files.createDirectories(uploadPath);
    
    // 3. 파일 저장
    Path filePath = uploadPath.resolve(fileName);
    Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
    
    // 4. URL 생성 및 반환
    String imageUrl = "https://api.winnticket.store/uploads/" + fileName;
    return ApiResponse.success(new ImageUploadResponse(imageUrl));
}
```

---

### 2. 상품 상세내용 수정 (Detail Content Update)

**URL**: `PATCH /api/product/admin/{id}/detailContent`

**요청**:
```json
{
  "detailContent": "## 제품 소개\n\n![헤드폰](https://api.winnticket.store/uploads/image123.jpg)\n\n고급 소재로 제작된..."
}
```

**응답**:
```json
{
  "success": true,
  "data": null,
  "message": "상세내용이 수정되었습니다.",
  "timestamp": "2025-12-04T10:35:00Z"
}
```

**백엔드 구현 가이드**:
```java
@PatchMapping("/api/product/admin/{id}/detailContent")
public ApiResponse<Void> updateDetailContent(
    @PathVariable String id,
    @RequestBody ProductDetailContentRequest request
) {
    Product product = productRepository.findById(id)
        .orElseThrow(() -> new NotFoundException("상품을 찾을 수 없습니다."));
    
    // detailContent에 마크다운 텍스트 저장 (이미지 URL 포함)
    product.setDetailContent(request.getDetailContent());
    
    productRepository.save(product);
    
    return ApiResponse.success(null, "상세내용이 수정되었습니다.");
}
```

---

### 3. 상품 등록 (Product Create)

**URL**: `POST /api/product/admin`

**요청**:
```json
{
  "code": "PROD-001",
  "name": "프리미엄 헤드폰",
  "categoryId": "cat-001",
  "description": "고음질 무선 헤드폰",
  "imageUrl": "https://api.winnticket.store/uploads/thumbnail.jpg",
  "imageUrls": [
    "https://api.winnticket.store/uploads/image1.jpg",
    "https://api.winnticket.store/uploads/image2.jpg"
  ],
  "price": 150000,
  "discountPrice": 120000,
  "stock": 100,
  "salesStatus": "ON_SALE",
  "salesStartDate": "2025-01-01",
  "salesEndDate": "2025-12-31",
  "displayOrder": 1,
  "visible": true,
  "detailContent": "## 제품 소개\n\n![헤드폰](https://api.winnticket.store/uploads/detail1.jpg)\n\n최고급 소재로 제작..."
}
```

**응답**:
```json
{
  "success": true,
  "data": {
    "id": "product-123",
    "code": "PROD-001",
    "name": "프리미엄 헤드폰",
    "detailContent": "## 제품 소개\n\n![헤드폰](https://api.winnticket.store/uploads/detail1.jpg)...",
    "createdAt": "2025-12-04T10:40:00Z",
    "updatedAt": "2025-12-04T10:40:00Z"
  },
  "message": "상품이 등록되었습니다.",
  "timestamp": "2025-12-04T10:40:00Z"
}
```

---

### 4. 상품 상세 조회 (Product Detail)

**URL**: `GET /api/product/admin/{id}`

**응답**:
```json
{
  "success": true,
  "data": {
    "id": "product-123",
    "code": "PROD-001",
    "name": "프리미엄 헤드폰",
    "categoryId": "cat-001",
    "categoryName": "전자제품",
    "price": 150000,
    "discountPrice": 120000,
    "stock": 100,
    "salesStatus": "ON_SALE",
    "description": "고음질 무선 헤드폰",
    "imageUrl": "https://api.winnticket.store/uploads/thumbnail.jpg",
    "imageUrls": [
      "https://api.winnticket.store/uploads/image1.jpg",
      "https://api.winnticket.store/uploads/image2.jpg"
    ],
    "detailContent": "## 제품 소개\n\n![헤드폰](https://api.winnticket.store/uploads/detail1.jpg)\n\n최고급 소재...",
    "shippingInfo": "무료 배송 (50,000원 이상 구매 시)",
    "warrantyInfo": "1년 무상 AS",
    "returnInfo": "7일 이내 무료 반품",
    "options": [],
    "visible": true,
    "displayOrder": 1,
    "createdAt": "2025-12-04T10:40:00Z",
    "updatedAt": "2025-12-04T10:40:00Z"
  },
  "message": "조회 성공",
  "timestamp": "2025-12-04T11:00:00Z"
}
```

---

## 데이터 스키마

### Product (상품)

```typescript
interface Product {
  // 기본 정보
  id: string;                    // 상품 ID
  code: string;                  // 상품 코드
  name: string;                  // 상품명
  categoryId: string;            // 카테고리 ID
  categoryName?: string;         // 카테고리명 (조인)
  partnerId?: string;            // 파트너 ID
  partnerName?: string;          // 파트너명 (조인)
  
  // 가격 및 재고
  price: number;                 // 기본 가격
  discountPrice?: number;        // 할인 가격
  stock: number;                 // 재고
  
  // 판매 정보
  salesStatus: SalesStatus;      // 판매 상태
  salesStartDate?: string;       // 판매 시작일
  salesEndDate?: string;         // 판매 종료일
  
  // 설명 및 이미지
  description: string;           // 간단한 설명
  imageUrl?: string;             // 대표 이미지 (하위 호환성)
  imageUrls?: string[];          // 상품 이미지 배열 (최대 4장)
  
  // ⭐ 상세 설명 (마크다운 + 이미지 URL)
  detailContent?: string;        // 마크다운 형식의 상세 설명
                                 // 예: "## 제품 소개\n![이미지](https://api.winnticket.store/uploads/img.jpg)\n..."
  
  detailImages?: string[];       // (DEPRECATED) detailContent로 마이그레이션 권장
  
  // 배송 및 보증
  shippingInfo?: string;         // 배송 정보
  warrantyInfo?: string;         // 보증 정보
  returnInfo?: string;           // 반품/교환 정보
  
  // 옵션
  options: ProductOption[];      // 상품 옵션 (사이즈, 색상 등)
  
  // 뱃지
  isNew?: boolean;               // 신상품 여부
  isBest?: boolean;              // 베스트 상품 여부
  isSale?: boolean;              // 특가 상품 여부
  
  // 표시 설정
  visible: boolean;              // 노출 여부
  displayOrder: number;          // 표시 순서
  
  // 타임스탬프
  createdAt: string;
  updatedAt: string;
}

enum SalesStatus {
  PREPARING = "준비중",
  ON_SALE = "판매중",
  SOLD_OUT = "품절",
  DISCONTINUED = "판매중단"
}
```

### ProductOption (상품 옵션)

```typescript
interface ProductOption {
  id: string;
  name: string;                  // 옵션명 (예: "사이즈", "색상")
  code: string;                  // 옵션 코드
  values: ProductOptionValue[];  // 옵션 값들
  required: boolean;             // 필수 선택 여부
  displayOrder: number;
  visible: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProductOptionValue {
  id: string;
  optionId: string;
  value: string;                 // 값 (예: "S", "M", "L" 또는 "빨강", "파랑")
  code: string;                  // 값 코드
  additionalPrice: number;       // 추가 금액 (양수/음수 가능)
  displayOrder: number;
  visible: boolean;
}
```

---

## 예제 코드

### 프론트엔드: 이미지 업로드

```typescript
import { uploadImage } from './lib/api/product';

async function handleImageUpload(file: File) {
  try {
    const response = await uploadImage(file);
    
    if (response.success) {
      const imageUrl = response.data.imageUrl;
      console.log('업로드된 이미지 URL:', imageUrl);
      
      // 에디터에 마크다운 형식으로 삽입
      const markdown = `![이미지](${imageUrl})`;
      insertIntoEditor(markdown);
    }
  } catch (error) {
    console.error('이미지 업로드 실패:', error);
  }
}
```

### 프론트엔드: 상품 저장

```typescript
import { updateProductDetailContent } from './lib/api/product';

async function saveProductDetail(productId: string, content: string) {
  try {
    const response = await updateProductDetailContent(productId, {
      detailContent: content,
      detailImagesList: extractImageUrls(content),
    });
    
    if (response.success) {
      toast.success('상품 상세내용이 저장되었습니다.');
    }
  } catch (error) {
    console.error('저장 실패:', error);
  }
}

// 마크다운에서 이미지 URL 추출
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

### 프론트엔드: 마크다운 렌더링

```typescript
function renderMarkdown(markdown: string): string {
  let html = markdown;
  
  // 이미지 변환
  html = html.replace(
    /!\[([^\]]*)\]\(([^\)]+)\)/g,
    '<img src="$2" alt="$1" style="max-width: 100%; height: auto;" />'
  );
  
  // 헤딩
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  
  // 볼드
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  
  // 줄바꿈
  html = html.replace(/\n/g, '<br />');
  
  return html;
}

// 사용 예시
function ProductDetail({ product }) {
  return (
    <div
      dangerouslySetInnerHTML={{
        __html: renderMarkdown(product.detailContent)
      }}
    />
  );
}
```

---

## 백엔드 체크리스트

### ✅ 필수 구현 사항

1. **이미지 업로드 API**
   - [ ] POST `/api/image/upload` 엔드포인트 구현
   - [ ] MultipartFile 처리
   - [ ] 파일 저장 디렉토리 생성 (`/var/www/uploads/`)
   - [ ] 고유한 파일명 생성 (`image-{timestamp}.jpg`)
   - [ ] 저장된 파일의 URL 반환

2. **이미지 파일 서빙**
   - [ ] `/uploads/` 경로를 정적 파일로 서빙
   - [ ] CORS 설정 (이미지 접근 허용)
   - [ ] Nginx 또는 Spring Boot 설정

3. **상품 상세내용 저장**
   - [ ] `detailContent` 필드를 TEXT 타입으로 저장 (긴 텍스트 지원)
   - [ ] 마크다운 텍스트를 그대로 저장 (변환 불필요)

4. **상품 조회 API**
   - [ ] `detailContent` 필드를 응답에 포함
   - [ ] 클라이언트에서 마크다운 → HTML 변환 수행

### 📋 권장 사항

- **파일 크기 제한**: 이미지 업로드 시 최대 10MB 제한
- **파일 형식 검증**: JPG, PNG, GIF, WebP만 허용
- **이미지 최적화**: 업로드 시 리사이징 또는 압축 적용
- **보안**: 파일명에서 특수문자 제거, 경로 traversal 방지
- **로깅**: 이미지 업로드 이력 저장 (용량 관리)

---

## 문의

추가 질문이나 도움이 필요하면 개발팀에 문의하세요.