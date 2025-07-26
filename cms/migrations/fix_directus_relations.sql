-- Fix Directus Relations for Event Categories
-- 기존 관계 삭제
DELETE FROM directus_relations WHERE many_collection = 'SpaceEventCategory';

-- 올바른 M2M 관계 설정
INSERT INTO directus_relations (many_collection, many_field, one_collection, one_field, one_collection_field, one_allowed_collections, junction_field, sort_field, one_deselect_action)
VALUES 
    -- Space -> SpaceEventCategory 관계 (M2M의 한쪽)
    ('SpaceEventCategory', 'spaceId', 'Space', 'SpaceEventCategory', null, null, 'eventCategoryId', null, 'nullify'),
    -- EventCategory -> SpaceEventCategory 관계 (M2M의 다른쪽)
    ('SpaceEventCategory', 'eventCategoryId', 'EventCategory', 'SpaceEventCategory', null, null, 'spaceId', null, 'nullify');