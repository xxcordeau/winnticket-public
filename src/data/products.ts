// 

import {
  Product,
  ProductOption,
  ProductOptionValue,
  SalesStatus,
  CreateProductDto,
  UpdateProductDto,
  CreateProductOptionDto,
  UpdateProductOptionDto,
  ProductListResponse,
  ProductResponse,
  ProductOptionListResponse,
  ProductOptionResponse,
  ProductChannelDiscount,
  ChannelDiscountStatus,
  CreateProductChannelDiscountDto,
  UpdateProductChannelDiscountDto,
  ProductChannelDiscountListResponse,
  ProductChannelDiscountResponse,
} from "./dto/product.dto";
import { PagedResponse } from "./dto/types";
import { generateUUID, generateUUIDWithPrefix } from '../lib/utils/uuid';

const STORAGE_KEY_PRODUCT_OPTIONS = "erp_product_options";
const STORAGE_KEY_PRODUCTS = "erp_products";
const STORAGE_KEY_CHANNEL_DISCOUNTS = "erp_product_channel_discounts";

// - 
const initialProductOptions: ProductOption[] = [
  {
    id: "opt-001",
    name: "좌석 등급",
    code: "SEAT_GRADE",
    required: true,
    displayOrder: 1,
    visible: true,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
    values: [
      {
        id: "val-001",
        optionId: "opt-001",
        value: "VIP석",
        code: "SEAT_VIP",
        additionalPrice: 50000,
        displayOrder: 1,
        visible: true,
      },
      {
        id: "val-002",
        optionId: "opt-001",
        value: "R석",
        code: "SEAT_R",
        additionalPrice: 0,
        displayOrder: 2,
        visible: true,
      },
      {
        id: "val-003",
        optionId: "opt-001",
        value: "S석",
        code: "SEAT_S",
        additionalPrice: -30000,
        displayOrder: 3,
        visible: true,
      },
      {
        id: "val-004",
        optionId: "opt-001",
        value: "A석",
        code: "SEAT_A",
        additionalPrice: -60000,
        displayOrder: 4,
        visible: true,
      },
    ],
  },
  {
    id: "opt-002",
    name: "공연 날짜",
    code: "SHOW_DATE",
    required: true,
    displayOrder: 2,
    visible: true,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
    values: [
      {
        id: "val-005",
        optionId: "opt-002",
        value: "2025-12-05 (목) 19:00",
        code: "DATE_1205",
        additionalPrice: 0,
        displayOrder: 1,
        visible: true,
      },
      {
        id: "val-006",
        optionId: "opt-002",
        value: "2025-12-06 (금) 19:00",
        code: "DATE_1206",
        additionalPrice: 0,
        displayOrder: 2,
        visible: true,
      },
      {
        id: "val-007",
        optionId: "opt-002",
        value: "2025-12-07 (토) 15:00",
        code: "DATE_1207_MAT",
        additionalPrice: 0,
        displayOrder: 3,
        visible: true,
      },
    ],
  },
  {
    id: "opt-003",
    name: "티켓 수량",
    code: "QUANTITY",
    required: false,
    displayOrder: 3,
    visible: true,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
    values: [
      {
        id: "val-008",
        optionId: "opt-003",
        value: "1매",
        code: "QTY_1",
        additionalPrice: 0,
        displayOrder: 1,
        visible: true,
      },
      {
        id: "val-009",
        optionId: "opt-003",
        value: "2매",
        code: "QTY_2",
        additionalPrice: 0,
        displayOrder: 2,
        visible: true,
      },
      {
        id: "val-010",
        optionId: "opt-003",
        value: "4매",
        code: "QTY_4",
        additionalPrice: 0,
        displayOrder: 3,
        visible: true,
      },
    ],
  },
];

// 
const initialProducts: Product[] = [
  {
    id: "IU_CONCERT_2025", // ID 
    code: "T2025001",
    name: "아이유 2025 콘서트 <The Golden Hour>",
    categoryId: "3924a177-bd9f-4d63-a557-9c52b6ae8f67", // 
    categoryName: "콘서트",
    partnerId: "PARTNER-HYBE",
    partnerName: "하이브 엔터테인먼트",
    productType: "NORMAL", // 
    price: 132000,
    discountPrice: 110000,
    salesStatus: SalesStatus.ON_SALE,
    salesStartDate: "2025-01-01T00:00:00Z",
    salesEndDate: "2025-12-31T23:59:59Z",
    stock: 150,
    options: [
      {
        id: "prod-001-opt-001",
        name: "좌석 등급",
        code: "SEAT_GRADE",
        required: true,
        displayOrder: 1,
        visible: true,
        createdAt: "2025-01-15T00:00:00Z",
        updatedAt: "2025-01-15T00:00:00Z",
        values: [
          { id: "prod-001-opt-001-val-001", optionId: "prod-001-opt-001", value: "VIP석", code: "SEAT_VIP", additionalPrice: 50000, displayOrder: 1, visible: true },
          { id: "prod-001-opt-001-val-002", optionId: "prod-001-opt-001", value: "R석", code: "SEAT_R", additionalPrice: 0, displayOrder: 2, visible: true },
          { id: "prod-001-opt-001-val-003", optionId: "prod-001-opt-001", value: "S석", code: "SEAT_S", additionalPrice: -30000, displayOrder: 3, visible: true },
          { id: "prod-001-opt-001-val-004", optionId: "prod-001-opt-001", value: "A석", code: "SEAT_A", additionalPrice: -60000, displayOrder: 4, visible: true },
        ],
      },
      {
        id: "prod-001-opt-002",
        name: "공연 날짜",
        code: "SHOW_DATE",
        required: true,
        displayOrder: 2,
        visible: true,
        createdAt: "2025-01-15T00:00:00Z",
        updatedAt: "2025-01-15T00:00:00Z",
        values: [
          { id: "prod-001-opt-002-val-001", optionId: "prod-001-opt-002", value: "2025-12-05 (목) 19:00", code: "DATE_1205", additionalPrice: 0, displayOrder: 1, visible: true },
          { id: "prod-001-opt-002-val-002", optionId: "prod-001-opt-002", value: "2025-12-06 (금) 19:00", code: "DATE_1206", additionalPrice: 0, displayOrder: 2, visible: true },
          { id: "prod-001-opt-002-val-003", optionId: "prod-001-opt-002", value: "2025-12-07 (토) 15:00", code: "DATE_1207", additionalPrice: 0, displayOrder: 3, visible: true },
        ],
      },
    ],
    description: "아이유의 전국투어 콘서트가 돌아왔습니다. 특별한 무대를 경험하세요. 잠실 올림픽 주경기장에서 만나요.",
    imageUrl: "https://images.unsplash.com/photo-1566735355837-2269c24e644e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25jZXJ0JTIwc3RhZ2UlMjBwZXJmb3JtYW5jZXxlbnwxfHx8fDE3NjQ3MzAzMDl8MA&ixlib=rb-4.1.0&q=80&w=1080",
    imageUrls: [
      "https://images.unsplash.com/photo-1566735355837-2269c24e644e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25jZXJ0JTIwc3RhZ2UlMjBwZXJmb3JtYW5jZXxlbnwxfHx8fDE3NjQ3MzAzMDl8MA&ixlib=rb-4.1.0&q=80&w=1080",
      "https://images.unsplash.com/photo-1647524904834-1ed784e73d2c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25jZXJ0JTIwY3Jvd2QlMjBhdWRpZW5jZXxlbnwxfHx8fDE3NjQ3OTczOTV8MA&ixlib=rb-4.1.0&q=80&w=1080",
      "https://images.unsplash.com/photo-1758706552632-64ab529c2631?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25jZXJ0JTIwbGlnaHRpbmclMjBlZmZlY3RzfGVufDF8fHx8MTc2NDgxNTI3NHww&ixlib=rb-4.1.0&q=80&w=1080",
      "https://images.unsplash.com/photo-1760509742354-6f0bad8fb4f5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25jZXJ0JTIwdmVudWUlMjBzZWF0c3xlbnwxfHx8fDE3NjQ4MTUyNzV8MA&ixlib=rb-4.1.0&q=80&w=1080",
    ],
    detailImages: [
      "https://images.unsplash.com/photo-1566735355837-2269c24e644e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25jZXJ0JTIwc3RhZ2UlMjBwZXJmb3JtYW5jZXxlbnwxfHx8fDE3NjQ3MzAzMDl8MA&ixlib=rb-4.1.0&q=80&w=1080",
      "https://images.unsplash.com/photo-1647524904834-1ed784e73d2c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25jZXJ0JTIwY3Jvd2QlMjBhdWRpZW5jZXxlbnwxfHx8fDE3NjQ3OTczOTV8MA&ixlib=rb-4.1.0&q=80&w=1080",
      "https://images.unsplash.com/photo-1758706552632-64ab529c2631?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25jZXJ0JTIwbGlnaHRpbmclMjBlZmZlY3RzfGVufDF8fHx8MTc2NDgxNTI3NHww&ixlib=rb-4.1.0&q=80&w=1080",
      "https://images.unsplash.com/photo-1760509742354-6f0bad8fb4f5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25jZXJ0JTIwdmVudWUlMjBzZWF0c3xlbnwxfHx8fDE3NjQ4MTUyNzV8MA&ixlib=rb-4.1.0&q=80&w=1080",
    ],
    shippingInfo: "현장 수령 또는 모바일 티켓 발송",
    warrantyInfo: "100% 정품 티켓 보장",
    returnInfo: "공연일 7일 전까지 취소 가능 (취소 수수료 10%)",
    detailContent: `# 아이유 2025 콘서트 <The Golden Hour> 완벽 가이드

![콘서트 메인 포스터](https://images.unsplash.com/photo-1566735355837-2269c24e644e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25jZXJ0JTIwc3RhZ2UlMjBwZXJmb3JtYW5jZXxlbnwxfHx8fDE3NjQ3MzAzMDl8MA&ixlib=rb-4.1.0&q=80&w=1080)

## 🎤 공연 소개

5년 만에 돌아온 아이유의 대규모 전국투어 콘서트! **"The Golden Hour"**는 아이유의 음악 인생에서 가장 빛나는 순간을 관객 여러분과 함께 나누고자 기획된 특별한 무대입니다.

이번 콘서트는 아이유의 데뷔 15주년을 기념하여 **초대형 규모**로 제작되었으며, 잠실 올림픽 주경기장을 가득 채울 환상적인 무대 연출과 라이브 밴드 세션이 준비되어 있습니다.

### ✨ 이번 콘서트의 특별함

* 최초 공개 신곡 3곡 - 새 앨범 수록곡을 콘서트에서 처음 만나보세요
* 스페셜 게스트 출연 - 깜짝 콜라보 무대 준비
* 360도 회전 무대 - 모든 좌석에서 완벽한 시야 보장
* AR 증강현실 연출 - 최첨단 기술로 구현한 몰입형 경험

![관객석 전경](https://images.unsplash.com/photo-1647524904834-1ed784e73d2c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25jZXJ0JTIwY3Jvd2QlMjBhdWRpZW5jZXxlbnwxfHx8fDE3NjQ3OTczOTV8MA&ixlib=rb-4.1.0&q=80&w=1080)

---

## 📍 공연 상세 정보

### 날짜 및 시간
* 12월 5일 (목) 오후 7시 - 오프닝 공연
* 12월 6일 (금) 오후 7시 - 레귤러 공연
* 12월 7일 (토) 오후 3시 - 마티네 공연 (가족 관람 추천)

### 장소
잠실 올림픽 주경기장
* 주소: 서울특별시 송파구 올림픽로 25
* 수용 인원: 약 40,000명
* 지하철: 2호선/8호선 잠실역 6번 출구 도보 10분

### 관람 등급
만 7세 이상 관람 가능 (7세 미만 입장 불가)

---

## 🎵 예상 세트리스트

이번 콘서트에서는 아이유의 역대 히트곡 30여 곡을 만나보실 수 있습니다.

### Part 1: Classic Hits
1. 좋은 날
2. 너랑 나
3. 금요일에 만나요
4. 분홍신
5. 마음을 드려요

### Part 2: Modern Era
6. 밤편지
7. 팔레트
8. 가을 아침
9. Blueming
10. Love poem

### Part 3: Recent Favorites
11. Celebrity
12. 라일락
13. Strawberry Moon
14. Love wins all
15. Holssi

![무대 조명 연출](https://images.unsplash.com/photo-1758706552632-64ab529c2631?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25jZXJ0JTIwbGlnaHRpbmclMjBlZmZlY3RzfGVufDF8fHx8MTc2NDgxNTI3NHww&ixlib=rb-4.1.0&q=80&w=1080)

---

## 💺 좌석 등급 안내

### VIP석 (182,000원)
* 무대와 가장 가까운 특별석
* 사운드체크 참관 기회 추첨
* 한정판 포토북 증정
* 전용 입장 게이트 이용

### R석 (132,000원)
* 정면 무대 완벽한 시야
* 공식 응원봉 증정
* 빠른 입장 가능

### S석 (102,000원)
* 전체 무대를 한눈에 볼 수 있는 좌석
* 음향 시스템 최적화 구역
* 합리적인 가격

### A석 (72,000원)
* 가성비 최고의 선택
* 전광판으로 클로즈업 관람
* 공연 분위기를 충분히 즐길 수 있는 좌석

![공연장 좌석 배치](https://images.unsplash.com/photo-1760509742354-6f0bad8fb4f5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25jZXJ0JTIwdmVudWUlMjBzZWF0c3xlbnwxfHx8fDE3NjQ4MTUyNzV8MA&ixlib=rb-4.1.0&q=80&w=1080)

---

## 📋 예매 안내

### 예매 일정
* 팬클럽 선예매: 11월 15일 (금) 오후 8시
* 일반 예매: 11월 18일 (월) 오후 8시

### 티켓 수령 방법
1. 모바일 티켓 (권장) - 카카오톡으로 즉시 수령
2. 현장 발권 - 신분증 지참 후 현장 발권소에서 수령
3. 등기 우편 - 공연 2주 전 배송 (배송비 별도)

### 유의사항
* 1인당 최대 4매까지 예매 가능
* 티켓 예매 후 변경 및 교환 불가
* 본인 확인을 위한 신분증 지참 필수
* 공연 당일 입장 시작은 공연 1시간 전부터

---

## 🎁 특전 혜택

### 전 좌석 공통
* 공식 프로그램북 (72페이지, 화보 및 인터뷰 수록)
* 포토카드 랜덤 1매 (총 20종)
* 스페셜 포스터 (A2 사이즈)

### VIP석 추가 혜택
* 한정판 포토북 (하드커버, 200페이지)
* 친필 사인 포토카드 추첨 기회
* 사운드체크 참관 추첨권 (회차당 100명)
* 단독 굿즈 세트 (응원봉 케이스, 에코백, 키링)

---

## 🚗 교통 및 주차 안내

### 대중교통
* 지하철: 2호선/8호선 잠실역 6번 출구
* 버스: 301, 341, 360, 3217, 3314, 3317, 3411, 3414

### 주차
* 올림픽공원 주차장 이용 가능 (유료)
* 공연일에는 교통 혼잡이 예상되니 대중교통 이용 권장
* 주차 요금: 10분당 500원

---

## ⚠️ 환불 및 취소 규정

### 취소 수수료
* 공연 7일 전까지: 티켓 금액의 10%
* 공연 3~6일 전: 티켓 금액의 20%
* 공연 1~2일 전: 티켓 금액의 30%
* 공연 당일: 취소 및 환불 불가

### 환불 불가 사유
* 단순 변심
* 티켓 분실 및 훼손
* 공연 시작 후

---

## 💬 자주 묻는 질문 (FAQ)

Q. 재입장이 가능한가요?
A. 아니요. 1회 퇴장 시 재입장이 불가능합니다.

Q. 음식물 반입이 가능한가요?
A. 생수(페트병)만 반입 가능합니다. 음식물 및 음료는 반입이 제한됩니다.

Q. 카메라 촬영이 가능한가요?
A. 전문 카메라 및 영상 장비는 반입이 불가능합니다. 휴대폰 촬영은 가능하나, 플래시 사용은 금지됩니다.

Q. 미성년자도 혼자 입장 가능한가요?
A. 만 7세 이상이면 보호자 동반 없이 입장 가능합니다.

---

## 📞 고객센터 문의

* 전화: 1588-0000 (평일 09:00~18:00)
* 이메일: support@winnticket.co.kr
* 카카오톡: @윈티켓고객센터

공연과 관련하여 궁금하신 사항은 언제든지 문의해주세요!

> 지금 바로 예매하고 아이유와 함께하는 황금빛 시간을 경험하세요!
`,
    visible: true,
    displayOrder: 1,
    createdAt: "2025-01-15T00:00:00Z",
    updatedAt: "2025-11-02T14:30:00Z",
  },
  {
    id: "prod-002",
    code: "T2025002",
    name: "뮤지컬 <위키드> - 샤롯데씨어터",
    categoryId: "e6ed5bf9-86b3-4aee-84bc-3a1a66546f22", // 
    categoryName: "뮤지컬",
    partnerId: "partner-001",
    partnerName: "샤롯데씨어터",
    price: 170000,
    discountPrice: 140000,
    salesStatus: SalesStatus.ON_SALE,
    salesStartDate: "2025-01-01T00:00:00Z",
    salesEndDate: "2025-12-31T23:59:59Z",
    stock: 85,
    options: [
      {
        id: "hotel-001-opt-001",
        name: "객실 타입",
        code: "ROOM_TYPE",
        required: true,
        displayOrder: 1,
        visible: true,
        createdAt: "2025-01-15T00:00:00Z",
        updatedAt: "2025-01-15T00:00:00Z",
        values: [
          { id: "hotel-001-opt-001-val-001", optionId: "hotel-001-opt-001", value: "스탠다드 더블", code: "STANDARD_DOUBLE", additionalPrice: 0, displayOrder: 1, visible: true },
          { id: "hotel-001-opt-001-val-002", optionId: "hotel-001-opt-001", value: "디럭스 트윈", code: "DELUXE_TWIN", additionalPrice: 50000, displayOrder: 2, visible: true },
          { id: "hotel-001-opt-001-val-003", optionId: "hotel-001-opt-001", value: "스위트룸", code: "SUITE", additionalPrice: 150000, displayOrder: 3, visible: true },
        ],
      },
    ],
    datePrices: [
      {
        id: "hotel-dp-001",
        productId: "HOTEL_PACKAGE_001",
        startDate: "2025-12-15",
        endDate: "2025-12-25",
        optionId: "hotel-001-opt-001",
        optionName: "객실 타입",
        optionValueId: "hotel-001-opt-001-val-001",
        optionValueName: "스탠다드 더블",
        price: 299000,
        discountPrice: 280000,
        createdAt: "2025-01-15T00:00:00Z",
      },
      {
        id: "hotel-dp-002",
        productId: "HOTEL_PACKAGE_001",
        startDate: "2025-12-26",
        endDate: "2025-12-31",
        optionId: "hotel-001-opt-001",
        optionName: "객실 타입",
        optionValueId: "hotel-001-opt-001-val-001",
        optionValueName: "스탠다드 더블",
        price: 350000,
        discountPrice: 330000,
        createdAt: "2025-01-15T00:00:00Z",
      },
      {
        id: "hotel-dp-003",
        productId: "HOTEL_PACKAGE_001",
        startDate: "2025-12-15",
        endDate: "2025-12-25",
        optionId: "hotel-001-opt-001",
        optionName: "객실 타입",
        optionValueId: "hotel-001-opt-001-val-002",
        optionValueName: "디럭스 트윈",
        price: 349000,
        discountPrice: 320000,
        createdAt: "2025-01-15T00:00:00Z",
      },
      {
        id: "hotel-dp-004",
        productId: "HOTEL_PACKAGE_001",
        startDate: "2025-12-26",
        endDate: "2025-12-31",
        optionId: "hotel-001-opt-001",
        optionName: "객실 타입",
        optionValueId: "hotel-001-opt-001-val-002",
        optionValueName: "디럭스 트윈",
        price: 400000,
        discountPrice: 370000,
        createdAt: "2025-01-15T00:00:00Z",
      },
      {
        id: "hotel-dp-005",
        productId: "HOTEL_PACKAGE_001",
        startDate: "2025-12-15",
        endDate: "2025-12-25",
        optionId: "hotel-001-opt-001",
        optionName: "객실 타입",
        optionValueId: "hotel-001-opt-001-val-003",
        optionValueName: "스위트룸",
        price: 499000,
        discountPrice: 450000,
        createdAt: "2025-01-15T00:00:00Z",
      },
      {
        id: "hotel-dp-006",
        productId: "HOTEL_PACKAGE_001",
        startDate: "2025-12-26",
        endDate: "2025-12-31",
        optionId: "hotel-001-opt-001",
        optionName: "객실 타입",
        optionValueId: "hotel-001-opt-001-val-003",
        optionValueName: "스위트룸",
        price: 550000,
        discountPrice: 500000,
        createdAt: "2025-01-15T00:00:00Z",
      },
    ],
    description: "제주도 오션뷰 호텔 1박 + 공연 티켓이 포함된 특별 패키지입니다. 날짜별로 다른 가격이 적용됩니다.",
    imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop",
    imageUrls: [
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=600&fit=crop",
    ],
    detailImages: [
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=600&fit=crop",
    ],
    shippingInfo: "체크인 시 프론트에서 티켓 수령",
    warrantyInfo: "100% 예약 보장",
    returnInfo: "체크인 3일 전까지 취소 가능 (취소 수수료 10%)",
    detailContent: `# 제주 오션뷰 호텔 + 공연 티켓 패키지

![제주 오션뷰 호텔](https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&h=800&fit=crop)

## 🏨 패키지 포함 내역

* **오션뷰 객실 1박** - 탁 트인 바다 전망
* **조식 2인 제공** - 호텔 레스토랑 뷔페
* **제주 아레나 공연 티켓 2매** - R석 이상 보장
* **호텔-공연장 왕복 셔틀버스** - 편리한 이동 서비스
* **웰컴 드링크** - 체크인 시 제공
* **무료 주차** - 발레파킹 서비스

![호텔 객실](https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1200&h=800&fit=crop)

---

## 🏖️ 객실 소개

### 스탠다드 더블 (280,000원~)
* 킹사이즈 침대
* 42인치 스마트 TV
* 미니바 & 커피머신
* 바다 전망 발코니
* 객실 크기: 33㎡

### 디럭스 트윈 (320,000원~)
* 트윈 침대
* 55인치 스마트 TV
* 프리미엄 어메니티
* 넓은 오션뷰 발코니
* 객실 크기: 45㎡

### 스위트룸 (450,000원~)
* 킹사이즈 침대 + 거실 공간
* 65인치 스마트 TV
* 네스프레소 머신
* 프라이빗 테라스
* 객실 크기: 66㎡
* VIP 라운지 이용 가능

![호텔 전경](https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&h=800&fit=crop)

---

## 📅 날짜별 가격 안내

### 평일 기간 (12/15~12/25)
* 스탠다드 더블: 280,000원
* 디럭스 트윈: 320,000원
* 스위트룸: 450,000원

### 주말/성수기 (12/26~12/31)
* 스탠다드 더블: 330,000원
* 디럭스 트윈: 370,000원
* 스위트룸: 500,000원

> 💡 **Tip:** 체크인/체크아웃 날짜를 선택하면 자동으로 총 금액이 계산됩니다!

![레스토랑](https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&h=800&fit=crop)

---

## ✨ 특별 특전

### 🎫 공연 티켓 혜택
* R석 이상 보장 (좌석 배정은 선착순)
* 공연 30분 전 VIP 라운지 이용
* 공연장 주차 무료

### 🏨 호텔 부대시설
* **스파 & 사우나** - 무료 이용
* **피트니스 센터** - 24시간 운영
* **루프탑 바** - 선셋 타임 칵테일 서비스
* **키즈 플레이룸** - 가족 고객 환영

### 🚗 셔틀 서비스
* 공연 시작 1시간 전 출발
* 공연 종료 후 즉시 운행
* 정시 운행 보장

---

## 🎯 이용 안내

### 체크인/체크아웃
* 체크인: 15:00 / 체크아웃: 11:00
* 레이트 체크아웃 14시까지 무료

### 공연 정보
* 장소: 제주 아레나 (차량 15분 거리)
* 좌석: R석 이상 랜덤 배정
* 티켓 수령: 체크인 시 프론트에서 전달

### 취소 규정
* 3일 전까지: 취소 수수료 10%
* 2일 전: 취소 수수료 30%
* 1일 전~당일: 취소 불가

---

## 📞 문의하기

궁금하신 사항은 언제든 연락주세요!

* **전화:** 064-123-4567
* **카카오톡:** @제주그랜드호텔
* **이메일:** booking@jejugrand.com

> 🌊 **제주의 아름다운 바다와 함께하는 특별한 하루, 지금 예약하세요!**
`,
    isBest: true,
    isNew: true,
    isSale: true,
    visible: true,
    displayOrder: 2,
    createdAt: "2025-01-15T00:00:00Z",
    updatedAt: "2025-12-15T14:30:00Z",
  },
  {
    id: "prod-003",
    code: "T2025003",
    name: "SSG 랜더스 vs LG 트윈스 - 야구",
    categoryId: "ed4439dd-db88-4880-a10f-ebed71b9e52f", // 
    categoryName: "뮤지컬",
    partnerId: "partner-001",
    partnerName: "샤롯데씨어터",
    price: 170000,
    discountPrice: 140000,
    salesStatus: SalesStatus.ON_SALE,
    salesStartDate: "2025-01-01T00:00:00Z",
    salesEndDate: "2025-12-31T23:59:59Z",
    stock: 85,
    options: [
      {
        id: "prod-002-opt-001",
        name: "좌석 등급",
        code: "SEAT_GRADE",
        required: true,
        displayOrder: 1,
        visible: true,
        createdAt: "2025-02-10T00:00:00Z",
        updatedAt: "2025-02-10T00:00:00Z",
        values: [
          { id: "prod-002-opt-001-val-001", optionId: "prod-002-opt-001", value: "VIP석", code: "SEAT_VIP", additionalPrice: 40000, displayOrder: 1, visible: true },
          { id: "prod-002-opt-001-val-002", optionId: "prod-002-opt-001", value: "R석", code: "SEAT_R", additionalPrice: 0, displayOrder: 2, visible: true },
          { id: "prod-002-opt-001-val-003", optionId: "prod-002-opt-001", value: "S석", code: "SEAT_S", additionalPrice: -40000, displayOrder: 3, visible: true },
          { id: "prod-002-opt-001-val-004", optionId: "prod-002-opt-001", value: "A석", code: "SEAT_A", additionalPrice: -80000, displayOrder: 4, visible: true },
        ],
      },
    ],
    description: "브로드웨이 최고의 뮤지컬, 위키드가 한국에서 펼쳐집니다. 마법과 우정의 이야기를 만나보세요.",
    imageUrl: "https://images.unsplash.com/photo-1764448473282-d474ee0b83e1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtdXNpY2FsJTIwdGhlYXRlciUyMHBlcmZvcm1hbmNlfGVufDF8fHx8MTc2NDc0NzMwMXww&ixlib=rb-4.1.0&q=80&w=1080",
    detailImages: [
      "https://images.unsplash.com/photo-1764448473282-d474ee0b83e1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtdXNpY2FsJTIwdGhlYXRlciUyMHBlcmZvcm1hbmNlfGVufDF8fHx8MTc2NDc0NzMwMXww&ixlib=rb-4.1.0&q=80&w=1080",
    ],
    shippingInfo: "모바일 티켓 또는 현장 수령",
    warrantyInfo: "공식 예매처 정품 보장",
    returnInfo: "공연일 10일 전까지 전액 환불",
    detailContent: `🎭 작품 소개
오즈의 마법사의 프리퀄 스토리! 엘파바와 글린다의 우정과 갈등을 그린 감동적인 뮤지컬

📍 공연 정보
- 장소: 샤롯데씨어터 (잠실)
- 공연시간: 약 2시간 40분 (인터미션 포함)
- 관람연령: 8세 이상

🌟 주요 출연진
- 엘파바 역: 옥주현, 정선아
- 글린다 역: 박혜나, 김보경

💚 환불 안내
- 공연일 10일 전까지: 전액 환불
- 공연일 7일 전까지: 90% 환불
- 공연일 3일 전까지: 70% 환불`,
    visible: true,
    displayOrder: 2,
    createdAt: "2025-02-10T00:00:00Z",
    updatedAt: "2025-11-01T09:15:00Z",
  },
  {
    id: "prod-003",
    code: "T2025003",
    name: "SSG 랜더스 vs LG 트윈스 - 야구",
    categoryId: "ed4439dd-db88-4880-a10f-ebed71b9e52f", // 
    categoryName: "야구",
    partnerId: "partner-004",
    partnerName: "KBO 프로야구",
    price: 15000,
    salesStatus: SalesStatus.ON_SALE,
    stock: 245,
    options: [
      {
        id: "prod-003-opt-001",
        name: "좌석 구역",
        code: "SEAT_ZONE",
        required: true,
        displayOrder: 1,
        visible: true,
        createdAt: "2025-10-20T00:00:00Z",
        updatedAt: "2025-10-20T00:00:00Z",
        values: [
          { id: "prod-003-opt-001-val-001", optionId: "prod-003-opt-001", value: "테이블석", code: "ZONE_TABLE", additionalPrice: 20000, displayOrder: 1, visible: true },
          { id: "prod-003-opt-001-val-002", optionId: "prod-003-opt-001", value: "중앙석", code: "ZONE_CENTER", additionalPrice: 5000, displayOrder: 2, visible: true },
          { id: "prod-003-opt-001-val-003", optionId: "prod-003-opt-001", value: "외야석", code: "ZONE_OUTFIELD", additionalPrice: 0, displayOrder: 3, visible: true },
        ],
      },
    ],
    description: "인천 SSG 랜더스 필드에서 펼쳐지는 프로야구 경기. 치킨과 맥주를 즐기며 응원하세요!",
    imageUrl: "https://images.unsplash.com/photo-1650124077853-b6fcb0231cc7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXNlYmFsbCUyMHN0YWRpdW0lMjBnYW1lfGVufDF8fHx8MTc2NDY1MDUzN3ww&ixlib=rb-4.1.0&q=80&w=1080",
    shippingInfo: "모바일 티켓 즉시 발송",
    warrantyInfo: "KBO 공식 티켓 보장",
    returnInfo: "경기 시작 3시간 전까지 취소 가능",
    visible: true,
    displayOrder: 3,
    createdAt: "2025-10-20T00:00:00Z",
    updatedAt: "2025-11-03T08:00:00Z",
  },
  {
    id: "prod-004",
    code: "T2025004",
    name: "BTS 정국 솔로 콘서트 <Golden>",
    categoryId: "3924a177-bd9f-4d63-a557-9c52b6ae8f67", // 
    categoryName: "콘서트",
    partnerId: "PARTNER-HYBE",
    partnerName: "하이브 엔터테인먼트",
    price: 198000,
    discountPrice: 154000,
    salesStatus: SalesStatus.ON_SALE,
    salesStartDate: "2025-01-01T00:00:00Z",
    salesEndDate: "2025-12-31T23:59:59Z",
    stock: 200,
    options: [],
    description: "BTS 정국의 첫 솔로 콘서트! 잠실 올림픽 주경기장에서 특별한 무대를 만나보세요.",
    imageUrl: "https://images.unsplash.com/photo-1760539620239-5906775b0055?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxrcG9wJTIwY29uY2VydCUyMGNyb3dkfGVufDF8fHx8MTc2NDc0NzMwMXww&ixlib=rb-4.1.0&q=80&w=1080",
    shippingInfo: "모바일 티켓 또는 현장 수령 (경기 당일)",
    warrantyInfo: "공식 판매처 정품 티켓",
    returnInfo: "공연일 10일 전까지 취소 가능 (수수료 발생)",
    visible: true,
    displayOrder: 4,
    createdAt: "2025-03-05T00:00:00Z",
    updatedAt: "2025-11-02T16:45:00Z",
  },
  {
    id: "prod-005",
    code: "T2025005",
    name: "서울 재즈 페스티벌 2025",
    categoryId: "507c0ead-c0d2-4dae-a509-86e8543a406b", // 
    categoryName: "락페",
    partnerId: "partner-005",
    partnerName: "인터파크 프로모션",
    price: 88000,
    salesStatus: SalesStatus.ON_SALE,
    stock: 320,
    options: [
      {
        id: "prod-005-opt-001",
        name: "입장 타입",
        code: "ENTRY_TYPE",
        required: true,
        displayOrder: 1,
        visible: true,
        createdAt: "2025-10-25T00:00:00Z",
        updatedAt: "2025-10-25T00:00:00Z",
        values: [
          { id: "prod-005-opt-001-val-001", optionId: "prod-005-opt-001", value: "1일권", code: "DAY_1", additionalPrice: 0, displayOrder: 1, visible: true },
          { id: "prod-005-opt-001-val-002", optionId: "prod-005-opt-001", value: "2일권", code: "DAY_2", additionalPrice: 60000, displayOrder: 2, visible: true },
          { id: "prod-005-opt-001-val-003", optionId: "prod-005-opt-001", value: "전체패스", code: "ALL_PASS", additionalPrice: 100000, displayOrder: 3, visible: true },
        ],
      },
    ],
    description: "올림픽공원에서 열리는 국내 최대 재즈 페스티벌. 국내외 유명 아티스트들의 공연을 즐기세요.",
    imageUrl: "https://images.unsplash.com/photo-1562593921-f18e5b6e86fb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxqYXp6JTIwZmVzdGl2YWwlMjBtdXNpY3xlbnwxfHx8fDE3NjQ3NDczMDJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    shippingInfo: "모바일 티켓 또는 현장 교환권",
    warrantyInfo: "공식 페스티벌 티켓 보장",
    returnInfo: "행사 30일 전까지 전액 환불 가능",
    visible: true,
    displayOrder: 5,
    createdAt: "2025-10-25T00:00:00Z",
    updatedAt: "2025-11-03T07:30:00Z",
  },
  {
    id: "prod-006",
    code: "T2025006",
    name: "국립중앙박물관 특별전 <고려의 미>",
    categoryId: "579cf704-0413-4e13-b0d6-9eaf99435eb1", // 
    categoryName: "미술전",
    partnerId: "partner-006",
    partnerName: "국립중앙박물관",
    price: 25000,
    discountPrice: 18000,
    salesStatus: SalesStatus.ON_SALE,
    salesStartDate: "2025-01-01T00:00:00Z",
    salesEndDate: "2025-12-31T23:59:59Z",
    stock: 195,
    options: [
      {
        id: "prod-006-opt-001",
        name: "관람 시간",
        code: "TIME_SLOT",
        required: true,
        displayOrder: 1,
        visible: true,
        createdAt: "2025-04-12T00:00:00Z",
        updatedAt: "2025-04-12T00:00:00Z",
        values: [
          { id: "prod-006-opt-001-val-001", optionId: "prod-006-opt-001", value: "오전 (10:00-13:00)", code: "TIME_AM", additionalPrice: 0, displayOrder: 1, visible: true },
          { id: "prod-006-opt-001-val-002", optionId: "prod-006-opt-001", value: "오후 (14:00-17:00)", code: "TIME_PM", additionalPrice: 0, displayOrder: 2, visible: true },
        ],
      },
    ],
    description: "고려시대 문화유산을 한눈에 볼 수 있는 특별 전시회. 청자, 불화, 금속공예품 등 국보급 유물 전시.",
    imageUrl: "https://images.unsplash.com/photo-1706665714936-3211c96474c8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtdXNldW0lMjBhcnQlMjBleGhpYml0aW9ufGVufDF8fHx8MTc2NDc0NzM3MHww&ixlib=rb-4.1.0&q=80&w=1080",
    shippingInfo: "현장 수령 또는 모바일 티켓",
    warrantyInfo: "국립중앙박물관 공식 티켓",
    returnInfo: "관람일 7일 전까지 취소 가능",
    visible: true,
    displayOrder: 6,
    createdAt: "2025-04-12T00:00:00Z",
    updatedAt: "2025-11-02T11:20:00Z",
  },
  {
    id: "prod-007",
    code: "T2025007",
    name: "서울시향 정기연주회 - 차이콥스키 교향곡",
    categoryId: "d4071926-d76e-4909-93a0-253b66ec36e3", // 
    categoryName: "오페라",
    price: 70000,
    salesStatus: SalesStatus.ON_SALE,
    stock: 160,
    options: [
      {
        id: "prod-007-opt-001",
        name: "좌석 등급",
        code: "SEAT_GRADE",
        required: true,
        displayOrder: 1,
        visible: true,
        createdAt: "2025-10-28T00:00:00Z",
        updatedAt: "2025-10-28T00:00:00Z",
        values: [
          { id: "prod-007-opt-001-val-001", optionId: "prod-007-opt-001", value: "R석", code: "SEAT_R", additionalPrice: 30000, displayOrder: 1, visible: true },
          { id: "prod-007-opt-001-val-002", optionId: "prod-007-opt-001", value: "S석", code: "SEAT_S", additionalPrice: 0, displayOrder: 2, visible: true },
          { id: "prod-007-opt-001-val-003", optionId: "prod-007-opt-001", value: "A석", code: "SEAT_A", additionalPrice: -20000, displayOrder: 3, visible: true },
        ],
      },
    ],
    description: "예술의전당 콘서트홀에서 펼쳐지는 클래식 음악회. 차이콥스키 교향곡 4번, 5번 연주.",
    imageUrl: "https://images.unsplash.com/photo-1719479757967-c61fd530c625?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjbGFzc2ljYWwlMjBvcmNoZXN0cmElMjBwZXJmb3JtYW5jZXxlbnwxfHx8fDE3NjQ3NDczNzB8MA&ixlib=rb-4.1.0&q=80&w=1080",
    shippingInfo: "모바일 티켓 또는 현장 수령",
    warrantyInfo: "예술의전당 공식 티켓",
    returnInfo: "공연일 3일 전까지 취소 가능 (취소 수수료 10%)",
    visible: true,
    displayOrder: 7,
    createdAt: "2025-10-28T00:00:00Z",
    updatedAt: "2025-11-03T09:00:00Z",
  },
  {
    id: "prod-008",
    code: "T2025008",
    name: "2024-25 프로농구 KBL - 서울 SK vs 안양 KGC",
    categoryId: "05965a24-5dcb-4146-9246-b2adc07b3936", // 
    categoryName: "스포츠",
    price: 35000,
    discountPrice: 25000,
    salesStatus: SalesStatus.ON_SALE,
    salesStartDate: "2025-01-01T00:00:00Z",
    salesEndDate: "2025-12-31T23:59:59Z",
    stock: 340,
    options: [
      {
        id: "prod-008-opt-001",
        name: "좌석 구역",
        code: "SEAT_ZONE",
        required: true,
        displayOrder: 1,
        visible: true,
        createdAt: "2025-01-20T00:00:00Z",
        updatedAt: "2025-01-20T00:00:00Z",
        values: [
          { id: "prod-008-opt-001-val-001", optionId: "prod-008-opt-001", value: "코트사이드", code: "ZONE_COURTSIDE", additionalPrice: 40000, displayOrder: 1, visible: true },
          { id: "prod-008-opt-001-val-002", optionId: "prod-008-opt-001", value: "중앙석", code: "ZONE_CENTER", additionalPrice: 10000, displayOrder: 2, visible: true },
          { id: "prod-008-opt-001-val-003", optionId: "prod-008-opt-001", value: "자유석", code: "ZONE_FREE", additionalPrice: 0, displayOrder: 3, visible: true },
        ],
      },
      {
        id: "prod-008-opt-002",
        name: "응원 팀",
        code: "SUPPORT_TEAM",
        required: true,
        displayOrder: 2,
        visible: true,
        createdAt: "2025-01-20T00:00:00Z",
        updatedAt: "2025-01-20T00:00:00Z",
        values: [
          { id: "prod-008-opt-002-val-001", optionId: "prod-008-opt-002", value: "서울 SK", code: "TEAM_SK", additionalPrice: 0, displayOrder: 1, visible: true },
          { id: "prod-008-opt-002-val-002", optionId: "prod-008-opt-002", value: "안양 KGC", code: "TEAM_KGC", additionalPrice: 0, displayOrder: 2, visible: true },
        ],
      },
    ],
    description: "잠실 학생체육관에서 열리는 프로농구 경기. 열정적인 응원과 박진감 넘치는 경기를 즐기세요!",
    imageUrl: "https://images.unsplash.com/photo-1634813052369-3584119ccd2a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzb2NjZXIlMjBmb290YmFsbCUyMHN0YWRpdW18ZW58MXx8fHwxNzY0NzI0NDI5fDA&ixlib=rb-4.1.0&q=80&w=1080",
    shippingInfo: "모바일 티켓 즉시 발송",
    warrantyInfo: "KBL 공식 티켓 보장",
    returnInfo: "경기 시작 2시간 전까지 취소 가능",
    visible: true,
    displayOrder: 8,
    createdAt: "2025-01-20T00:00:00Z",
    updatedAt: "2025-11-02T13:10:00Z",
  },
  {
    id: "prod-009",
    code: "T2025009",
    name: "뮤지컬 <팬텀> - 블루스퀘어",
    categoryId: "e6ed5bf9-86b3-4aee-84bc-3a1a66546f22", // 
    categoryName: "뮤지컬",
    partnerId: "PARTNER-CHARLOTTE",
    partnerName: "샤롯데씨어터",
    price: 150000,
    discountPrice: 135000,
    salesStatus: SalesStatus.ON_SALE,
    salesStartDate: "2025-01-01T00:00:00Z",
    salesEndDate: "2025-12-31T23:59:59Z",
    stock: 110,
    options: [],
    description: "로맨틱한 사랑과 음악이 어우러진 뮤지컬 팬텀. 블루스퀘어에서 펼쳐지는 환상적인 무대.",
    imageUrl: "https://images.unsplash.com/photo-1686435386310-92ee42a3580f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYWxsZXQlMjBkYW5jZSUyMHBlcmZvcm1hbmNlfGVufDF8fHx8MTc2NDcxNDE2OHww&ixlib=rb-4.1.0&q=80&w=1080",
    shippingInfo: "모바일 티켓 또는 현장 수령",
    warrantyInfo: "공식 예매처 정품 보장",
    returnInfo: "공연일 7일 전까지 취소 가능",
    visible: true,
    displayOrder: 9,
    createdAt: "2025-02-15T00:00:00Z",
    updatedAt: "2025-11-03T10:00:00Z",
  },
  {
    id: "prod-010",
    code: "T2025010",
    name: "에스파(aespa) 2025 월드투어 서울",
    categoryId: "3924a177-bd9f-4d63-a557-9c52b6ae8f67", // 
    categoryName: "콘서트",
    partnerId: "PARTNER-HYBE",
    partnerName: "하이브 엔터테인먼트",
    price: 143000,
    discountPrice: 121000,
    salesStatus: SalesStatus.ON_SALE,
    salesStartDate: "2025-01-01T00:00:00Z",
    salesEndDate: "2025-12-31T23:59:59Z",
    stock: 180,
    options: [],
    description: "에스파의 월드투어 서울 공연! Next Level, Savage 등 히트곡을 라이브로 만나보세요.",
    imageUrl: "https://images.unsplash.com/photo-1706448474956-22099fe780c8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxrcG9wJTIwZ2lybCUyMGdyb3VwJTIwY29uY2VydHxlbnwxfHx8fDE3NjQ3NDc0OTd8MA&ixlib=rb-4.1.0&q=80&w=1080",
    shippingInfo: "모바일 티켓 발송",
    warrantyInfo: "100% 정품 티켓 보장",
    returnInfo: "공연일 7일 전까지 취소 가능",
    visible: true,
    displayOrder: 10,
    createdAt: "2025-03-10T00:00:00Z",
    updatedAt: "2025-11-03T11:00:00Z",
  },
  {
    id: "prod-011",
    code: "T2025011",
    name: "서울랜드 자유이용권",
    categoryId: "c5f178ae-c927-4cfe-a11a-0e7ce2434f32", // 
    categoryName: "어린이 영화",
    partnerId: "PARTNER-OLYMPIC-PARK",
    partnerName: "올림픽공원 체조경기장",
    price: 56000,
    discountPrice: 42000,
    salesStatus: SalesStatus.ON_SALE,
    salesStartDate: "2025-01-01T00:00:00Z",
    salesEndDate: "2025-12-31T23:59:59Z",
    stock: 500,
    options: [],
    description: "서울랜드 자유이용권으로 모든 놀이기구를 무제한 이용하세요. 가족 나들이에 최적!",
    imageUrl: "https://images.unsplash.com/photo-1638450096618-7774f1cdb5d5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbXVzZW1lbnQlMjBwYXJrJTIwcmlkZXN8ZW58MXx8fHwxNzY0NzQ3NTExfDA&ixlib=rb-4.1.0&q=80&w=1080",
    shippingInfo: "모바일 티켓 또는 현장 교환",
    warrantyInfo: "공식 티켓 보장",
    returnInfo: "사용 전까지 취소 가능",
    visible: true,
    displayOrder: 11,
    createdAt: "2025-04-05T00:00:00Z",
    updatedAt: "2025-11-02T14:00:00Z",
  },
  {
    id: "prod-012",
    code: "T2025012",
    name: "FC 서울 vs 수원 삼성 - K리그",
    categoryId: "d78ea6e2-20fd-4e29-8fd9-b76452083e7e", // 
    categoryName: "축구",
    partnerId: "partner-004",
    partnerName: "KBO 프로야구",
    price: 20000,
    salesStatus: SalesStatus.ON_SALE,
    stock: 280,
    options: [],
    description: "서울월드컵경기장에서 열리는 K리그 더비 매치! 열정적인 응원을 즐기세요.",
    imageUrl: "https://images.unsplash.com/photo-1568495019994-e9f1045bf0ac?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzb2NjZXIlMjBmb290YmFsbCUyMG1hdGNofGVufDF8fHx8MTc2NDY1MDUzN3ww&ixlib=rb-4.1.0&q=80&w=1080",
    shippingInfo: "모바일 티켓 즉시 발송",
    warrantyInfo: "K리그 공식 티켓",
    returnInfo: "경기 시작 3시간 전까지 취소 가능",
    visible: true,
    displayOrder: 12,
    createdAt: "2025-05-01T00:00:00Z",
    updatedAt: "2025-11-03T09:30:00Z",
  },
  {
    id: "prod-013",
    code: "T2025013",
    name: "뮤지컬 <시카고> - 디큐브아트센터",
    categoryId: "e6ed5bf9-86b3-4aee-84bc-3a1a66546f22", // 
    categoryName: "뮤지컬",
    partnerId: "PARTNER-CHARLOTTE",
    partnerName: "샤롯데씨어터",
    price: 140000,
    discountPrice: 120000,
    salesStatus: SalesStatus.ON_SALE,
    salesStartDate: "2025-01-01T00:00:00Z",
    salesEndDate: "2025-12-31T23:59:59Z",
    stock: 95,
    options: [],
    description: "브로드웨이의 전설적인 뮤지컬 시카고! 재즈와 범죄의 도시 이야기.",
    imageUrl: "https://images.unsplash.com/photo-1763215733028-02803292649c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxqYXp6JTIwbXVzaWNhbCUyMGJyb2Fkd2F5fGVufDF8fHx8MTc2NDc0NzUzMXww&ixlib=rb-4.1.0&q=80&w=1080",
    shippingInfo: "모바일 티켓 또는 현장 수령",
    warrantyInfo: "공식 예매처 정품 보장",
    returnInfo: "공연일 10일 전까지 전액 환불",
    visible: true,
    displayOrder: 13,
    createdAt: "2025-05-15T00:00:00Z",
    updatedAt: "2025-11-02T15:00:00Z",
  },
  {
    id: "prod-014",
    code: "T2025014",
    name: "국립발레단 <백조의 호수>",
    categoryId: "d4071926-d76e-4909-93a0-253b66ec36e3", // 
    categoryName: "오페라",
    partnerId: "PARTNER-SEJONG",
    partnerName: "세종문화회관",
    price: 90000,
    discountPrice: 75000,
    salesStatus: SalesStatus.ON_SALE,
    salesStartDate: "2025-01-01T00:00:00Z",
    salesEndDate: "2025-12-31T23:59:59Z",
    stock: 140,
    options: [],
    description: "클래식 발레의 정수, 백조의 호수. 국립발레��의 우아한 무대를 만나보세요.",
    imageUrl: "https://images.unsplash.com/photo-1684251198295-6c0682080278?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzd2FuJTIwbGFrZSUyMGJhbGxldHxlbnwxfHx8fDE3NjQ3NDc1MzF8MA&ixlib=rb-4.1.0&q=80&w=1080",
    shippingInfo: "현장 수령 또는 모바일 티켓",
    warrantyInfo: "세종문화회관 공식 티켓",
    returnInfo: "공연일 5일 전까지 취소 가능",
    visible: true,
    displayOrder: 14,
    createdAt: "2025-06-01T00:00:00Z",
    updatedAt: "2025-11-03T08:30:00Z",
  },
  {
    id: "prod-015",
    code: "T2025015",
    name: "코엑스 아쿠아리움 입장권",
    categoryId: "dc70480d-7217-4630-871e-8c2238bd4333", // 
    categoryName: "사진전",
    partnerId: "partner-006",
    partnerName: "국립중앙박물관",
    price: 29000,
    discountPrice: 23000,
    salesStatus: SalesStatus.ON_SALE,
    salesStartDate: "2025-01-01T00:00:00Z",
    salesEndDate: "2025-12-31T23:59:59Z",
    stock: 420,
    options: [],
    description: "코엑스 아쿠아리움에서 다양한 해양생물을 만나보세요. 가족 나들이 추천!",
    imageUrl: "https://images.unsplash.com/photo-1635189034042-79680288c0b8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcXVhcml1bSUyMGZpc2glMjBvY2VhbnxlbnwxfHx8fDE3NjQ3NDc1NTV8MA&ixlib=rb-4.1.0&q=80&w=1080",
    shippingInfo: "모바일 티켓 즉시 발송",
    warrantyInfo: "공식 티켓 보장",
    returnInfo: "사용 전까지 환불 가능",
    visible: true,
    displayOrder: 15,
    createdAt: "2025-06-20T00:00:00Z",
    updatedAt: "2025-11-02T12:00:00Z",
  },
  {
    id: "prod-016",
    code: "T2025016",
    name: "세븐틴(SEVENTEEN) 콘서트 <FOLLOW>",
    categoryId: "3924a177-bd9f-4d63-a557-9c52b6ae8f67", // 
    categoryName: "콘서트",
    partnerId: "PARTNER-HYBE",
    partnerName: "하이브 엔터테인먼트",
    price: 165000,
    discountPrice: 143000,
    salesStatus: SalesStatus.ON_SALE,
    salesStartDate: "2025-01-01T00:00:00Z",
    salesEndDate: "2025-12-31T23:59:59Z",
    stock: 175,
    options: [],
    description: "세븐틴의 스타디움 콘서트! 완벽한 퍼포먼스와 무대를 경험하세요.",
    imageUrl: "https://images.unsplash.com/photo-1512352036558-e6fb1f0c8340?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxrcG9wJTIwYm95JTIwZ3JvdXAlMjBjb25jZXJ0fGVufDF8fHx8MTc2NDc0NzU1Nnww&ixlib=rb-4.1.0&q=80&w=1080",
    shippingInfo: "모바일 티켓 발송",
    warrantyInfo: "100% 정품 티켓 보장",
    returnInfo: "공연일 7일 전까지 취소 가능",
    visible: true,
    displayOrder: 16,
    createdAt: "2025-07-01T00:00:00Z",
    updatedAt: "2025-11-03T10:30:00Z",
  },
  {
    id: "prod-017",
    code: "T2025017",
    name: "뮤지컬 <레미제라블> - 샤롯데씨어터",
    categoryId: "e6ed5bf9-86b3-4aee-84bc-3a1a66546f22", // 
    categoryName: "뮤지컬",
    partnerId: "PARTNER-CHARLOTTE",
    partnerName: "샤롯데씨어터",
    price: 180000,
    discountPrice: 150000,
    salesStatus: SalesStatus.ON_SALE,
    salesStartDate: "2025-01-01T00:00:00Z",
    salesEndDate: "2025-12-31T23:59:59Z",
    stock: 80,
    options: [],
    description: "역사상 최고의 뮤지컬, 레미제라블이 한국에서! 감동의 무대를 만나보세요.",
    imageUrl: "https://images.unsplash.com/photo-1639758807437-b3d74b62df2e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsZXMlMjBtaXNlcmFibGVzJTIwbXVzaWNhbHxlbnwxfHx8fDE3NjQ3NDc3MTB8MA&ixlib=rb-4.1.0&q=80&w=1080",
    shippingInfo: "모바일 티켓 또는 현장 수령",
    warrantyInfo: "공식 예매처 정품 보장",
    returnInfo: "공연일 10일 전까지 전액 환불",
    visible: true,
    displayOrder: 17,
    createdAt: "2025-07-15T00:00:00Z",
    updatedAt: "2025-11-02T16:00:00Z",
  },
  {
    id: "prod-018",
    code: "T2025018",
    name: "롯데월드 자유이용권",
    categoryId: "436370c5-f491-4772-976b-d016a69c4ddb", // 
    categoryName: "놀이",
    partnerId: "partner-005",
    partnerName: "인터파크 프로모션",
    price: 62000,
    discountPrice: 48000,
    salesStatus: SalesStatus.ON_SALE,
    salesStartDate: "2025-01-01T00:00:00Z",
    salesEndDate: "2025-12-31T23:59:59Z",
    stock: 600,
    options: [],
    description: "롯데월드 어드벤처 자유이용권! 짜릿한 놀이기구와 퍼레이드를 즐기세요.",
    imageUrl: "https://images.unsplash.com/photo-1622906880189-c0e969b37495?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0aGVtZSUyMHBhcmslMjByb2xsZXIlMjBjb2FzdGVyfGVufDF8fHx8MTc2NDY0MTg0NHww&ixlib=rb-4.1.0&q=80&w=1080",
    shippingInfo: "모바일 티켓 즉시 발송",
    warrantyInfo: "공식 티켓 보장",
    returnInfo: "사용 전까지 환불 가능",
    visible: true,
    displayOrder: 18,
    createdAt: "2025-08-01T00:00:00Z",
    updatedAt: "2025-11-03T09:00:00Z",
  },
  {
    id: "prod-019",
    code: "T2025019",
    name: "KT vs SK 프로야구 - 수원",
    categoryId: "ed4439dd-db88-4880-a10f-ebed71b9e52f", // 
    categoryName: "야구",
    partnerId: "partner-004",
    partnerName: "KBO 프로야구",
    price: 18000,
    salesStatus: SalesStatus.ON_SALE,
    stock: 310,
    options: [],
    description: "수원 KT 위즈 파크에서 열리는 프로야구 경기. 치맥과 함께 응원하세요!",
    imageUrl: "https://images.unsplash.com/photo-1763674752728-2a3b76d3083f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXNlYmFsbCUyMGdhbWUlMjBjcm93ZHxlbnwxfHx8fDE3NjQ3NDc3NDd8MA&ixlib=rb-4.1.0&q=80&w=1080",
    shippingInfo: "모바일 티켓 즉시 발송",
    warrantyInfo: "KBO 공식 티켓",
    returnInfo: "경기 시작 3시간 전까지 취소 가능",
    visible: true,
    displayOrder: 19,
    createdAt: "2025-08-15T00:00:00Z",
    updatedAt: "2025-11-02T17:00:00Z",
  },
  {
    id: "prod-020",
    code: "T2025020",
    name: "국립오페라단 <라 트라비아타>",
    categoryId: "d4071926-d76e-4909-93a0-253b66ec36e3", // 
    categoryName: "오페라",
    partnerId: "PARTNER-SEJONG",
    partnerName: "세종문화회관",
    price: 120000,
    discountPrice: 95000,
    salesStatus: SalesStatus.ON_SALE,
    salesStartDate: "2025-01-01T00:00:00Z",
    salesEndDate: "2025-12-31T23:59:59Z",
    stock: 125,
    options: [],
    description: "베르디의 명작 오페라 라 트라비아타. 국립오페라단의 감동적인 무대.",
    imageUrl: "https://images.unsplash.com/photo-1760280825762-501279acee48?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcGVyYSUyMHBlcmZvcm1hbmNlJTIwc3RhZ2V8ZW58MXx8fHwxNzY0NjY5OTY3fDA&ixlib=rb-4.1.0&q=80&w=1080",
    shippingInfo: "현장 수령 또는 모바일 티켓",
    warrantyInfo: "세종문화회관 공식 티켓",
    returnInfo: "공연일 5일 전까지 취소 가능",
    visible: true,
    displayOrder: 20,
    createdAt: "2025-09-01T00:00:00Z",
    updatedAt: "2025-11-03T07:45:00Z",
  },
  {
    id: "prod-021",
    code: "T2025021",
    name: "뉴진스(NewJeans) 팬미팅",
    categoryId: "3924a177-bd9f-4d63-a557-9c52b6ae8f67", // 
    categoryName: "콘서트",
    partnerId: "PARTNER-HYBE",
    partnerName: "하이브 엔터테인먼트",
    price: 88000,
    discountPrice: 77000,
    salesStatus: SalesStatus.ON_SALE,
    salesStartDate: "2025-01-01T00:00:00Z",
    salesEndDate: "2025-12-31T23:59:59Z",
    stock: 220,
    options: [],
    description: "뉴진스와 함께하는 특별한 팬미팅! OMG, Ditto 등 히트곡 무대와 팬 교류.",
    imageUrl: "https://images.unsplash.com/photo-1686397140330-40f4c9919b58?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxrcG9wJTIwZmFuJTIwbWVldGluZyUyMGV2ZW50fGVufDF8fHx8MTc2NDc0Nzc4MHww&ixlib=rb-4.1.0&q=80&w=1080",
    shippingInfo: "모바일 티켓 발송",
    warrantyInfo: "100% 정품 티켓 보장",
    returnInfo: "공연일 7일 전까지 취소 가능",
    visible: true,
    displayOrder: 21,
    createdAt: "2025-09-15T00:00:00Z",
    updatedAt: "2025-11-03T11:30:00Z",
  },
  {
    id: "prod-022",
    code: "T2025022",
    name: "에버랜드 자유이용권 + 사파리",
    categoryId: "436370c5-f491-4772-976b-d016a69c4ddb", // 
    categoryName: "놀이",
    partnerId: "partner-005",
    partnerName: "인터파크 프로모션",
    price: 72000,
    discountPrice: 59000,
    salesStatus: SalesStatus.ON_SALE,
    salesStartDate: "2025-01-01T00:00:00Z",
    salesEndDate: "2025-12-31T23:59:59Z",
    stock: 550,
    options: [],
    description: "에버랜드 자유이용권과 사파리 입장권 패키지! 가족 나들이 최고의 선택.",
    imageUrl: "https://images.unsplash.com/photo-1559090336-3b19608e6a41?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzYWZhcmklMjB6b28lMjBhbmltYWxzfGVufDF8fHx8MTc2NDc0Nzc4MXww&ixlib=rb-4.1.0&q=80&w=1080",
    shippingInfo: "모바일 티켓 즉시 발송",
    warrantyInfo: "공식 티켓 보장",
    returnInfo: "사용 전까지 환불 가능",
    visible: true,
    displayOrder: 22,
    createdAt: "2025-09-25T00:00:00Z",
    updatedAt: "2025-11-02T13:30:00Z",
  },
  {
    id: "prod-023",
    code: "T2025023",
    name: "뮤지컬 <캣츠> - 블루스퀘어",
    categoryId: "e6ed5bf9-86b3-4aee-84bc-3a1a66546f22", // 
    categoryName: "뮤지컬",
    partnerId: "PARTNER-CHARLOTTE",
    partnerName: "샤롯데씨어터",
    price: 155000,
    discountPrice: 130000,
    salesStatus: SalesStatus.ON_SALE,
    salesStartDate: "2025-01-01T00:00:00Z",
    salesEndDate: "2025-12-31T23:59:59Z",
    stock: 105,
    options: [],
    description: "앤드류 로이드 웨버의 명작 뮤지컬 캣츠! 환상적인 고양이들의 축제.",
    imageUrl: "https://images.unsplash.com/photo-1598814944414-04828cc07434?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXRzJTIwbXVzaWNhbCUyMGJyb2Fkd2F5fGVufDF8fHx8MTc2NDc0NzgyMHww&ixlib=rb-4.1.0&q=80&w=1080",
    shippingInfo: "모바일 티켓 또는 현장 수령",
    warrantyInfo: "공식 예매처 정품 보장",
    returnInfo: "공연일 7일 전까지 취소 가능",
    visible: true,
    displayOrder: 23,
    createdAt: "2025-10-01T00:00:00Z",
    updatedAt: "2025-11-03T10:15:00Z",
  },
  {
    id: "prod-024",
    code: "T2025024",
    name: "BLACKPINK 로제 솔로 콘서트",
    categoryId: "3924a177-bd9f-4d63-a557-9c52b6ae8f67", // 
    categoryName: "콘서트",
    partnerId: "PARTNER-HYBE",
    partnerName: "하이브 엔터테인먼트",
    price: 176000,
    discountPrice: 154000,
    salesStatus: SalesStatus.ON_SALE,
    salesStartDate: "2025-01-01T00:00:00Z",
    salesEndDate: "2025-12-31T23:59:59Z",
    stock: 165,
    options: [],
    description: "블랙핑크 로제의 첫 솔로 콘서트! On The Ground, Gone 등 히트곡 무대.",
    imageUrl: "https://images.unsplash.com/photo-1563681543778-002ee8f3cd8a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmZW1hbGUlMjBzaW5nZXIlMjBjb25jZXJ0JTIwc3RhZ2V8ZW58MXx8fHwxNzY0NzQ3ODIwfDA&ixlib=rb-4.1.0&q=80&w=1080",
    shippingInfo: "모바일 티켓 발송",
    warrantyInfo: "100% 정품 티켓 보장",
    returnInfo: "공연일 7일 전까지 취소 가능",
    visible: true,
    displayOrder: 24,
    createdAt: "2025-10-10T00:00:00Z",
    updatedAt: "2025-11-03T12:00:00Z",
  },
  {
    id: "prod-025",
    code: "T2025025",
    name: "서울시립교향악단 정기연주회",
    categoryId: "d4071926-d76e-4909-93a0-253b66ec36e3", // 
    categoryName: "오페라",
    partnerId: "PARTNER-SEJONG",
    partnerName: "세종문화회관",
    price: 60000,
    discountPrice: 50000,
    salesStatus: SalesStatus.ON_SALE,
    salesStartDate: "2025-01-01T00:00:00Z",
    salesEndDate: "2025-12-31T23:59:59Z",
    stock: 175,
    options: [],
    description: "세종문화회관에서 열리는 서울시립교향악단 정기연주회. 클래식의 감동을 느껴보세요.",
    imageUrl: "https://images.unsplash.com/photo-1519683000900-034603c717b3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzeW1waG9ueSUyMG9yY2hlc3RyYSUyMGhhbGx8ZW58MXx8fHwxNzY0NzQ3ODIxfDA&ixlib=rb-4.1.0&q=80&w=1080",
    shippingInfo: "현장 수령 또는 모바일 티켓",
    warrantyInfo: "세종문화회관 공식 티켓",
    returnInfo: "공연일 3일 전까지 취소 가능",
    visible: true,
    displayOrder: 25,
    createdAt: "2025-10-15T00:00:00Z",
    updatedAt: "2025-11-02T14:30:00Z",
  },
  {
    id: "prod-026",
    code: "T2025026",
    name: "삼성 라이온즈 vs 롯데 자이언츠",
    categoryId: "ed4439dd-db88-4880-a10f-ebed71b9e52f", // 
    categoryName: "야구",
    partnerId: "partner-004",
    partnerName: "KBO 프로야구",
    price: 16000,
    salesStatus: SalesStatus.ON_SALE,
    stock: 295,
    options: [],
    description: "대구 라이온즈 파크에서 열리는 프로야구 경기. 치열한 접전을 응원하세요!",
    imageUrl: "https://images.unsplash.com/photo-1650124077853-b6fcb0231cc7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXNlYmFsbCUyMHN0YWRpdW0lMjBnYW1lfGVufDF8fHx8MTc2NDY1MDUzN3ww&ixlib=rb-4.1.0&q=80&w=1080",
    shippingInfo: "모바일 티켓 즉시 발송",
    warrantyInfo: "KBO 공식 티켓",
    returnInfo: "경기 시작 3시간 전까지 취소 가능",
    visible: true,
    displayOrder: 26,
    createdAt: "2025-10-20T00:00:00Z",
    updatedAt: "2025-11-03T08:45:00Z",
  },
  {
    id: "prod-027",
    code: "T2025027",
    name: "N서울타워 전망대 입장권",
    categoryId: "b6499418-4218-4507-b777-d0f9f02cb4ed", // 
    categoryName: "전시",
    partnerId: "partner-006",
    partnerName: "국립중앙박물관",
    price: 16000,
    discountPrice: 13000,
    salesStatus: SalesStatus.ON_SALE,
    salesStartDate: "2025-01-01T00:00:00Z",
    salesEndDate: "2025-12-31T23:59:59Z",
    stock: 650,
    options: [],
    description: "N서울타워 전망대에서 서울의 아름다운 야경을 감상하세요. 커플 데이트 추천!",
    imageUrl: "https://images.unsplash.com/photo-1734828812812-35d9d06ddd06?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzZW91bCUyMHRvd2VyJTIwbmlnaHQlMjB2aWV3fGVufDF8fHx8MTc2NDc0ODA3OXww&ixlib=rb-4.1.0&q=80&w=1080",
    shippingInfo: "모바일 티켓 즉시 발송",
    warrantyInfo: "공식 티켓 보장",
    returnInfo: "사용 전까지 환불 가능",
    visible: true,
    displayOrder: 27,
    createdAt: "2025-10-22T00:00:00Z",
    updatedAt: "2025-11-02T15:30:00Z",
  },
  {
    id: "prod-028",
    code: "T2025028",
    name: "뮤지컬 <맘마미아> - 샤롯데씨어터",
    categoryId: "e6ed5bf9-86b3-4aee-84bc-3a1a66546f22", // 
    categoryName: "뮤지컬",
    partnerId: "PARTNER-CHARLOTTE",
    partnerName: "샤롯데씨어터",
    price: 145000,
    discountPrice: 125000,
    salesStatus: SalesStatus.ON_SALE,
    salesStartDate: "2025-01-01T00:00:00Z",
    salesEndDate: "2025-12-31T23:59:59Z",
    stock: 90,
    options: [],
    description: "ABBA의 히트곡으로 가득한 뮤지컬 맘마미아! 신나는 무대와 함께 즐거운 시간을.",
    imageUrl: "https://images.unsplash.com/photo-1705482723134-f1703c6336af?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW1tYSUyMG1pYSUyMG11c2ljYWx8ZW58MXx8fHwxNzY0NzQ4MDgwfDA&ixlib=rb-4.1.0&q=80&w=1080",
    shippingInfo: "모바일 티켓 또는 현장 수령",
    warrantyInfo: "공식 예매처 정품 보장",
    returnInfo: "공연일 10일 전까지 전액 환불",
    visible: true,
    displayOrder: 28,
    createdAt: "2025-10-25T00:00:00Z",
    updatedAt: "2025-11-03T09:15:00Z",
  },
  {
    id: "prod-029",
    code: "T2025029",
    name: "트와이스(TWICE) 앵콜 콘서트",
    categoryId: "3924a177-bd9f-4d63-a557-9c52b6ae8f67", // 
    categoryName: "콘서트",
    partnerId: "PARTNER-HYBE",
    partnerName: "하이브 엔터테인먼트",
    price: 154000,
    discountPrice: 132000,
    salesStatus: SalesStatus.ON_SALE,
    salesStartDate: "2025-01-01T00:00:00Z",
    salesEndDate: "2025-12-31T23:59:59Z",
    stock: 190,
    options: [],
    description: "트와이스의 앵콜 콘서트! Feel Special, Fancy 등 대표곡 무대를 만나보세요.",
    imageUrl: "https://images.unsplash.com/photo-1760539620239-5906775b0055?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxrcG9wJTIwdHdpY2UlMjBjb25jZXJ0fGVufDF8fHx8MTc2NDc0ODA4MHww&ixlib=rb-4.1.0&q=80&w=1080",
    shippingInfo: "모바일 티켓 발송",
    warrantyInfo: "100% 정품 티켓 보장",
    returnInfo: "공연일 7일 전까지 취소 가능",
    visible: true,
    displayOrder: 29,
    createdAt: "2025-10-28T00:00:00Z",
    updatedAt: "2025-11-03T11:45:00Z",
  },
  {
    id: "prod-030",
    code: "T2025030",
    name: "국립극장 창극 <심청전>",
    categoryId: "45099b09-fa5e-4ec5-8a27-8cd70ac07da2", // 
    categoryName: "연극",
    partnerId: "PARTNER-SEJONG",
    partnerName: "세종문화회관",
    price: 50000,
    discountPrice: 40000,
    salesStatus: SalesStatus.ON_SALE,
    salesStartDate: "2025-01-01T00:00:00Z",
    salesEndDate: "2025-12-31T23:59:59Z",
    stock: 155,
    options: [],
    description: "한국 전통 예술 창극으로 만나는 심청전. 국립극장의 아름다운 무대.",
    imageUrl: "https://images.unsplash.com/photo-1590501754285-3f90ff9449a7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxrb3JlYW4lMjB0cmFkaXRpb25hbCUyMHRoZWF0ZXIlMjBwZXJmb3JtYW5jZXxlbnwxfHx8fDE3NjQ3NDgxNTJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    shippingInfo: "현장 수령 또는 모바일 티켓",
    warrantyInfo: "국립극장 공식 티켓",
    returnInfo: "공연일 5일 전까지 취소 가능",
    visible: true,
    displayOrder: 30,
    createdAt: "2025-10-30T00:00:00Z",
    updatedAt: "2025-11-03T08:00:00Z",
  },
  // (STAY ) - 
  {
    id: "STAY_RESORT_001",
    code: "STAY001",
    name: "제주 오션뷰 리조트 1박 2일 (조식 포함)",
    categoryId: "cat-stay-001",
    categoryName: "숙박/레저",
    partnerId: "partner-jeju-resort",
    partnerName: "제주 블루오션 리조트",
    productType: "STAY",
    price: 200000,
    discountPrice: 180000,
    salesStatus: SalesStatus.ON_SALE,
    salesStartDate: "2025-02-01T00:00:00Z",
    salesEndDate: "2025-12-31T23:59:59Z",
    stock: 999,
    options: [
      {
        id: "stay-001-opt-001",
        name: "객실 타입",
        code: "ROOM_TYPE",
        priceType: "ADDITIONAL",
        required: true,
        displayOrder: 1,
        visible: true,
        createdAt: "2025-02-01T00:00:00Z",
        updatedAt: "2025-02-01T00:00:00Z",
        values: [
          { id: "stay-001-opt-001-val-001", optionId: "stay-001-opt-001", value: "스탠다드 더블", code: "STANDARD", additionalPrice: 0, stock: 999, displayOrder: 1, visible: true },
          { id: "stay-001-opt-001-val-002", optionId: "stay-001-opt-001", value: "디럭스 트윈", code: "DELUXE", additionalPrice: 50000, stock: 999, displayOrder: 2, visible: true },
          { id: "stay-001-opt-001-val-003", optionId: "stay-001-opt-001", value: "프리미엄 스위트", code: "SUITE", additionalPrice: 100000, stock: 999, displayOrder: 3, visible: true },
        ],
      },
    ],
    datePrices: [],
    description: "제주 동쪽 해안가에 위치한 프리미엄 오션뷰 리조트입니다. 모든 객실에서 탁 트인 바다 전망을 감상하실 수 있습니다.",
    imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop",
    imageUrls: [
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&h=600&fit=crop",
    ],
    detailImages: [],
    shippingInfo: "체크인 시 프론트 데스크에서 안내",
    warrantyInfo: "100% 예약 보장",
    returnInfo: "체크인 3일 전까지 무료 취소 가능",
    detailContent: "제주 블루오션 리조트에 오신 것을 환영합니다.",
    visible: true,
    displayOrder: 31,
    createdAt: "2025-02-01T00:00:00Z",
    updatedAt: "2025-02-01T00:00:00Z",
  },
  {
    id: "prod-stay-001",
    code: "STAY2025001",
    name: "🏨 서울 그랜드 호텔 패키지 (2박 3일)",
    categoryId: "3924a177-bd9f-4d63-a557-9c52b6ae8f67",
    categoryName: "숙박",
    partnerId: "partner-hotel-001",
    partnerName: "서울 그랜드 호텔",
    productType: "PACKAGE",
    price: 450000,
    discountPrice: 399000,
    salesStatus: SalesStatus.ON_SALE,
    salesStartDate: "2025-01-01T00:00:00Z",
    salesEndDate: "2025-12-31T23:59:59Z",
    stock: 50,
    isNew: true,
    isBest: true,
    isSale: true,
    options: [
      {
        id: "stay-001-opt-001",
        name: "객실 타입",
        code: "ROOM_TYPE",
        required: true,
        displayOrder: 1,
        visible: true,
        createdAt: "2025-01-15T00:00:00Z",
        updatedAt: "2025-01-15T00:00:00Z",
        values: [
          { id: "stay-001-opt-001-val-001", optionId: "stay-001-opt-001", value: "스탠다드 더블", code: "STANDARD_DOUBLE", additionalPrice: 0, displayOrder: 1, visible: true },
          { id: "stay-001-opt-001-val-002", optionId: "stay-001-opt-001", value: "디럭스 트윈", code: "DELUXE_TWIN", additionalPrice: 80000, displayOrder: 2, visible: true },
          { id: "stay-001-opt-001-val-003", optionId: "stay-001-opt-001", value: "이그제큐티브 스위트", code: "EXECUTIVE_SUITE", additionalPrice: 200000, displayOrder: 3, visible: true },
        ],
      },
      {
        id: "stay-001-opt-002",
        name: "체크인 날짜",
        code: "CHECKIN_DATE",
        required: true,
        displayOrder: 2,
        visible: true,
        createdAt: "2025-01-15T00:00:00Z",
        updatedAt: "2025-01-15T00:00:00Z",
        values: [
          { id: "stay-001-opt-002-val-001", optionId: "stay-001-opt-002", value: "2025-03-15 (토)", code: "DATE_0315", additionalPrice: 0, displayOrder: 1, visible: true },
          { id: "stay-001-opt-002-val-002", optionId: "stay-001-opt-002", value: "2025-03-22 (토)", code: "DATE_0322", additionalPrice: 0, displayOrder: 2, visible: true },
          { id: "stay-001-opt-002-val-003", optionId: "stay-001-opt-002", value: "2025-03-29 (토)", code: "DATE_0329", additionalPrice: 0, displayOrder: 3, visible: true },
        ],
      },
    ],
    description: "서울 중심부 최고급 호텔에서의 럭셔리한 2박 3일. 조식 포함, 무료 스파 이용권 제공",
    imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
    imageUrls: [
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800",
      "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800",
    ],
    detailImages: [
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800",
    ],
    shippingInfo: "체크인 시 프론트에서 안내",
    warrantyInfo: "100% 예약 보장",
    returnInfo: "체크인 7일 전까지 무료 취소",
    detailContent: `# 서울 그랜드 호텔 프리미엄 패키지

## 🏨 패키지 구성
- 2박 3일 숙박
- 조식 뷔페 (2인, 3회)
- 프리미엄 스파 이용권 (2인)
- 웰컴 드링크 제공

## ✨ 호텔 시설
- 야외 수영장
- 피트니스 센터
- 사우나 & 스파
- 레스토랑 & 바 (3개)`,
    visible: true,
    displayOrder: 2,
    createdAt: "2025-02-05T00:00:00Z",
    updatedAt: "2025-02-05T00:00:00Z",
  },
  {
    id: "prod-stay-002",
    code: "STAY2025002",
    name: "🌊 부산 오션뷰 리조트 (3박 4일)",
    categoryId: "3924a177-bd9f-4d63-a557-9c52b6ae8f67",
    categoryName: "숙박",
    partnerId: "partner-resort-001",
    partnerName: "부산 오션뷰 리조트",
    productType: "PACKAGE",
    price: 680000,
    discountPrice: 599000,
    salesStatus: SalesStatus.ON_SALE,
    salesStartDate: "2025-01-01T00:00:00Z",
    salesEndDate: "2025-12-31T23:59:59Z",
    stock: 35,
    isNew: true,
    isBest: true,
    isSale: true,
    options: [
      {
        id: "stay-002-opt-001",
        name: "객실 타입",
        code: "ROOM_TYPE",
        required: true,
        displayOrder: 1,
        visible: true,
        createdAt: "2025-01-15T00:00:00Z",
        updatedAt: "2025-01-15T00:00:00Z",
        values: [
          { id: "stay-002-opt-001-val-001", optionId: "stay-002-opt-001", value: "오션뷰 더블", code: "OCEAN_DOUBLE", additionalPrice: 0, displayOrder: 1, visible: true },
          { id: "stay-002-opt-001-val-002", optionId: "stay-002-opt-001", value: "프리미엄 오션뷰", code: "PREMIUM_OCEAN", additionalPrice: 120000, displayOrder: 2, visible: true },
          { id: "stay-002-opt-001-val-003", optionId: "stay-002-opt-001", value: "로얄 스위트", code: "ROYAL_SUITE", additionalPrice: 300000, displayOrder: 3, visible: true },
        ],
      },
    ],
    description: "해운대 최고의 오션뷰 리조트에서 즐기는 3박 4일. 전 객실 바다 전망, 조식 포함",
    imageUrl: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800",
    imageUrls: [
      "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800",
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800",
    ],
    detailImages: [
      "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800",
    ],
    shippingInfo: "체크인 시 프론트에서 안내",
    warrantyInfo: "100% 예약 보장",
    returnInfo: "체크인 7일 전까지 무료 취소",
    detailContent: `# 부산 오션뷰 리조트

## 🌊 특별한 경험
- 해운대 해변 도보 3분
- 모든 객실 바다 전망
- 루프탑 인피니티 풀
- 프라이빗 비치 이용`,
    visible: true,
    displayOrder: 3,
    createdAt: "2025-02-05T00:00:00Z",
    updatedAt: "2025-02-05T00:00:00Z",
  },
];

// 
function loadProductOptions(): ProductOption[] {
  const stored = localStorage.getItem(STORAGE_KEY_PRODUCT_OPTIONS);
  return stored ? JSON.parse(stored) : initialProductOptions;
}

function loadProducts(): Product[] {
  if (typeof window === 'undefined') return initialProducts;
  
  const stored = localStorage.getItem(STORAGE_KEY_PRODUCTS);
  if (!stored) {
    // localStorage 
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(initialProducts));
    return initialProducts;
  }
  
  let products = JSON.parse(stored);
  
  return products;
}

// ()
export function resetProductsToInitial(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(initialProducts));
    localStorage.setItem(STORAGE_KEY_PRODUCT_OPTIONS, JSON.stringify(initialProductOptions));
    
    // 
    window.dispatchEvent(new Event('productUpdated'));
  }
}

// 
function saveProductOptions(options: ProductOption[]): void {
  localStorage.setItem(STORAGE_KEY_PRODUCT_OPTIONS, JSON.stringify(options));
}

function saveProducts(products: Product[]): void {
  localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products));
}

// ========== API ==========

/**
 * 상품 옵션 목록 조회
 */
export function getProductOptions(
  page: number = 0,
  size: number = 20,
  searchKeyword?: string
): ProductOptionListResponse {
  let options = loadProductOptions();

  // 
  if (searchKeyword) {
    const keyword = searchKeyword.toLowerCase();
    options = options.filter(
      (opt) =>
        opt.name.toLowerCase().includes(keyword) ||
        opt.code.toLowerCase().includes(keyword)
    );
  }

  // 
  options.sort((a, b) => a.displayOrder - b.displayOrder);

  // 
  const totalElements = options.length;
  const totalPages = Math.ceil(totalElements / size);
  const start = page * size;
  const end = start + size;
  const content = options.slice(start, end);

  return {
    success: true,
    message: "상품 옵션 목록을 조회했습니다.",
    data: {
      content,
      pageInfo: {
        page,
        size,
        totalElements,
        totalPages,
      },
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * 상품 옵션 단건 조회
 */
export function getProductOption(id: string): ProductOptionResponse {
  const options = loadProductOptions();
  const option = options.find((opt) => opt.id === id);

  if (!option) {
    return {
      success: false,
      message: "상품 옵션을 찾을 수 없습니다.",
      data: {} as ProductOption,
      timestamp: new Date().toISOString(),
    };
  }

  return {
    success: true,
    message: "상품 옵션을 조회했습니다.",
    data: option,
    timestamp: new Date().toISOString(),
  };
}

/**
 * 상품 옵션 생성
 */
export function createProductOption(
  dto: CreateProductOptionDto
): ProductOptionResponse {
  const options = loadProductOptions();

  // 
  if (options.some((opt) => opt.code === dto.code)) {
    return {
      success: false,
      message: "이미 존재하는 옵션 코드입니다.",
      data: {} as ProductOption,
      timestamp: new Date().toISOString(),
    };
  }

  const now = new Date().toISOString();
  const newId = generateUUIDWithPrefix('opt');

  // ID 
  const values: ProductOptionValue[] = dto.values.map((val) => ({
    id: generateUUIDWithPrefix('val'),
    optionId: newId,
    ...val,
  }));

  const newOption: ProductOption = {
    id: newId,
    ...dto,
    values,
    createdAt: now,
    updatedAt: now,
  };

  options.push(newOption);
  saveProductOptions(options);

  return {
    success: true,
    message: "상품 옵션이 생성되었습니다.",
    data: newOption,
    timestamp: now,
  };
}

/**
 * 상품 옵션 수정
 */
export function updateProductOption(
  dto: UpdateProductOptionDto
): ProductOptionResponse {
  const options = loadProductOptions();
  const index = options.findIndex((opt) => opt.id === dto.id);

  if (index === -1) {
    return {
      success: false,
      message: "상품 옵션을 찾을 수 없습니다.",
      data: {} as ProductOption,
      timestamp: new Date().toISOString(),
    };
  }

  // ( )
  if (
    dto.code &&
    options.some((opt) => opt.code === dto.code && opt.id !== dto.id)
  ) {
    return {
      success: false,
      message: "이미 존재하는 옵션 코드입니다.",
      data: {} as ProductOption,
      timestamp: new Date().toISOString(),
    };
  }

  const now = new Date().toISOString();
  const updatedOption = {
    ...options[index],
    ...dto,
    updatedAt: now,
  };

  options[index] = updatedOption;
  saveProductOptions(options);

  return {
    success: true,
    message: "상품 옵션이 수정되었습니다.",
    data: updatedOption,
    timestamp: now,
  };
}

/**
 * 상품 옵션 삭제
 */
export function deleteProductOption(id: string): ProductOptionResponse {
  const options = loadProductOptions();
  const products = loadProducts();

  // 
  const usedByProducts = products.filter((prod) =>
    prod.optionIds.includes(id)
  );

  if (usedByProducts.length > 0) {
    return {
      success: false,
      message: `해당 옵션을 사용하는 상품이 ${usedByProducts.length}개 있습니다.`,
      data: {} as ProductOption,
      timestamp: new Date().toISOString(),
    };
  }

  const index = options.findIndex((opt) => opt.id === id);

  if (index === -1) {
    return {
      success: false,
      message: "상품 옵션을 찾을 수 없습니다.",
      data: {} as ProductOption,
      timestamp: new Date().toISOString(),
    };
  }

  const deleted = options.splice(index, 1)[0];
  saveProductOptions(options);

  return {
    success: true,
    message: "상품 옵션이 삭제되었습니다.",
    data: deleted,
    timestamp: new Date().toISOString(),
  };
}

// ========== API ==========

/**
 * 상품 목록 조회
 */
export function getProducts(
  page: number = 0,
  size: number = 20,
  searchKeyword?: string,
  categoryId?: string,
  salesStatus?: SalesStatus
): ProductListResponse {
  let products = loadProducts();

  // 
  if (searchKeyword) {
    const keyword = searchKeyword.toLowerCase();
    products = products.filter(
      (prod) =>
        prod.name.toLowerCase().includes(keyword) ||
        prod.code.toLowerCase().includes(keyword) ||
        prod.description.toLowerCase().includes(keyword)
    );
  }

  // 
  if (categoryId) {
    products = products.filter((prod) => prod.categoryId === categoryId);
  }

  // 
  if (salesStatus) {
    products = products.filter((prod) => prod.salesStatus === salesStatus);
  }

  // 
  products.sort((a, b) => a.displayOrder - b.displayOrder);

  // 
  const totalElements = products.length;
  const totalPages = Math.ceil(totalElements / size);
  const start = page * size;
  const end = start + size;
  const content = products.slice(start, end);

  return {
    success: true,
    message: "상품 목록을 조회했습니다.",
    data: {
      content,
      pageInfo: {
        page,
        size,
        totalElements,
        totalPages,
      },
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * 상품 단건 조회
 */
export function getProduct(id: string): ProductResponse {
  const products = loadProducts();
  const product = products.find((prod) => prod.id === id);

  if (!product) {
    return {
      success: false,
      message: "상품을 찾을 수 없습니다.",
      data: null as any,
      timestamp: new Date().toISOString(),
    };
  }

  return {
    success: true,
    message: "상품을 조회했습니다.",
    data: product,
    timestamp: new Date().toISOString(),
  };
}

/**
 * 상품 생성
 */
export function createProduct(dto: CreateProductDto): ProductResponse {
  const products = loadProducts();

  // 
  if (products.some((prod) => prod.code === dto.code)) {
    return {
      success: false,
      message: "이미 존재하는 상품 코드입니다.",
      data: {} as Product,
      timestamp: new Date().toISOString(),
    };
  }

  const now = new Date().toISOString();
  const newProduct: Product = {
    id: generateUUIDWithPrefix('prod'),
    ...dto,
    options: dto.options || [],
    createdAt: now,
    updatedAt: now,
  };

  products.push(newProduct);
  saveProducts(products);

  // 
  window.dispatchEvent(new Event('productUpdated'));

  return {
    success: true,
    message: "상품이 생성되었습니다.",
    data: newProduct,
    timestamp: now,
  };
}

/**
 * 상품 수정
 */
export function updateProduct(dto: UpdateProductDto): ProductResponse {
  const products = loadProducts();
  const index = products.findIndex((prod) => prod.id === dto.id);

  if (index === -1) {
    return {
      success: false,
      message: "상품을 찾을 수 없습니다.",
      data: {} as Product,
      timestamp: new Date().toISOString(),
    };
  }

  // ( )
  if (
    dto.code &&
    products.some((prod) => prod.code === dto.code && prod.id !== dto.id)
  ) {
    return {
      success: false,
      message: "이미 존재하는 상품 코드입니다.",
      data: {} as Product,
      timestamp: new Date().toISOString(),
    };
  }

  const now = new Date().toISOString();
  const updatedProduct = {
    ...products[index],
    ...dto,
    updatedAt: now,
  };

  products[index] = updatedProduct;
  saveProducts(products);

  // 
  window.dispatchEvent(new Event('productUpdated'));

  return {
    success: true,
    message: "상품이 수정되었습니다.",
    data: updatedProduct,
    timestamp: now,
  };
}

/**
 * 상품 삭제
 */
export function deleteProduct(id: string): ProductResponse {
  const products = loadProducts();
  const index = products.findIndex((prod) => prod.id === id);

  if (index === -1) {
    return {
      success: false,
      message: "상품을 찾을 수 없습니다.",
      data: {} as Product,
      timestamp: new Date().toISOString(),
    };
  }

  const deleted = products.splice(index, 1)[0];
  saveProducts(products);

  // 
  window.dispatchEvent(new Event('productUpdated'));

  return {
    success: true,
    message: "상품이 삭제되었습니다.",
    data: deleted,
    timestamp: new Date().toISOString(),
  };
}

/**
 * 초기 데이터 리셋
 */
export function resetProductData(): void {
  localStorage.removeItem(STORAGE_KEY_PRODUCT_OPTIONS);
  localStorage.removeItem(STORAGE_KEY_PRODUCTS);
  localStorage.removeItem(STORAGE_KEY_CHANNEL_DISCOUNTS);
}

/**
 * 채널별 할인 데이터 초기화
 */
export function resetChannelDiscounts(): void {
  localStorage.removeItem(STORAGE_KEY_CHANNEL_DISCOUNTS);
}

// ========== API ==========

/**
 * 할인 상태 자동 계산
 */
function calculateDiscountStatus(startDate: string, endDate: string): ChannelDiscountStatus {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (now < start) {
    return ChannelDiscountStatus.SCHEDULED;
  } else if (now > end) {
    return ChannelDiscountStatus.EXPIRED;
  } else {
    return ChannelDiscountStatus.ACTIVE;
  }
}

/**
 * 판매가 자동 계산
 */
function calculateSalePrice(basePrice: number, discountRate: number): number {
  return Math.round(basePrice * (1 - discountRate / 100));
}

// 
const initialChannelDiscounts: ProductChannelDiscount[] = [
  {
    id: "cd-001",
    productId: "prod-001",
    channelId: "CH001", // 
    channelName: "기본 채널",
    discountRate: 15,
    salePrice: 112200, // 132000 * 0.85
    startDate: "2025-11-01T00:00:00Z",
    endDate: "2025-12-31T23:59:59Z",
    status: ChannelDiscountStatus.ACTIVE,
    visible: true,
    createdAt: "2025-10-20T00:00:00Z",
    updatedAt: "2025-10-20T00:00:00Z",
  },
  {
    id: "cd-002",
    productId: "prod-002",
    channelId: "CH002", // 
    channelName: "경찰청 티켓몰",
    discountRate: 20,
    salePrice: 136000, // 170000 * 0.8
    startDate: "2025-10-15T00:00:00Z",
    endDate: "2025-11-30T23:59:59Z",
    status: ChannelDiscountStatus.ACTIVE,
    visible: true,
    createdAt: "2025-10-10T00:00:00Z",
    updatedAt: "2025-10-10T00:00:00Z",
  },
  {
    id: "cd-003",
    productId: "prod-004",
    channelId: "CH003", // 
    channelName: "문화생활 채널",
    discountRate: 25,
    salePrice: 148500, // 198000 * 0.75
    startDate: "2025-11-10T00:00:00Z",
    endDate: "2025-12-20T23:59:59Z",
    status: ChannelDiscountStatus.ACTIVE,
    visible: true,
    createdAt: "2025-11-01T00:00:00Z",
    updatedAt: "2025-11-01T00:00:00Z",
  },
  {
    id: "cd-004",
    productId: "prod-001",
    channelId: "CH001", // 
    channelName: "기본 채널",
    discountRate: 10,
    salePrice: 118800, // 132000 * 0.9
    startDate: "2025-10-01T00:00:00Z",
    endDate: "2025-10-31T23:59:59Z",
    status: ChannelDiscountStatus.EXPIRED,
    visible: false,
    createdAt: "2025-09-25T00:00:00Z",
    updatedAt: "2025-09-25T00:00:00Z",
  },
  {
    id: "cd-005",
    productId: "prod-006",
    channelId: "CH002", // 
    channelName: "경찰청 티켓몰",
    discountRate: 30,
    salePrice: 17500, // 25000 * 0.7
    startDate: "2025-12-01T00:00:00Z",
    endDate: "2025-12-31T23:59:59Z",
    status: ChannelDiscountStatus.SCHEDULED,
    visible: true,
    createdAt: "2025-11-01T00:00:00Z",
    updatedAt: "2025-11-01T00:00:00Z",
  },
  {
    id: "cd-006",
    productId: "prod-001",
    channelId: "CH003", // 
    channelName: "문화생활 채널",
    discountRate: 20,
    salePrice: 105600, // 132000 * 0.8
    startDate: "2025-11-01T00:00:00Z",
    endDate: "2025-11-30T23:59:59Z",
    status: ChannelDiscountStatus.ACTIVE,
    visible: true,
    createdAt: "2025-10-28T00:00:00Z",
    updatedAt: "2025-10-28T00:00:00Z",
  },
  {
    id: "cd-007",
    productId: "prod-001",
    channelId: "CH001", // 
    channelName: "기본 채널",
    discountRate: 10,
    salePrice: 118800, // 132000 * 0.9
    startDate: "2025-11-10T00:00:00Z",
    endDate: "2025-11-25T23:59:59Z",
    status: ChannelDiscountStatus.ACTIVE,
    visible: true,
    createdAt: "2025-11-05T00:00:00Z",
    updatedAt: "2025-11-05T00:00:00Z",
  },
  {
    id: "cd-008",
    productId: "prod-001",
    channelId: "CH002", // 
    channelName: "경찰청 티켓몰",
    discountRate: 0,
    salePrice: 132000, // 132000 * 1
    startDate: "2025-11-01T00:00:00Z",
    endDate: "2025-12-31T23:59:59Z",
    status: ChannelDiscountStatus.INACTIVE,
    visible: false,
    createdAt: "2025-10-30T00:00:00Z",
    updatedAt: "2025-10-30T00:00:00Z",
  },
];

// 
function loadChannelDiscounts(): ProductChannelDiscount[] {
  const stored = localStorage.getItem(STORAGE_KEY_CHANNEL_DISCOUNTS);
  let discounts = stored ? JSON.parse(stored) : initialChannelDiscounts;
  
  // ID ( )
  const seenIds = new Map<string, ProductChannelDiscount>();
  discounts.forEach((discount: ProductChannelDiscount) => {
    const existing = seenIds.get(discount.id);
    if (!existing || new Date(discount.updatedAt) > new Date(existing.updatedAt)) {
      seenIds.set(discount.id, discount);
    }
  });
  
  discounts = Array.from(seenIds.values());
  
  // 
  if (discounts.length !== (stored ? JSON.parse(stored).length : initialChannelDiscounts.length)) {
    localStorage.setItem(STORAGE_KEY_CHANNEL_DISCOUNTS, JSON.stringify(discounts));
  }
  
  return discounts;
}

// 
function saveChannelDiscounts(discounts: ProductChannelDiscount[]): void {
  localStorage.setItem(STORAGE_KEY_CHANNEL_DISCOUNTS, JSON.stringify(discounts));
}

/**
 * 상품의 채널별 할인 목록 조회
 */
export function getProductChannelDiscounts(productId: string): ProductChannelDiscountListResponse {
  let discounts = loadChannelDiscounts();
  
  // 
  const channelsData = localStorage.getItem("ticket_channels");
  const channels = channelsData ? JSON.parse(channelsData) : [];
  
  // ID 
  discounts = discounts.filter(d => d.productId === productId);
  
  // ID 
  const idCounts = new Map<string, number>();
  discounts.forEach(d => {
    idCounts.set(d.id, (idCounts.get(d.id) || 0) + 1);
  });
  
  const duplicates = Array.from(idCounts.entries()).filter(([_, count]) => count > 1);
  if (duplicates.length > 0) {
    // : ID 
    const seen = new Set<string>();
    discounts = discounts.filter(d => {
      if (seen.has(d.id)) return false;
      seen.add(d.id);
      return true;
    });
  }
  
  // 
  discounts = discounts.map(discount => {
    const channel = channels.find((c: any) => c.id === discount.channelId);
    return {
      ...discount,
      channelName: channel?.channelName || "알 수 없는 채널",
      status: calculateDiscountStatus(discount.startDate, discount.endDate),
    };
  });
  
  // 
  saveChannelDiscounts(loadChannelDiscounts().map(d => {
    const updated = discounts.find(ud => ud.id === d.id);
    return updated ? updated : d;
  }));
  
  return {
    success: true,
    message: "채널별 할인 목록을 조회했습니다.",
    data: discounts,
    timestamp: new Date().toISOString(),
  };
}

/**
 * 채널별 할인 생성
 */
export function createProductChannelDiscount(
  dto: CreateProductChannelDiscountDto
): ProductChannelDiscountResponse {
  const discounts = loadChannelDiscounts();
  const products = loadProducts();
  
  // 
  const product = products.find(p => p.id === dto.productId);
  if (!product) {
    return {
      success: false,
      message: "상품을 찾을 수 없습니다.",
      data: {} as ProductChannelDiscount,
      timestamp: new Date().toISOString(),
    };
  }
  
  // ( / )
  const existingDiscount = discounts.find(
    d => d.productId === dto.productId && 
         d.channelId === dto.channelId &&
         (d.status === ChannelDiscountStatus.ACTIVE || d.status === ChannelDiscountStatus.SCHEDULED)
  );
  
  if (existingDiscount) {
    return {
      success: false,
      message: "해당 채널의 활성 또는 예정된 할인이 이미 존재합니다.",
      data: {} as ProductChannelDiscount,
      timestamp: new Date().toISOString(),
    };
  }
  
  // 
  const channelsData = localStorage.getItem("ticket_channels");
  const channels = channelsData ? JSON.parse(channelsData) : [];
  const channel = channels.find((c: any) => c.id === dto.channelId);
  
  const now = new Date().toISOString();
  const salePrice = calculateSalePrice(product.price, dto.discountRate);
  const status = calculateDiscountStatus(dto.startDate, dto.endDate);
  
  // ID : ID 
  let uniqueId: string;
  let attempts = 0;
  const timestamp = Date.now();
  do {
    // + + 
    uniqueId = `cd-${timestamp}-${attempts}-${Math.random().toString(36).substr(2, 9)}`;
    attempts++;
  } while (discounts.some(d => d.id === uniqueId) && attempts < 100);
  
  const newDiscount: ProductChannelDiscount = {
    id: uniqueId,
    ...dto,
    channelName: channel?.channelName || "알 수 없음",
    salePrice,
    status,
    createdAt: now,
    updatedAt: now,
  };
  
  discounts.push(newDiscount);
  saveChannelDiscounts(discounts);
  
  return {
    success: true,
    message: "채널별 할인이 생성되었습니다.",
    data: newDiscount,
    timestamp: now,
  };
}

/**
 * 채널별 할인 수정
 */
export function updateProductChannelDiscount(
  id: string,
  dto: UpdateProductChannelDiscountDto
): ProductChannelDiscountResponse {
  const discounts = loadChannelDiscounts();
  const products = loadProducts();
  const index = discounts.findIndex(d => d.id === id);
  
  if (index === -1) {
    return {
      success: false,
      message: "할인 정보를 찾을 수 없습니다.",
      data: {} as ProductChannelDiscount,
      timestamp: new Date().toISOString(),
    };
  }
  
  const discount = discounts[index];
  const product = products.find(p => p.id === discount.productId);
  
  if (!product) {
    return {
      success: false,
      message: "상품을 찾을 수 없습니다.",
      data: {} as ProductChannelDiscount,
      timestamp: new Date().toISOString(),
    };
  }
  
  const now = new Date().toISOString();
  
  // 
  const salePrice = dto.discountRate !== undefined 
    ? calculateSalePrice(product.price, dto.discountRate)
    : discount.salePrice;
    
  // 
  const startDate = dto.startDate || discount.startDate;
  const endDate = dto.endDate || discount.endDate;
  const status = dto.status || calculateDiscountStatus(startDate, endDate);
  
  const updatedDiscount: ProductChannelDiscount = {
    ...discount,
    ...dto,
    salePrice,
    status,
    startDate,
    endDate,
    updatedAt: now,
  };
  
  discounts[index] = updatedDiscount;
  saveChannelDiscounts(discounts);
  
  return {
    success: true,
    message: "채널별 할인이 수정되었습니다.",
    data: updatedDiscount,
    timestamp: now,
  };
}

/**
 * 채널별 할인 삭제
 */
export function deleteProductChannelDiscount(id: string): ProductChannelDiscountResponse {
  const discounts = loadChannelDiscounts();
  const index = discounts.findIndex(d => d.id === id);
  
  if (index === -1) {
    return {
      success: false,
      message: "할인 정보를 찾을 수 없습니다.",
      data: {} as ProductChannelDiscount,
      timestamp: new Date().toISOString(),
    };
  }
  
  const deleted = discounts.splice(index, 1)[0];
  saveChannelDiscounts(discounts);
  
  return {
    success: true,
    message: "채널별 할인이 삭제되었습니다.",
    data: deleted,
    timestamp: new Date().toISOString(),
  };
}

/**
 * 채널별 할인 데이터 초기화 (개발용 유틸리티)
 */
export function resetChannelDiscountsToInitial(): void {
  localStorage.removeItem(STORAGE_KEY_CHANNEL_DISCOUNTS);
}

/**
 * 중복 ID 정리 유틸리티
 */
export function cleanupDuplicateChannelDiscounts(): number {
  const discounts = loadChannelDiscounts();
  const originalCount = discounts.length;
  
  // : ID 
  const seenIds = new Map<string, ProductChannelDiscount>();
  discounts.forEach((discount: ProductChannelDiscount) => {
    const existing = seenIds.get(discount.id);
    if (!existing || new Date(discount.updatedAt) > new Date(existing.updatedAt)) {
      seenIds.set(discount.id, discount);
    }
  });
  
  const cleanedDiscounts = Array.from(seenIds.values());
  const removedCount = originalCount - cleanedDiscounts.length;
  
  if (removedCount > 0) {
    saveChannelDiscounts(cleanedDiscounts);
  }
  
  return removedCount;
}