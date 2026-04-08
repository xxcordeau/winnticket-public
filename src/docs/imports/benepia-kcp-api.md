. 포인트 조회 API
베네피아 계정 정보를 사용하여 사용 가능한 KCP 포인트를 확인합니다.

Endpoint: POST /api/benepia/kcp/point

Request Body (JSON):

orderNo: 주문 번호

amount: 조회 기준 금액 (일반적으로 0)

benepiaId: 베네피아 아이디

benepiaPwd: 베네피아 비밀번호

memcorpCd: 회원사 코드 (테스트 시 null 가능)

Response (Data 객체 주요 필드):

rsv_pnt: 보유 포인트 (잔액)

res_cd / res_msg: 결과 코드 및 메시지

2. 포인트 결제 API
베네피아 포인트를 사용하여 최종 결제 승인을 요청합니다.

Endpoint: POST /api/benepia/kcp/pay

Request Body (JSON):

orderNo: 주문 번호

amount: 결제 요청 금액

benepiaId: 베네피아 아이디 (testtravel)

benepiaPwd: 베네피아 비밀번호

memcorpCd: 회원사 코드 (테스트 시 5555)

productName: 상품명

buyerName / buyerPhone / buyerEmail: 구매자 정보

Response (Data 객체 주요 필드):

tno: KCP 거래번호

pnt_app_no: 포인트 승인 번호

amount: 최종 승인 금액