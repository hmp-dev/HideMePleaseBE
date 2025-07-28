-- 수동으로 SpaceEventCategory에 데이터 추가 테스트

-- 1. Space와 EventCategory 확인
SELECT id, name FROM "Space" WHERE deleted = false LIMIT 5;
SELECT id, name FROM "EventCategory" WHERE deleted = false LIMIT 5;

-- 2. 테스트 데이터 추가 (위의 ID를 사용해서 수정 필요)
-- 예시:
-- INSERT INTO "SpaceEventCategory" ("spaceId", "eventCategoryId")
-- VALUES 
-- ('space-id-here', 'event-category-id-here');

-- 3. 추가 후 확인
SELECT 
    sec.*,
    s.name as space_name,
    ec.name as event_category_name
FROM "SpaceEventCategory" sec
JOIN "Space" s ON s.id = sec."spaceId"
JOIN "EventCategory" ec ON ec.id = sec."eventCategoryId";