-- 모든 SpaceEventCategory 데이터 확인

-- 1. SpaceEventCategory 테이블의 모든 데이터 확인
SELECT 
    sec.id,
    sec."spaceId",
    sec."eventCategoryId",
    s.name as space_name,
    ec.name as category_name
FROM "SpaceEventCategory" sec
LEFT JOIN "Space" s ON s.id = sec."spaceId"
LEFT JOIN "EventCategory" ec ON ec.id = sec."eventCategoryId"
LIMIT 10;

-- 2. Space 중에서 SpaceEventCategory가 있는 것들 확인
SELECT 
    s.id,
    s.name,
    s.category,
    COUNT(sec.id) as event_category_count
FROM "Space" s
LEFT JOIN "SpaceEventCategory" sec ON s.id = sec."spaceId"
WHERE s.deleted = false
GROUP BY s.id, s.name, s.category
HAVING COUNT(sec.id) > 0
LIMIT 10;

-- 3. 하이드미플리즈 홍제에 EventCategory 연결하기 (예시)
-- INSERT INTO "SpaceEventCategory" ("spaceId", "eventCategoryId")
-- VALUES ('346fc960-e359-421d-8a56-b2a58d44ddfa', 'e62889a4-f4a3-4b69-a633-ecf896a29a44')
-- ON CONFLICT DO NOTHING;