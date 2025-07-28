-- 실제 테이블 이름 확인

-- 1. Space와 EventCategory 관련 테이블들 확인
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (
    table_name LIKE '%space%event%' 
    OR table_name LIKE '%Space%Event%'
    OR table_name = 'SpaceEventCategory'
    OR table_name = 'Space_EventCategory'
)
ORDER BY table_name;

-- 2. Space_EventCategory 테이블 데이터 확인 (언더스코어 사용)
SELECT * FROM "Space_EventCategory" LIMIT 5;

-- 3. 특정 Space의 데이터 확인
SELECT * 
FROM "Space_EventCategory" 
WHERE "Space_id" = '346fc960-e359-421d-8a56-b2a58d44ddfa'
   OR "space_id" = '346fc960-e359-421d-8a56-b2a58d44ddfa'
   OR "spaceId" = '346fc960-e359-421d-8a56-b2a58d44ddfa';

-- 4. 컬럼 이름 확인
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'Space_EventCategory'
ORDER BY ordinal_position;