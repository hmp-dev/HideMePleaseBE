-- Simple approach: Create event categories field for Space

-- 1. 먼저 기존 필드 삭제 (있다면)
DELETE FROM directus_fields WHERE collection = 'Space' AND field IN ('SpaceEventCategory', 'eventCategories', 'event_categories');

-- 2. Many to Many 필드 생성
INSERT INTO directus_fields (
    collection,
    field,
    special,
    interface,
    options,
    display,
    display_options,
    readonly,
    hidden,
    sort,
    width,
    required
) VALUES (
    'Space',
    'event_categories',
    'm2m',
    'list-m2m',
    jsonb_build_object(
        'template', '{{eventCategoryId.name}}',
        'enableCreate', false,
        'enableSelect', true,
        'layout', 'list'
    ),
    'related-values',
    jsonb_build_object(
        'template', '{{eventCategoryId.name}}'
    ),
    false,
    false,
    40,
    'full',
    false
);

-- 3. 관계 설정
DELETE FROM directus_relations 
WHERE (many_collection = 'SpaceEventCategory' AND one_collection IN ('Space', 'EventCategory'))
   OR (one_collection = 'SpaceEventCategory' AND many_collection IN ('Space', 'EventCategory'));

INSERT INTO directus_relations (
    many_collection,
    many_field,
    one_collection,
    junction_field
) VALUES (
    'SpaceEventCategory',
    'spaceId',
    'Space',
    'eventCategoryId'
), (
    'SpaceEventCategory',
    'eventCategoryId', 
    'EventCategory',
    'spaceId'
);