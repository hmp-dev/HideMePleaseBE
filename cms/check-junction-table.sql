-- SpaceEventCategory 테이블 확인

-- 1. 테이블 구조 확인
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'SpaceEventCategory'
ORDER BY ordinal_position;

-- 2. 테이블에 데이터가 있는지 확인
SELECT 
    sec.*,
    s.name as space_name,
    ec.name as event_category_name
FROM "SpaceEventCategory" sec
LEFT JOIN "Space" s ON s.id = sec."spaceId"
LEFT JOIN "EventCategory" ec ON ec.id = sec."eventCategoryId"
LIMIT 10;

-- 3. 테이블의 제약조건 확인
SELECT
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'SpaceEventCategory';

-- 4. 최근 추가된 데이터 확인
SELECT 
    id,
    "spaceId",
    "eventCategoryId",
    "createdAt"
FROM "SpaceEventCategory"
ORDER BY "createdAt" DESC
LIMIT 5;