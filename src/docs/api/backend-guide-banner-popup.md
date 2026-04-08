# 배너 & 팝업 관리 백엔드 구현 가이드

## 목차
1. [개요](#개요)
2. [프로젝트 구조](#프로젝트-구조)
3. [배너 관리 API](#배너-관리-api)
4. [팝업 관리 API](#팝업-관리-api)
5. [통계 API](#통계-api)
6. [공통 처리](#공통-처리)
7. [보안 및 권한](#보안-및-권한)
8. [성능 최적화](#성능-최적화)

---

## 개요

배너 및 팝업 관리 시스템은 쇼핑몰의 마케팅 콘텐츠를 효율적으로 관리하고 통계를 수집하는 시스템입니다.

### 주요 기능
- **배너 관리**: 메인/카테고리 페이지 배너 CRUD
- **팝업 관리**: 팝업 CRUD 및 사용자 설정 관리
- **채널별 노출**: 멀티 채널 시스템 지원
- **통계 수집**: 조회수, 클릭수 등 통계 수집 및 분석
- **스케줄링**: 시작일/종료일 기반 자동 노출 제어

### 기술 스택
- **Framework**: Spring Boot 3.2+
- **Language**: Java 17+
- **Database**: MySQL 8.0+
- **Cache**: Redis (옵션)
- **File Storage**: S3 or Local Storage

---

## 프로젝트 구조

```
src/main/java/com/winnticket/
├── banner/
│   ├── controller/
│   │   ├── BannerController.java           # 관리자 API
│   │   └── BannerShopController.java       # 쇼핑몰 API
│   ├── service/
│   │   ├── BannerService.java
│   │   └── BannerStatsService.java
│   ├── repository/
│   │   ├── BannerRepository.java
│   │   ├── BannerChannelRepository.java
│   │   └── BannerClickLogRepository.java
│   ├── entity/
│   │   ├── Banner.java
│   │   ├── BannerChannel.java
│   │   └── BannerClickLog.java
│   └── dto/
│       ├── BannerDto.java
│       ├── BannerCreateDto.java
│       ├── BannerUpdateDto.java
│       └── BannerStatsDto.java
├── popup/
│   ├── controller/
│   │   ├── PopupController.java            # 관리자 API
│   │   └── PopupShopController.java        # 쇼핑몰 API
│   ├── service/
│   │   ├── PopupService.java
│   │   ├── PopupStatsService.java
│   │   └── PopupUserPreferenceService.java
│   ├── repository/
│   │   ├── PopupRepository.java
│   │   ├── PopupChannelRepository.java
│   │   ├── PopupLogRepository.java
│   │   └── PopupUserPreferenceRepository.java
│   ├── entity/
│   │   ├── Popup.java
│   │   ├── PopupChannel.java
│   │   ├── PopupPage.java
│   │   ├── PopupLog.java
│   │   └── PopupUserPreference.java
│   └── dto/
│       ├── PopupDto.java
│       ├── PopupCreateDto.java
│       ├── PopupUpdateDto.java
│       └── PopupStatsDto.java
└── common/
    ├── dto/ApiResponse.java
    ├── exception/GlobalExceptionHandler.java
    └── config/SecurityConfig.java
```

---

## 배너 관리 API

### 1. Entity 정의

```java
@Entity
@Table(name = "banners")
@Getter @Setter
public class Banner extends BaseEntity {
    
    @Id
    @Column(length = 50)
    private String id;
    
    @Column(nullable = false, length = 200)
    private String name;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    // 배너 설정
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BannerType type;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private BannerPosition position;
    
    @Column(length = 500)
    private String imageUrl;
    
    @Column(length = 500)
    private String imageUrlMobile;
    
    @Column(columnDefinition = "TEXT")
    private String htmlContent;
    
    @Column(length = 500)
    private String videoUrl;
    
    // 클릭 동작
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BannerClickAction clickAction;
    
    @Column(length = 500)
    private String linkUrl;
    
    @Column(length = 10)
    private String linkTarget;
    
    // 노출 설정
    @Column(nullable = false)
    private LocalDateTime startDate;
    
    @Column(nullable = false)
    private LocalDateTime endDate;
    
    @Column(nullable = false)
    private Boolean visible = true;
    
    @Column(nullable = false)
    private Integer displayOrder = 0;
    
    // 통계
    @Column(nullable = false)
    private Long viewCount = 0L;
    
    @Column(nullable = false)
    private Long clickCount = 0L;
    
    // 반응형 설정
    private Integer width;
    private Integer height;
    private Integer mobileWidth;
    private Integer mobileHeight;
    
    // 관계
    @OneToMany(mappedBy = "banner", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BannerChannel> channels = new ArrayList<>();
    
    // 메서드
    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = "BANNER_" + UUID.randomUUID().toString();
        }
    }
    
    public BannerStatus getStatus() {
        LocalDateTime now = LocalDateTime.now();
        if (!visible) return BannerStatus.비활성;
        if (now.isBefore(startDate)) return BannerStatus.예정;
        if (now.isAfter(endDate)) return BannerStatus.만료;
        return BannerStatus.활성;
    }
    
    public void incrementViewCount() {
        this.viewCount++;
    }
    
    public void incrementClickCount() {
        this.clickCount++;
    }
}
```

### 2. Repository 정의

```java
@Repository
public interface BannerRepository extends JpaRepository<Banner, String> {
    
    // 위치별 활성 배너 조회
    @Query("""
        SELECT b FROM Banner b
        LEFT JOIN FETCH b.channels bc
        WHERE b.position = :position
        AND b.visible = true
        AND b.startDate <= :now
        AND b.endDate >= :now
        ORDER BY b.displayOrder ASC, b.createdAt ASC
        """)
    List<Banner> findActiveBannersByPosition(
        @Param("position") BannerPosition position,
        @Param("now") LocalDateTime now
    );
    
    // 채널별 활성 배너 조회
    @Query("""
        SELECT DISTINCT b FROM Banner b
        LEFT JOIN b.channels bc
        WHERE b.position = :position
        AND b.visible = true
        AND b.startDate <= :now
        AND b.endDate >= :now
        AND (bc.channelId = :channelId OR SIZE(b.channels) = 0)
        ORDER BY b.displayOrder ASC, b.createdAt ASC
        """)
    List<Banner> findActiveBannersByPositionAndChannel(
        @Param("position") BannerPosition position,
        @Param("channelId") String channelId,
        @Param("now") LocalDateTime now
    );
    
    // 관리자용: 필터링된 배너 조회
    Page<Banner> findByNameContainingOrDescriptionContaining(
        String name,
        String description,
        Pageable pageable
    );
}
```

### 3. Service 구현

```java
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BannerService {
    
    private final BannerRepository bannerRepository;
    private final BannerChannelRepository bannerChannelRepository;
    private final BannerClickLogRepository bannerClickLogRepository;
    
    /**
     * 배너 목록 조회 (관리자)
     */
    public ApiResponse<Page<BannerDto>> getBanners(
        BannerFilter filter,
        Pageable pageable
    ) {
        Specification<Banner> spec = BannerSpecification.byFilter(filter);
        Page<Banner> banners = bannerRepository.findAll(spec, pageable);
        Page<BannerDto> dtos = banners.map(this::convertToDto);
        
        return ApiResponse.success(dtos);
    }
    
    /**
     * 배너 상세 조회
     */
    public ApiResponse<BannerDto> getBanner(String id) {
        Banner banner = bannerRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("배너를 찾을 수 없습니다."));
        
        return ApiResponse.success(convertToDto(banner));
    }
    
    /**
     * 배너 생성
     */
    @Transactional
    public ApiResponse<BannerDto> createBanner(
        BannerCreateDto dto,
        String userId
    ) {
        // 이미지 URL 검증
        validateImageUrl(dto.getImageUrl());
        
        // Entity 생성
        Banner banner = new Banner();
        banner.setName(dto.getName());
        banner.setDescription(dto.getDescription());
        banner.setType(dto.getType());
        banner.setPosition(dto.getPosition());
        banner.setImageUrl(dto.getImageUrl());
        banner.setImageUrlMobile(dto.getImageUrlMobile());
        banner.setHtmlContent(dto.getHtmlContent());
        banner.setVideoUrl(dto.getVideoUrl());
        banner.setClickAction(dto.getClickAction());
        banner.setLinkUrl(dto.getLinkUrl());
        banner.setLinkTarget(dto.getLinkTarget());
        banner.setStartDate(dto.getStartDate());
        banner.setEndDate(dto.getEndDate());
        banner.setVisible(dto.getVisible());
        banner.setDisplayOrder(dto.getDisplayOrder());
        banner.setWidth(dto.getWidth());
        banner.setHeight(dto.getHeight());
        banner.setMobileWidth(dto.getMobileWidth());
        banner.setMobileHeight(dto.getMobileHeight());
        banner.setCreatedBy(userId);
        banner.setUpdatedBy(userId);
        
        // 저장
        banner = bannerRepository.save(banner);
        
        // 채널 매핑
        if (dto.getChannelIds() != null && !dto.getChannelIds().isEmpty()) {
            for (String channelId : dto.getChannelIds()) {
                BannerChannel bc = new BannerChannel();
                bc.setBanner(banner);
                bc.setChannelId(channelId);
                bannerChannelRepository.save(bc);
            }
        }
        
        return ApiResponse.success(
            convertToDto(banner),
            "배너가 생성되었습니다."
        );
    }
    
    /**
     * 배너 수정
     */
    @Transactional
    public ApiResponse<BannerDto> updateBanner(
        String id,
        BannerUpdateDto dto,
        String userId
    ) {
        Banner banner = bannerRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("배너를 찾을 수 없습니다."));
        
        // 필드 업데이트
        if (dto.getName() != null) banner.setName(dto.getName());
        if (dto.getDescription() != null) banner.setDescription(dto.getDescription());
        if (dto.getType() != null) banner.setType(dto.getType());
        if (dto.getPosition() != null) banner.setPosition(dto.getPosition());
        if (dto.getImageUrl() != null) {
            validateImageUrl(dto.getImageUrl());
            banner.setImageUrl(dto.getImageUrl());
        }
        if (dto.getImageUrlMobile() != null) banner.setImageUrlMobile(dto.getImageUrlMobile());
        if (dto.getHtmlContent() != null) banner.setHtmlContent(dto.getHtmlContent());
        if (dto.getVideoUrl() != null) banner.setVideoUrl(dto.getVideoUrl());
        if (dto.getClickAction() != null) banner.setClickAction(dto.getClickAction());
        if (dto.getLinkUrl() != null) banner.setLinkUrl(dto.getLinkUrl());
        if (dto.getLinkTarget() != null) banner.setLinkTarget(dto.getLinkTarget());
        if (dto.getStartDate() != null) banner.setStartDate(dto.getStartDate());
        if (dto.getEndDate() != null) banner.setEndDate(dto.getEndDate());
        if (dto.getVisible() != null) banner.setVisible(dto.getVisible());
        if (dto.getDisplayOrder() != null) banner.setDisplayOrder(dto.getDisplayOrder());
        if (dto.getWidth() != null) banner.setWidth(dto.getWidth());
        if (dto.getHeight() != null) banner.setHeight(dto.getHeight());
        if (dto.getMobileWidth() != null) banner.setMobileWidth(dto.getMobileWidth());
        if (dto.getMobileHeight() != null) banner.setMobileHeight(dto.getMobileHeight());
        
        banner.setUpdatedBy(userId);
        
        // 채널 매핑 업데이트
        if (dto.getChannelIds() != null) {
            bannerChannelRepository.deleteByBannerId(id);
            for (String channelId : dto.getChannelIds()) {
                BannerChannel bc = new BannerChannel();
                bc.setBanner(banner);
                bc.setChannelId(channelId);
                bannerChannelRepository.save(bc);
            }
        }
        
        return ApiResponse.success(
            convertToDto(banner),
            "배너가 수정되었습니다."
        );
    }
    
    /**
     * 배너 삭제
     */
    @Transactional
    public ApiResponse<Void> deleteBanner(String id) {
        Banner banner = bannerRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("배너를 찾을 수 없습니다."));
        
        bannerRepository.delete(banner);
        
        return ApiResponse.success(null, "배너가 삭제되었습니다.");
    }
    
    /**
     * 쇼핑몰용: 위치별 배너 조회
     */
    public ApiResponse<List<BannerDto>> getShopBanners(
        BannerPosition position,
        String channelId
    ) {
        List<Banner> banners;
        
        if (channelId != null && !channelId.isEmpty()) {
            banners = bannerRepository.findActiveBannersByPositionAndChannel(
                position,
                channelId,
                LocalDateTime.now()
            );
        } else {
            banners = bannerRepository.findActiveBannersByPosition(
                position,
                LocalDateTime.now()
            );
        }
        
        List<BannerDto> dtos = banners.stream()
            .map(this::convertToDto)
            .collect(Collectors.toList());
        
        return ApiResponse.success(dtos);
    }
    
    /**
     * 배너 조회수 증가
     */
    @Transactional
    public void incrementViewCount(String bannerId) {
        Banner banner = bannerRepository.findById(bannerId)
            .orElseThrow(() -> new ResourceNotFoundException("배너를 찾을 수 없습니다."));
        
        banner.incrementViewCount();
    }
    
    /**
     * 배너 클릭 로그 기록
     */
    @Transactional
    public ApiResponse<Void> logBannerClick(
        String bannerId,
        String channelId,
        String userId,
        String ipAddress,
        String userAgent
    ) {
        Banner banner = bannerRepository.findById(bannerId)
            .orElseThrow(() -> new ResourceNotFoundException("배너를 찾을 수 없습니다."));
        
        banner.incrementClickCount();
        
        // 클릭 로그 저장
        BannerClickLog log = new BannerClickLog();
        log.setBannerId(bannerId);
        log.setChannelId(channelId);
        log.setUserId(userId);
        log.setIpAddress(ipAddress);
        log.setUserAgent(userAgent);
        bannerClickLogRepository.save(log);
        
        return ApiResponse.success(null);
    }
    
    // Private methods
    private void validateImageUrl(String imageUrl) {
        if (imageUrl == null || imageUrl.isEmpty()) {
            throw new ValidationException("이미지 URL은 필수입니다.");
        }
        // URL 형식 검증 로직
    }
    
    private BannerDto convertToDto(Banner banner) {
        BannerDto dto = new BannerDto();
        dto.setId(banner.getId());
        dto.setName(banner.getName());
        dto.setDescription(banner.getDescription());
        dto.setType(banner.getType());
        dto.setPosition(banner.getPosition());
        dto.setImageUrl(banner.getImageUrl());
        dto.setImageUrlMobile(banner.getImageUrlMobile());
        dto.setHtmlContent(banner.getHtmlContent());
        dto.setVideoUrl(banner.getVideoUrl());
        dto.setClickAction(banner.getClickAction());
        dto.setLinkUrl(banner.getLinkUrl());
        dto.setLinkTarget(banner.getLinkTarget());
        dto.setStartDate(banner.getStartDate());
        dto.setEndDate(banner.getEndDate());
        dto.setVisible(banner.getVisible());
        dto.setDisplayOrder(banner.getDisplayOrder());
        dto.setChannelIds(
            banner.getChannels().stream()
                .map(BannerChannel::getChannelId)
                .collect(Collectors.toList())
        );
        dto.setViewCount(banner.getViewCount());
        dto.setClickCount(banner.getClickCount());
        dto.setWidth(banner.getWidth());
        dto.setHeight(banner.getHeight());
        dto.setMobileWidth(banner.getMobileWidth());
        dto.setMobileHeight(banner.getMobileHeight());
        dto.setStatus(banner.getStatus());
        dto.setCreatedBy(banner.getCreatedBy());
        dto.setUpdatedBy(banner.getUpdatedBy());
        dto.setCreatedAt(banner.getCreatedAt());
        dto.setUpdatedAt(banner.getUpdatedAt());
        return dto;
    }
}
```

### 4. Controller 구현

```java
@RestController
@RequestMapping("/api/admin/banners")
@RequiredArgsConstructor
public class BannerController {
    
    private final BannerService bannerService;
    
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    public ApiResponse<Page<BannerDto>> getBanners(
        @ModelAttribute BannerFilter filter,
        Pageable pageable
    ) {
        return bannerService.getBanners(filter, pageable);
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    public ApiResponse<BannerDto> getBanner(@PathVariable String id) {
        return bannerService.getBanner(id);
    }
    
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<BannerDto> createBanner(
        @Valid @RequestBody BannerCreateDto dto,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        return bannerService.createBanner(dto, userDetails.getUsername());
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<BannerDto> updateBanner(
        @PathVariable String id,
        @Valid @RequestBody BannerUpdateDto dto,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        return bannerService.updateBanner(id, dto, userDetails.getUsername());
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> deleteBanner(@PathVariable String id) {
        return bannerService.deleteBanner(id);
    }
}
```

```java
@RestController
@RequestMapping("/api/shop/banners")
@RequiredArgsConstructor
public class BannerShopController {
    
    private final BannerService bannerService;
    
    @GetMapping
    public ApiResponse<List<BannerDto>> getBanners(
        @RequestParam BannerPosition position,
        @RequestParam(required = false) String channelId
    ) {
        return bannerService.getShopBanners(position, channelId);
    }
    
    @PostMapping("/{id}/view")
    public ApiResponse<Void> logView(@PathVariable String id) {
        bannerService.incrementViewCount(id);
        return ApiResponse.success(null);
    }
    
    @PostMapping("/{id}/click")
    public ApiResponse<Void> logClick(
        @PathVariable String id,
        @RequestParam(required = false) String channelId,
        @AuthenticationPrincipal UserDetails userDetails,
        HttpServletRequest request
    ) {
        String userId = userDetails != null ? userDetails.getUsername() : null;
        String ipAddress = request.getRemoteAddr();
        String userAgent = request.getHeader("User-Agent");
        
        return bannerService.logBannerClick(id, channelId, userId, ipAddress, userAgent);
    }
}
```

---

## 팝업 관리 API

팝업 관리는 배너와 유사한 구조를 가지며, 추가로 **사용자 설정 관리** 기능이 포함됩니다.

### 주요 차이점

1. **PopupUserPreference**: 사용자별 "오늘 하루 보지 않기" 설정
2. **PopupPage**: 페이지별 노출 설정
3. **ShowCondition**: 표시 조건 (첫 방문, 하루 한 번 등)

### PopupService 추가 메서드

```java
/**
 * 쇼핑몰용: 표시할 팝업 조회 (사용자 설정 고려)
 */
public ApiResponse<List<PopupDto>> getShopPopups(
    String channelId,
    String pagePath,
    String userId,
    String sessionId
) {
    // 1. 활성 팝업 조회
    List<Popup> popups = popupRepository.findActivePopupsByChannelAndPage(
        channelId,
        pagePath,
        LocalDateTime.now()
    );
    
    // 2. 사용자 설정 필터링
    List<Popup> filteredPopups = popups.stream()
        .filter(popup -> shouldShowPopup(popup, userId, sessionId))
        .collect(Collectors.toList());
    
    List<PopupDto> dtos = filteredPopups.stream()
        .map(this::convertToDto)
        .collect(Collectors.toList());
    
    return ApiResponse.success(dtos);
}

/**
 * 팝업 표시 여부 확인
 */
private boolean shouldShowPopup(Popup popup, String userId, String sessionId) {
    // 사용자 설정 조회
    PopupUserPreference pref = popupUserPreferenceRepository
        .findByPopupIdAndUserIdOrSessionId(popup.getId(), userId, sessionId)
        .orElse(null);
    
    if (pref != null) {
        // "다시 보지 않기" 설정
        if (pref.getNeverShow()) {
            return false;
        }
        
        // "오늘 하루 보지 않기" 설정
        if (pref.getClosedUntil() != null && 
            LocalDateTime.now().isBefore(pref.getClosedUntil())) {
            return false;
        }
    }
    
    // 표시 조건 확인
    switch (popup.getShowCondition()) {
        case FIRST_VISIT:
            return pref == null; // 첫 방문이면 설정 없음
        case ONCE_PER_DAY:
            return pref == null || 
                   pref.getUpdatedAt().toLocalDate().isBefore(LocalDate.now());
        case ONCE_PER_SESSION:
            // 세션 체크 로직 (Redis 활용)
            return !hasShownInSession(popup.getId(), sessionId);
        default:
            return true;
    }
}

/**
 * "오늘 하루 보지 않기" 설정
 */
@Transactional
public ApiResponse<Void> setTodayClose(
    String popupId,
    String userId,
    String sessionId
) {
    PopupUserPreference pref = popupUserPreferenceRepository
        .findByPopupIdAndUserIdOrSessionId(popupId, userId, sessionId)
        .orElse(new PopupUserPreference());
    
    pref.setPopupId(popupId);
    pref.setUserId(userId);
    pref.setSessionId(sessionId);
    pref.setClosedUntil(LocalDateTime.now().plusDays(1));
    
    popupUserPreferenceRepository.save(pref);
    
    return ApiResponse.success(null, "오늘 하루 보지 않기 설정이 완료되었습니다.");
}
```

---

## 통계 API

### BannerStatsService

```java
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BannerStatsService {
    
    private final BannerClickLogRepository bannerClickLogRepository;
    private final BannerViewLogRepository bannerViewLogRepository;
    
    /**
     * 배너 통계 조회
     */
    public ApiResponse<BannerStatsDto> getBannerStats(
        String bannerId,
        LocalDate startDate,
        LocalDate endDate
    ) {
        BannerStatsDto stats = new BannerStatsDto();
        stats.setBannerId(bannerId);
        
        // 총 조회수/클릭수
        stats.setTotalViews(bannerViewLogRepository.countByBannerIdAndPeriod(
            bannerId,
            startDate.atStartOfDay(),
            endDate.atTime(23, 59, 59)
        ));
        
        stats.setTotalClicks(bannerClickLogRepository.countByBannerIdAndPeriod(
            bannerId,
            startDate.atStartOfDay(),
            endDate.atTime(23, 59, 59)
        ));
        
        // 클릭률 계산
        if (stats.getTotalViews() > 0) {
            stats.setClickRate(
                (double) stats.getTotalClicks() / stats.getTotalViews() * 100
            );
        }
        
        // 일별 통계
        stats.setViewsByDate(getViewsByDate(bannerId, startDate, endDate));
        
        // 채널별 통계
        stats.setViewsByChannel(getViewsByChannel(bannerId, startDate, endDate));
        
        return ApiResponse.success(stats);
    }
    
    private List<DailyStatsDto> getViewsByDate(
        String bannerId,
        LocalDate startDate,
        LocalDate endDate
    ) {
        // Native query or JPQL로 일별 집계
        return bannerViewLogRepository.findDailyStatsByBannerIdAndPeriod(
            bannerId,
            startDate.atStartOfDay(),
            endDate.atTime(23, 59, 59)
        );
    }
    
    private List<ChannelStatsDto> getViewsByChannel(
        String bannerId,
        LocalDate startDate,
        LocalDate endDate
    ) {
        // Native query or JPQL로 채널별 집계
        return bannerViewLogRepository.findChannelStatsByBannerIdAndPeriod(
            bannerId,
            startDate.atStartOfDay(),
            endDate.atTime(23, 59, 59)
        );
    }
}
```

---

## 공통 처리

### ApiResponse 래핑

```java
@Getter
@AllArgsConstructor
public class ApiResponse<T> {
    private boolean success;
    private String message;
    private T data;
    
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, null, data);
    }
    
    public static <T> ApiResponse<T> success(T data, String message) {
        return new ApiResponse<>(true, message, data);
    }
    
    public static <T> ApiResponse<T> error(String message) {
        return new ApiResponse<>(false, message, null);
    }
}
```

### 예외 처리

```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleResourceNotFound(
        ResourceNotFoundException ex
    ) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(ApiResponse.error(ex.getMessage()));
    }
    
    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(
        ValidationException ex
    ) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(ApiResponse.error(ex.getMessage()));
    }
    
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDenied(
        AccessDeniedException ex
    ) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body(ApiResponse.error("접근 권한이 없습니다."));
    }
}
```

---

## 보안 및 권한

### Security Configuration

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/admin/**").hasAnyRole("ADMIN", "SUPERVISOR")
                .requestMatchers("/api/shop/**").permitAll()
                .anyRequest().authenticated()
            )
            .csrf().disable()
            .sessionManagement()
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS);
        
        return http.build();
    }
}
```

### 권한 체크

- **ADMIN**: 모든 배너/팝업 CRUD 가능
- **SUPERVISOR**: 조회만 가능
- **일반 사용자**: 쇼핑몰 API만 접근 가능

---

## 성능 최적화

### 1. 캐싱 전략

```java
@Cacheable(value = "banners", key = "#position + '_' + #channelId")
public List<BannerDto> getShopBanners(
    BannerPosition position,
    String channelId
) {
    // ...
}

@CacheEvict(value = "banners", allEntries = true)
public ApiResponse<BannerDto> createBanner(...) {
    // ...
}
```

### 2. 인덱스 최적화

```sql
-- 활성 배너 조회 최적화
CREATE INDEX idx_active_banners 
ON banners(position, visible, start_date, end_date, display_order);

-- 통계 집계 최적화
CREATE INDEX idx_logs_stats 
ON banner_click_logs(banner_id, clicked_at);
```

### 3. 비동기 로깅

```java
@Async
public void logBannerViewAsync(
    String bannerId,
    String channelId,
    String userId
) {
    BannerViewLog log = new BannerViewLog();
    log.setBannerId(bannerId);
    log.setChannelId(channelId);
    log.setUserId(userId);
    bannerViewLogRepository.save(log);
}
```

### 4. 배치 처리

```java
@Scheduled(cron = "0 0 1 * * *") // 매일 새벽 1시
public void aggregateDailyStats() {
    LocalDate yesterday = LocalDate.now().minusDays(1);
    
    // 일별 통계 집계
    List<BannerStatsDaily> dailyStats = 
        bannerClickLogRepository.aggregateDailyStats(yesterday);
    
    bannerStatsDailyRepository.saveAll(dailyStats);
    
    // 90일 이전 로그 삭제
    LocalDateTime cutoffDate = LocalDateTime.now().minusDays(90);
    bannerClickLogRepository.deleteByClickedAtBefore(cutoffDate);
    bannerViewLogRepository.deleteByViewedAtBefore(cutoffDate);
}
```

---

## 테스트

### 단위 테스트

```java
@SpringBootTest
@Transactional
class BannerServiceTest {
    
    @Autowired
    private BannerService bannerService;
    
    @Test
    void 배너_생성_성공() {
        // Given
        BannerCreateDto dto = new BannerCreateDto();
        dto.setName("테스트 배너");
        dto.setPosition(BannerPosition.MAIN_TOP);
        // ... 기타 필드 설정
        
        // When
        ApiResponse<BannerDto> response = 
            bannerService.createBanner(dto, "admin");
        
        // Then
        assertTrue(response.isSuccess());
        assertNotNull(response.getData().getId());
        assertEquals("테스트 배너", response.getData().getName());
    }
    
    @Test
    void 활성_배너_조회_성공() {
        // Given
        createTestBanner(); // 테스트 데이터 생성
        
        // When
        ApiResponse<List<BannerDto>> response = 
            bannerService.getShopBanners(BannerPosition.MAIN_TOP, null);
        
        // Then
        assertTrue(response.isSuccess());
        assertFalse(response.getData().isEmpty());
    }
}
```

---

## 배포 체크리스트

- [ ] 데이터베이스 마이그레이션 스크립트 준비
- [ ] 인덱스 생성 확인
- [ ] 환경 변수 설정 (파일 업로드 경로 등)
- [ ] 로그 레벨 설정
- [ ] 캐시 서버 연결 확인
- [ ] 배치 스케줄러 설정
- [ ] 모니터링 설정
- [ ] API 문서 배포
