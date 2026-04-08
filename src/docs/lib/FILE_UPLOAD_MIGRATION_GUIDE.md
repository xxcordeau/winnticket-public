# 파일 업로드 API 마이그레이션 가이드

## 개요

기존 `/api/image/upload` API를 새로운 공통 파일 API `/api/common/files/upload`로 전환합니다.

## 변경 사항

### 기존 API
```typescript
// 기존 - lib/api/product.ts
uploadImage(file: File): Promise<ApiResponse<ImageUploadResponse>>
// ImageUploadResponse = { imageUrl: string }
```

### 새로운 API
```typescript
// 신규 - lib/api/file.ts
uploadFile(file: File): Promise<ApiResponse<string>>
uploadFiles(files: File[]): Promise<ApiResponse<string[]>>
deleteFile(url: string): Promise<ApiResponse<string>>
deleteFiles(urls: string[]): Promise<ApiResponse<string[]>>
```

## 마이그레이션 방법

### 1. Import 변경

#### Before:
```typescript
import { uploadImage } from "../../lib/api/product";
```

#### After:
```typescript
import { uploadFile, uploadFiles } from "../../lib/api/file";
```

### 2. 함수 호출 변경

#### Before:
```typescript
const response = await uploadImage(file);
if (response.success && response.data) {
  const imageUrl = response.data.imageUrl;  // 객체에서 imageUrl 추출
  // 사용...
}
```

#### After:
```typescript
const response = await uploadFile(file);
if (response.success && response.data) {
  const imageUrl = response.data;  // data가 직접 URL 문자열
  // 사용...
}
```

### 3. 여러 파일 업로드

#### 새로운 기능:
```typescript
const files = [file1, file2, file3];
const response = await uploadFiles(files);
if (response.success && response.data) {
  const urls = response.data;  // string[] 배열
  urls.forEach(url => console.log(url));
}
```

### 4. 파일 삭제

#### 새로운 기능:
```typescript
// 단일 파일 삭제
await deleteFile('https://api.winnticket.store/uploads/abc123.png');

// 여러 파일 삭제
await deleteFiles([
  'https://api.winnticket.store/uploads/abc123.png',
  'https://api.winnticket.store/uploads/xyz456.jpg'
]);
```

## 적용 대상 컴포넌트

✅ 완료:
- [x] `/components/pages/product-content-editor.tsx` - 상세내용 편집기

⏳ 적용 필요:
- [ ] `/components/pages/product-detail.tsx` - 상품 이미지 업로드
- [ ] `/components/pages/partner-detail.tsx` - 파트너 로고 업로드
- [ ] `/components/pages/channel-detail.tsx` - 채널 로고 업로드
- [ ] `/components/pages/community/notice-editor.tsx` - 공지사항 이미지 업로드
- [ ] `/components/pages/community/event-editor.tsx` - 이벤트 이미지 업로드
- [ ] `/components/pages/community/faq-management.tsx` - FAQ 이미지 (있는 경우)
- [ ] `/components/pages/community/inquiry-management.tsx` - 문의 이미지 (있는 경우)

## API 엔드포인트

```
POST   /api/common/files/upload   - 파일 업로드 (배열 반환)
DELETE /api/common/files/delete   - 파일 삭제 (Query params)
```

## Response 형식

### 업로드 성공:
```json
{
  "success": true,
  "message": "업로드 성공",
  "data": [
    "https://api.winnticket.store/uploads/abc123.png",
    "https://api.winnticket.store/uploads/xyz456.jpg"
  ],
  "errorCode": null
}
```

### 삭제 성공:
```json
{
  "success": true,
  "message": "삭제 성공",
  "data": [
    "https://api.winnticket.store/uploads/abc123.png"
  ],
  "errorCode": null
}
```

## 하이브리드 동작

- API 서버가 정상 작동하면 실제 업로드 수행
- API 서버가 없거나 실패하면 에러 반환 (더미 데이터 없음)
- 각 컴포넌트에서 에러 처리 필요

## 주의사항

1. **response.data 타입 변경**: 객체 → 문자열(또는 배열)
2. **파일 삭제 기능 추가**: 이미지 교체 시 기존 이미지 삭제 권장
3. **에러 처리**: 업로드 실패 시 사용자에게 명확한 메시지 표시
4. **파일 크기 제한**: 프론트엔드에서 5MB 제한 체크 권장
