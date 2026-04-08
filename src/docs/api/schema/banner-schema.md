# 배너 관리 스키마

## 데이터베이스 테이블 구조

### 1. banners (배너)

```sql
CREATE TABLE banners (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- 배너 설정
    type VARCHAR(20) NOT NULL,                    -- IMAGE, HTML, VIDEO
    position VARCHAR(50) NOT NULL,                -- MAIN_TOP, MAIN_MIDDLE, MAIN_BOTTOM, etc.
    image_url VARCHAR(500),
    image_url_mobile VARCHAR(500),
    html_content TEXT,
    video_url VARCHAR(500),
    
    -- 클릭 동작
    click_action VARCHAR(20) NOT NULL,            -- LINK, POPUP, NONE
    link_url VARCHAR(500),
    link_target VARCHAR(10),                      -- _blank, _self
    
    -- 노출 설정
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    visible BOOLEAN DEFAULT true,
    display_order INT DEFAULT 0,
    
    -- 통계
    view_count BIGINT DEFAULT 0,
    click_count BIGINT DEFAULT 0,
    
    -- 반응형 설정
    width INT,
    height INT,
    mobile_width INT,
    mobile_height INT,
    
    -- 메타데이터
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_position (position),
    INDEX idx_visible (visible),
    INDEX idx_dates (start_date, end_date),
    INDEX idx_display_order (display_order)
);
```

### 2. banner_channels (배너-채널 매핑)

```sql
CREATE TABLE banner_channels (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    banner_id VARCHAR(50) NOT NULL,
    channel_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (banner_id) REFERENCES banners(id) ON DELETE CASCADE,
    FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE,
    UNIQUE KEY unique_banner_channel (banner_id, channel_id),
    INDEX idx_channel (channel_id)
);
```

### 3. banner_click_logs (배너 클릭 로그)

```sql
CREATE TABLE banner_click_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    banner_id VARCHAR(50) NOT NULL,
    channel_id VARCHAR(50),
    user_id VARCHAR(50),
    ip_address VARCHAR(45),
    user_agent TEXT,
    clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (banner_id) REFERENCES banners(id) ON DELETE CASCADE,
    INDEX idx_banner (banner_id),
    INDEX idx_clicked_at (clicked_at)
);
```

### 4. banner_view_logs (배너 조회 로그)

```sql
CREATE TABLE banner_view_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    banner_id VARCHAR(50) NOT NULL,
    channel_id VARCHAR(50),
    user_id VARCHAR(50),
    ip_address VARCHAR(45),
    user_agent TEXT,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (banner_id) REFERENCES banners(id) ON DELETE CASCADE,
    INDEX idx_banner (banner_id),
    INDEX idx_viewed_at (viewed_at)
);
```

## Enum 타입

### BannerType (배너 타입)
- `IMAGE`: 이미지 배너
- `HTML`: HTML 배너
- `VIDEO`: 비디오 배너

### BannerPosition (배너 위치)
- `MAIN_TOP`: 메인 페이지 최상단
- `MAIN_MIDDLE`: 메인 페이지 중간
- `MAIN_BOTTOM`: 메인 페이지 하단
- `CATEGORY_TOP`: 카테고리 페이지 상단
- `PRODUCT_DETAIL`: 상품 상세 페이지
- `SIDEBAR`: 사이드바
- `FOOTER`: 푸터

### BannerStatus (배너 상태)
- `활성`: 현재 노출 중 (현재 시간이 시작일~종료일 사이 && visible=true)
- `예정`: 시작일 이전
- `만료`: 종료일 이후
- `비활성`: 수동 비활성화 (visible=false)

### BannerClickAction (클릭 동작)
- `LINK`: 링크 이동
- `POPUP`: 팝업 열기
- `NONE`: 동작 없음

## 비즈니스 로직

### 배너 상태 계산
```typescript
function calculateBannerStatus(banner: Banner): BannerStatus {
  const now = new Date();
  const startDate = new Date(banner.startDate);
  const endDate = new Date(banner.endDate);
  
  if (!banner.visible) return "비활성";
  if (now < startDate) return "예정";
  if (now > endDate) return "만료";
  return "활성";
}
```

### 배너 노출 조건
- `visible = true`
- 현재 시간이 `start_date`와 `end_date` 사이
- 요청한 채널이 `banner_channels`에 포함되거나 채널 매핑이 없는 경우 (모든 채널)

### 배너 표시 순서
- `display_order` 오름차순
- 같은 `display_order`인 경우 `created_at` 오름차순

## 인덱스 전략

### 주요 조회 패턴
1. **위치별 배너 조회**: `position` + `visible` + `start_date` + `end_date`
2. **채널별 배너 조회**: `banner_channels.channel_id` JOIN
3. **통계 집계**: `banner_click_logs.banner_id` + `clicked_at`

### 복합 인덱스
```sql
-- 활성 배너 조회 최적화
CREATE INDEX idx_active_banners ON banners(position, visible, start_date, end_date, display_order);

-- 통계 집계 최적화
CREATE INDEX idx_logs_stats ON banner_click_logs(banner_id, clicked_at);
CREATE INDEX idx_view_stats ON banner_view_logs(banner_id, viewed_at);
```

## 데이터 보관 정책

### 로그 데이터
- **banner_click_logs**: 90일 보관 후 집계 테이블로 이관
- **banner_view_logs**: 90일 보관 후 집계 테이블로 이관

### 집계 테이블
```sql
CREATE TABLE banner_stats_daily (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    banner_id VARCHAR(50) NOT NULL,
    channel_id VARCHAR(50),
    stats_date DATE NOT NULL,
    view_count BIGINT DEFAULT 0,
    click_count BIGINT DEFAULT 0,
    
    UNIQUE KEY unique_banner_date (banner_id, channel_id, stats_date),
    INDEX idx_stats_date (stats_date)
);
```

## 파티셔닝 전략

### 로그 테이블 월별 파티셔닝
```sql
ALTER TABLE banner_click_logs
PARTITION BY RANGE (YEAR(clicked_at) * 100 + MONTH(clicked_at)) (
    PARTITION p202401 VALUES LESS THAN (202402),
    PARTITION p202402 VALUES LESS THAN (202403),
    -- ...
    PARTITION p_future VALUES LESS THAN MAXVALUE
);
```

## 마이그레이션 스크립트

### V1: 초기 스키마 생성
```sql
-- 위의 CREATE TABLE 문들 실행
```

### V2: 통계 최적화
```sql
-- 집계 테이블 추가
-- 복합 인덱스 추가
```

### V3: 파티셔닝 적용
```sql
-- 로그 테이블 파티셔닝
```
