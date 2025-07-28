-- Space 컬렉션의 M2M 필드명 확인 및 수정

-- 1. 현재 필드 확인
SELECT 
    field,
    special,
    interface,
    options::text
FROM directus_fields
WHERE collection = 'Space' 
AND special = 'm2m';

-- 2. 필드명이 잘못되었다면 수정
-- 예: SpaceEventCategory -> event_categories
UPDATE directus_fields
SET field = 'event_categories'
WHERE collection = 'Space' 
AND field = 'SpaceEventCategory'
AND special = 'm2m';

-- 3. 관계도 업데이트
UPDATE directus_relations
SET one_field = 'event_categories'
WHERE one_collection = 'Space'
AND one_field = 'SpaceEventCategory';

-- 4. 옵션에서 junction collection 확인
UPDATE directus_fields
SET options = jsonb_set(
    options,
    '{junctionCollection}',
    '"SpaceEventCategory"'
)
WHERE collection = 'Space' 
AND field = 'event_categories'
AND special = 'm2m';