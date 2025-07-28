-- Space_EventCategory 테이블의 실제 컬럼 이름 확인

-- 1. 테이블 존재 여부 확인
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'Space_EventCategory';

-- 2. Space_EventCategory 테이블의 모든 컬럼 확인
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'Space_EventCategory'
ORDER BY ordinal_position;

-- 3. 실제 데이터 샘플 확인 (컬럼 이름 확인용)
SELECT * FROM "Space_EventCategory" LIMIT 1;