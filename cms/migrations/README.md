# Event Categories 배포 가이드

## 배포 전 체크리스트
- [ ] 데이터베이스 백업 완료
- [ ] 실서버 접근 권한 확인
- [ ] Directus 관리자 권한 확인

## 배포 순서

### 1. 백엔드 API 배포
1. 백엔드 코드 배포 (이미 완료된 상태)
   - EventCategory 관련 API 엔드포인트
   - Space API에 EventCategory 정보 포함

### 2. 데이터베이스 마이그레이션
```bash
# 실서버 DB에서 실행
psql -h [production-db-host] -U [username] -d [database] -f cms/migrations/001_add_event_categories.sql
```

### 3. Directus 재시작
```bash
# 실서버에서 Directus 재시작
pm2 restart directus  # 또는 사용 중인 프로세스 매니저
```

### 4. 검증
1. Directus 관리자 패널 확인
   - EventCategory 컬렉션이 보이는지 확인
   - Space 컬렉션에 eventCategories 필드가 추가되었는지 확인

2. API 테스트
   ```bash
   # 이벤트 카테고리 목록 조회
   curl -X GET https://[api-domain]/event-category \
     -H "Authorization: Bearer [token]"
   ```

## 롤백 방법 (문제 발생 시)
```bash
# 롤백 SQL 실행
psql -h [production-db-host] -U [username] -d [database] -f cms/migrations/001_rollback_event_categories.sql
```

## 주의사항
1. 마이그레이션은 idempotent하게 작성되어 있어 여러 번 실행해도 안전합니다.
2. 롤백 스크립트는 모든 이벤트 카테고리 데이터를 삭제합니다.
3. 배포 전 반드시 데이터베이스를 백업하세요.

## 파일 구조
```
cms/migrations/
├── 001_add_event_categories.sql      # 마이그레이션 스크립트
├── 001_rollback_event_categories.sql # 롤백 스크립트
└── README.md                         # 이 문서
```