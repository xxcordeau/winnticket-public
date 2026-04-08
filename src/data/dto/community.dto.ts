/** 공통: ISO8601 문자열 */
export type ISODateTime = string & { __brand: "ISODateTime" };

/** 커뮤니티 게시판 타입 */
export type PostType = "NOTICE" | "FAQ" | "QNA" | "EVENT";

/** 문의 상태
 *  스키마가 PENDING/ANSWERED만이라면 BLOCKED는 차단 플래그로 분리하는 게 일관적입니다.
 */
export type QnaStatus = "PENDING" | "ANSWERED";

/** FAQ 카테고리 (사용 중이라면 enum 유지) */
export type FaqCategory = "ORDER" | "DELIVERY" | "CANCEL" | "TICKET" | "MEMBERSHIP" | "ETC";

/** 공통 필드 (모든 게시글 공통) */
export interface PostBase {
  id: string;
  type: PostType;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: ISODateTime;
  updatedAt?: ISODateTime;
  views: number;
  isActive?: boolean;           // ( )
  isBlocked?: boolean;          // 
  blockedReason?: string;
  blockedAt?: ISODateTime;
  blockedBy?: string;
}

/** NOTICE */
export interface NoticePost extends PostBase {
  type: "NOTICE";
}

/** EVENT */
export interface EventPost extends PostBase {
  type: "EVENT";
  eventEndDate: ISODateTime;    // 
}

/** FAQ
 *  title=question, content=answer 로 재사용 가능하지만,
 *  명시적으로 노출하고 싶으면 아래처럼 중복 매핑을 허용
 */
export interface FaqPost extends PostBase {
  type: "FAQ";
  category: FaqCategory;
  question?: string;            // UI ()
  answer?: string;              // UI ()
}

/** QNA */
export interface QnaPost extends PostBase {
  type: "QNA";
  status: QnaStatus;            // 
  answer?: string;
  answeredAt?: ISODateTime;
  answeredBy?: string;

  inquiryNumber?: string;       // INQ-YYYY-NNN
  contactPhone?: string;
  contactEmail?: string;
  relatedOrderNumber?: string;  // orderId 
}

/** 통합 Post (분기 유니온) */
export type Post = NoticePost | EventPost | FaqPost | QnaPost;

/* ----------------------------
 * 요청(Request) DTO
 * -------------------------- */

/** 생성 요청: 타입별 분기로 필수값 강제 */
export type CreatePostRequest =
  | {
      type: "NOTICE";
      title: string;
      content: string;
      isActive?: boolean;
    }
  | {
      type: "EVENT";
      title: string;
      content: string;
      eventEndDate: ISODateTime;
      isActive?: boolean;
    }
  | {
      type: "FAQ";
      title: string;
      content: string;
      category: FaqCategory;
      /** title/content와 별개로 질문/답 노출을 원하면 전달 */
      question?: string;
      answer?: string;
      isActive?: boolean;
    }
  | {
      type: "QNA";
      title: string;
      content: string;
      contactPhone?: string;
      contactEmail?: string;
      relatedOrderNumber?: string;
      /** 일반적으로 생성 시 status는 서버 기본값(PENDING) */
    };

/** 수정 요청: 타입별 Patch — 변경 가능한 필드만 노출 */
export type UpdatePostRequest =
  | {
      type: "NOTICE";
      title?: string;
      content?: string;
      isActive?: boolean;
    }
  | {
      type: "EVENT";
      title?: string;
      content?: string;
      eventEndDate?: ISODateTime;
      isActive?: boolean;
    }
  | {
      type: "FAQ";
      title?: string;
      content?: string;
      category?: FaqCategory;
      question?: string;
      answer?: string;
      isActive?: boolean;
    }
  | {
      type: "QNA";
      title?: string;
      content?: string;
      contactPhone?: string;
      contactEmail?: string;
      relatedOrderNumber?: string;
      // status answer DTO(/ )
    };

/** QNA 답변/상태 전용 요청 (감사 로그 남기기 좋음) */
export interface AnswerQnaRequest {
  answer: string;
  answeredBy: string;          // 
  /** 답변하면서 상태 전환 */
  status?: Extract<QnaStatus, "ANSWERED">;
}

/** 차단/해제 요청을 분리하면 감사 처리/권한 분리가 깔끔 */
export interface BlockPostRequest {
  blockedReason: string;
}
export type UnblockPostRequest = Record<string, never>;

/** 목록 조회 요청: 필터/정렬 보강 */
export interface GetPostsRequest {
  type?: PostType;
  page?: number;               // 1-base or 0-base 
  size?: number;
  search?: string;
  status?: QnaStatus;          // QNA 
  category?: FaqCategory;      // FAQ 
  isActive?: boolean;
  isBlocked?: boolean;
  sort?: "createdAt" | "updatedAt" | "views";
  order?: "asc" | "desc";
  dateFrom?: ISODateTime;
  dateTo?: ISODateTime;
}

/** 목록 응답 공통 포맷 */
export interface PageMeta {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
export interface Page<T> {
  content: T[];
  meta: PageMeta;
}

/** 요약 카드용(리스트 성능 최적화) */
export interface PostSummary {
  id: string;
  type: PostType;
  title: string;
  createdAt: ISODateTime;
  updatedAt?: ISODateTime;
  views: number;
  isActive?: boolean;
  isBlocked?: boolean;
  // 
  eventEndDate?: ISODateTime;  // EVENT
  category?: FaqCategory;      // FAQ
  status?: QnaStatus;          // QNA
}
