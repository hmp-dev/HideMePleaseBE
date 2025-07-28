-- Fix Event Category Field to allow optional selection

-- 1. SpaceEventCategory 필드를 필수가 아니도록 수정
UPDATE directus_fields 
SET required = false
WHERE collection = 'SpaceEventCategory' 
AND field = 'eventCategoryId';

-- 2. Space 컬렉션의 SpaceEventCategory 필드도 필수가 아니도록 수정
UPDATE directus_fields 
SET required = false
WHERE collection = 'Space' 
AND field = 'SpaceEventCategory';

-- 3. 관계 필드의 옵션 업데이트 (선택사항으로 만들기)
UPDATE directus_fields 
SET options = jsonb_set(
    COALESCE(options, '{}'::jsonb),
    '{enableCreate}',
    'false'::jsonb
)
WHERE collection = 'Space' 
AND field = 'SpaceEventCategory';

-- 확인 쿼리
SELECT collection, field, required, options
FROM directus_fields
WHERE (collection = 'Space' AND field = 'SpaceEventCategory')
   OR (collection = 'SpaceEventCategory' AND field IN ('eventCategoryId', 'spaceId'));