-- 특정 Space의 SpaceEventCategory 데이터 확인
-- Space ID: 346fc960-e359-421d-8a56-b2a58d44ddfa (하이드미플리즈 홍제)

-- 1. Space 정보 확인
SELECT id, name, category, deleted 
FROM "Space" 
WHERE id = '346fc960-e359-421d-8a56-b2a58d44ddfa';

-- 2. SpaceEventCategory 데이터 확인
SELECT 
    sec.id,
    sec."spaceId",
    sec."eventCategoryId",
    s.name as space_name,
    ec.name as category_name,
    ec."nameEn" as category_name_en,
    ec."colorCode",
    ec."iconUrl"
FROM "SpaceEventCategory" sec
JOIN "Space" s ON s.id = sec."spaceId"
JOIN "EventCategory" ec ON ec.id = sec."eventCategoryId"
WHERE sec."spaceId" = '346fc960-e359-421d-8a56-b2a58d44ddfa';

-- 3. 전체 SpaceEventCategory 레코드 수 확인
SELECT COUNT(*) as total_count 
FROM "SpaceEventCategory";

-- 4. EventCategory 테이블 데이터 확인
SELECT id, name, "nameEn", "isActive", deleted 
FROM "EventCategory" 
WHERE deleted = false AND "isActive" = true;