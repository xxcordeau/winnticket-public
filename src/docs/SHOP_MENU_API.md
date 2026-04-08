# 쇼핑몰 메뉴 API 가이드

## 개요

쇼핑몰에서 사용하는 메뉴 카테고리를 관리하는 API입니다. 하이브리드 방식으로 동작하여 API 서버가 없을 때는 자동으로 더미 데이터로 폴백합니다.

## API 엔드포인트

### 쇼핑몰 메뉴 목록 조회

```
GET /api/menu/menuCategory/shopMenus
```

쇼핑몰에 표시할 메뉴 카테고리 목록을 조회합니다.

#### 응답 데이터 구조

```typescript
interface MenuItem {
  id: string;
  name: string;           // 메뉴 이름 (예: "콘서트", "야구")
  code: string;           // 메뉴 코드 (예: "CONCERT", "BASEBALL")
  level: number;          // 계층 레벨 (1 = 대분류, 2 = 중분류)
  parentId: string | null; // 부모 메뉴 ID (대분류는 null)
  displayOrder: number;   // 표시 순서
  visible: boolean;       // 노출 여부
  iconUrl?: string;       // 아이콘 URL (선택사항)
  routePath?: string;     // 라우팅 경로 (선택사항)
}
```

#### 응답 예시

```json
{
  "success": true,
  "data": [
    {
      "id": "shop-menu-show",
      "name": "공연",
      "code": "SHOW",
      "level": 1,
      "parentId": null,
      "displayOrder": 1,
      "visible": true
    },
    {
      "id": "shop-menu-concert",
      "name": "콘서트",
      "code": "CONCERT",
      "level": 2,
      "parentId": "shop-menu-show",
      "displayOrder": 1,
      "visible": true
    },
    {
      "id": "shop-menu-musical",
      "name": "뮤지컬",
      "code": "MUSICAL",
      "level": 2,
      "parentId": "shop-menu-show",
      "displayOrder": 2,
      "visible": true
    }
  ],
  "message": "Success",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

## 프론트엔드 사용 방법

### 1. API 호출

```typescript
import { getShopMenus } from '@/lib/api/menu';

const response = await getShopMenus();
if (response.success && response.data) {
  const menuItems = response.data;
  // 메뉴 데이터 처리
}
```

### 2. 계층 구조 변환

API는 평면 구조로 메뉴를 반환하므로, 프론트엔드에서 계층 구조로 변환해야 합니다.

```typescript
// level=1 (대분류) 필터링
const parents = menuData.filter(x => x.level === 1);

// 각 대분류에 자식 메뉴 추가
const hierarchicalMenus = parents.map(parent => ({
  ...parent,
  children: menuData.filter(x => x.parentId === parent.id)
}));
```

### 3. 최종 메뉴 구조

```typescript
interface HierarchicalMenu {
  name: string;
  code: string;
  children: {
    name: string;
    code: string;
  }[];
}

// 예시
const menus: HierarchicalMenu[] = [
  {
    name: "공연",
    code: "SHOW",
    children: [
      { name: "콘서트", code: "CONCERT" },
      { name: "뮤지컬", code: "MUSICAL" },
      { name: "클래식", code: "CLASSIC" }
    ]
  },
  {
    name: "스포츠",
    code: "SPORTS",
    children: [
      { name: "야구", code: "BASEBALL" },
      { name: "축구", code: "FOOTBALL" }
    ]
  }
];
```

## 하이브리드 방식

API 서버 연결이 실패하면 자동으로 다음 더미 데이터를 사용합니다:

- **공연** (SHOW)
  - 콘서트 (CONCERT)
  - 뮤지컬 (MUSICAL)
  - 클래식 (CLASSIC)

- **스포츠** (SPORTS)
  - 야구 (BASEBALL)
  - 축구 (FOOTBALL)

- **전시** (EXHIBITION)

## 캐싱

메뉴 데이터는 1분간 캐싱되어 불필요한 API 호출을 방지합니다.

```typescript
import { invalidateMenuCache } from '@/data/hooks/useShopStore';

// 캐시 강제 무효화
invalidateMenuCache();

// 강제 재로드
const menus = await loadMenuFromServer(true);
```

## 라우팅

메뉴 코드는 URL 라우팅에 사용됩니다:

- 대분류: `/shop/{대분류CODE}` (예: `/shop/SHOW`)
- 중분류: `/shop/{대분류CODE}/{중분류CODE}` (예: `/shop/SHOW/CONCERT`)
- 중분류만: `/shop/{중분류CODE}` (예: `/shop/CONCERT`)

## 주의사항

1. **visible=false인 메뉴는 자동으로 필터링**됩니다.
2. **displayOrder로 정렬**되어 표시됩니다.
3. API 응답이 없거나 실패해도 **사용자에게 에러를 표시하지 않고** 더미 데이터로 폴백합니다.
4. 관리자 메뉴(`/api/menu/menuCategory`)와 **별도의 엔드포인트**를 사용합니다.
