
<img width="200" height="171" alt="Group 14" src="https://github.com/user-attachments/assets/d366bb4b-e7de-48a0-8140-6ac30c6b2ba7" />

### 티켓 판매 플랫폼 winnticket의 프론트엔드 프로젝트입니다.  
### 쇼핑몰(고객 구매), 관리자(어드민), 현장관리자 UI를 하나의 SPA로 구성합니다.
###  https://www.winnticket.co.kr/
---

## 기술 스택

| 구분 | 사용 기술 |
|------|-----------|
| 프레임워크 | React 18 + TypeScript |
| 빌드 | Vite 6 |
| 스타일 | Tailwind CSS 4 |
| UI 컴포넌트 | shadcn/ui (Radix UI 기반) |
| 라우팅 | React Router 7 |
| 폼 | React Hook Form |
| 차트 | Recharts |
| 애니메이션 | Motion |
| 바코드/QR | jsbarcode, qrcode |
| 엑셀 | xlsx |
| CI/CD | Jenkins + SSH 배포 |

---


## 주요 기능

### 쇼핑몰 (`/`)
- 상품 목록, 카테고리 탐색, 상품 상세
- 장바구니 및 결제 (콜백, 성공 페이지 포함)
- 주문 조회 및 상세
- QR / 바코드 쿠폰 사용
- 공지사항, 이벤트, FAQ, 1:1 문의
- 채널별 분기 지원 (`?channel=코드`)

### 어드민 (`/admin`)
- 대시보드
- 상품 관리 (옵션, 시즌, 가격, 채널별 할인, SMS, 콘텐츠 편집)
- 파트너 / 직원 / 현장관리자 관리
- 주문 관리 및 상세
- 배너 / 팝업 관리
- 채널 관리
- 커뮤니티 (공지사항, 이벤트 에디터 포함)
- 사이트 정보 설정
- 바우처 교환
- 메뉴 구성 관리

### 현장관리자 (`/admin/field-orders`, `/field/ticket-scanner`)
- 현장 주문 목록 조회
- 티켓 스캐너 (QR 스캔 기반 사용 처리)

---
