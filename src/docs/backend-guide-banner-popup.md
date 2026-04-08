# 배너관리 & 팝업관리 백엔드 API 가이드

## 개요
이 문서는 티켓 판매 사이트의 배너관리 및 팝업관리를 위한 백엔드 API 명세서입니다.

## 공통 사항

### Base URL
```
https://api.winnticket.store/api
```

### 인증
모든 API 요청은 헤더에 JWT 토큰이 필요합니다.
```
Authorization: Bearer {access_token}
```

### 공통 응답 형식
모든 API는 Spring Boot 스타일의 `ApiResponse<T>` 형태로 응답합니다.

```typescript
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  timestamp?: string;
}
```

---

## 1. 배너 관리 (Banner Management)

### 1.1 배너 목록 조회

**Endpoint:** `GET /admin/banners`

**Query Parameters:**
- `page` (optional): 페이지 번호 (기본값: 0)
- `size` (optional): 페이지 크기 (기본값: 20)
- `position` (optional): 배너 위치 필터 (MAIN, SUB, FOOTER)
- `visible` (optional): 노출 여부 필터 (true/false)
- `channelCode` (optional): 채널 코드 필터

**Request Example:**
```
GET /admin/banners?page=0&size=20&position=MAIN
```

**Response Schema:**
```json
{
  "success": true,
  "message": "배너 목록 조회 성공",
  "data": {
    "content": [
      {
        "id": "string (UUID)",
        "title": "string",
        "description": "string",
        "imageUrl": "string",
        "linkUrl": "string",
        "position": "MAIN | SUB | FOOTER",
        "displayOrder": "number",
        "visible": "boolean",
        "startDate": "string (ISO 8601)",
        "endDate": "string (ISO 8601)",
        "channels": [
          {
            "channelCode": "string",
            "channelName": "string",
            "visible": "boolean"
          }
        ],
        "createdAt": "string (ISO 8601)",
        "updatedAt": "string (ISO 8601)",
        "createdBy": "string",
        "updatedBy": "string"
      }
    ],
    "pageable": {
      "pageNumber": 0,
      "pageSize": 20,
      "sort": {
        "sorted": true,
        "unsorted": false,
        "empty": false
      }
    },
    "totalElements": 50,
    "totalPages": 3,
    "last": false,
    "first": true,
    "numberOfElements": 20,
    "size": 20,
    "number": 0,
    "empty": false
  },
  "timestamp": "2025-12-11T10:30:00Z"
}
```

---

### 1.2 배너 상세 조회

**Endpoint:** `GET /admin/banners/{bannerId}`

**Path Parameters:**
- `bannerId`: 배너 ID (UUID)

**Request Example:**
```
GET /admin/banners/550e8400-e29b-41d4-a716-446655440000
```

**Response Schema:**
```json
{
  "success": true,
  "message": "배너 조회 성공",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "크리스마스 특별 할인",
    "description": "연말 특가 이벤트",
    "imageUrl": "https://api.winnticket.store/uploads/banner-001.jpg",
    "linkUrl": "/events/christmas-2025",
    "position": "MAIN",
    "displayOrder": 1,
    "visible": true,
    "startDate": "2025-12-01T00:00:00Z",
    "endDate": "2025-12-25T23:59:59Z",
    "channels": [
      {
        "channelCode": "MAIN",
        "channelName": "메인 채널",
        "visible": true
      },
      {
        "channelCode": "PARTNER_A",
        "channelName": "파트너 A",
        "visible": false
      }
    ],
    "clickCount": 1234,
    "impressionCount": 45678,
    "createdAt": "2025-11-01T10:00:00Z",
    "updatedAt": "2025-12-10T15:30:00Z",
    "createdBy": "admin@winnticket.com",
    "updatedBy": "admin@winnticket.com"
  },
  "timestamp": "2025-12-11T10:30:00Z"
}
```

---

### 1.3 배너 생성

**Endpoint:** `POST /admin/banners`

**Request Body Schema:**
```json
{
  "title": "string (required, max 200)",
  "description": "string (optional, max 500)",
  "imageUrl": "string (required, URL)",
  "linkUrl": "string (optional, URL)",
  "position": "MAIN | SUB | FOOTER (required)",
  "displayOrder": "number (required, >= 0)",
  "visible": "boolean (required)",
  "startDate": "string (ISO 8601, required)",
  "endDate": "string (ISO 8601, optional)",
  "channels": [
    {
      "channelCode": "string (required)",
      "visible": "boolean (required)"
    }
  ]
}
```

**Request Example:**
```json
{
  "title": "신년 특별 할인",
  "description": "2026년 새해 맞이 특가",
  "imageUrl": "https://api.winnticket.store/uploads/banner-new-year.jpg",
  "linkUrl": "/events/new-year-2026",
  "position": "MAIN",
  "displayOrder": 1,
  "visible": true,
  "startDate": "2026-01-01T00:00:00Z",
  "endDate": "2026-01-31T23:59:59Z",
  "channels": [
    {
      "channelCode": "MAIN",
      "visible": true
    },
    {
      "channelCode": "PARTNER_A",
      "visible": true
    }
  ]
}
```

**Response Schema:**
```json
{
  "success": true,
  "message": "배너가 생성되었습니다",
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "title": "신년 특별 할인",
    "description": "2026년 새해 맞이 특가",
    "imageUrl": "https://api.winnticket.store/uploads/banner-new-year.jpg",
    "linkUrl": "/events/new-year-2026",
    "position": "MAIN",
    "displayOrder": 1,
    "visible": true,
    "startDate": "2026-01-01T00:00:00Z",
    "endDate": "2026-01-31T23:59:59Z",
    "channels": [
      {
        "channelCode": "MAIN",
        "channelName": "메인 채널",
        "visible": true
      },
      {
        "channelCode": "PARTNER_A",
        "channelName": "파트너 A",
        "visible": true
      }
    ],
    "clickCount": 0,
    "impressionCount": 0,
    "createdAt": "2025-12-11T10:35:00Z",
    "updatedAt": "2025-12-11T10:35:00Z",
    "createdBy": "admin@winnticket.com",
    "updatedBy": "admin@winnticket.com"
  },
  "timestamp": "2025-12-11T10:35:00Z"
}
```

---

### 1.4 배너 수정

**Endpoint:** `PUT /admin/banners/{bannerId}`

**Path Parameters:**
- `bannerId`: 배너 ID (UUID)

**Request Body Schema:**
```json
{
  "title": "string (required, max 200)",
  "description": "string (optional, max 500)",
  "imageUrl": "string (required, URL)",
  "linkUrl": "string (optional, URL)",
  "position": "MAIN | SUB | FOOTER (required)",
  "displayOrder": "number (required, >= 0)",
  "visible": "boolean (required)",
  "startDate": "string (ISO 8601, required)",
  "endDate": "string (ISO 8601, optional)",
  "channels": [
    {
      "channelCode": "string (required)",
      "visible": "boolean (required)"
    }
  ]
}
```

**Request Example:**
```json
{
  "title": "크리스마스 특별 할인 (연장)",
  "description": "연말 특가 이벤트 - 기간 연장",
  "imageUrl": "https://api.winnticket.store/uploads/banner-001-updated.jpg",
  "linkUrl": "/events/christmas-2025",
  "position": "MAIN",
  "displayOrder": 1,
  "visible": true,
  "startDate": "2025-12-01T00:00:00Z",
  "endDate": "2025-12-31T23:59:59Z",
  "channels": [
    {
      "channelCode": "MAIN",
      "visible": true
    }
  ]
}
```

**Response Schema:**
```json
{
  "success": true,
  "message": "배너가 수정되었습니다",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "크리스마스 특별 할인 (연장)",
    "description": "연말 특가 이벤트 - 기간 연장",
    "imageUrl": "https://api.winnticket.store/uploads/banner-001-updated.jpg",
    "linkUrl": "/events/christmas-2025",
    "position": "MAIN",
    "displayOrder": 1,
    "visible": true,
    "startDate": "2025-12-01T00:00:00Z",
    "endDate": "2025-12-31T23:59:59Z",
    "channels": [
      {
        "channelCode": "MAIN",
        "channelName": "메인 채널",
        "visible": true
      }
    ],
    "clickCount": 1234,
    "impressionCount": 45678,
    "createdAt": "2025-11-01T10:00:00Z",
    "updatedAt": "2025-12-11T10:40:00Z",
    "createdBy": "admin@winnticket.com",
    "updatedBy": "admin@winnticket.com"
  },
  "timestamp": "2025-12-11T10:40:00Z"
}
```

---

### 1.5 배너 삭제

**Endpoint:** `DELETE /admin/banners/{bannerId}`

**Path Parameters:**
- `bannerId`: 배너 ID (UUID)

**Request Example:**
```
DELETE /admin/banners/550e8400-e29b-41d4-a716-446655440000
```

**Response Schema:**
```json
{
  "success": true,
  "message": "배너가 삭제되었습니다",
  "timestamp": "2025-12-11T10:45:00Z"
}
```

---

### 1.6 배너 노출 여부 토글

**Endpoint:** `PATCH /admin/banners/{bannerId}/visible`

**Path Parameters:**
- `bannerId`: 배너 ID (UUID)

**Request Body Schema:**
```json
{
  "visible": "boolean (required)"
}
```

**Request Example:**
```json
{
  "visible": false
}
```

**Response Schema:**
```json
{
  "success": true,
  "message": "배너 노출 여부가 변경되었습니다",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "visible": false
  },
  "timestamp": "2025-12-11T10:50:00Z"
}
```

---

### 1.7 배너 정렬 순서 변경

**Endpoint:** `PATCH /admin/banners/reorder`

**Request Body Schema:**
```json
{
  "banners": [
    {
      "id": "string (UUID, required)",
      "displayOrder": "number (required, >= 0)"
    }
  ]
}
```

**Request Example:**
```json
{
  "banners": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "displayOrder": 2
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "displayOrder": 1
    }
  ]
}
```

**Response Schema:**
```json
{
  "success": true,
  "message": "배너 정렬 순서가 변경되었습니다",
  "timestamp": "2025-12-11T10:55:00Z"
}
```

---

### 1.8 배너 클릭/노출 통계 기록

**Endpoint:** `POST /admin/banners/{bannerId}/track`

**Path Parameters:**
- `bannerId`: 배너 ID (UUID)

**Request Body Schema:**
```json
{
  "type": "CLICK | IMPRESSION (required)",
  "channelCode": "string (optional)",
  "userAgent": "string (optional)",
  "ipAddress": "string (optional)"
}
```

**Request Example:**
```json
{
  "type": "CLICK",
  "channelCode": "MAIN",
  "userAgent": "Mozilla/5.0...",
  "ipAddress": "123.456.789.0"
}
```

**Response Schema:**
```json
{
  "success": true,
  "message": "통계가 기록되었습니다",
  "timestamp": "2025-12-11T11:00:00Z"
}
```

---

## 2. 팝업 관리 (Popup Management)

### 2.1 팝업 목록 조회

**Endpoint:** `GET /admin/popups`

**Query Parameters:**
- `page` (optional): 페이지 번호 (기본값: 0)
- `size` (optional): 페이지 크기 (기본값: 20)
- `visible` (optional): 노출 여부 필터 (true/false)
- `channelCode` (optional): 채널 코드 필터

**Request Example:**
```
GET /admin/popups?page=0&size=20
```

**Response Schema:**
```json
{
  "success": true,
  "message": "팝업 목록 조회 성공",
  "data": {
    "content": [
      {
        "id": "string (UUID)",
        "title": "string",
        "content": "string",
        "imageUrl": "string",
        "linkUrl": "string",
        "width": "number",
        "height": "number",
        "position": "CENTER | TOP_LEFT | TOP_RIGHT | BOTTOM_LEFT | BOTTOM_RIGHT",
        "displayOrder": "number",
        "visible": "boolean",
        "startDate": "string (ISO 8601)",
        "endDate": "string (ISO 8601)",
        "allowTodayClose": "boolean",
        "channels": [
          {
            "channelCode": "string",
            "channelName": "string",
            "visible": "boolean"
          }
        ],
        "createdAt": "string (ISO 8601)",
        "updatedAt": "string (ISO 8601)",
        "createdBy": "string",
        "updatedBy": "string"
      }
    ],
    "pageable": {
      "pageNumber": 0,
      "pageSize": 20,
      "sort": {
        "sorted": true,
        "unsorted": false,
        "empty": false
      }
    },
    "totalElements": 20,
    "totalPages": 1,
    "last": true,
    "first": true,
    "numberOfElements": 20,
    "size": 20,
    "number": 0,
    "empty": false
  },
  "timestamp": "2025-12-11T11:05:00Z"
}
```

---

### 2.2 팝업 상세 조회

**Endpoint:** `GET /admin/popups/{popupId}`

**Path Parameters:**
- `popupId`: 팝업 ID (UUID)

**Request Example:**
```
GET /admin/popups/770e8400-e29b-41d4-a716-446655440000
```

**Response Schema:**
```json
{
  "success": true,
  "message": "팝업 조회 성공",
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440000",
    "title": "신규 회원 가입 이벤트",
    "content": "지금 가입하고 5,000원 쿠폰 받기!",
    "imageUrl": "https://api.winnticket.store/uploads/popup-001.jpg",
    "linkUrl": "/signup",
    "width": 400,
    "height": 600,
    "position": "CENTER",
    "displayOrder": 1,
    "visible": true,
    "startDate": "2025-12-01T00:00:00Z",
    "endDate": "2025-12-31T23:59:59Z",
    "allowTodayClose": true,
    "channels": [
      {
        "channelCode": "MAIN",
        "channelName": "메인 채널",
        "visible": true
      }
    ],
    "impressionCount": 12345,
    "closeCount": 8900,
    "todayCloseCount": 6700,
    "clickCount": 567,
    "createdAt": "2025-11-15T10:00:00Z",
    "updatedAt": "2025-12-10T15:30:00Z",
    "createdBy": "admin@winnticket.com",
    "updatedBy": "admin@winnticket.com"
  },
  "timestamp": "2025-12-11T11:10:00Z"
}
```

---

### 2.3 팝업 생성

**Endpoint:** `POST /admin/popups`

**Request Body Schema:**
```json
{
  "title": "string (required, max 200)",
  "content": "string (optional, max 1000)",
  "imageUrl": "string (required, URL)",
  "linkUrl": "string (optional, URL)",
  "width": "number (required, 100-1200)",
  "height": "number (required, 100-1200)",
  "position": "CENTER | TOP_LEFT | TOP_RIGHT | BOTTOM_LEFT | BOTTOM_RIGHT (required)",
  "displayOrder": "number (required, >= 0)",
  "visible": "boolean (required)",
  "startDate": "string (ISO 8601, required)",
  "endDate": "string (ISO 8601, optional)",
  "allowTodayClose": "boolean (required)",
  "channels": [
    {
      "channelCode": "string (required)",
      "visible": "boolean (required)"
    }
  ]
}
```

**Request Example:**
```json
{
  "title": "크리스마스 이벤트",
  "content": "크리스마스 특별 공연 예매하고 선물 받기!",
  "imageUrl": "https://api.winnticket.store/uploads/popup-christmas.jpg",
  "linkUrl": "/events/christmas-2025",
  "width": 500,
  "height": 700,
  "position": "CENTER",
  "displayOrder": 1,
  "visible": true,
  "startDate": "2025-12-20T00:00:00Z",
  "endDate": "2025-12-26T23:59:59Z",
  "allowTodayClose": true,
  "channels": [
    {
      "channelCode": "MAIN",
      "visible": true
    }
  ]
}
```

**Response Schema:**
```json
{
  "success": true,
  "message": "팝업이 생성되었습니다",
  "data": {
    "id": "880e8400-e29b-41d4-a716-446655440002",
    "title": "크리스마스 이벤트",
    "content": "크리스마스 특별 공연 예매하고 선물 받기!",
    "imageUrl": "https://api.winnticket.store/uploads/popup-christmas.jpg",
    "linkUrl": "/events/christmas-2025",
    "width": 500,
    "height": 700,
    "position": "CENTER",
    "displayOrder": 1,
    "visible": true,
    "startDate": "2025-12-20T00:00:00Z",
    "endDate": "2025-12-26T23:59:59Z",
    "allowTodayClose": true,
    "channels": [
      {
        "channelCode": "MAIN",
        "channelName": "메인 채널",
        "visible": true
      }
    ],
    "impressionCount": 0,
    "closeCount": 0,
    "todayCloseCount": 0,
    "clickCount": 0,
    "createdAt": "2025-12-11T11:15:00Z",
    "updatedAt": "2025-12-11T11:15:00Z",
    "createdBy": "admin@winnticket.com",
    "updatedBy": "admin@winnticket.com"
  },
  "timestamp": "2025-12-11T11:15:00Z"
}
```

---

### 2.4 팝업 수정

**Endpoint:** `PUT /admin/popups/{popupId}`

**Path Parameters:**
- `popupId`: 팝업 ID (UUID)

**Request Body Schema:**
```json
{
  "title": "string (required, max 200)",
  "content": "string (optional, max 1000)",
  "imageUrl": "string (required, URL)",
  "linkUrl": "string (optional, URL)",
  "width": "number (required, 100-1200)",
  "height": "number (required, 100-1200)",
  "position": "CENTER | TOP_LEFT | TOP_RIGHT | BOTTOM_LEFT | BOTTOM_RIGHT (required)",
  "displayOrder": "number (required, >= 0)",
  "visible": "boolean (required)",
  "startDate": "string (ISO 8601, required)",
  "endDate": "string (ISO 8601, optional)",
  "allowTodayClose": "boolean (required)",
  "channels": [
    {
      "channelCode": "string (required)",
      "visible": "boolean (required)"
    }
  ]
}
```

**Response Schema:**
```json
{
  "success": true,
  "message": "팝업이 수정되었습니다",
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440000",
    "title": "신규 회원 가입 이벤트 (업데이트)",
    "content": "지금 가입하고 10,000원 쿠폰 받기!",
    "imageUrl": "https://api.winnticket.store/uploads/popup-001-v2.jpg",
    "linkUrl": "/signup",
    "width": 400,
    "height": 600,
    "position": "CENTER",
    "displayOrder": 1,
    "visible": true,
    "startDate": "2025-12-01T00:00:00Z",
    "endDate": "2025-12-31T23:59:59Z",
    "allowTodayClose": true,
    "channels": [
      {
        "channelCode": "MAIN",
        "channelName": "메인 채널",
        "visible": true
      }
    ],
    "impressionCount": 12345,
    "closeCount": 8900,
    "todayCloseCount": 6700,
    "clickCount": 567,
    "createdAt": "2025-11-15T10:00:00Z",
    "updatedAt": "2025-12-11T11:20:00Z",
    "createdBy": "admin@winnticket.com",
    "updatedBy": "admin@winnticket.com"
  },
  "timestamp": "2025-12-11T11:20:00Z"
}
```

---

### 2.5 팝업 삭제

**Endpoint:** `DELETE /admin/popups/{popupId}`

**Path Parameters:**
- `popupId`: 팝업 ID (UUID)

**Request Example:**
```
DELETE /admin/popups/770e8400-e29b-41d4-a716-446655440000
```

**Response Schema:**
```json
{
  "success": true,
  "message": "팝업이 삭제되었습니다",
  "timestamp": "2025-12-11T11:25:00Z"
}
```

---

### 2.6 팝업 노출 여부 토글

**Endpoint:** `PATCH /admin/popups/{popupId}/visible`

**Path Parameters:**
- `popupId`: 팝업 ID (UUID)

**Request Body Schema:**
```json
{
  "visible": "boolean (required)"
}
```

**Request Example:**
```json
{
  "visible": false
}
```

**Response Schema:**
```json
{
  "success": true,
  "message": "팝업 노출 여부가 변경되었습니다",
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440000",
    "visible": false
  },
  "timestamp": "2025-12-11T11:30:00Z"
}
```

---

### 2.7 팝업 정렬 순서 변경

**Endpoint:** `PATCH /admin/popups/reorder`

**Request Body Schema:**
```json
{
  "popups": [
    {
      "id": "string (UUID, required)",
      "displayOrder": "number (required, >= 0)"
    }
  ]
}
```

**Request Example:**
```json
{
  "popups": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440000",
      "displayOrder": 2
    },
    {
      "id": "880e8400-e29b-41d4-a716-446655440002",
      "displayOrder": 1
    }
  ]
}
```

**Response Schema:**
```json
{
  "success": true,
  "message": "팝업 정렬 순서가 변경되었습니다",
  "timestamp": "2025-12-11T11:35:00Z"
}
```

---

### 2.8 팝업 통계 기록

**Endpoint:** `POST /admin/popups/{popupId}/track`

**Path Parameters:**
- `popupId`: 팝업 ID (UUID)

**Request Body Schema:**
```json
{
  "type": "IMPRESSION | CLOSE | TODAY_CLOSE | CLICK (required)",
  "channelCode": "string (optional)",
  "userAgent": "string (optional)",
  "ipAddress": "string (optional)"
}
```

**Request Example:**
```json
{
  "type": "TODAY_CLOSE",
  "channelCode": "MAIN",
  "userAgent": "Mozilla/5.0...",
  "ipAddress": "123.456.789.0"
}
```

**Response Schema:**
```json
{
  "success": true,
  "message": "통계가 기록되었습니다",
  "timestamp": "2025-12-11T11:40:00Z"
}
```

---

## 3. 사용자 팝업 쿠키 관리 (클라이언트 사이드)

### 3.1 "오늘 하루 보지 않기" 쿠키 설정
클라이언트에서 localStorage 또는 cookie로 관리합니다.

**Cookie/LocalStorage Key:**
```
popup_today_close_{popupId}
```

**Value:**
```
{
  "closedAt": "2025-12-11T11:40:00Z",
  "expiresAt": "2025-12-12T00:00:00Z"
}
```

---

## 4. Database Schema (MySQL/MariaDB)

### 4.1 배너 테이블 (banners)

```sql
CREATE TABLE banners (
  id VARCHAR(36) PRIMARY KEY COMMENT '배너 ID (UUID)',
  title VARCHAR(200) NOT NULL COMMENT '배너 제목',
  description VARCHAR(500) COMMENT '배너 설명',
  image_url VARCHAR(500) NOT NULL COMMENT '배너 이미지 URL',
  link_url VARCHAR(500) COMMENT '배너 링크 URL',
  position ENUM('MAIN', 'SUB', 'FOOTER') NOT NULL DEFAULT 'MAIN' COMMENT '배너 위치',
  display_order INT NOT NULL DEFAULT 0 COMMENT '정렬 순서',
  visible BOOLEAN NOT NULL DEFAULT true COMMENT '노출 여부',
  start_date DATETIME NOT NULL COMMENT '노출 시작일',
  end_date DATETIME COMMENT '노출 종료일',
  click_count BIGINT NOT NULL DEFAULT 0 COMMENT '클릭 수',
  impression_count BIGINT NOT NULL DEFAULT 0 COMMENT '노출 수',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
  created_by VARCHAR(100) COMMENT '생성자',
  updated_by VARCHAR(100) COMMENT '수정자',
  INDEX idx_position_visible (position, visible),
  INDEX idx_start_end_date (start_date, end_date),
  INDEX idx_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='배너 테이블';
```

### 4.2 배너 채널 매핑 테이블 (banner_channels)

```sql
CREATE TABLE banner_channels (
  id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '매핑 ID',
  banner_id VARCHAR(36) NOT NULL COMMENT '배너 ID',
  channel_code VARCHAR(50) NOT NULL COMMENT '채널 코드',
  visible BOOLEAN NOT NULL DEFAULT true COMMENT '해당 채널 노출 여부',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
  FOREIGN KEY (banner_id) REFERENCES banners(id) ON DELETE CASCADE,
  FOREIGN KEY (channel_code) REFERENCES channels(code) ON DELETE CASCADE,
  UNIQUE KEY uk_banner_channel (banner_id, channel_code),
  INDEX idx_channel_visible (channel_code, visible)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='배너 채널 매핑 테이블';
```

### 4.3 팝업 테이블 (popups)

```sql
CREATE TABLE popups (
  id VARCHAR(36) PRIMARY KEY COMMENT '팝업 ID (UUID)',
  title VARCHAR(200) NOT NULL COMMENT '팝업 제목',
  content VARCHAR(1000) COMMENT '팝업 내용',
  image_url VARCHAR(500) NOT NULL COMMENT '팝업 이미지 URL',
  link_url VARCHAR(500) COMMENT '팝업 링크 URL',
  width INT NOT NULL DEFAULT 400 COMMENT '팝업 너비 (px)',
  height INT NOT NULL DEFAULT 600 COMMENT '팝업 높이 (px)',
  position ENUM('CENTER', 'TOP_LEFT', 'TOP_RIGHT', 'BOTTOM_LEFT', 'BOTTOM_RIGHT') NOT NULL DEFAULT 'CENTER' COMMENT '팝업 위치',
  display_order INT NOT NULL DEFAULT 0 COMMENT '정렬 순서',
  visible BOOLEAN NOT NULL DEFAULT true COMMENT '노출 여부',
  start_date DATETIME NOT NULL COMMENT '노출 시작일',
  end_date DATETIME COMMENT '노출 종료일',
  allow_today_close BOOLEAN NOT NULL DEFAULT true COMMENT '오늘 하루 보지 않기 버튼 표시 여부',
  impression_count BIGINT NOT NULL DEFAULT 0 COMMENT '노출 수',
  close_count BIGINT NOT NULL DEFAULT 0 COMMENT '닫기 수',
  today_close_count BIGINT NOT NULL DEFAULT 0 COMMENT '오늘 하루 보지 않기 수',
  click_count BIGINT NOT NULL DEFAULT 0 COMMENT '클릭 수',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
  created_by VARCHAR(100) COMMENT '생성자',
  updated_by VARCHAR(100) COMMENT '수정자',
  INDEX idx_visible (visible),
  INDEX idx_start_end_date (start_date, end_date),
  INDEX idx_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='팝업 테이블';
```

### 4.4 팝업 채널 매핑 테이블 (popup_channels)

```sql
CREATE TABLE popup_channels (
  id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '매핑 ID',
  popup_id VARCHAR(36) NOT NULL COMMENT '팝업 ID',
  channel_code VARCHAR(50) NOT NULL COMMENT '채널 코드',
  visible BOOLEAN NOT NULL DEFAULT true COMMENT '해당 채널 노출 여부',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
  FOREIGN KEY (popup_id) REFERENCES popups(id) ON DELETE CASCADE,
  FOREIGN KEY (channel_code) REFERENCES channels(code) ON DELETE CASCADE,
  UNIQUE KEY uk_popup_channel (popup_id, channel_code),
  INDEX idx_channel_visible (channel_code, visible)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='팝업 채널 매핑 테이블';
```

---

## 5. 에러 응답

모든 API는 에러 발생 시 다음과 같은 형식으로 응답합니다.

```json
{
  "success": false,
  "message": "에러 메시지",
  "timestamp": "2025-12-11T12:00:00Z"
}
```

**공통 HTTP 상태 코드:**
- `200 OK`: 성공
- `201 Created`: 생성 성공
- `400 Bad Request`: 잘못된 요청 (유효성 검증 실패 등)
- `401 Unauthorized`: 인증 실패
- `403 Forbidden`: 권한 없음
- `404 Not Found`: 리소스를 찾을 수 없음
- `409 Conflict`: 중복된 데이터
- `500 Internal Server Error`: 서버 오류

---

## 6. 주요 비즈니스 로직

### 6.1 배너/팝업 노출 조건
배너/팝업은 다음 조건을 **모두 만족**할 때만 사용자에게 노출됩니다:

1. `visible = true` (노출 여부가 활성화)
2. `현재 시각 >= start_date` (노출 시작일 이후)
3. `end_date가 없거나 현재 시각 <= end_date` (노출 종료일 이전 또는 종료일 미설정)
4. 해당 채널의 `banner_channels.visible = true` 또는 `popup_channels.visible = true`

### 6.2 배너/팝업 정렬
- `display_order` (오름차순) → `created_at` (내림차순) 순으로 정렬

### 6.3 팝업 "오늘 하루 보지 않기" 처리
- 클라이언트에서 localStorage/cookie로 관리
- Key: `popup_today_close_{popupId}`
- 자정(00:00)에 자동 만료되도록 설정
- 서버는 통계만 수집 (POST /admin/popups/{popupId}/track)

---

## 7. 권한 관리

### 7.1 관리자 (ADMIN)
- 모든 배너/팝업 CRUD 권한
- 통계 조회 권한

### 7.2 현장관리자 (SUPERVISOR)
- 배너/팝업 조회 권한만 (읽기 전용)

---

## 8. 구현 예시 (Spring Boot Controller)

### 8.1 배너 컨트롤러 예시

```java
@RestController
@RequestMapping("/api/admin/banners")
@RequiredArgsConstructor
public class BannerController {
    
    private final BannerService bannerService;
    
    @GetMapping
    public ApiResponse<Page<BannerResponse>> getBanners(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) BannerPosition position,
            @RequestParam(required = false) Boolean visible,
            @RequestParam(required = false) String channelCode) {
        
        Page<BannerResponse> banners = bannerService.getBanners(
            page, size, position, visible, channelCode
        );
        
        return ApiResponse.<Page<BannerResponse>>builder()
                .success(true)
                .message("배너 목록 조회 성공")
                .data(banners)
                .build();
    }
    
    @GetMapping("/{bannerId}")
    public ApiResponse<BannerDetailResponse> getBanner(
            @PathVariable String bannerId) {
        
        BannerDetailResponse banner = bannerService.getBannerDetail(bannerId);
        
        return ApiResponse.<BannerDetailResponse>builder()
                .success(true)
                .message("배너 조회 성공")
                .data(banner)
                .build();
    }
    
    @PostMapping
    public ApiResponse<BannerDetailResponse> createBanner(
            @Valid @RequestBody BannerCreateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        BannerDetailResponse banner = bannerService.createBanner(
            request, userDetails.getUsername()
        );
        
        return ApiResponse.<BannerDetailResponse>builder()
                .success(true)
                .message("배너가 생성되었습니다")
                .data(banner)
                .build();
    }
    
    @PutMapping("/{bannerId}")
    public ApiResponse<BannerDetailResponse> updateBanner(
            @PathVariable String bannerId,
            @Valid @RequestBody BannerUpdateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        BannerDetailResponse banner = bannerService.updateBanner(
            bannerId, request, userDetails.getUsername()
        );
        
        return ApiResponse.<BannerDetailResponse>builder()
                .success(true)
                .message("배너가 수정되었습니다")
                .data(banner)
                .build();
    }
    
    @DeleteMapping("/{bannerId}")
    public ApiResponse<Void> deleteBanner(@PathVariable String bannerId) {
        bannerService.deleteBanner(bannerId);
        
        return ApiResponse.<Void>builder()
                .success(true)
                .message("배너가 삭제되었습니다")
                .build();
    }
    
    @PatchMapping("/{bannerId}/visible")
    public ApiResponse<BannerVisibleResponse> toggleVisible(
            @PathVariable String bannerId,
            @Valid @RequestBody BannerVisibleRequest request) {
        
        BannerVisibleResponse response = bannerService.toggleVisible(
            bannerId, request.isVisible()
        );
        
        return ApiResponse.<BannerVisibleResponse>builder()
                .success(true)
                .message("배너 노출 여부가 변경되었습니다")
                .data(response)
                .build();
    }
    
    @PatchMapping("/reorder")
    public ApiResponse<Void> reorderBanners(
            @Valid @RequestBody BannerReorderRequest request) {
        
        bannerService.reorderBanners(request.getBanners());
        
        return ApiResponse.<Void>builder()
                .success(true)
                .message("배너 정렬 순서가 변경되었���니다")
                .build();
    }
    
    @PostMapping("/{bannerId}/track")
    public ApiResponse<Void> trackBanner(
            @PathVariable String bannerId,
            @Valid @RequestBody BannerTrackRequest request) {
        
        bannerService.trackBanner(bannerId, request);
        
        return ApiResponse.<Void>builder()
                .success(true)
                .message("통계가 기록되었습니다")
                .build();
    }
}
```

### 8.2 팝업 컨트롤러 예시

```java
@RestController
@RequestMapping("/api/admin/popups")
@RequiredArgsConstructor
public class PopupController {
    
    private final PopupService popupService;
    
    @GetMapping
    public ApiResponse<Page<PopupResponse>> getPopups(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Boolean visible,
            @RequestParam(required = false) String channelCode) {
        
        Page<PopupResponse> popups = popupService.getPopups(
            page, size, visible, channelCode
        );
        
        return ApiResponse.<Page<PopupResponse>>builder()
                .success(true)
                .message("팝업 목록 조회 성공")
                .data(popups)
                .build();
    }
    
    @GetMapping("/{popupId}")
    public ApiResponse<PopupDetailResponse> getPopup(
            @PathVariable String popupId) {
        
        PopupDetailResponse popup = popupService.getPopupDetail(popupId);
        
        return ApiResponse.<PopupDetailResponse>builder()
                .success(true)
                .message("팝업 조회 성공")
                .data(popup)
                .build();
    }
    
    @PostMapping
    public ApiResponse<PopupDetailResponse> createPopup(
            @Valid @RequestBody PopupCreateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        PopupDetailResponse popup = popupService.createPopup(
            request, userDetails.getUsername()
        );
        
        return ApiResponse.<PopupDetailResponse>builder()
                .success(true)
                .message("팝업이 생성되었습니다")
                .data(popup)
                .build();
    }
    
    @PutMapping("/{popupId}")
    public ApiResponse<PopupDetailResponse> updatePopup(
            @PathVariable String popupId,
            @Valid @RequestBody PopupUpdateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        PopupDetailResponse popup = popupService.updatePopup(
            popupId, request, userDetails.getUsername()
        );
        
        return ApiResponse.<PopupDetailResponse>builder()
                .success(true)
                .message("팝업이 수정되었습니다")
                .data(popup)
                .build();
    }
    
    @DeleteMapping("/{popupId}")
    public ApiResponse<Void> deletePopup(@PathVariable String popupId) {
        popupService.deletePopup(popupId);
        
        return ApiResponse.<Void>builder()
                .success(true)
                .message("팝업이 삭제되었습니다")
                .build();
    }
    
    @PatchMapping("/{popupId}/visible")
    public ApiResponse<PopupVisibleResponse> toggleVisible(
            @PathVariable String popupId,
            @Valid @RequestBody PopupVisibleRequest request) {
        
        PopupVisibleResponse response = popupService.toggleVisible(
            popupId, request.isVisible()
        );
        
        return ApiResponse.<PopupVisibleResponse>builder()
                .success(true)
                .message("팝업 노출 여부가 변경되었습니다")
                .data(response)
                .build();
    }
    
    @PatchMapping("/reorder")
    public ApiResponse<Void> reorderPopups(
            @Valid @RequestBody PopupReorderRequest request) {
        
        popupService.reorderPopups(request.getPopups());
        
        return ApiResponse.<Void>builder()
                .success(true)
                .message("팝업 정렬 순서가 변경되었습니다")
                .build();
    }
    
    @PostMapping("/{popupId}/track")
    public ApiResponse<Void> trackPopup(
            @PathVariable String popupId,
            @Valid @RequestBody PopupTrackRequest request) {
        
        popupService.trackPopup(popupId, request);
        
        return ApiResponse.<Void>builder()
                .success(true)
                .message("통계가 기록되었습니다")
                .build();
    }
}
```

---

## 9. 참고 사항

1. **이미지 업로드**: 파일 업로드 API (`POST /api/uploads`)를 먼저 호출하여 이미지 URL을 받은 후, 배너/팝업 생성/수정 시 해당 URL을 사용합니다.

2. **채널 코드**: 채널 관리 시스템과 연동하여 유효한 채널 코드만 사용할 수 있습니다.

3. **날짜 형식**: 모든 날짜는 ISO 8601 형식 (`yyyy-MM-dd'T'HH:mm:ss'Z'`)을 사용합니다.

4. **페이징**: Spring Data JPA의 `Pageable`을 사용하며, 기본 페이지 크기는 20입니다.

5. **통계 수집**: 배너/팝업의 노출, 클릭 등의 통계는 비동기로 처리하여 사용자 경험에 영향을 주지 않도록 합니다.

6. **캐싱**: 배너/팝업 목록은 Redis 등을 사용하여 캐싱하면 성능이 향상됩니다. (TTL: 5분 권장)

7. **하이브리드 모드**: 프론트엔드에서 API 호출 실패 시 로컬 더미 데이터로 폴백합니다.
