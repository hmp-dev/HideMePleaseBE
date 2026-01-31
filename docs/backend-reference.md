# 백엔드 스키마 & API 레퍼런스

Last updated: 2026-01-31 21:35 KST

이 문서는 다음을 요약합니다:
- `prisma/schema.prisma` 기준 데이터 스키마
- `backend/src/api` 및 `backend/src/app` 컨트롤러 기준 API 라우트

테이블이나 컨트롤러를 추가/수정하면 이 문서를 같은 파일에서 계속 업데이트해 주세요.

## 데이터 스키마 (Prisma)

### 핵심 도메인 모델
- `User`: 핵심 계정, 프로필, 토큰, 점주 플래그, 알림, 포인트, 점주 실명, 라이브 액티비티 토큰, 점주 FCM 토큰, PFP 민팅 상태.
- `Wallet`: `publicAddress` 키 기반 지갑, `User`와 연결.
- `NftCollection`: 외부 NFT 컬렉션, 체인 메타데이터/카테고리/관계.
- `Nft`: `Wallet`, `NftCollection`에 연결된 NFT 보유 정보.
- `NftCollectionPoints`: 컬렉션 단위 포인트 집계.
- `NftCollectionMemberPoints`: 사용자별 컬렉션 포인트.
- `SystemNftCollection`: 공간에 매핑된 시스템 민팅 컬렉션.
- `SystemNft`: `User`, `SystemNftCollection`과 연결된 시스템 민팅 NFT.
- `SystemNftCollectionSpace`: 시스템 컬렉션과 공간의 연결 테이블.
- `NftCollectionAllowedSpace`: 컬렉션과 공간의 연결 테이블.
- `Space`: 매장/공간 엔티티, 위치/영업시간/점주/상태, 연락처, 체크인 제약/정책, 사진/사업자등록증 이미지.
- `SpaceBusinessHours`: 공간별 요일 영업/브레이크 시간.
- `SpaceBenefit`: 공간 혜택 및 레벨.
- `SpaceBenefitNftCollection`: 혜택과 컬렉션의 연결 테이블.
- `SpaceBenefitUsage`: 사용자/컬렉션 기준 혜택 사용 이력.
- `SpaceCheckIn`: 체크인 및 하트비트, 포인트, 사용 혜택 정보.
- `SpaceCheckInGroup`: 체크인 그룹(보너스 포인트) 관리.
- `SpaceSiren`: 공간 사이렌 게시물.
- `SpaceUser`: 공간 사용자 멤버십/역할.
- `SpaceUserInvites`: 이메일 기반 공간 초대.
- `UserLastKnownSpace`: 사용자 마지막 위치 공간.
- `CheckInUnlimitedUser`: 체크인 무제한 사용자 화이트리스트.
- `Reservation`: 공간 예약 기록, 확정/취소 시각.
- `Friendship`: 사용자 간 친구 관계 상태.
- `UserPointBalance`: 사용자 포인트 잔액 요약.
- `PointTransaction`: 포인트 거래 원장.
- `Notification`: 일반 알림 레코드.
- `PushNotification`: 푸시 알림 히스토리.
- `ScheduleNotification`: 예약 알림.
- `Announcements`: 공지사항.
- `SystemConfig`: 시스템 전역 설정/배너.
- `EventCategory`: 공간 이벤트 카테고리.
- `SpaceEventCategory`: 공간-이벤트 카테고리 연결.
- `MediaFile`: 시스템 NFT 및 자산 미디어 메타데이터.
- `ApiKey`: 관리자/사용자 스코프 API 키, 프리픽스/마지막 사용 시각.
- `SolanaGroups`: tokenAddress와 Solana groupId 매핑.
- `User2`: 레거시 테이블(현재 코드에서는 미사용).

### Directus 테이블
`directus_*` 모델은 Directus CMS에서 사용하는 테이블(사용자, 역할, 파일, 설정,
리비전 등)입니다. Directus 도구나 관리된 마이그레이션 외에서 수동 수정하지 마세요.

### 열거형 (Enums)
- `LoginType`: `FIREBASE`, `WORLD_ID`
- `SpaceUserRole`: `SPACE_ADMIN`
- `SupportedChains`: `ETHEREUM`, `POLYGON`, `MUMBAI`, `SOLANA`, `KLAYTN`, `AVALANCHE`
- `WalletProvider`: `METAMASK`, `KLIP`, `PHANTOM`, `WALLET_CONNECT`, `WEPIN_EVM`, `WEPIN_SOLANA`
- `SpaceCategory`: `PUB`, `CAFE`, `COWORKING`, `MUSIC`, `MEAL`, `WALKERHILL`, `ETC`
- `BenefitLevel`: `LEVEL1`..`LEVEL5`, `LEVEL_NFT`
- `DayOfWeek`: `MONDAY`..`SUNDAY`
- `PointTransactionType`: `EARNED`, `SPENT`, `REFUND`, `ADJUSTMENT`, `LOCKED`, `UNLOCKED`
- `PointSource`: `CHECK_IN`, `GROUP_BONUS`, `PURCHASE`, `REWARD`, `REFERRAL`, `EVENT`,
  `ADMIN_GRANT`, `ADMIN_DEDUCT`, `TRANSFER_IN`, `TRANSFER_OUT`, `REFUND`, `SIREN_POST`,
  `FRIEND_REQUEST`, `FRIEND_ACCEPT`, `OTHER`
- `FriendshipStatus`: `PENDING`, `ACCEPTED`, `REJECTED`, `BLOCKED`
- `StoreStatus`: `DRAFT`, `PENDING`, `APPROVED`, `REJECTED`
- `ReservationStatus`: `PENDING`, `CONFIRMED`, `CANCELLED`, `COMPLETED`, `NO_SHOW`
- `VeganType`: `NONE`, `OPTIONS`, `ALL`
- `RestroomLocation`: `IN_STORE`, `OUTSIDE`, `NONE`
- `RestroomGender`: `UNISEX`, `SEPARATED`, `UNKNOWN`

## API 목록

공통 표기:
- 인증이 필요한 경우 `Authorization: Bearer <JWT>` 또는 `X-API-Key: <key>`를 명시합니다.
- JSON 바디는 `Content-Type: application/json`을 사용합니다.
- 파일 업로드는 `Content-Type: multipart/form-data`를 사용합니다.
- 타입 표기 예: `string`, `number`, `boolean`, `string[]`, `enum(ReservationStatus)`
- 응답 표기 예: `200 OK`, `201 Created`, `204 No Content`
- 에러 표기 예: `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `500 Internal Server Error`

### App
- Response: `200 OK`
- Errors: `500 Internal Server Error`
- Headers: 없음
- `GET /` - 헬스 체크
- `GET /debug-sentry` - Sentry 테스트용 에러 발생

### Auth (`/auth`)
- Response: `200 OK` (JWT 또는 결과)
- Errors: `400 Bad Request`, `401 Unauthorized`, `500 Internal Server Error`
- Headers: `Content-Type: application/json`
- `POST /firebase/login` - Body: `{ token: string }`
- `POST /wld/login` - Body: `{ nullifierHash: string, merkleRoot: string, proof: string, verificationLevel: string, action: string, appVerifierId: string }`
- `GET /wld/login/:appVerifierId` - Path: `appVerifierId: string`

### User (`/user`)
- Response: `200 OK`, `204 No Content`
- Errors: `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`
- Headers: `Authorization: Bearer <JWT>` 또는 `X-API-Key: <key>`
- `GET /`
- `DELETE /`
- `GET /profile`
- `PATCH /profile` - Body: `{ nickName?: string, introduction?: string, locationPublic?: boolean, notificationsEnabled?: boolean, pfpNftId?: string, fcmToken?: string, profilePartsString?: string, finalProfileImageUrl?: string, onboardingCompleted?: boolean, appOS?: string, appVersion?: string, phoneNumber?: string, ownerName?: string, termsAccepted?: boolean, termsAcceptedAt?: string, marketingOptIn?: boolean, notificationSetupCompleted?: boolean }`
- `GET /nickName/exists` - Query: `nickName: string`
- `POST /location` - Body: `{ latitude: number, longitude: number, spaceId?: string }`
- `GET /collections` - Query: `chain: enum(SupportedChains)`, `next?: string`
- `GET /collections/populated` - Query: `chain: enum(SupportedChains)`, `next?: string`
- `GET /collections/selected`
- `GET /collections/selected/points`
- `POST /nft/selected/order` - Body: `{ order: string[] }`
- `POST /nft/select` - Body: `{ nftId: string, selected: boolean, order: number }`
- `GET /collections/communities`
- `GET /collection/:tokenAddress/usage-history` - Query: `type?: enum(BenefitUsageType)`, `page: number`, `order?: enum(SortOrder)`

### Users (`/users/:userId`)
- Response: `200 OK`
- Errors: `401 Unauthorized`, `403 Forbidden`, `404 Not Found`
- Headers: `Authorization: Bearer <JWT>` 또는 `X-API-Key: <key>`
- `GET /profile`
- `GET /collections/selected`
- `GET /collections/selected/points`
- `GET /collection/:tokenAddress/usage-history` - Query: `type?: enum(BenefitUsageType)`, `page: number`, `order?: enum(SortOrder)`

### Space (`/space`)
- Response: `200 OK`, `201 Created`
- Errors: `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`
- Headers: `Authorization: Bearer <JWT>` 또는 `X-API-Key: <key>`
- `POST /` - Body: `{ name: string, nameEn?: string, latitude: number, longitude: number, address: string, addressEn?: string, webLink: string, businessHoursStart: string, businessHoursEnd: string, category: string, introduction?: string, introductionEn?: string, locationDescription?: string, imageId: string, isTemporarilyClosed?: boolean, temporaryClosureReason?: string, temporaryClosureEndDate?: Date, businessHours?: SpaceBusinessHoursDTO[] }`
- `GET /` - Query: `page?: number`, `category?: enum(SpaceCategory)`, `latitude: number`, `longitude: number`
- `GET /recommendations`
- `GET /new-spaces`
- `GET /space/:spaceId`
- `GET /space/:spaceId/benefits`
- `POST /benefits/redeem/:benefitId` - Body: `{ latitude: number, longitude: number, spaceId: string, tokenAddress: string }`
- `POST /:spaceId/check-in` - Body: `{ latitude: number, longitude: number, benefitId?: string, fcmToken?: string, liveActivityToken?: string }`
- `DELETE /:spaceId/check-out` - Body: `{ latitude: number, longitude: number }`
- `GET /:spaceId/check-in-status`
- `GET /:spaceId/check-in-users`
- `GET /:spaceId/current-group`
- `DELETE /:spaceId/check-out-all`
- `POST /checkin/heartbeat` - Body: `{ spaceId: string, latitude: number, longitude: number, timestamp?: string, benefitId?: string }`
- `GET /checkin/status`
- `POST /checkin/live-activity-token` - Body: `{ liveActivityToken: string }`
- `DELETE /checkin/live-activity-token`

### Space Public (`/space`)
- Response: `200 OK`
- Errors: `500 Internal Server Error`
- Headers: 없음
- `GET /public`

### Siren (`/space/siren`)
- Response: `200 OK`, `201 Created`
- Errors: `400 Bad Request`, `401 Unauthorized`, `404 Not Found`
- Headers: `Authorization: Bearer <JWT>`
- `POST /` - Body: `{ spaceId: string, message: string, expiresAt: string }`
- `GET /` - Query: `sortBy?: enum(SirenSortBy)`, `latitude?: number`, `longitude?: number`, `page?: number`, `limit?: number`, `spaceId?: string`
- `GET /my`
- `DELETE /:sirenId`
- `GET /stats/:spaceId`

### Reservation (`/reservation`)
- Response: `200 OK`, `201 Created`
- Errors: `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`
- Headers: `Authorization: Bearer <JWT>` 또는 `X-API-Key: <key>`
- `POST /` - Body: `{ spaceId: string, reservationTime: string, guestCount: number, guestName?: string, contactNumber?: string, memo?: string }`
- `GET /` - Query: `status?: enum(ReservationStatus)`, `startDate?: string`, `endDate?: string`, `page?: number`, `limit?: number`
- `GET /:reservationId`
- `DELETE /:reservationId` - Body: `{ cancelReason?: string }`

### Owner (`/owner`)
- Response: `200 OK`, `201 Created`
- Errors: `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`
- Headers: `Authorization: Bearer <JWT>` 또는 `X-API-Key: <key>` (점주 권한 필요)
- `GET /dashboard`
- `GET /spaces`
- `POST /spaces` - Body: `{ name: string, nameEn?: string, latitude?: number, longitude?: number, address: string, addressEn?: string, webLink?: string, businessHoursStart?: string, businessHoursEnd?: string, businessHours?: Record<DayOfWeek, { isClosed: boolean, openTime: string, closeTime: string, breakStartTime?: string, breakEndTime?: string }>, dayBenefits?: Record<DayOfWeek, { name: string, startTime?: string, endTime?: string }[]>, category: enum(SpaceCategory), introduction?: string, introductionEn?: string, imageId?: string, photo1Id?: string, photo2Id?: string, photo3Id?: string, businessRegistrationImageId?: string, phoneNumber?: string, maxCheckInCapacity?: number, photos?: { id: string }[], mainPhotoIndex?: number, businessLicense?: { id: string }, eventEnabled?: boolean, reservationEnabled?: boolean, parkingAvailable?: boolean, valetAvailable?: boolean, groupSeatingAvailable?: boolean, highChairAvailable?: boolean, outletAvailable?: boolean, wheelchairAccessible?: boolean, noKidsZone?: boolean, petFriendly?: boolean, veganType?: enum(VeganType), veganFriendly?: boolean, wifiAvailable?: boolean, wifiSsid?: string, restroomLocation?: enum(RestroomLocation), restroomGender?: enum(RestroomGender), smokingArea?: boolean, paymentMethods?: string[], reservationDepositRequired?: boolean, waitlistAvailable?: boolean, maxReservationPartySize?: number, soldOutMenuIds?: string[], terraceSeating?: boolean, lastOrderTime?: string, takeoutAvailable?: boolean, strollerStorage?: boolean }`
- `PATCH /spaces/:spaceId` - Body: `{ name?: string, nameEn?: string, address?: string, addressEn?: string, webLink?: string, businessHoursStart?: string, businessHoursEnd?: string, introduction?: string, introductionEn?: string, isTemporarilyClosed?: boolean, temporaryClosureReason?: string, photo1Id?: string, photo2Id?: string, photo3Id?: string, businessRegistrationImageId?: string, latitude?: number, longitude?: number, category?: enum(SpaceCategory), imageId?: string, temporaryClosureEndDate?: string, locationDescription?: string, checkInEnabled?: boolean, checkInPointsOverride?: number, checkInRequirements?: any, dailyCheckInLimit?: number, maxCheckInCapacity?: number, phoneNumber?: string, eventEnabled?: boolean, reservationEnabled?: boolean, parkingAvailable?: boolean, valetAvailable?: boolean, groupSeatingAvailable?: boolean, highChairAvailable?: boolean, outletAvailable?: boolean, wheelchairAccessible?: boolean, noKidsZone?: boolean, petFriendly?: boolean, veganType?: enum(VeganType), veganFriendly?: boolean, wifiAvailable?: boolean, wifiSsid?: string, restroomLocation?: enum(RestroomLocation), restroomGender?: enum(RestroomGender), smokingArea?: boolean, paymentMethods?: string[], reservationDepositRequired?: boolean, waitlistAvailable?: boolean, maxReservationPartySize?: number, soldOutMenuIds?: string[], terraceSeating?: boolean, lastOrderTime?: string, takeoutAvailable?: boolean, strollerStorage?: boolean }`
- `PATCH /spaces/:spaceId/status` - Body: `{ isTemporarilyClosed?: boolean, temporaryClosureReason?: string, temporaryClosureEndDate?: string, eventEnabled?: boolean, reservationEnabled?: boolean }`
- `POST /spaces/:spaceId/submit`
- `GET /spaces/:spaceId/reservations` - Query: `status?: enum(ReservationStatus)`, `startDate?: string`, `endDate?: string`, `page?: number`, `limit?: number`
- `PATCH /reservations/:reservationId/confirm` - Body: `{ ownerMemo?: string, cancelReason?: string }`
- `PATCH /reservations/:reservationId/cancel` - Body: `{ ownerMemo?: string, cancelReason?: string }`
- `PATCH /reservations/:reservationId/complete` - Body: `{ ownerMemo?: string, cancelReason?: string }`
- `PATCH /reservations/:reservationId/no-show` - Body: `{ ownerMemo?: string, cancelReason?: string }`
- `POST /upload-image` - Headers: `Content-Type: multipart/form-data`, Body: `{ file: file }`
- `POST /spaces/:spaceId/benefits` - Body: `{ description: string, descriptionEn?: string, dayOfWeek?: enum(DayOfWeek), level?: enum(BenefitLevel), singleUse?: boolean, isRepresentative?: boolean }`
- `GET /spaces/:spaceId/benefits` - Query: `dayOfWeek?: enum(DayOfWeek)`
- `PATCH /spaces/:spaceId/benefits/:benefitId` - Body: `{ description?: string, descriptionEn?: string, dayOfWeek?: enum(DayOfWeek), level?: enum(BenefitLevel), singleUse?: boolean, isRepresentative?: boolean, active?: boolean }`
- `DELETE /spaces/:spaceId/benefits/:benefitId`
- `POST /fcm-token` - Body: `{ fcmToken: string }`
- `DELETE /fcm-token`

### Admin Owner (`/admin`)
- Response: `200 OK`, `201 Created`
- Errors: `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`
- Headers: `Authorization: Bearer <JWT>` (관리자 권한 필요)
- `POST /spaces` - Body: `{ name: string, nameEn?: string, latitude: number, longitude: number, address: string, addressEn?: string, webLink?: string, businessHoursStart: string, businessHoursEnd: string, category: enum(SpaceCategory), introduction?: string, introductionEn?: string, imageId: string, ownerId?: string, storeStatus?: enum(StoreStatus) }`
- `GET /spaces/pending` - Query: `page?: number`, `limit?: number`, `status?: enum(StoreStatus)`
- `POST /spaces/:spaceId/approve` - Body: `{ memo?: string }`
- `POST /spaces/:spaceId/reject` - Body: `{ reason: string }`
- `GET /owners`
- `POST /users/:userId/set-owner` - Body: `{ reason?: string }`
- `DELETE /users/:userId/revoke-owner`

### Admin API Keys (`/admin/api-keys`)
- Response: `200 OK`, `201 Created`
- Errors: `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`
- Headers: `Authorization: Bearer <JWT>` (관리자 권한 필요)
- `POST /` - Body: `{ name: string, isAdmin?: boolean, userId?: string, expiresAt?: string }`
- `GET /`
- `GET /:id`
- `PATCH /:id/deactivate`
- `PATCH /:id/activate`
- `DELETE /:id`

### Admin NFT (`/admin/nft`)
- Response: `200 OK`, `201 Created`, `204 No Content`
- Errors: `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`
- Headers: `Authorization: Bearer <JWT>` (관리자 권한 필요)
- `POST /user/:userId/profile` - Body: `{ name?: string, description?: string, imageUrl?: string, imagePath?: string, attributes?: NftAttributeDTO[], externalUrl?: string }`
- `PUT /user/:userId/profile` - Body: `{ name?: string, description?: string, imageUrl?: string, imagePath?: string, attributes?: NftAttributeDTO[], externalUrl?: string }`
- `PUT /user/:userId/image` - Body: `{ imageUrl?: string, imagePath?: string }`
- `POST /user/:userId/image/upload` - Headers: `Content-Type: multipart/form-data`, Body: `{ file }`
- `DELETE /user/:userId/profile`

### Admin Announcements (`/admin/announcements`)
- Response: `200 OK`, `201 Created`, `204 No Content`
- Errors: `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`
- Headers: `Authorization: Bearer <JWT>` (관리자 권한 필요)
- `POST /` - Body: `{ title: string, description: string, sendNotification?: boolean }`
- `PUT /:announcementId` - Body: `{ title?: string, description?: string }`
- `DELETE /:announcementId`
- `GET /:announcementId`

### Event Category (`/event-category`)
- Response: `200 OK`, `201 Created`, `204 No Content`
- Errors: `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`
- Headers: `Authorization: Bearer <JWT>`
- `POST /` - Body: `{ name: string, nameEn?: string, description?: string, descriptionEn?: string, displayOrder?: number, isActive?: boolean, colorCode?: string, iconUrl?: string }`
- `GET /` - Query: `includeInactive?: boolean`
- `GET /:id`
- `PATCH /:id` - Body: `{ name?: string, nameEn?: string, description?: string, descriptionEn?: string, displayOrder?: number, isActive?: boolean, colorCode?: string, iconUrl?: string }`
- `DELETE /:id`
- `POST /assign-to-space` - Body: `{ spaceId, eventCategoryIds }`
- `DELETE /space/:spaceId/category/:categoryId`
- `GET /:id/spaces`

### NFT (`/nft`)
- Response: `200 OK`, `201 Created`
- Errors: `400 Bad Request`, `401 Unauthorized`, `404 Not Found`
- Headers: `Authorization: Bearer <JWT>`
- `GET /welcome` - Query: `latitude?: number`, `longitude?: number`
- `POST /welcome/:tokenAddress`
- `POST /pfp/mint` - Body: `{ walletAddress: string, imageUrl: string, metadataUrl: string, name?: string, description?: string }`
- `GET /pfp`
- `GET /collection/:tokenAddress/benefits` - Query: `page?: number`, `pageSize?: number`, `spaceId?: string`, `latitude?: number`, `longitude?: number`
- `GET /collection/:tokenAddress/network-info`
- `GET /collection/:tokenAddress/info`
- `GET /collection/:tokenAddress/spaces` - Query: `latitude: number`, `longitude: number`
- `GET /collection/:tokenAddress/members` - Query: `page?: number`
- `GET /collections` - Query: `page?: number`, `pageSize?: number`
- `GET /collections/communities` - Query: `order: enum(NftCommunitySortOrder)`, `page?: number`
- `GET /collections/communities/hot`

### Public NFT (`/public/nft`)
- Response: `200 OK`, `302 Found`
- Errors: `404 Not Found`
- Headers: 없음
- `GET /user/:userId/metadata`
- `GET /user/:userId/image`

### Wallet (`/wallet`)
- Response: `200 OK`
- Errors: `400 Bad Request`, `401 Unauthorized`, `404 Not Found`
- Headers: `Authorization: Bearer <JWT>`
- `GET /`
- `POST /` - Body: `{ publicAddress: string, provider: enum(WalletProvider) }`
- `DELETE /id/:publicAddress`

### Points (`/points`)
- Response: `200 OK`
- Errors: `400 Bad Request`, `401 Unauthorized`, `404 Not Found`
- Headers: `Authorization: Bearer <JWT>`
- `GET /balance`
- `GET /history` - Query: `page?: number`, `limit?: number`, `source?: enum(PointSource)`, `type?: enum(PointTransactionType)`
- `GET /summary`
- `POST /spend` - Body: `{ amount: number, description: string, metadata?: any }`
- `POST /refund` - Body: `{ originalTransactionId: string, reason: string }`

### Admin Points (`/admin/points`)
- Response: `200 OK`
- Errors: `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`
- Headers: `Authorization: Bearer <JWT>`
- `POST /grant` - Body: `{ userId: string, amount: number, reason: string }`
- `POST /adjust/:userId` - Body: `{ amount: number, reason: string }`
- `GET /user/:userId/balance`
- `GET /user/:userId/history` - Query: `page?`, `limit?`

### Friends (`/friends`)
- Response: `200 OK`, `201 Created`
- Errors: `400 Bad Request`, `401 Unauthorized`, `404 Not Found`
- Headers: `Authorization: Bearer <JWT>`
- `POST /request` - Body: `{ addresseeId: string }`
- `POST /accept/:friendshipId`
- `POST /reject/:friendshipId`
- `GET /` - Query: `page?: number`, `limit?: number`
- `GET /requests/received` - Query: `page?: number`, `limit?: number`
- `GET /requests/sent` - Query: `status?: enum(FriendshipStatus)`, `page?: number`, `limit?: number`
- `DELETE /:friendshipId`
- `POST /block/:userId`
- `DELETE /block/:userId`
- `GET /search` - Query: `query: string`, `page?: number`, `limit?: number`
- `GET /stats`
- `GET /status/:userId`

### Push Notification (`/push-notification`)
- Response: `200 OK`
- Errors: `401 Unauthorized`, `404 Not Found`
- Headers: `Authorization: Bearer <JWT>`
- `GET /` - Query: `page?: number`
- `GET /unread/count`
- `PATCH /:id/read`
- `POST /read-all`
- `DELETE /:id`

### Notification (`/notification`)
- Response: `200 OK`
- Errors: `401 Unauthorized`
- Headers: `Authorization: Bearer <JWT>`
- `GET /` - Query: `page?: number`

### CMS (`/cms`)
- Response: `200 OK`, `201 Created`
- Errors: `400 Bad Request`, `401 Unauthorized`, `404 Not Found`
- `PUT /image` - Headers: `Authorization: Bearer <JWT>`, `Content-Type: multipart/form-data`, Body: `{ file: file }`
- `GET /announcements` - Headers: `Authorization: Bearer <JWT>`, Query: `page?: number`
- `GET /settings/banner` - Headers: `Authorization: Bearer <JWT>`
- `GET /modal/banner` - Headers: `Authorization: Bearer <JWT>`
- `GET /top-users` - Headers: 없음, Query: `startDate?: string`
- `GET /top-nfts` - Headers: 없음, Query: `startDate?: string`
- `GET /top-spaces` - Headers: 없음, Query: `startDate?: string`
- `GET /nft-usage-frequency/:tokenAddress` - Headers: 없음
- `GET /user/:userId/benefit-usage` - Headers: 없음, Query: `startDate?: string`
- `GET /user/:userId/benefit-usage-aggregate` - Headers: 없음
- `GET /system-nfts` - Headers: 없음
- `GET /nft/:tokenAddress/benefit-usage` - Headers: 없음, Query: `startDate?: string`
