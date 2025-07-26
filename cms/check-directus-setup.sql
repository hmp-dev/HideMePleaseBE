-- Directus 설정 확인 쿼리

-- 1. Collections 확인
SELECT collection, icon, display_template, hidden 
FROM directus_collections 
WHERE collection IN ('EventCategory', 'SpaceEventCategory', 'Space');

-- 2. Fields 확인
SELECT collection, field, interface, special, hidden 
FROM directus_fields 
WHERE collection IN ('EventCategory', 'SpaceEventCategory', 'Space') 
AND field IN ('SpaceEventCategory', 'eventCategoryId', 'spaceId')
ORDER BY collection, field;

-- 3. Relations 확인
SELECT many_collection, many_field, one_collection, one_field, junction_field 
FROM directus_relations 
WHERE many_collection = 'SpaceEventCategory' 
OR one_collection IN ('EventCategory', 'SpaceEventCategory');

-- 4. 실제 테이블 확인
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('EventCategory', 'SpaceEventCategory');