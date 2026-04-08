# 배너 & 팝업 API 문서

## 목차
1. [배너 관리 API](#배너-관리-api)
2. [팝업 관리 API](#팝업-관리-api)
3. [쇼핑몰 배너 API](#쇼핑몰-배너-api)
4. [쇼핑몰 팝업 API](#쇼핑몰-팝업-api)
5. [통계 API](#통계-api)

---

## 공통 사항

### Base URL
```
https://api.winnticket.store/api
```

### 인증
- 관리자 API: JWT Bearer Token 필수
- 쇼핑몰 API: 인증 불필요

### 응답 형식
모든 API는 다음 형식으로 응답합니다:

```json
{
  "success": true,
  "message": "성공 메시지",
  "data": { /* 응답 데이터 */ }
}
```

### 에러 응답
```json
{
  "success": false,
  "message": "에러 메시지",
  "data": null
}
```

---

## 배너 관리 API

### 1. 배너 목록 조회

관리자가 배너 목록을 조회합니다.

**Endpoint**
```
GET /admin/banners
```

**Headers**
```
Authorization: Bearer {token}
```

**Query Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| status | string | N | 상태 필터 (활성, 예정, 만료, 비활성) |
| position | string | N | 위치 필터 (MAIN_TOP, MAIN_MIDDLE 등) |
| type | string | N | 타입 필터 (IMAGE, HTML, VIDEO) |
| channelId | string | N | 채널 ID 필터 |
| visible | boolean | N | 노출 여부 필터 |
| keyword | string | N | 검색 키워드 (이름, 설명) |
| page | number | N | 페이지 번호 (0부터 시작, 기본값: 0) |
| size | number | N | 페이지 크기 (기본값: 20) |
| sort | string | N | 정렬 기준 (예: displayOrder,asc) |

**Response**
```json
{
  "success": true,
  "message": null,
  "data": {
    "content": [
      {
        "id": "BANNER_abc123",
        "name": "메인 배너 1",
        "description": "신규 상품 홍보 배너",
        "type": "IMAGE",
        "position": "MAIN_TOP",
        "imageUrl": "https://cdn.example.com/banner1.jpg",
        "imageUrlMobile": "https://cdn.example.com/banner1-mobile.jpg",
        "htmlContent": null,
        "videoUrl": null,
        "clickAction": "LINK",
        "linkUrl": "https://winnticket.store/products/123",
        "linkTarget": "_blank",
        "startDate": "2025-01-01T00:00:00",
        "endDate": "2025-12-31T23:59:59",
        "visible": true,
        "displayOrder": 1,
        "channelIds": ["CHANNEL_001", "CHANNEL_002"],
        "viewCount": 15000,
        "clickCount": 450,
        "width": 1200,
        "height": 400,
        "mobileWidth": 800,
        "mobileHeight": 300,
        "status": "활성",
        "createdBy": "admin",
        "updatedBy": "admin",
        "createdAt": "2024-12-01T10:00:00",
        "updatedAt": "2024-12-20T15:30:00"
      }
    ],
    "pageable": {
      "pageNumber": 0,
      "pageSize": 20
    },
    "totalElements": 50,
    "totalPages": 3
  }
}
```

### 2. 배너 상세 조회

**Endpoint**
```
GET /admin/banners/{id}
```

**Headers**
```
Authorization: Bearer {token}
```

**Path Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| id | string | Y | 배너 ID |

**Response**
```json
{
  "success": true,
  "message": null,
  "data": {
    "id": "BANNER_abc123",
    "name": "메인 배너 1",
    // ... (배너 목록 조회와 동일한 필드)
  }
}
```

### 3. 배너 생성

**Endpoint**
```
POST /admin/banners
```

**Headers**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body**
```json
{
  "name": "신규 배너",
  "description": "크리스마스 프로모션 배너",
  "type": "IMAGE",
  "position": "MAIN_TOP",
  "imageUrl": "https://cdn.example.com/xmas-banner.jpg",
  "imageUrlMobile": "https://cdn.example.com/xmas-banner-mobile.jpg",
  "clickAction": "LINK",
  "linkUrl": "https://winnticket.store/events/xmas",
  "linkTarget": "_self",
  "startDate": "2025-12-20T00:00:00",
  "endDate": "2025-12-26T23:59:59",
  "visible": true,
  "displayOrder": 1,
  "channelIds": ["CHANNEL_001"],
  "width": 1200,
  "height": 400,
  "mobileWidth": 800,
  "mobileHeight": 300
}
```

**Validation**
- `name`: 필수, 최대 200자
- `type`: 필수, IMAGE | HTML | VIDEO
- `position`: 필수
- `imageUrl`: type이 IMAGE일 때 필수
- `startDate`: 필수
- `endDate`: 필수, startDate 이후
- `displayOrder`: 0 이상
- `width`, `height`: 양수

**Response**
```json
{
  "success": true,
  "message": "배너가 생성되었습니다.",
  "data": {
    "id": "BANNER_xyz789",
    // ... (생성된 배너 정보)
  }
}
```

### 4. 배너 수정

**Endpoint**
```
PUT /admin/banners/{id}
```

**Headers**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Path Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| id | string | Y | 배너 ID |

**Request Body**
```json
{
  "name": "수정된 배너명",
  "visible": false,
  "displayOrder": 5
  // ... 수정할 필드만 포함
}
```

**Response**
```json
{
  "success": true,
  "message": "배너가 수정되었습니다.",
  "data": {
    // ... (수정된 배너 정보)
  }
}
```

### 5. 배너 삭제

**Endpoint**
```
DELETE /admin/banners/{id}
```

**Headers**
```
Authorization: Bearer {token}
```

**Path Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| id | string | Y | 배너 ID |

**Response**
```json
{
  "success": true,
  "message": "배너가 삭제되었습니다.",
  "data": null
}
```

---

## 팝업 관리 API

### 1. 팝업 목록 조회

**Endpoint**
```
GET /admin/popups
```

**Headers**
```
Authorization: Bearer {token}
```

**Query Parameters**
배너와 동일한 필터링 파라미터 지원

**Response**
```json
{
  "success": true,
  "message": null,
  "data": {
    "content": [
      {
        "id": "POPUP_abc123",
        "name": "이벤트 팝업",
        "description": "신년 이벤트 안내",
        "type": "IMAGE",
        "position": "CENTER",
        "imageUrl": "https://cdn.example.com/popup1.jpg",
        "imageUrlMobile": "https://cdn.example.com/popup1-mobile.jpg",
        "htmlContent": null,
        "iframeUrl": null,
        "linkUrl": "https://winnticket.store/events/newyear",
        "linkTarget": "_blank",
        "startDate": "2025-01-01T00:00:00",
        "endDate": "2025-01-07T23:59:59",
        "visible": true,
        "displayOrder": 1,
        "showCondition": "ONCE_PER_DAY",
        "showDelay": 3,
        "channelIds": ["CHANNEL_001"],
        "showOnPages": ["home", "category"],
        "viewCount": 5000,
        "clickCount": 300,
        "closeCount": 4500,
        "width": 600,
        "height": 800,
        "mobileWidth": 400,
        "mobileHeight": 600,
        "showCloseButton": true,
        "showTodayCloseButton": true,
        "backgroundOverlay": true,
        "overlayOpacity": 0.5,
        "status": "활성",
        "createdBy": "admin",
        "updatedBy": "admin",
        "createdAt": "2024-12-15T10:00:00",
        "updatedAt": "2024-12-20T15:30:00"
      }
    ],
    "pageable": {
      "pageNumber": 0,
      "pageSize": 20
    },
    "totalElements": 10,
    "totalPages": 1
  }
}
```

### 2. 팝업 생성

**Endpoint**
```
POST /admin/popups
```

**Headers**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body**
```json
{
  "name": "신규 팝업",
  "description": "겨울 세일 안내",
  "type": "IMAGE",
  "position": "CENTER",
  "imageUrl": "https://cdn.example.com/winter-sale.jpg",
  "linkUrl": "https://winnticket.store/sales/winter",
  "startDate": "2025-12-01T00:00:00",
  "endDate": "2025-12-31T23:59:59",
  "visible": true,
  "displayOrder": 1,
  "showCondition": "ONCE_PER_DAY",
  "showDelay": 5,
  "channelIds": ["CHANNEL_001", "CHANNEL_002"],
  "showOnPages": ["home"],
  "width": 600,
  "height": 800,
  "showCloseButton": true,
  "showTodayCloseButton": true,
  "backgroundOverlay": true,
  "overlayOpacity": 0.7
}
```

**Validation**
- `name`: 필수, 최대 200자
- `type`: 필수, IMAGE | HTML | IFRAME
- `position`: 필수
- `showCondition`: 필수
- `showDelay`: 0 이상
- `overlayOpacity`: 0.0 ~ 1.0

**Response**
```json
{
  "success": true,
  "message": "팝업이 생성되었습니다.",
  "data": {
    // ... (생성된 팝업 정보)
  }
}
```

### 3. 팝업 수정, 삭제

배너 API와 동일한 패턴

---

## 쇼핑몰 배너 API

### 1. 배너 조회

쇼핑몰에서 특정 위치의 활성 배너를 조회합니다.

**Endpoint**
```
GET /shop/banners
```

**Query Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| position | string | Y | 배너 위치 (MAIN_TOP, MAIN_MIDDLE 등) |
| channelId | string | N | 채널 ID (없으면 모든 채널) |

**Example**
```
GET /shop/banners?position=MAIN_TOP&channelId=CHANNEL_001
```

**Response**
```json
{
  "success": true,
  "message": null,
  "data": [
    {
      "id": "BANNER_abc123",
      "name": "메인 배너 1",
      "type": "IMAGE",
      "position": "MAIN_TOP",
      "imageUrl": "https://cdn.example.com/banner1.jpg",
      "imageUrlMobile": "https://cdn.example.com/banner1-mobile.jpg",
      "clickAction": "LINK",
      "linkUrl": "https://winnticket.store/products/123",
      "linkTarget": "_blank",
      "width": 1200,
      "height": 400,
      "mobileWidth": 800,
      "mobileHeight": 300,
      "displayOrder": 1
    }
  ]
}
```

### 2. 배너 조회수 기록

**Endpoint**
```
POST /shop/banners/{id}/view
```

**Path Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| id | string | Y | 배너 ID |

**Response**
```json
{
  "success": true,
  "message": null,
  "data": null
}
```

### 3. 배너 클릭 기록

**Endpoint**
```
POST /shop/banners/{id}/click
```

**Path Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| id | string | Y | 배너 ID |

**Query Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| channelId | string | N | 채널 ID |

**Response**
```json
{
  "success": true,
  "message": null,
  "data": null
}
```

---

## 쇼핑몰 팝업 API

### 1. 팝업 조회

쇼핑몰에서 표시할 팝업을 조회합니다. 사용자 설정을 고려합니다.

**Endpoint**
```
GET /shop/popups
```

**Query Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| channelId | string | N | 채널 ID |
| pagePath | string | Y | 현재 페이지 경로 (home, product, category 등) |
| sessionId | string | Y | 세션 ID (쿠키에서 가져옴) |

**Example**
```
GET /shop/popups?channelId=CHANNEL_001&pagePath=home&sessionId=sess_abc123
```

**Response**
```json
{
  "success": true,
  "message": null,
  "data": [
    {
      "id": "POPUP_abc123",
      "name": "이벤트 팝업",
      "type": "IMAGE",
      "position": "CENTER",
      "imageUrl": "https://cdn.example.com/popup1.jpg",
      "imageUrlMobile": "https://cdn.example.com/popup1-mobile.jpg",
      "linkUrl": "https://winnticket.store/events/newyear",
      "linkTarget": "_blank",
      "width": 600,
      "height": 800,
      "mobileWidth": 400,
      "mobileHeight": 600,
      "showCloseButton": true,
      "showTodayCloseButton": true,
      "backgroundOverlay": true,
      "overlayOpacity": 0.5,
      "showDelay": 3,
      "displayOrder": 1
    }
  ]
}
```

### 2. 팝업 조회수 기록

**Endpoint**
```
POST /shop/popups/{id}/view
```

**Path Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| id | string | Y | 팝업 ID |

**Query Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| sessionId | string | Y | 세션 ID |
| channelId | string | N | 채널 ID |

**Response**
```json
{
  "success": true,
  "message": null,
  "data": null
}
```

### 3. 팝업 클릭 기록

**Endpoint**
```
POST /shop/popups/{id}/click
```

**Path Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| id | string | Y | 팝업 ID |

**Query Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| sessionId | string | Y | 세션 ID |
| channelId | string | N | 채널 ID |

**Response**
```json
{
  "success": true,
  "message": null,
  "data": null
}
```

### 4. 팝업 닫기 기록

**Endpoint**
```
POST /shop/popups/{id}/close
```

**Path Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| id | string | Y | 팝업 ID |

**Query Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| sessionId | string | Y | 세션 ID |
| channelId | string | N | 채널 ID |

**Response**
```json
{
  "success": true,
  "message": null,
  "data": null
}
```

### 5. "오늘 하루 보지 않기" 설정

**Endpoint**
```
POST /shop/popups/{id}/today-close
```

**Path Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| id | string | Y | 팝업 ID |

**Query Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| sessionId | string | Y | 세션 ID |

**Response**
```json
{
  "success": true,
  "message": "오늘 하루 보지 않기 설정이 완료되었습니다.",
  "data": null
}
```

---

## 통계 API

### 1. 배너 통계 조회

**Endpoint**
```
GET /admin/banners/{id}/stats
```

**Headers**
```
Authorization: Bearer {token}
```

**Path Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| id | string | Y | 배너 ID |

**Query Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| startDate | string | Y | 시작일 (YYYY-MM-DD) |
| endDate | string | Y | 종료일 (YYYY-MM-DD) |

**Example**
```
GET /admin/banners/BANNER_abc123/stats?startDate=2025-01-01&endDate=2025-01-31
```

**Response**
```json
{
  "success": true,
  "message": null,
  "data": {
    "bannerId": "BANNER_abc123",
    "totalViews": 45000,
    "totalClicks": 1350,
    "clickRate": 3.0,
    "viewsByDate": [
      {
        "date": "2025-01-01",
        "views": 1500,
        "clicks": 45
      },
      {
        "date": "2025-01-02",
        "views": 1600,
        "clicks": 50
      }
      // ...
    ],
    "viewsByChannel": [
      {
        "channelId": "CHANNEL_001",
        "channelName": "메인 채널",
        "views": 30000,
        "clicks": 900
      },
      {
        "channelId": "CHANNEL_002",
        "channelName": "파트너 채널",
        "views": 15000,
        "clicks": 450
      }
    ]
  }
}
```

### 2. 팝업 통계 조회

**Endpoint**
```
GET /admin/popups/{id}/stats
```

배너 통계 조회와 유사하며, 추가로 `closeCount`, `closeRate` 포함

**Response**
```json
{
  "success": true,
  "message": null,
  "data": {
    "popupId": "POPUP_abc123",
    "totalViews": 10000,
    "totalClicks": 500,
    "totalCloses": 9000,
    "clickRate": 5.0,
    "closeRate": 90.0,
    "viewsByDate": [
      {
        "date": "2025-01-01",
        "views": 500,
        "clicks": 25,
        "closes": 450
      }
      // ...
    ],
    "viewsByChannel": [
      // ...
    ]
  }
}
```

---

## 에러 코드

| HTTP 상태 | 코드 | 메시지 | 설명 |
|-----------|------|--------|------|
| 400 | BAD_REQUEST | 잘못된 요청입니다. | 요청 파라미터 누락 또는 형식 오류 |
| 401 | UNAUTHORIZED | 인증이 필요합니다. | JWT 토큰 없음 또는 만료 |
| 403 | FORBIDDEN | 접근 권한이 없습니다. | 권한 부족 |
| 404 | NOT_FOUND | 리소스를 찾을 수 없습니다. | 배너/팝업 ID 없음 |
| 409 | CONFLICT | 중복된 데이터입니다. | 이미 존재하는 데이터 |
| 500 | INTERNAL_SERVER_ERROR | 서버 오류가 발생했습니다. | 서버 내부 오류 |

---

## 사용 예시

### 프론트엔드 구현 예시

#### 배너 표시
```typescript
// 배너 조회
const response = await fetch(
  `/api/shop/banners?position=MAIN_TOP&channelId=${channelId}`
);
const { data: banners } = await response.json();

// 배너 표시
banners.forEach(banner => {
  displayBanner(banner);
  
  // 조회수 기록
  fetch(`/api/shop/banners/${banner.id}/view`, { method: 'POST' });
});

// 배너 클릭 시
function handleBannerClick(bannerId) {
  // 클릭수 기록
  fetch(`/api/shop/banners/${bannerId}/click`, { method: 'POST' });
  
  // 링크 이동
  // ...
}
```

#### 팝업 표시
```typescript
// 세션 ID 가져오기 (없으면 생성)
let sessionId = getCookie('popup_session_id');
if (!sessionId) {
  sessionId = generateSessionId();
  setCookie('popup_session_id', sessionId);
}

// 팝업 조회
const response = await fetch(
  `/api/shop/popups?channelId=${channelId}&pagePath=${pagePath}&sessionId=${sessionId}`
);
const { data: popups } = await response.json();

// 팝업 표시
popups.forEach(popup => {
  setTimeout(() => {
    displayPopup(popup);
    
    // 조회수 기록
    fetch(
      `/api/shop/popups/${popup.id}/view?sessionId=${sessionId}`,
      { method: 'POST' }
    );
  }, popup.showDelay * 1000);
});

// "오늘 하루 보지 않기" 클릭 시
function handleTodayClose(popupId) {
  fetch(
    `/api/shop/popups/${popupId}/today-close?sessionId=${sessionId}`,
    { method: 'POST' }
  );
  closePopup(popupId);
}
```

---

## 변경 이력

### v1.0.0 (2025-01-01)
- 초기 API 문서 작성
- 배너 관리 API
- 팝업 관리 API
- 통계 API
