# 실서버 배포 가이드 (psql 없이)

## 방법 1: Node.js 스크립트 사용 (권장)

### 1. 서버에 파일 업로드
```bash
# migrations 폴더 전체를 서버에 업로드
scp -r cms/migrations/ user@server:/path/to/cms/
```

### 2. 서버에서 실행
```bash
cd /path/to/cms/migrations

# 환경변수 설정 (또는 migrate-event-categories.js 파일 직접 수정)
export DB_HOST="your-db-host"
export DB_DATABASE="your-database"
export DB_USER="your-username"
export DB_PASSWORD="your-password"

# 마이그레이션 실행
node migrate-event-categories.js migrate

# 문제 발생 시 롤백
node migrate-event-categories.js rollback
```

## 방법 2: Directus API 사용

Directus가 실행 중이라면, Directus의 custom endpoint를 통해 SQL 실행:

```bash
# Directus Admin으로 로그인 후
# Settings > Extensions > Custom Endpoints 에서 SQL 실행
```

## 방법 3: 데이터베이스 클라이언트 사용

### DBeaver, pgAdmin, TablePlus 등 사용
1. 실서버 DB에 연결
2. `001_add_event_categories.sql` 내용 복사
3. SQL 에디터에서 실행

## 방법 4: SSH 터널링 + 로컬 psql

```bash
# SSH 터널 생성
ssh -L 5433:localhost:5432 user@server

# 로컬에서 psql 실행
psql -h localhost -p 5433 -U username -d database -f cms/migrations/001_add_event_categories.sql
```

## 방법 5: Prisma 사용

백엔드 서버에서:
```bash
cd /path/to/backend

# 이미 스키마는 업데이트되어 있으므로
npx prisma db push

# 또는 마이그레이션 생성
npx prisma migrate deploy
```

## 검증 방법

### API로 확인
```bash
# 이벤트 카테고리 목록 조회
curl https://your-api-domain/event-category
```

### Directus 관리자 패널
1. Directus 로그인
2. Content > EventCategory 메뉴 확인
3. Settings > Data Model > Space > eventCategories 필드 확인

## 주의사항
- 배포 전 반드시 데이터베이스 백업
- 실서버 환경변수 확인
- Directus 재시작 필요할 수 있음