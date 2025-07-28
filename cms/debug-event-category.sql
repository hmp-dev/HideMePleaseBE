-- Debug Event Category Issue

-- 1. Space 컬렉션의 모든 m2m 필드 확인
SELECT 
    field,
    special,
    interface,
    options
FROM directus_fields
WHERE collection = 'Space'
AND special = 'm2m';

-- 2. SpaceEventCategory 관련 필드들 확인
SELECT 
    collection,
    field,
    special,
    interface,
    required,
    options
FROM directus_fields
WHERE collection IN ('Space', 'SpaceEventCategory', 'EventCategory')
AND (field LIKE '%EventCategory%' OR field LIKE '%eventCategory%' OR field LIKE '%space%')
ORDER BY collection, field;

-- 3. 관계 설정 상세 확인
SELECT 
    many_collection,
    many_field,
    one_collection,
    one_field,
    junction_field,
    one_collection_field
FROM directus_relations
WHERE many_collection = 'SpaceEventCategory'
   OR one_collection = 'SpaceEventCategory'
   OR (many_collection = 'Space' AND many_field LIKE '%EventCategory%');

-- 4. EventCategory 테이블에 데이터가 있는지 확인
SELECT COUNT(*) as event_category_count FROM "EventCategory";

-- 5. SpaceEventCategory 테이블 구조 확인
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'SpaceEventCategory'
ORDER BY ordinal_position;