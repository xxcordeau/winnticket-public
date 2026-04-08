📘 Channel Management Module (채널 관리 모듈)

채널 관리 기능은 쇼핑몰·파트너사와 연동되는 판매 채널의 기본 정보를 등록·조회하기 위한 모듈입니다.
본 문서는 Controller → Service → Mapper → DTO 순서로 실제 동작 흐름을 이해하기 쉽게 정리한 문서입니다.

📂 1. 기능 개요
제공 기능
기능	설명
채널 목록 조회	코드/이름/회사명으로 필터링하여 채널 정보를 조회
채널 등록	채널코드·회사명·도메인 등 신규 채널 등록
기술 스택

Spring Boot

RestController

MyBatis Mapper 기반 DB 연동

Swagger(OpenAPI) 를 통한 API 문서 자동화

📁 2. 패키지 구조
kr/co/winnticket/channels
├── controller
│   └── ChannelController.java
├── dto
│   ├── ChannelCreateReqDto.java
│   └── ChannelListGetResDto.java
├── mapper
│   └── ChannelMapper.java
└── service
    └── ChannelService.java

📌 3. API 상세 설명
📍 3-1. 채널 목록 조회 API
GET /api/channels
✔ 기능

채널 목록 조회

코드 / 이름 / 회사명 조건(optional)으로 필터링

✔ Request Parameters
파라미터	타입	필수	설명
code	String	❌	채널 코드
name	String	❌	채널 이름
companyName	String	❌	회사명
✔ Response Body
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "id": "UUID",
      "code": "NAVER",
      "name": "네이버 스토어",
      "logoUrl": "https://...",
      "companyName": "네이버",
      "status": true,
      "domain": "https://naver.com"
    }
  ]
}

📍 3-2. 채널 등록 API
POST /api/channels
✔ Request Body (ChannelCreateReqDto)
{
  "code": "COUPANG",
  "name": "쿠팡",
  "companyName": "쿠팡",
  "commissionRate": 10,
  "logoUrl": "https://...",
  "faviconUrl": "https://...",
  "email": "contact@coupang.com",
  "phone": "02-123-4567",
  "domain": "https://coupang.com",
  "description": "쿠팡 판매 채널",
  "status": true
}

✔ Response Body
{
  "success": true,
  "message": "채널이 등록되었습니다",
  "data": null
}

🧩 4. Controller
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/channels")
@Tag(name = "채널", description = "채널 관리 > 채널 목록")
public class ChannelController {

    private final ChannelService service;

    @GetMapping
    @Operation(summary = "채널 목록 조회", description = "채널 목록을 조회합니다.")
    public ResponseEntity<ApiResponse<List<ChannelListGetResDto>>> getChannelList(
            @Parameter(description = "채널코드") @RequestParam(required = false) String code,
            @Parameter(description = "채널이름") @RequestParam(required = false) String name,
            @Parameter(description = "회사이름") @RequestParam(required = false) String companyName
    ){
        List<ChannelListGetResDto> list = service.getChannelList(code, name, companyName);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @PostMapping
    @Operation(summary = "채널 등록", description = "채널을 등록합니다.")
    public ResponseEntity<ApiResponse<Void>> postChannel(
            @RequestBody ChannelCreateReqDto model
    ){
        service.createChannel(model);
        return ResponseEntity.ok(ApiResponse.success("채널이 등록되었습니다", null));
    }
}

🧠 5. Service
@Service
@RequiredArgsConstructor
public class ChannelService {

    private final ChannelMapper mapper;

    // 채널 조회 + 검색
    public List<ChannelListGetResDto> getChannelList(String code, String name, String companyName) {
        return mapper.selectPartnerList(code, name, companyName);
    }

    // 채널 등록
    public void createChannel(ChannelCreateReqDto model){
        mapper.createChannel(model);
    }
}

🗂 6. MyBatis Mapper
@Mapper
public interface ChannelMapper {

    // 채널조회 + 검색
    List<ChannelListGetResDto> selectPartnerList(
            @Param("code") String code,
            @Param("name") String name,
            @Param("companyName") String companyName
    );

    // 채널 등록
    void createChannel(ChannelCreateReqDto model);
}

📦 7. DTO
7-1. ChannelCreateReqDto
@Data
@Schema(title = "[채널관리 > 채널 추가 ] ChannelCreateReqDto")
public class ChannelCreateReqDto {

    @Hidden
    @NotBlank
    private UUID id;

    @NotBlank
    @Pattern(regexp = "^[A-Z0-9]+$", message = "채널코드는 대문자와 숫자만 입력 가능합니다.")
    private String code;

    @NotBlank
    private String name;

    @NotBlank
    private String companyName;

    private Integer commissionRate;
    private String logoUrl;
    private String faviconUrl;
    private String email;
    private String phone;
    private String domain;
    private String description;
    private Boolean status;

    public void setCode(String code) {
        if (code != null) {
            this.code = code.toUpperCase(); // 자동 대문자 변환
        }
    }
}

7-2. ChannelListGetResDto
@Data
@Schema(title = "[채널관리 > 채널 목록 ] ChannelListGetResDto")
public class ChannelListGetResDto {

    @Hidden
    private UUID id;

    @NotBlank
    private String code;

    @NotBlank
    private String name;

    private String logoUrl;

    @NotBlank
    private String companyName;

    private boolean status;

    @NotBlank
    private String domain;
}

📄 8. APIResponse 구조

이 모듈 전체 응답은 아래 공통 구조 사용:

@Builder
public class ApiResponse<T> {
    private boolean success;
    private String message;
    private T data;
    private String errorCode;
}


사용 예시

ApiResponse.success(data)
ApiResponse.success("메시지", null)
ApiResponse.error("에러 메시지")

✅ 9. 전체 흐름 요약

Client → GET /api/channels
→ Controller
→ Service
→ Mapper(MyBatis)
→ DB 조회
→ 결과 DTO 반환

Client → POST /api/channels
→ Controller
→ Service
→ Mapper
→ DB insert
→ 성공 메시지 응답