# ixplorer 브랜치 변경 요약

이 문서는 `master` 기준으로 **ixplorer 브랜치에서 추가/수정된 사항**을 한눈에 보기 쉽게 정리한 것입니다.

## 1) 데이터 스키마 변경 (Prisma)

### User
- `ownerName` (점주 실명)
- `phoneNumber`
- `termsAccepted`, `termsAcceptedAt`
- `marketingOptIn`
- `notificationSetupCompleted`

### Space (점주 앱 기능 확장)
- 운영/예약 토글
  - `eventEnabled`, `reservationEnabled`
- 편의/정책
  - `parkingAvailable`, `valetAvailable`, `groupSeatingAvailable`, `highChairAvailable`
  - `outletAvailable`, `wheelchairAccessible`, `noKidsZone`, `petFriendly`
  - `veganType`, `veganFriendly`
- 유틸/정보
  - `wifiAvailable`, `wifiSsid`, `restroomLocation`, `restroomGender`
  - `smokingArea`, `paymentMethods`
- 예약 상세
  - `reservationDepositRequired`, `waitlistAvailable`, `maxReservationPartySize`
- 기타
  - `soldOutMenuIds`, `terraceSeating`, `lastOrderTime`, `takeoutAvailable`, `strollerStorage`

### 새 enum
- `VeganType` (`NONE`, `OPTIONS`, `ALL`)
- `RestroomLocation` (`IN_STORE`, `OUTSIDE`, `NONE`)
- `RestroomGender` (`UNISEX`, `SEPARATED`, `UNKNOWN`)

> **중요:** 마이그레이션 파일은 아직 생성하지 않았습니다.  
> `ixplorer` 브랜치 기준으로 검토 후 필요 시 생성 바랍니다.

---

## 5) 진행 단계 메모

- 코드 변경: **완료**
- 마이그레이션: **미생성** (DB 스키마 변경은 반영 필요)
- 배포/적용: **미진행**

---

## 2) API 변경 / 추가

### 신규 엔드포인트
- `PATCH /v1/owner/spaces/:spaceId/status`
  - 운영 상태(휴무/이벤트/예약) 전용 업데이트
  - Body: `isTemporarilyClosed`, `temporaryClosureReason`, `temporaryClosureEndDate`,
    `eventEnabled`, `reservationEnabled`

### 기존 엔드포인트 확장
- `PATCH /v1/user/profile`
  - `ownerName`, `phoneNumber`, `termsAccepted`, `termsAcceptedAt`,
    `marketingOptIn`, `notificationSetupCompleted` 추가 지원
- `POST /v1/owner/spaces`
  - 점주 앱에서 요구하는 편의/정책/예약/기타 필드 확장 반영
- `PATCH /v1/owner/spaces/:spaceId`
  - 위 확장 필드들 업데이트 가능하도록 DTO 반영

---

## 3) 문서 업데이트

- `docs/backend-reference.md`
  - 신규 필드/엔드포인트/enum 반영
  - 응답 스키마/에러 코드 정보 추가

---

## 4) 참고

- `BACKEND_FIELD_GAPS.md` 요구사항 기반으로 반영
- `ixplorer` 브랜치는 최신 `master` 기준으로 새로 생성됨
