import { 
  Post, 
  PostType, 
  QnaStatus, 
  NoticePost, 
  EventPost, 
  FaqPost, 
  QnaPost,
  FaqCategory 
} from "./dto/community.dto";

/**
 * 커뮤니티 게시글 더미 데이터
 */
const INITIAL_POSTS: Post[] = [
  // 
  {
    id: "post-event-1",
    type: "EVENT",
    title: "🎉 2025 새해맞이 특별 할인 이벤트",
    content: `<p>티켓팅 서비스의 새해맞이 특별 할인 이벤트를 진행합니다!</p>

<h2>이벤트 기간</h2>
<p>2025년 1월 1일 ~ 1월 31일</p>

<h2>혜택 내용</h2>
<ul>
<li>전 공연 최대 30% 할인</li>
<li>조기 예매 시 추가 5% 할인</li>
<li>회원 전용 적립금 3배 적립</li>
</ul>

<h2>참여 방법</h2>
<ol>
<li>회원가입 또는 로그인</li>
<li>원하는 공연 선택</li>
<li>결제 시 자동 할인 적용</li>
</ol>

<p>놓치지 마세요!</p>`,
    authorId: "admin-1",
    authorName: "마케팅팀",
    createdAt: "2025-01-01T09:00:00Z",
    eventEndDate: "2025-01-31T23:59:59Z",
    views: 2341,
    isActive: true,
  } as EventPost,
  {
    id: "post-event-2",
    type: "EVENT",
    title: "🎭 뮤지컬 위크 특별전 (1월 15~21일)",
    content: `<p>뮤지컬 팬들을 위한 특별한 한 주!</p>

<h2>이벤트 개요</h2>
<p>1월 15일부터 21일까지 진행되는 뮤지컬 위크 특별전에서 인기 뮤지컬 티켓을 특가로 만나보세요.</p>

<h2>대상 공연</h2>
<ul>
<li>레미제라블: 20% 할인</li>
<li>오페라의 유령: 25% 할인</li>
<li>위키드: 15% 할인</li>
<li>캣츠: 30% 할인</li>
</ul>

<h2>추가 혜택</h2>
<ul>
<li>2매 이상 구매 시 팝콘 세트 증정</li>
<li>SNS 인증 이벤트 참여 시 추첨을 통해 백스테이지 투어권 증정</li>
</ul>

<p>기간 한정이니 서둘러 예매하세요!</p>`,
    authorId: "admin-2",
    authorName: "마케팅팀",
    createdAt: "2025-01-10T14:00:00Z",
    eventEndDate: "2025-01-21T23:59:59Z",
    views: 1876,
    isActive: false,
  } as EventPost,
  {
    id: "post-event-3",
    type: "EVENT",
    title: "🎨 전시회 무료 초대 이벤트",
    content: `<p>명화 전시회에 여러분을 초대합니다!</p>

<h2>이벤트 내용</h2>
<p>'인상파의 거장들' 전시회 무료 초대권을 추첨을 통해 드립니다.</p>

<h2>전시 정보</h2>
<ul>
<li>기간: 2025년 2월 1일 ~ 3월 31일</li>
<li>장소: 서울시립미술관</li>
<li>전시 작품: 모네, 르누아르, 드가 등 50여 점</li>
</ul>

<h2>응모 방법</h2>
<ol>
<li>공식 SNS 팔로우</li>
<li>이벤트 게시글 공유</li>
<li>응모 폼 작성</li>
</ol>

<h2>당첨자 발표</h2>
<ul>
<li>1월 25일 당첨자 개별 연락</li>
<li>2인 초대권 100명</li>
</ul>

<p>행운을 빕니다!</p>`,
    authorId: "admin-1",
    authorName: "마케팅팀",
    createdAt: "2025-01-12T11:00:00Z",
    eventEndDate: "2025-01-25T23:59:59Z",
    views: 1543,
    isActive: true,
  } as EventPost,
  {
    id: "post-event-4",
    type: "EVENT",
    title: "⚽ 스포츠 경기 패키지 특가 이벤트",
    content: `<p>프로야구 시즌권 & 축구 티켓 패키지를 특별가에!</p>

<h2>야구 시즌권</h2>
<ul>
<li>정규 시즌 전 경기 관람 가능</li>
<li>할인가: 정가 대비 40% 할인</li>
<li>조기 예약 특전: 유니폼 증정</li>
</ul>

<h2>축구 티켓 패키지</h2>
<ul>
<li>K리그 5경기 티켓</li>
<li>할인가: 경기당 평균 25% 할인</li>
<li>특전: 선수 사인회 초대권</li>
</ul>

<h2>판매 기간</h2>
<p>2025년 1월 20일 ~ 2월 10일</p>

<p>스포츠를 사랑하는 분들의 많은 관심 바랍니다!</p>`,
    authorId: "admin-2",
    authorName: "마케팅팀",
    createdAt: "2025-01-18T10:00:00Z",
    eventEndDate: "2025-02-10T23:59:59Z",
    views: 987,
    isActive: true,
  } as EventPost,

  // FAQ
  {
    id: "post-4",
    type: "FAQ",
    category: "ORDER" as FaqCategory,
    title: "티켓 예매는 어떻게 하나요?",
    content: `<p>티켓 예매 방법은 다음과 같습니다:</p>

<ol>
<li>원하시는 공연을 검색하세요</li>
<li>날짜와 좌석을 선택하세요</li>
<li>결제를 진행하세요</li>
<li>예매 완료 후 이메일로 티켓이 발송됩니다</li>
</ol>

<p>더 자세한 사항은 고객센터로 문의해주세요.</p>`,
    authorId: "admin-1",
    authorName: "관리자",
    createdAt: "2024-12-01T09:00:00Z",
    views: 3421,
    isActive: true,
  } as FaqPost,
  {
    id: "post-5",
    type: "FAQ",
    category: "CANCEL" as FaqCategory,
    title: "티켓 취소 및 환불 규정이 궁금합니다",
    content: `<p>티켓 취소 및 환불 규정:</p>

<ul>
<li>공연일 7일 전: 100% 환불</li>
<li>공연일 3~6일 전: 90% 환불</li>
<li>공연일 1~2일 전: 80% 환불</li>
<li>공연 당일: 환불 불가</li>
</ul>

<p>자세한 사항은 각 공연의 상세 페이지를 참고해주세요.</p>`,
    authorId: "admin-1",
    authorName: "관리자",
    createdAt: "2024-12-01T09:30:00Z",
    views: 2876,
    isActive: true,
  } as FaqPost,
  {
    id: "post-6",
    type: "FAQ",
    category: "MEMBERSHIP" as FaqCategory,
    title: "회원가입 없이도 예매가 가능한가요?",
    content: `<p>아니요, 티켓 예매를 위해서는 회원가입이 필요합니다.</p>

<p>회원가입의 장점:</p>
<ol>
<li>예매 내역 관리</li>
<li>포인트 적립</li>
<li>할인 쿠폰 제공</li>
<li>맞춤 공연 추천</li>
</ol>

<p>간편하게 소셜 로그인으로도 가입하실 수 있습니다.</p>`,
    authorId: "admin-2",
    authorName: "운영팀",
    createdAt: "2024-12-05T11:00:00Z",
    views: 1987,
    isActive: true,
  } as FaqPost,
  {
    id: "post-7",
    type: "FAQ",
    category: "TICKET" as FaqCategory,
    title: "좌석은 어떻게 선택하나요?",
    content: `<p>좌석 선택 방법:</p>

<ol>
<li>공연 상세 페이지에서 날짜를 선택합니다</li>
<li>좌석 배치도에서 원하는 구역을 클릭합니다</li>
<li>구역 내 빈 좌석 중 원하는 좌석을 선택합니다</li>
<li>선택 완료 후 결제를 진행합니다</li>
</ol>

<p>좌석 등급에 따라 가격이 다를 수 있습니다.</p>`,
    authorId: "admin-1",
    authorName: "관리자",
    createdAt: "2024-12-10T13:00:00Z",
    views: 1654,
    isActive: true,
  } as FaqPost,

  // (QNA)
  {
    id: "post-8",
    type: "QNA",
    title: "티켓 예매 관련 문의",
    content: `안녕하세요.

BTS 콘서트 티켓을 예매하려고 하는데, 좌석 선택이 잘 안되네요.
어떻게 하면 좋을까요?`,
    authorId: "guest",
    authorName: "김고객",
    createdAt: "2025-01-25T10:30:00Z",
    views: 45,
    status: "ANSWERED" as QnaStatus,
    inquiryNumber: "INQ-2025-001",
    contactPhone: "010-1234-5678",
    contactEmail: "customer@email.com",
    relatedOrderNumber: undefined,
    answer: `안녕하세요. 고객님.

좌석 선택이 안 되는 경우 다음을 확인해주세요:
1. 브라우저 캐시 삭제 후 재시도
2. 다른 브라우저로 시도
3. 팝업 차단 해제

계속 문제가 발생하면 고객센터(1588-1234)로 연락주시면 도와드리겠습니다.

감사합니다.`,
    answeredAt: "2025-01-25T15:20:00Z",
    answeredBy: "관리자",
  } as QnaPost,
  {
    id: "post-9",
    type: "QNA",
    title: "주문 취소 문의",
    content: `어제 주문한 티켓을 취소하고 싶습니다.
주문번호: ORD-2024-001

환불은 언제쯤 되나요?`,
    authorId: "guest",
    authorName: "이고객",
    createdAt: "2025-01-26T09:15:00Z",
    views: 28,
    status: "ANSWERED" as QnaStatus,
    inquiryNumber: "INQ-2025-002",
    contactPhone: "010-2345-6789",
    contactEmail: undefined,
    relatedOrderNumber: "ORD-2024-001",
    answer: `안녕하세요. 고객님.

주문 취소 확인했습니다.

환불은 결제 수단에 따라 다릅니다:
- 신용카드: 3~5영업일
- 계좌이체: 1~2영업일

환불이 완료되면 SMS로 안내드립니다.

감사합니다.`,
    answeredAt: "2025-01-26T14:00:00Z",
    answeredBy: "관리자",
  } as QnaPost,
  {
    id: "post-10",
    type: "QNA",
    title: "결제 오류 문의",
    content: `티켓 결제 중에 계속 오류가 발생합니다.

카드 결제를 시도했는데 "결제 실패" 메시지만 나옵니다.

어떻게 해야 하나요?`,
    authorId: "guest",
    authorName: "박고객",
    createdAt: "2025-01-27T16:45:00Z",
    views: 12,
    status: "PENDING" as QnaStatus,
    inquiryNumber: "INQ-2025-003",
    contactPhone: "010-3456-7890",
    contactEmail: undefined,
    relatedOrderNumber: undefined,
  } as QnaPost,
  
  // 
  {
    id: "post-notice-5",
    type: "NOTICE",
    title: "🎊 2025년 봄 시즌 신규 공연 라인업 발표",
    content: `<p>안녕하세요, 윈티켓입니다.</p>

<p>2025년 봄 시즌을 맞아 다양한 신규 공연 라인업을 공개합니다!</p>

<h2>3월 공연 라인업</h2>
<ul>
<li>뮤지컬 <b>해밀턴</b> - 샤롯데씨어터 (3/1~5/31)</li>
<li>콘서트 <b>버스커버스커 10주년 기념 공연</b> - 올림픽공원 (3/15~3/16)</li>
<li>클래식 <b>베를린 필하모닉 내한 공연</b> - 예술의전당 (3/22)</li>
</ul>

<h2>4월 공연 라인업</h2>
<ul>
<li>뮤지컬 <b>맘마미아!</b> - 블루스퀘어 (4/5~6/30)</li>
<li>전시회 <b>반 고흐 몰입형 체험전</b> - DDP (4/1~7/31)</li>
<li>스포츠 <b>K리그 시즌 개막전</b> - 월드컵경기장 (4/12)</li>
</ul>

<p>예매는 2월 1일부터 순차적으로 오픈됩니다.</p>
<p>많은 관심 부탁드립니다!</p>`,
    authorId: "admin-1",
    authorName: "운영팀",
    createdAt: "2025-01-28T10:00:00Z",
    views: 3250,
    isActive: true,
    isPinned: true,
  },
  {
    id: "post-notice-6",
    type: "NOTICE",
    title: "🏨 숙박형 상품 판매 시작 안내",
    content: `<p>안녕하세요, 윈티켓입니다.</p>

<p>고객님들의 많은 요청으로 <b>숙박형 패키지 상품</b> 판매를 시작합니다!</p>

<h2>새로운 서비스</h2>
<p>이제 윈티켓에서 공연 티켓과 함께 숙박까지 한번에 해결하세요.</p>

<h2>런칭 기념 특별 할인</h2>
<ul>
<li>서울 그랜드 호텔 패키지 (2박 3일) - 15% 할인</li>
<li>부산 오션뷰 리조트 (3박 4일) - 20% 할인</li>
<li>제주 블루오션 리조트 - 25% 할인</li>
</ul>

<h2>패키지 혜택</h2>
<ul>
<li>조식 포함</li>
<li>무료 체크인/체크아웃</li>
<li>스파 이용권 제공 (일부 상품)</li>
<li>공연 티켓과 함께 예약 시 추가 5% 할인</li>
</ul>

<p>할인은 2월 28일까지 한정입니다.</p>`,
    authorId: "admin-2",
    authorName: "마케팅팀",
    createdAt: "2025-02-01T09:00:00Z",
    views: 1820,
    isActive: true,
    isPinned: false,
  },
  {
    id: "post-notice-7",
    type: "NOTICE",
    title: "📱 모바일 앱 업데이트 (v2.5.0) 안내",
    content: `<p>모바일 앱이 v2.5.0으로 업데이트되었습니다.</p>

<h2>주요 변경 사항</h2>
<ul>
<li>숙박형 상품 예약 기능 추가</li>
<li>좌석 선택 UI 개선</li>
<li>결제 프로세스 최적화</li>
<li>알림 설정 세분화</li>
<li>다크 모드 지원</li>
</ul>

<h2>버그 수정</h2>
<ul>
<li>일부 기기에서 로그인 오류 수정</li>
<li>티켓 QR코드 스캔 안정성 개선</li>
<li>검색 기능 속도 향상</li>
</ul>

<p>앱스토어 또는 플레이스토어에서 업데이트 해주세요.</p>`,
    authorId: "admin-1",
    authorName: "개발팀",
    createdAt: "2025-02-03T14:00:00Z",
    views: 985,
    isActive: true,
    isPinned: false,
  },
];

/**
 * 로컬스토리지 키
 */
const STORAGE_KEY = "community_posts";

/**
 * 로컬스토리지에서 게시글 불러오기
 */
export function loadPosts(): Post[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
  }
  return INITIAL_POSTS;
}

/**
 * 로컬스토리지에 게시글 저장
 */
export function savePosts(posts: Post[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  } catch (error) {
  }
}

/**
 * 게시글 초기화
 */
export function resetPosts(): Post[] {
  savePosts(INITIAL_POSTS);
  return INITIAL_POSTS;
}

/**
 * 조회수 증가
 */
export function incrementPostViews(postId: string): void {
  const posts = loadPosts();
  const updatedPosts = posts.map(post => 
    post.id === postId 
      ? { ...post, views: (post.views || 0) + 1 }
      : post
  );
  savePosts(updatedPosts);
}

/**
 * FAQ 목록 불러오기 (타입별 필터링 지원)
 */
export function loadFAQs(): FaqPost[] {
  const posts = loadPosts();
  return posts.filter((post): post is FaqPost => post.type === "FAQ");
}

/**
 * 문의 번호 생성 (INQ-YYYY-NNN 형식)
 */
export function generateInquiryNumber(): string {
  const posts = loadPosts();
  const inquiries = posts.filter((p): p is QnaPost => p.type === "QNA" && !!p.inquiryNumber);
  
  const year = new Date().getFullYear();
  const yearInquiries = inquiries.filter(inq => 
    inq.inquiryNumber?.startsWith(`INQ-${year}-`)
  );
  
  const nextNumber = yearInquiries.length + 1;
  return `INQ-${year}-${String(nextNumber).padStart(3, '0')}`;
}

/**
 * 문의 번호로 조회
 */
export function getInquiryByNumber(inquiryNumber: string): QnaPost | null {
  const posts = loadPosts();
  const inquiry = posts.find((p): p is QnaPost => 
    p.type === "QNA" && p.inquiryNumber === inquiryNumber
  );
  return inquiry || null;
}