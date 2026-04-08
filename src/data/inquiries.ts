// 
export interface InquiryInput {
  name: string;
  phone: string;
  email: string;
  category: string;
  relatedOrderNumber?: string;
  title: string;
  content: string;
}

export interface Inquiry extends InquiryInput {
  id: string;
  inquiryNumber: string;
  status: 'pending' | 'answered' | 'closed';
  answer?: string;
  answeredAt?: string;
  createdAt: string;
}

// ( API )
let inquiries: Inquiry[] = [];
let inquiryCounter = 1;

/**
 * 문의 생성
 */
export function createInquiry(input: InquiryInput): Inquiry {
  const now = new Date().toISOString();
  const inquiryNumber = `INQ${String(inquiryCounter++).padStart(8, '0')}`;
  
  const inquiry: Inquiry = {
    ...input,
    id: crypto.randomUUID(),
    inquiryNumber,
    status: 'pending',
    createdAt: now,
  };
  
  inquiries.push(inquiry);
  return inquiry;
}

/**
 * 문의 조회 (문의번호 + 이메일)
 */
export function getInquiryByNumber(inquiryNumber: string, email: string): Inquiry | null {
  const inquiry = inquiries.find(
    (inq) => inq.inquiryNumber === inquiryNumber && inq.email === email
  );
  return inquiry || null;
}

/**
 * 모든 문의 조회
 */
export function getAllInquiries(): Inquiry[] {
  return [...inquiries];
}

/**
 * 문의 답변
 */
export function answerInquiry(inquiryNumber: string, answer: string): Inquiry | null {
  const inquiry = inquiries.find((inq) => inq.inquiryNumber === inquiryNumber);
  if (!inquiry) return null;
  
  inquiry.answer = answer;
  inquiry.answeredAt = new Date().toISOString();
  inquiry.status = 'answered';
  
  return inquiry;
}

export type { InquiryInput as InquiryCreateRequest };
