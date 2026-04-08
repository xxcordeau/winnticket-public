# 팝업 관리 스키마

## 데이터베이스 테이블 구조

### 1. popups (팝업)

```sql
CREATE TABLE popups (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- 팝업 설정
    type VARCHAR(20) NOT NULL,                    -- IMAGE, HTML, IFRAME
    position VARCHAR(20) NOT NULL,                -- CENTER, TOP_LEFT, TOP_RIGHT, etc.
    image_url VARCHAR(500),
    image_url_mobile VARCHAR(500),
    html_content TEXT,
    iframe_url VARCHAR(500),
    
    -- 링크 설정
    link_url VARCHAR(500),
    link_target VARCHAR(10),                      -- _blank, _self
    
    -- 노출 설정
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    visible BOOLEAN DEFAULT true,
    display_order INT DEFAULT 0,
    
    -- 표시 조건
    show_condition VARCHAR(20) NOT NULL,          -- ALWAYS, FIRST_VISIT, ONCE_PER_DAY, etc.
    show_delay INT DEFAULT 0,                     -- 표시 지연 시간 (초)
    
    -- 통계
    view_count BIGINT DEFAULT 0,
    click_count BIGINT DEFAULT 0,
    close_count BIGINT DEFAULT 0,
    
    -- 팝업 크기 및 스타일
    width INT NOT NULL,
    height INT NOT NULL,
    mobile_width INT,
    mobile_height INT,
    
    -- 추가 옵션
    show_close_button BOOLEAN DEFAULT true,
    show_today_close_button BOOLEAN DEFAULT true,
    background_overlay BOOLEAN DEFAULT true,
    overlay_opacity DECIMAL(3,2) DEFAULT 0.50,    -- 0.00 ~ 1.00
    
    -- 메타데이터
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_visible (visible),
    INDEX idx_dates (start_date, end_date),
    INDEX idx_display_order (display_order)
);
```

### 2. popup_channels (팝업-채널 매핑)

```sql
CREATE TABLE popup_channels (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    popup_id VARCHAR(50) NOT NULL,
    channel_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (popup_id) REFERENCES popups(id) ON DELETE CASCADE,
    FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE,
    UNIQUE KEY unique_popup_channel (popup_id, channel_id),
    INDEX idx_channel (channel_id)
);
```

### 3. popup_pages (팝업-페이지 매핑)

```sql
CREATE TABLE popup_pages (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    popup_id VARCHAR(50) NOT NULL,
    page_path VARCHAR(200) NOT NULL,              -- home, product, category/{id}, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (popup_id) REFERENCES popups(id) ON DELETE CASCADE,
    UNIQUE KEY unique_popup_page (popup_id, page_path),
    INDEX idx_page (page_path)
);
```

### 4. popup_logs (팝업 로그)

```sql
CREATE TABLE popup_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    popup_id VARCHAR(50) NOT NULL,
    action VARCHAR(20) NOT NULL,                  -- VIEW, CLICK, CLOSE, TODAY_CLOSE
    channel_id VARCHAR(50),
    user_id VARCHAR(50),
    ip_address VARCHAR(45),
    user_agent TEXT,
    action_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (popup_id) REFERENCES popups(id) ON DELETE CASCADE,
    INDEX idx_popup (popup_id),
    INDEX idx_action (action),
    INDEX idx_action_at (action_at)
);
```

### 5. popup_user_preferences (사용자 팝업 설정)

```sql
CREATE TABLE popup_user_preferences (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    popup_id VARCHAR(50) NOT NULL,
    user_id VARCHAR(50),
    session_id VARCHAR(100),                      -- 비로그인 사용자용
    closed_until TIMESTAMP,                       -- "오늘 하루 보지 않기" 만료 시간
    never_show BOOLEAN DEFAULT false,             -- 다시 보지 않기
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (popup_id) REFERENCES popups(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_session (session_id),
    INDEX idx_closed_until (closed_until)
);
```

## Enum 타입

### PopupType (팝업 타입)
- `IMAGE`: 이미지 팝업
- `HTML`: HTML 팝업
- `IFRAME`: iframe 팝업

### PopupPosition (팝업 위치)
- `CENTER`: 화면 중앙
- `TOP_LEFT`: 좌측 상단
- `TOP_RIGHT`: 우측 상단
- `BOTTOM_LEFT`: 좌측 하단
- `BOTTOM_RIGHT`: 우측 하단

### PopupStatus (팝업 상태)
- `활성`: 현재 노출 중 (현재 시간이 시작일~종료일 사이 && visible=true)
- `예정`: 시작일 이전
- `만료`: 종료일 이후
- `비활성`: 수동 비활성화 (visible=false)

### PopupShowCondition (표시 조건)
- `ALWAYS`: 항상 표시
- `FIRST_VISIT`: 첫 방문 시만
- `ONCE_PER_DAY`: 하루에 한 번
- `ONCE_PER_SESSION`: 세션당 한 번
- `UNTIL_CLOSED`: 사용자가 닫을 때까지

### PopupLogAction (로그 액션)
- `VIEW`: 팝업 조회
- `CLICK`: 팝업 클릭
- `CLOSE`: 팝업 닫기
- `TODAY_CLOSE`: 오늘 하루 보지 않기

## 비즈니스 로직

### 팝업 상태 계산
```typescript
function calculatePopupStatus(popup: Popup): PopupStatus {
  const now = new Date();
  const startDate = new Date(popup.startDate);
  const endDate = new Date(popup.endDate);
  
  if (!popup.visible) return "비활성";
  if (now < startDate) return "예정";
  if (now > endDate) return "만료";
  return "활성";
}
```

### 팝업 노출 조건 체크
```typescript
function shouldShowPopup(
  popup: Popup,
  channelId: string,
  pagePath: string,
  userId?: string,
  sessionId?: string
): boolean {
  // 1. 기본 조건: visible, 날짜 범위
  const status = calculatePopupStatus(popup);
  if (status !== "활성") return false;
  
  // 2. 채널 조건
  if (popup.channelIds.length > 0 && !popup.channelIds.includes(channelId)) {
    return false;
  }
  
  // 3. 페이지 조건
  if (popup.showOnPages.length > 0 && !popup.showOnPages.includes(pagePath)) {
    return false;
  }
  
  // 4. 사용자 설정 확인
  const userPref = getUserPreference(popup.id, userId, sessionId);
  if (userPref) {
    if (userPref.neverShow) return false;
    if (userPref.closedUntil && new Date() < new Date(userPref.closedUntil)) {
      return false;
    }
  }
  
  // 5. 표시 조건 확인
  switch (popup.showCondition) {
    case "FIRST_VISIT":
      return !hasVisitedBefore(userId, sessionId);
    case "ONCE_PER_DAY":
      return !hasShownToday(popup.id, userId, sessionId);
    case "ONCE_PER_SESSION":
      return !hasShownThisSession(popup.id, sessionId);
    case "UNTIL_CLOSED":
      return !hasClosedInSession(popup.id, sessionId);
    default:
      return true;
  }
}
```

### 팝업 표시 순서
- `display_order` 오름차순
- 같은 `display_order`인 경우 `created_at` 오름차순

## 인덱스 전략

### 주요 조회 패턴
1. **활성 팝업 조회**: `visible` + `start_date` + `end_date`
2. **채널별 팝업 조회**: `popup_channels.channel_id` JOIN
3. **페이지별 팝업 조회**: `popup_pages.page_path` JOIN
4. **사용자 설정 조회**: `popup_user_preferences.user_id` or `session_id`

### 복합 인덱스
```sql
-- 활성 팝업 조회 최적화
CREATE INDEX idx_active_popups ON popups(visible, start_date, end_date, display_order);

-- 사용자 설정 조회 최적화
CREATE INDEX idx_user_prefs ON popup_user_preferences(popup_id, user_id, closed_until);
CREATE INDEX idx_session_prefs ON popup_user_preferences(popup_id, session_id, closed_until);

-- 통계 집계 최적화
CREATE INDEX idx_logs_stats ON popup_logs(popup_id, action, action_at);
```

## 데이터 보관 정책

### 로그 데이터
- **popup_logs**: 90일 보관 후 집계 테이블로 이관
- **popup_user_preferences**: 마지막 업데이트 후 1년 경과 시 삭제

### 집계 테이블
```sql
CREATE TABLE popup_stats_daily (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    popup_id VARCHAR(50) NOT NULL,
    channel_id VARCHAR(50),
    stats_date DATE NOT NULL,
    view_count BIGINT DEFAULT 0,
    click_count BIGINT DEFAULT 0,
    close_count BIGINT DEFAULT 0,
    today_close_count BIGINT DEFAULT 0,
    
    UNIQUE KEY unique_popup_date (popup_id, channel_id, stats_date),
    INDEX idx_stats_date (stats_date)
);
```

## 파티셔닝 전략

### 로그 테이블 월별 파티셔닝
```sql
ALTER TABLE popup_logs
PARTITION BY RANGE (YEAR(action_at) * 100 + MONTH(action_at)) (
    PARTITION p202401 VALUES LESS THAN (202402),
    PARTITION p202402 VALUES LESS THAN (202403),
    -- ...
    PARTITION p_future VALUES LESS THAN MAXVALUE
);
```

## 세션 관리

### 세션 ID 생성
```typescript
function generateSessionId(): string {
  // UUID v4 or custom implementation
  return crypto.randomUUID();
}
```

### 쿠키 저장
- **이름**: `popup_session_id`
- **유효기간**: 세션 쿠키 (브라우저 닫으면 삭제)
- **경로**: `/`
- **SameSite**: `Strict`

## 마이그레이션 스크립트

### V1: 초기 스키마 생성
```sql
-- 위의 CREATE TABLE 문들 실행
```

### V2: 사용자 설정 추가
```sql
-- popup_user_preferences 테이블 추가
```

### V3: 통계 최적화
```sql
-- 집계 테이블 추가
-- 복합 인덱스 추가
```

### V4: 파티셔닝 적용
```sql
-- 로그 테이블 파티셔닝
```
