# 티켓 판매 ERP 시스템 데이터베이스 스키마

## 환경 정보

- **데이터베이스**: PostgreSQL 18
- **백엔드**: Spring Boot 3.5.7
- **JDK**: 17

## 목차

1. [공통 사항](#공통-사항)
2. [메뉴 카테고리 관리](#1-메뉴-카테고리-관리)
3. [상품 관리](#2-상품-관리)
4. [파트너 관리](#3-파트너-관리)
5. [권한 및 역할 관리](#4-권한-및-역할-관리)
6. [관리자 메뉴 관리](#5-관리자-메뉴-관리)
7. [주문 관리](#6-주문-관리)
8. [커뮤니티 관리](#7-커뮤니티-관리)
9. [쿠폰 관리](#8-쿠폰-관리)
10. [채널 관리](#9-채널-관리)
11. [인덱스 전략](#인덱스-전략)
12. [스키마 초기화](#스키마-초기화)
13. [ERD 관계도](#erd-관계도)

---

## 공통 사항

### 타임스탬프

모든 테이블은 다음 컬럼을 포함합니다:

```sql
created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
```

### UUID vs BIGINT

- 외부 노출용 엔티티(상품, 파트너 등): `VARCHAR(36)` UUID 사용
- 내부 관리용 엔티티(권한, 역할 등): `BIGINT` AUTO_INCREMENT 사용

### 공통 Enum 타입 정의

```sql
-- 활성화 상태
CREATE TYPE active_status AS ENUM ('ACTIVE', 'INACTIVE');

-- 노출 여부
CREATE TYPE visibility_status AS ENUM ('VISIBLE', 'HIDDEN');
```

---

## 1. 메뉴 카테고리 관리

### 1.1 menu_categories (메뉴 카테고리)

쇼핑몰 상품 카테고리를 관리하는 테이블입니다.

```sql
CREATE TABLE menu_categories (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    level SMALLINT NOT NULL CHECK (level IN (1, 2)),
    parent_id VARCHAR(36),
    display_order INTEGER NOT NULL DEFAULT 0,
    visible BOOLEAN NOT NULL DEFAULT true,
    icon_url VARCHAR(500),
    route_path VARCHAR(200),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_menu_category_parent
        FOREIGN KEY (parent_id)
        REFERENCES menu_categories(id)
        ON DELETE CASCADE,

    CONSTRAINT check_parent_level
        CHECK (
            (level = 1 AND parent_id IS NULL) OR
            (level = 2 AND parent_id IS NOT NULL)
        )
);

CREATE INDEX idx_menu_categories_parent ON menu_categories(parent_id);
CREATE INDEX idx_menu_categories_visible ON menu_categories(visible, display_order);
CREATE INDEX idx_menu_categories_code ON menu_categories(code);

COMMENT ON TABLE menu_categories IS '쇼핑몰 메뉴 카테고리 (2단계 계층구조)';
COMMENT ON COLUMN menu_categories.level IS '1: 상위메뉴, 2: 하위메뉴';
COMMENT ON COLUMN menu_categories.display_order IS '정렬 순서 (낮을수록 먼저 표시)';
```

**주요 특징:**

- 최대 2단계 계층 구조 (상위/하위 카테고리)
- 콘서트, 뮤지컬, 스포츠, 전시, 클래식 등의 티켓 카테고리
- 라우팅 경로 지원으로 프론트엔드 연동 용이

---

## 2. 상품 관리

### 2.1 products (상품)

티켓 및 입장권 정보를 관리하는 핵심 테이블입니다.

```sql
CREATE TYPE sales_status AS ENUM ('준비중', '판매중', '품절', '판매중단');

CREATE TABLE products (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    category_id VARCHAR(36) NOT NULL,
    partner_id VARCHAR(36),
    price INTEGER NOT NULL CHECK (price >= 0),
    discount_price INTEGER CHECK (discount_price >= 0 AND discount_price <= price),
    sales_status sales_status NOT NULL DEFAULT '준비중',
    sales_start_date DATE,
    sales_end_date DATE,
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    description TEXT,
    image_url VARCHAR(1000),
    detail_images JSONB,
    detail_content TEXT,
    visible BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_product_category
        FOREIGN KEY (category_id)
        REFERENCES menu_categories(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_product_partner
        FOREIGN KEY (partner_id)
        REFERENCES partners(id)
        ON DELETE SET NULL,

    CONSTRAINT check_sales_dates
        CHECK (
            sales_end_date IS NULL OR
            sales_start_date IS NULL OR
            sales_end_date >= sales_start_date
        )
);

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_partner ON products(partner_id);
CREATE INDEX idx_products_status ON products(sales_status, visible);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_sales_date ON products(sales_start_date, sales_end_date);
CREATE INDEX idx_products_code ON products(code);
CREATE INDEX idx_products_display_order ON products(display_order);

-- JSONB 인덱스
CREATE INDEX idx_products_detail_images ON products USING GIN (detail_images);

COMMENT ON TABLE products IS '티켓 및 입장권 상품 정보';
COMMENT ON COLUMN products.code IS '상품 코드 (예: P2025001)';
COMMENT ON COLUMN products.detail_images IS '상세 이미지 URL 배열 (JSONB)';
COMMENT ON COLUMN products.detail_content IS '상품 상세 설명 (HTML/Markdown)';
COMMENT ON COLUMN products.stock IS '재고 수량';
```

### 2.2 product_options (상품 옵션)

상품별 선택 옵션을 관리합니다.

```sql
CREATE TABLE product_options (
    id VARCHAR(36) PRIMARY KEY,
    product_id VARCHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    required BOOLEAN NOT NULL DEFAULT false,
    display_order INTEGER NOT NULL DEFAULT 0,
    visible BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_product_option_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE,

    CONSTRAINT uk_product_option_code
        UNIQUE (product_id, code)
);

CREATE INDEX idx_product_options_product ON product_options(product_id);
CREATE INDEX idx_product_options_visible ON product_options(visible, display_order);

COMMENT ON TABLE product_options IS '상품 옵션 (예: 좌석 등급, 날짜)';
COMMENT ON COLUMN product_options.name IS '옵션명 (예: 좌석등급, 관람일)';
COMMENT ON COLUMN product_options.required IS '필수 선택 여부';
```

### 2.3 product_option_values (상품 옵션 값)

각 옵션의 선택 가능한 값들을 관리합니다.

```sql
CREATE TABLE product_option_values (
    id VARCHAR(36) PRIMARY KEY,
    option_id VARCHAR(36) NOT NULL,
    value VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    additional_price INTEGER NOT NULL DEFAULT 0,
    display_order INTEGER NOT NULL DEFAULT 0,
    visible BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_option_value_option
        FOREIGN KEY (option_id)
        REFERENCES product_options(id)
        ON DELETE CASCADE,

    CONSTRAINT uk_option_value_code
        UNIQUE (option_id, code)
);

CREATE INDEX idx_product_option_values_option ON product_option_values(option_id);
CREATE INDEX idx_product_option_values_visible ON product_option_values(visible, display_order);

COMMENT ON TABLE product_option_values IS '상품 옵션 선택값';
COMMENT ON COLUMN product_option_values.value IS '옵션값 (예: VIP석, R석, S석)';
COMMENT ON COLUMN product_option_values.additional_price IS '추가 금액';
```

### 2.4 product_partner_discounts (파트너별 상품 할인)

파트너별 상품 할인 정책을 관리합니다.

```sql
CREATE TYPE partner_discount_status AS ENUM ('활성', '비활성', '만료', '예정');

CREATE TABLE product_partner_discounts (
    id VARCHAR(36) PRIMARY KEY,
    product_id VARCHAR(36) NOT NULL,
    partner_id VARCHAR(36) NOT NULL,
    discount_rate DECIMAL(5,2) NOT NULL CHECK (discount_rate >= 0 AND discount_rate <= 100),
    sale_price INTEGER NOT NULL CHECK (sale_price >= 0),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status partner_discount_status NOT NULL DEFAULT '비활성',
    visible BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_partner_discount_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_partner_discount_partner
        FOREIGN KEY (partner_id)
        REFERENCES partners(id)
        ON DELETE CASCADE,

    CONSTRAINT uk_product_partner_period
        UNIQUE (product_id, partner_id, start_date, end_date),

    CONSTRAINT check_discount_dates
        CHECK (end_date >= start_date)
);

CREATE INDEX idx_partner_discounts_product ON product_partner_discounts(product_id);
CREATE INDEX idx_partner_discounts_partner ON product_partner_discounts(partner_id);
CREATE INDEX idx_partner_discounts_status ON product_partner_discounts(status, visible);
CREATE INDEX idx_partner_discounts_dates ON product_partner_discounts(start_date, end_date);

COMMENT ON TABLE product_partner_discounts IS '파트너별 상품 할인 정책';
COMMENT ON COLUMN product_partner_discounts.discount_rate IS '할인율 (%)';
COMMENT ON COLUMN product_partner_discounts.sale_price IS '판매가 (자동 계산)';
```

---

## 3. 파트너 관리

### 3.1 partners (파트너)

티켓 공급 파트너(공연장, 주최사, 프로모터 등)를 관리합니다.

```sql
CREATE TYPE partner_status AS ENUM ('활성', '비활성', '대기중', '정지');
CREATE TYPE partner_type AS ENUM ('공연장', '주최사', '기획사', '아티스트', '기업');

CREATE TABLE partners (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    type partner_type NOT NULL,
    status partner_status NOT NULL DEFAULT '대기중',

    -- 담당자 정보
    manager_name VARCHAR(100) NOT NULL,
    manager_email VARCHAR(200) NOT NULL,
    manager_phone VARCHAR(20) NOT NULL,

    -- 계약 정보
    contract_start_date DATE NOT NULL,
    contract_end_date DATE NOT NULL,
    commission_rate DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (commission_rate >= 0 AND commission_rate <= 100),

    -- 통계 (비정규화)
    product_count INTEGER NOT NULL DEFAULT 0,
    last_order_date TIMESTAMP,
    total_sales BIGINT NOT NULL DEFAULT 0,
    total_orders INTEGER NOT NULL DEFAULT 0,

    -- 기본 정보
    business_number VARCHAR(20),
    address TEXT,
    description TEXT,
    logo_url VARCHAR(1000),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT check_contract_dates
        CHECK (contract_end_date >= contract_start_date)
);

CREATE INDEX idx_partners_status ON partners(status);
CREATE INDEX idx_partners_type ON partners(type);
CREATE INDEX idx_partners_code ON partners(code);
CREATE INDEX idx_partners_contract_end ON partners(contract_end_date);
CREATE INDEX idx_partners_manager_email ON partners(manager_email);

COMMENT ON TABLE partners IS '티켓 공급 파트너 (공연장, 주최사 등)';
COMMENT ON COLUMN partners.commission_rate IS '수수료율 (%)';
COMMENT ON COLUMN partners.product_count IS '등록 상품 수 (캐시)';
COMMENT ON COLUMN partners.total_sales IS '총 매출액 (캐시)';
```

### 3.2 partner_discount_policies (파트너 할인 정책)

파트너의 전반적인 할인 정책을 관리합니다.

```sql
CREATE TYPE discount_type AS ENUM ('퍼센트', '고정금액', '묶음할인');

CREATE TABLE partner_discount_policies (
    id VARCHAR(36) PRIMARY KEY,
    partner_id VARCHAR(36) NOT NULL,
    name VARCHAR(200) NOT NULL,
    type discount_type NOT NULL,
    discount_value INTEGER NOT NULL CHECK (discount_value >= 0),
    min_purchase_amount INTEGER CHECK (min_purchase_amount >= 0),
    max_discount_amount INTEGER CHECK (max_discount_amount >= 0),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_discount_policy_partner
        FOREIGN KEY (partner_id)
        REFERENCES partners(id)
        ON DELETE CASCADE,

    CONSTRAINT check_policy_dates
        CHECK (end_date >= start_date)
);

CREATE INDEX idx_partner_policies_partner ON partner_discount_policies(partner_id);
CREATE INDEX idx_partner_policies_active ON partner_discount_policies(is_active, start_date, end_date);

COMMENT ON TABLE partner_discount_policies IS '파트너별 할인 정책';
COMMENT ON COLUMN partner_discount_policies.discount_value IS '할인값 (% 또는 금액)';
```

### 3.3 partner_products (파트너 적용 상품)

파트너가 공급하는 상품과 판매 통계를 관리합니다.

```sql
CREATE TABLE partner_products (
    id VARCHAR(36) PRIMARY KEY,
    partner_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    sales_count INTEGER NOT NULL DEFAULT 0,
    revenue BIGINT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    registered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_partner_product_partner
        FOREIGN KEY (partner_id)
        REFERENCES partners(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_partner_product_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE,

    CONSTRAINT uk_partner_product
        UNIQUE (partner_id, product_id)
);

CREATE INDEX idx_partner_products_partner ON partner_products(partner_id);
CREATE INDEX idx_partner_products_product ON partner_products(product_id);
CREATE INDEX idx_partner_products_active ON partner_products(is_active);

COMMENT ON TABLE partner_products IS '파트너-상품 연결 및 통계';
```

### 3.4 partner_sales_stats (파트너 판매 통계)

파트너별 월간 판매 통계를 집계합니다.

```sql
CREATE TABLE partner_sales_stats (
    id BIGSERIAL PRIMARY KEY,
    partner_id VARCHAR(36) NOT NULL,
    period VARCHAR(7) NOT NULL, -- YYYY-MM
    total_revenue BIGINT NOT NULL DEFAULT 0,
    total_orders INTEGER NOT NULL DEFAULT 0,
    total_tickets INTEGER NOT NULL DEFAULT 0,
    average_order_value INTEGER NOT NULL DEFAULT 0,
    top_products JSONB,
    daily_sales JSONB,
    category_breakdown JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_partner_stats_partner
        FOREIGN KEY (partner_id)
        REFERENCES partners(id)
        ON DELETE CASCADE,

    CONSTRAINT uk_partner_period
        UNIQUE (partner_id, period)
);

CREATE INDEX idx_partner_stats_partner ON partner_sales_stats(partner_id);
CREATE INDEX idx_partner_stats_period ON partner_sales_stats(period);

-- JSONB 인덱스
CREATE INDEX idx_partner_stats_top_products ON partner_sales_stats USING GIN (top_products);
CREATE INDEX idx_partner_stats_daily_sales ON partner_sales_stats USING GIN (daily_sales);
CREATE INDEX idx_partner_stats_category ON partner_sales_stats USING GIN (category_breakdown);

COMMENT ON TABLE partner_sales_stats IS '파트너별 월간 판매 통계';
COMMENT ON COLUMN partner_sales_stats.period IS '통계 기간 (YYYY-MM 형식)';
```

### 3.5 supervisors (현장관리자)

파트너에 소속된 현장관리자를 관리합니다.

```sql
CREATE TABLE supervisors (
    id VARCHAR(36) PRIMARY KEY,
    partner_id VARCHAR(36) NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(200),
    phone VARCHAR(20),
    active BOOLEAN NOT NULL DEFAULT true,
    logo_url VARCHAR(1000),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_supervisor_partner
        FOREIGN KEY (partner_id)
        REFERENCES partners(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_supervisors_partner ON supervisors(partner_id);
CREATE INDEX idx_supervisors_username ON supervisors(username);
CREATE INDEX idx_supervisors_active ON supervisors(active);

COMMENT ON TABLE supervisors IS '파트너 현장관리자';
COMMENT ON COLUMN supervisors.username IS '로그인 아이디';
COMMENT ON COLUMN supervisors.password IS '비밀번호';
```

---

## 4. 권한 및 역할 관리

### 4.1 permissions (권한)

시스템 권한을 정의합니다.

```sql
CREATE TABLE permissions (
    id BIGSERIAL PRIMARY KEY,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_permission_resource_action
        UNIQUE (resource, action)
);

CREATE INDEX idx_permissions_resource ON permissions(resource);

COMMENT ON TABLE permissions IS '시스템 권한 정의';
COMMENT ON COLUMN permissions.resource IS '리소스명 (예: products, partners, orders)';
COMMENT ON COLUMN permissions.action IS '동작 (예: view, create, edit, delete, approve)';

-- 기본 권한 데이터
INSERT INTO permissions (resource, action, description) VALUES
('dashboard', 'view', '대시보드 조회'),
('products', 'view', '상품 조회'),
('products', 'create', '상품 생성'),
('products', 'edit', '상품 수정'),
('products', 'delete', '상품 삭제'),
('partners', 'view', '파트너 조회'),
('partners', 'create', '파트너 생성'),
('partners', 'edit', '파트너 수정'),
('partners', 'delete', '파트너 삭제'),
('menu_categories', 'view', '메뉴 카테고리 조회'),
('menu_categories', 'create', '메뉴 카테고리 생성'),
('menu_categories', 'edit', '메뉴 카테고리 수정'),
('menu_categories', 'delete', '메뉴 카테고리 삭제'),
('orders', 'view', '주문 조회'),
('orders', 'edit', '주문 수정'),
('orders', 'cancel', '주문 취소'),
('community', 'view', '커뮤니티 조회'),
('community', 'create', '커뮤니티 생성'),
('community', 'edit', '커뮤니티 수정'),
('community', 'delete', '커뮤니티 삭제'),
('permissions', 'view', '권한 조회'),
('permissions', 'manage', '권한 관리');
```

### 4.2 roles (역할)

사용자 역할을 정의합니다.

```sql
CREATE TABLE roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    is_system BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_roles_name ON roles(name);
CREATE INDEX idx_roles_system ON roles(is_system);

COMMENT ON TABLE roles IS '사용자 역할';
COMMENT ON COLUMN roles.is_system IS '시스템 기본 역할 (삭제 불가)';

-- 기본 역할 데이터
INSERT INTO roles (name, description, is_system) VALUES
('ADMIN', '시스템 관리자', true),
('FIELD_MANAGER', '현장관리자', true);
```

### 4.3 role_permissions (역할-권한 매핑)

역할에 할당된 권한을 관리합니다.

```sql
CREATE TYPE permission_effect AS ENUM ('ALLOW', 'DENY');

CREATE TABLE role_permissions (
    id BIGSERIAL PRIMARY KEY,
    role_id BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    effect permission_effect NOT NULL DEFAULT 'ALLOW',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_role_permission_role
        FOREIGN KEY (role_id)
        REFERENCES roles(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_role_permission_permission
        FOREIGN KEY (permission_id)
        REFERENCES permissions(id)
        ON DELETE CASCADE,

    CONSTRAINT uk_role_permission
        UNIQUE (role_id, permission_id)
);

CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON role_permissions(permission_id);

COMMENT ON TABLE role_permissions IS '역할-권한 매핑';
```

---

## 5. 관리자 메뉴 관리

### 5.1 admin_menus (관리자 메뉴)

관리자 페이지의 메뉴 항목을 동적으로 관리합니다.

```sql
CREATE TABLE admin_menus (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    title_en VARCHAR(100) NOT NULL,
    icon VARCHAR(50) NOT NULL,
    page VARCHAR(100) NOT NULL UNIQUE,
    display_order INTEGER NOT NULL DEFAULT 0,
    visible BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_admin_menus_page ON admin_menus(page);
CREATE INDEX idx_admin_menus_visible ON admin_menus(visible, display_order);
CREATE INDEX idx_admin_menus_order ON admin_menus(display_order);

COMMENT ON TABLE admin_menus IS '관리자 메뉴 설정';
COMMENT ON COLUMN admin_menus.icon IS 'React Icons 이름 (예: MdDashboard)';
COMMENT ON COLUMN admin_menus.page IS '페이지 식별자 (라우팅용)';

-- 기본 관리자 메뉴 데이터
INSERT INTO admin_menus (id, title, title_en, icon, page, display_order, visible) VALUES
('menu-1', '대시보드', 'Dashboard', 'MdDashboard', 'dashboard', 1, true),
('menu-2', '메뉴관리', 'Menu Management', 'MdMenu', 'menu-management', 2, true),
('menu-3', '파트너관리', 'Partner Management', 'MdHandshake', 'partners', 3, true),
('menu-4', '상품관리', 'Product Management', 'MdShoppingBag', 'products', 4, true),
('menu-5', '주문관리', 'Order Management', 'MdShoppingCart', 'orders', 5, true),
('menu-6', '커뮤니티', 'Community', 'MdForum', 'community', 6, true),
('menu-7', '권한관리', 'Permissions', 'MdSecurity', 'permissions', 7, true),
('menu-8', '엔티티', 'Entity Diagram', 'MdSchema', 'entity-diagram', 8, true);
```

---

## 6. 주문 관리

### 6.1 ticket_orders (티켓 주문)

티켓 주문 정보를 관리하는 핵심 테이블입니다. 복합 주문을 지원합니다.

```sql
CREATE TYPE ticket_order_status AS ENUM ('입금전', '주문처리완료', '취소신청', '취소완료');
CREATE TYPE payment_status AS ENUM ('입금대기', '입금완료', '결제완료', '환불신청', '환불완료');
CREATE TYPE payment_method AS ENUM ('신용카드', '계좌이체', '무통장입금', '간편결제', '휴대폰결제', '기타');
CREATE TYPE order_channel AS ENUM ('온라인', '전화', '현장', '대량구��', '제휴사', '기타');

CREATE TABLE ticket_orders (
    id VARCHAR(36) PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    channel_order_number VARCHAR(50),
    order_date TIMESTAMP NOT NULL,
    
    -- 주문자 정보
    orderer_name VARCHAR(100) NOT NULL,
    orderer_phone VARCHAR(20) NOT NULL,
    orderer_email VARCHAR(200) NOT NULL,
    orderer_company VARCHAR(200),
    orderer_department VARCHAR(100),
    
    -- 금액 정보
    items_total INTEGER NOT NULL CHECK (items_total >= 0),
    total_amount INTEGER NOT NULL CHECK (total_amount >= 0),
    
    -- 결제 정보
    payment_status payment_status NOT NULL DEFAULT '입금대기',
    payment_amount INTEGER NOT NULL DEFAULT 0 CHECK (payment_amount >= 0),
    payment_method payment_method,
    payment_date TIMESTAMP,
    
    -- 주문 정보
    order_status ticket_order_status NOT NULL DEFAULT '입금전',
    channel order_channel NOT NULL DEFAULT '온라인',
    request_message TEXT,
    
    -- 파트너 정보 (단일 파트너 주문인 경우)
    partner_id VARCHAR(36),
    partner_name VARCHAR(200),
    
    -- 채널 정보
    channel_name VARCHAR(200),
    
    -- 티켓 사용 여부 (하위 호환성)
    ticket_used BOOLEAN NOT NULL DEFAULT false,
    
    -- 메타 정보
    visible BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ticket_order_partner
        FOREIGN KEY (partner_id)
        REFERENCES partners(id)
        ON DELETE SET NULL
);

CREATE INDEX idx_ticket_orders_order_number ON ticket_orders(order_number);
CREATE INDEX idx_ticket_orders_orderer_phone ON ticket_orders(orderer_phone);
CREATE INDEX idx_ticket_orders_orderer_email ON ticket_orders(orderer_email);
CREATE INDEX idx_ticket_orders_order_status ON ticket_orders(order_status);
CREATE INDEX idx_ticket_orders_payment_status ON ticket_orders(payment_status);
CREATE INDEX idx_ticket_orders_partner ON ticket_orders(partner_id);
CREATE INDEX idx_ticket_orders_order_date ON ticket_orders(order_date DESC);
CREATE INDEX idx_ticket_orders_visible ON ticket_orders(visible);

COMMENT ON TABLE ticket_orders IS '티켓 주문 정보 (복합 주문 지원)';
COMMENT ON COLUMN ticket_orders.order_number IS '주문번호 (예: ORD-2024-001)';
COMMENT ON COLUMN ticket_orders.channel_order_number IS '채널별 주문번호';
COMMENT ON COLUMN ticket_orders.items_total IS '상품 금액 합계';
COMMENT ON COLUMN ticket_orders.total_amount IS '최종 결제 금액';
```

### 6.2 ticket_order_items (티켓 주문 아이템)

주문에 포함된 개별 상품 아이템을 관리합니다. 복합 주문 지원을 위해 아이템마다 파트너 정보를 가집니다.

```sql
CREATE TABLE ticket_order_items (
    id VARCHAR(36) PRIMARY KEY,
    order_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    product_code VARCHAR(50) NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    category_name VARCHAR(100) NOT NULL,
    option_name VARCHAR(200),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price INTEGER NOT NULL CHECK (unit_price >= 0),
    subtotal INTEGER NOT NULL CHECK (subtotal >= 0),
    is_used BOOLEAN NOT NULL DEFAULT false,
    
    -- 상품의 파트너사 정보 (복합 주문 대응)
    partner_id VARCHAR(36),
    partner_name VARCHAR(200),
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_order_item_order
        FOREIGN KEY (order_id)
        REFERENCES ticket_orders(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_order_item_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_order_item_partner
        FOREIGN KEY (partner_id)
        REFERENCES partners(id)
        ON DELETE SET NULL
);

CREATE INDEX idx_order_items_order ON ticket_order_items(order_id);
CREATE INDEX idx_order_items_product ON ticket_order_items(product_id);
CREATE INDEX idx_order_items_partner ON ticket_order_items(partner_id);
CREATE INDEX idx_order_items_is_used ON ticket_order_items(is_used);

COMMENT ON TABLE ticket_order_items IS '주문 아이템 (복합 주문 지원)';
COMMENT ON COLUMN ticket_order_items.subtotal IS '소계 (단가 × 수량)';
COMMENT ON COLUMN ticket_order_items.partner_id IS '상품의 파트너사 ID (복합 주문 시 아이템별로 다를 수 있음)';
```

### 6.3 tickets (티켓)

개별 티켓 정보를 관리합니다. 각 주문 아이템의 수량만큼 티켓이 생성됩니다.

```sql
CREATE TABLE tickets (
    id VARCHAR(36) PRIMARY KEY,
    order_id VARCHAR(36) NOT NULL,
    order_item_id VARCHAR(36) NOT NULL,
    ticket_number VARCHAR(50) NOT NULL UNIQUE,
    product_id VARCHAR(36) NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    
    -- 파트너 정보
    partner_id VARCHAR(36),
    partner_name VARCHAR(200),
    
    -- 사용 정보
    used BOOLEAN NOT NULL DEFAULT false,
    used_at TIMESTAMP,
    used_by VARCHAR(100),
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ticket_order
        FOREIGN KEY (order_id)
        REFERENCES ticket_orders(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_ticket_order_item
        FOREIGN KEY (order_item_id)
        REFERENCES ticket_order_items(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_ticket_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_ticket_partner
        FOREIGN KEY (partner_id)
        REFERENCES partners(id)
        ON DELETE SET NULL
);

CREATE INDEX idx_tickets_order ON tickets(order_id);
CREATE INDEX idx_tickets_order_item ON tickets(order_item_id);
CREATE INDEX idx_tickets_product ON tickets(product_id);
CREATE INDEX idx_tickets_partner ON tickets(partner_id);
CREATE INDEX idx_tickets_ticket_number ON tickets(ticket_number);
CREATE INDEX idx_tickets_used ON tickets(used);

COMMENT ON TABLE tickets IS '개별 티켓 정보';
COMMENT ON COLUMN tickets.ticket_number IS '티켓 번호 (예: TKT-20241202-001-01)';
COMMENT ON COLUMN tickets.used_by IS '티켓 사용 처리자 (현장관리자 ID 또는 이름)';
```

---

## 7. 커뮤니티 관리

### 7.1 posts (게시글)

공지사항, FAQ, 문의, 이벤트 게시글을 관리합니다.

```sql
CREATE TYPE post_type AS ENUM ('NOTICE', 'FAQ', 'QNA', 'EVENT');
CREATE TYPE qna_status AS ENUM ('PENDING', 'ANSWERED');

CREATE TABLE posts (
    id VARCHAR(36) PRIMARY KEY,
    type post_type NOT NULL,
    title VARCHAR(300) NOT NULL,
    content TEXT NOT NULL,
    author_id VARCHAR(100) NOT NULL,
    author_name VARCHAR(100) NOT NULL,
    
    views INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    
    -- QNA 전용
    status qna_status,
    answer TEXT,
    answered_at TIMESTAMP,
    answered_by VARCHAR(100),
    inquiry_number VARCHAR(50),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(200),
    related_order_number VARCHAR(50),
    
    -- 차단 관리
    is_blocked BOOLEAN DEFAULT false,
    blocked_reason TEXT,
    blocked_at TIMESTAMP,
    blocked_by VARCHAR(100),
    
    -- 이벤트 전용
    event_end_date DATE,
    
    -- FAQ 카테고리
    category VARCHAR(100),
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_posts_type ON posts(type);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_inquiry_number ON posts(inquiry_number);
CREATE INDEX idx_posts_category ON posts(category);
CREATE INDEX idx_posts_created ON posts(created_at DESC);

COMMENT ON TABLE posts IS '커뮤니티 게시글 (공지/FAQ/문의/이벤트)';
COMMENT ON COLUMN posts.inquiry_number IS '문의번호 (INQ-YYYY-NNN)';
```

---

## 8. 쿠폰 관리

### 8.1 coupons (쿠폰)

쿠폰 정보를 관리합니다.

```sql
CREATE TYPE coupon_type AS ENUM ('정률', '정액', '무료배송');
CREATE TYPE coupon_status AS ENUM ('활성', '비활성', '만료');

CREATE TABLE coupons (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    type coupon_type NOT NULL,
    discount_value INTEGER NOT NULL,
    min_order_amount INTEGER,
    max_discount_amount INTEGER,
    
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status coupon_status NOT NULL DEFAULT '활성',
    
    total_quantity INTEGER,
    used_quantity INTEGER NOT NULL DEFAULT 0,
    
    applicable_categories JSONB,
    applicable_products JSONB,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT check_coupon_dates
        CHECK (end_date >= start_date)
);

CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_status ON coupons(status);
CREATE INDEX idx_coupons_dates ON coupons(start_date, end_date);

COMMENT ON TABLE coupons IS '쿠폰 정보';
```

---

## 9. 채널 관리

### 9.1 channels (채널)

멀티 채널 쇼핑몰의 채널 정보를 관리합니다.

```sql
CREATE TABLE channels (
    id VARCHAR(36) PRIMARY KEY,
    channel_code VARCHAR(50) NOT NULL UNIQUE,
    channel_name VARCHAR(200) NOT NULL,
    company_name VARCHAR(200) NOT NULL,
    
    -- 브랜딩
    logo_url VARCHAR(1000),
    favicon_url VARCHAR(1000),
    primary_color VARCHAR(20) DEFAULT '#0c8ce9',
    secondary_color VARCHAR(20) DEFAULT '#666666',
    
    -- 연락처 정보
    contact_email VARCHAR(200),
    contact_phone VARCHAR(20),
    website_url VARCHAR(500),
    
    -- 기타
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_channels_code ON channels(channel_code);
CREATE INDEX idx_channels_active ON channels(active);

COMMENT ON TABLE channels IS '멀티 채널 쇼핑몰 채널 정보';
COMMENT ON COLUMN channels.channel_code IS '채널 고유 코드 (URL 파라미터용)';
COMMENT ON COLUMN channels.channel_name IS '채널 이름 (화면 표시용)';
COMMENT ON COLUMN channels.company_name IS '운영 회사명';
COMMENT ON COLUMN channels.primary_color IS '주 색상 (Hex 코드)';
COMMENT ON COLUMN channels.secondary_color IS '보조 색상 (Hex 코드)';

-- 기본 채널 데이터
INSERT INTO channels (id, channel_code, channel_name, company_name, active) VALUES
('channel-default', 'DEFAULT', '기본 쇼핑몰', '주식회사 티켓플러스', true);
```

### 9.2 channel_product_exclusions (채널별 상품 제외)

채널별로 노출하지 않을 상품을 관리합니다.

```sql
CREATE TABLE channel_product_exclusions (
    id BIGSERIAL PRIMARY KEY,
    channel_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_exclusion_channel
        FOREIGN KEY (channel_id)
        REFERENCES channels(id)
        ON DELETE CASCADE,
    
    CONSTRAINT fk_exclusion_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE,
    
    CONSTRAINT uk_channel_product_exclusion
        UNIQUE (channel_id, product_id)
);

CREATE INDEX idx_channel_exclusions_channel ON channel_product_exclusions(channel_id);
CREATE INDEX idx_channel_exclusions_product ON channel_product_exclusions(product_id);

COMMENT ON TABLE channel_product_exclusions IS '채널별 상품 노출 제외 관리';
COMMENT ON COLUMN channel_product_exclusions.channel_id IS '채널 ID';
COMMENT ON COLUMN channel_product_exclusions.product_id IS '제외할 상품 ID';
```

---

## 인덱스 전략

### 복합 인덱스

성능 최적화를 위한 복합 인덱스:

```sql
-- 상품 검색 최적화
CREATE INDEX idx_products_category_status_visible
ON products(category_id, sales_status, visible);

-- 파트너 상품 조회 최적화
CREATE INDEX idx_products_partner_status
ON products(partner_id, sales_status)
WHERE visible = true;

-- 할인 조회 최적화
CREATE INDEX idx_partner_discounts_active
ON product_partner_discounts(product_id, partner_id, status)
WHERE visible = true AND status = '활성';
```

### 부분 인덱스

데이터 특성에 맞는 부분 인덱스:

```sql
-- 판매중인 상품만
CREATE INDEX idx_products_on_sale
ON products(category_id, price)
WHERE sales_status = '판매중' AND visible = true;

-- 활성 파트너만
CREATE INDEX idx_partners_active
ON partners(type, commission_rate)
WHERE status = '활성';

-- 현재 진행중인 할인만
CREATE INDEX idx_discounts_current
ON product_partner_discounts(product_id, discount_rate)
WHERE status = '활성' AND visible = true;
```

---

## 스키마 초기화

### 전체 스키마 삭제 및 재생성

개발/테스트 환경에서 스키마를 초기화할 때 사용합니다.

```sql
-- ⚠️ 경고: 모든 데이터가 삭제됩니다!

-- 1. 모든 테이블 삭제 (순서 중요 - 외래키 제약 때문)
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS admin_menus CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;
DROP TABLE IF EXISTS ticket_orders CASCADE;
DROP TABLE IF EXISTS partner_sales_stats CASCADE;
DROP TABLE IF EXISTS partner_products CASCADE;
DROP TABLE IF EXISTS partner_discount_policies CASCADE;
DROP TABLE IF EXISTS product_partner_discounts CASCADE;
DROP TABLE IF EXISTS product_option_values CASCADE;
DROP TABLE IF EXISTS product_options CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS partners CASCADE;
DROP TABLE IF EXISTS menu_categories CASCADE;
DROP TABLE IF EXISTS supervisors CASCADE;
DROP TABLE IF EXISTS channels CASCADE;
DROP TABLE IF EXISTS channel_product_exclusions CASCADE;

-- 2. 모든 ENUM 타입 삭제
DROP TYPE IF EXISTS coupon_status CASCADE;
DROP TYPE IF EXISTS coupon_type CASCADE;
DROP TYPE IF EXISTS qna_status CASCADE;
DROP TYPE IF EXISTS post_type CASCADE;
DROP TYPE IF EXISTS payment_method CASCADE;
DROP TYPE IF EXISTS order_status CASCADE;
DROP TYPE IF EXISTS permission_effect CASCADE;
DROP TYPE IF EXISTS discount_type CASCADE;
DROP TYPE IF EXISTS partner_discount_status CASCADE;
DROP TYPE IF EXISTS partner_type CASCADE;
DROP TYPE IF EXISTS partner_status CASCADE;
DROP TYPE IF EXISTS sales_status CASCADE;
DROP TYPE IF EXISTS visibility_status CASCADE;
DROP TYPE IF EXISTS active_status CASCADE;

-- 3. 스키마 재생성
-- 이 문서의 각 섹션에 있는 CREATE 문들을 순서대로 실행합니다.
```

### 데이터만 초기화 (테이블 구조 유지)

테이블 구조는 유지하고 데이터만 삭제할 때 사용합니다.

```sql
-- ⚠️ 경고: 모든 데이터가 삭제됩니다!

-- 외래키 제약을 고려한 순서로 삭제
TRUNCATE TABLE role_permissions CASCADE;
TRUNCATE TABLE admin_menus CASCADE;
TRUNCATE TABLE posts CASCADE;
TRUNCATE TABLE coupons CASCADE;
TRUNCATE TABLE ticket_orders CASCADE;
TRUNCATE TABLE partner_sales_stats CASCADE;
TRUNCATE TABLE partner_products CASCADE;
TRUNCATE TABLE partner_discount_policies CASCADE;
TRUNCATE TABLE product_partner_discounts CASCADE;
TRUNCATE TABLE product_option_values CASCADE;
TRUNCATE TABLE product_options CASCADE;
TRUNCATE TABLE products CASCADE;
TRUNCATE TABLE partners CASCADE;
TRUNCATE TABLE menu_categories CASCADE;
TRUNCATE TABLE roles CASCADE;
TRUNCATE TABLE permissions CASCADE;
TRUNCATE TABLE supervisors CASCADE;
TRUNCATE TABLE channels CASCADE;
TRUNCATE TABLE channel_product_exclusions CASCADE;

-- 시퀀스 초기화 (BIGSERIAL 사용 테이블)
ALTER SEQUENCE permissions_id_seq RESTART WITH 1;
ALTER SEQUENCE roles_id_seq RESTART WITH 1;
ALTER SEQUENCE role_permissions_id_seq RESTART WITH 1;
ALTER SEQUENCE partner_sales_stats_id_seq RESTART WITH 1;
```

### 초기 데이터 삽입 스크립트

```sql
-- 1. 권한 초기 데이터
INSERT INTO permissions (resource, action, description) VALUES
('dashboard', 'view', '대시보드 조회'),
('products', 'view', '상품 조회'),
('products', 'create', '상품 생성'),
('products', 'edit', '상품 수정'),
('products', 'delete', '상품 삭제'),
('partners', 'view', '파트너 조회'),
('partners', 'create', '파트너 생성'),
('partners', 'edit', '파트너 수정'),
('partners', 'delete', '파트너 삭제'),
('menu_categories', 'view', '메뉴 카테고리 조회'),
('menu_categories', 'create', '메뉴 카테고리 생성'),
('menu_categories', 'edit', '메뉴 카테고리 수정'),
('menu_categories', 'delete', '메뉴 카테고리 삭제'),
('orders', 'view', '주문 조회'),
('orders', 'edit', '주문 수정'),
('orders', 'cancel', '주문 취소'),
('community', 'view', '커뮤니티 조회'),
('community', 'create', '커뮤니티 생성'),
('community', 'edit', '커뮤니티 수정'),
('community', 'delete', '커뮤니티 삭제'),
('permissions', 'view', '권한 조회'),
('permissions', 'manage', '권한 관리');

-- 2. 역할 초기 데이터
INSERT INTO roles (name, description, is_system) VALUES
('ADMIN', '시스템 관리자', true),
('FIELD_MANAGER', '현장관리자', true);

-- 3. 관리자 메뉴 초기 데이터
INSERT INTO admin_menus (id, title, title_en, icon, page, display_order, visible) VALUES
('menu-1', '대시보드', 'Dashboard', 'MdDashboard', 'dashboard', 1, true),
('menu-2', '메뉴관리', 'Menu Management', 'MdMenu', 'menu-management', 2, true),
('menu-3', '파트너관리', 'Partner Management', 'MdHandshake', 'partners', 3, true),
('menu-4', '상품관리', 'Product Management', 'MdShoppingBag', 'products', 4, true),
('menu-5', '주문관리', 'Order Management', 'MdShoppingCart', 'orders', 5, true),
('menu-6', '커뮤니티', 'Community', 'MdForum', 'community', 6, true),
('menu-7', '권한관리', 'Permissions', 'MdSecurity', 'permissions', 7, true),
('menu-8', '엔티티', 'Entity Diagram', 'MdSchema', 'entity-diagram', 8, true);
```

---

## ERD 관계도

### 핵심 엔티티 관계

```
┌─────────────────┐         ┌──────────────────┐
│ menu_categories │◄────────┤    products      │
│                 │ 1     * │                  │
└─────────────────┘         └──────────────────┘
                                     │ *
                                     │
                                     │ 1
                            ┌────────▼────────┐
                            │    partners     │
                            │                 │
                            └─────────────────┘
                                     │ 1
                                     │
                                     │ *
                    ┌────────────────▼────────────────┐
                    │ product_partner_discounts       │
                    │                                 │
                    └─────────────────────────────────┘

┌─────────────────┐         ┌──────────────────┐
│    products     │◄────────┤ product_options  │
│                 │ 1     * │                  │
└─────────────────┘         └──────────────────┘
                                     │ 1
                                     │
                                     │ *
                            ┌────────▼────────────┐
                            │ product_option_     │
                            │      values         │
                            └─────────────────────┘

┌─────────────────┐         ┌──────────────────┐
│      roles      │◄────────┤ role_permissions │
│                 │ 1     * │                  │
└─────────────────┘         └──────────────────┘
                                     │ *
                                     │
                                     │ 1
                            ┌────────▼────────┐
                            │  permissions    │
                            │                 │
                            └─────────────────┘

┌─────────────────┐         ┌──────────────────┐
│    partners     │◄────────┤    channels      │
│                 │ 1     * │                  │
└─────────────────┘         └──────────────────┘
                                     │ 1
                                     │
                                     │ *
                            ┌────────▼────────────┐
                            │ partner_discount_   │
                            │      policies       │
                            └─────────────────────┘
```

---

## 변경 이력

### 2025-11-10
- 조직관리, 직원관리, 일정관리, 프로젝트, 보고서, 고객관리 섹션 제거
- 주문관리, 커뮤니티 관리, 쿠폰 관리 섹션 추가
- 스키마 초기화 섹션 추가
- 관리자 메뉴 데이터 업데이트

---

## 라이선스

이 문서는 티켓 판매 ERP 시스템의 일부입니다.