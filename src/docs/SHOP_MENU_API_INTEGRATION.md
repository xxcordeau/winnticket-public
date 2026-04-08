# 쇼핑몰 메뉴 API 연동 완료 ✅

## 변경 사항

### 1. 새로운 API 엔드포인트 추가

**파일:** `/lib/api/menu.ts`

- `getShopMenus()` 함수 추가
  - 엔드포인트: `GET /api/menu/menuCategory/shopMenus`
  - 하이브리드 방식: API 서버 실패 시 더미 데이터로 자동 폴백
  - 더미 데이터 포함 (공연/스포츠/전시 카테고리)

### 2. 메뉴 로딩 로직 변경

**파일:** `/data/hooks/useShopStore.ts`

- `loadMenuFromServer()` 함수 수정
  - `getMenuList()` → `getShopMenus()` 로 변경
  - 쇼핑몰 전용 메뉴 API 사용

### 3. 향상된 로깅

**파일:** `/components/shop-header.tsx`

- 메뉴 로딩 과정 상세 로그 추가
- 계층 구조 변환 로그 추가
- 디버깅 편의성 향상

## API 응답 구조

```typescript
{
  success: true,
  data: [
    {
      id: "shop-menu-show",
      name: "공연",
      code: "SHOW",
      level: 1,              // 1 = 대분류, 2 = 중분류
      parentId: null,        // 대분류는 null
      displayOrder: 1,
      visible: true
    },
    {
      id: "shop-menu-concert",
      name: "콘서트",
      code: "CONCERT",
      level: 2,
      parentId: "shop-menu-show",  // 부모 메뉴 ID
      displayOrder: 1,
      visible: true
    }
  ],
  message: "Success",
  timestamp: "2025-01-01T00:00:00.000Z"
}
```

## 더미 데이터 (API 서버 없을 때)

```
공연 (SHOW)
├─ 콘서트 (CONCERT)
├─ 뮤지컬 (MUSICAL)
└─ 클래식 (CLASSIC)

스포츠 (SPORTS)
├─ 야구 (BASEBALL)
└─ 축구 (FOOTBALL)

전시 (EXHIBITION)
```

## 프론트엔드 처리 방식

1. **API 호출**
   - `GET /api/menu/menuCategory/shopMenus`로 평면 구조 데이터 수신

2. **계층 구조 변환**
   - `level=1`인 항목을 대분류로 필터링
   - `parentId`를 사용하여 자식 메뉴 연결
   - `displayOrder`로 정렬

3. **UI 렌더링**
   - 대분류: 드롭다운 메뉴
   - 중분류: 드롭다운 항목
   - 계층이 없는 메뉴: 단순 링크

## 캐싱

- **캐시 유효 시간:** 1분
- **자동 재검증:** 페이지 리로드 시
- **수동 무효화:** `invalidateMenuCache()` 호출

## 라우팅

- 전체 상품: `/shop`
- 대분류: `/shop/SHOW`
- 중분류: `/shop/SHOW/CONCERT` 또는 `/shop/CONCERT`

## 테스트 방법

### 1. API 서버 연결 시

```bash
# 콘솔에서 확인
🌐 [API] Calling GET /api/menu/menuCategory/shopMenus
✅ [API] Shop menus loaded from server: 8 items
🍔 [ShopHeader] Loaded menu data from cache/server: [...]
✅ [ShopHeader] Total: 3 parent menus
```

### 2. API 서버 없을 때

```bash
# 콘솔에서 확인
⚠️ [API] 쇼핑몰 메뉴 API 연결 실패, 더미 데이터 사용
📦 [API] Using dummy shop menus: 8 items
🍔 [ShopHeader] Loaded menu data from cache/server: [...]
✅ [ShopHeader] Total: 3 parent menus
```

## 참고 문서

- 상세 API 가이드: `/docs/SHOP_MENU_API.md`
- 메뉴 API 소스: `/lib/api/menu.ts`
- 메뉴 훅: `/data/hooks/useShopStore.ts`
- 쇼핑몰 헤더: `/components/shop-header.tsx`

## 주요 특징

✅ 하이브리드 방식 (API/더미 데이터 자동 전환)
✅ 1분 캐싱으로 성능 최적화
✅ 2단계 계층 구조 지원
✅ visible 필터링 자동 처리
✅ displayOrder 정렬 자동 처리
✅ 에러 발생 시 사용자 경험 유지

## 다음 단계

백엔드 팀에서 `/api/menu/menuCategory/shopMenus` 엔드포인트를 구현하면 자동으로 실제 데이터가 표시됩니다. 구현 전까지는 더미 데이터로 정상 동작합니다.
