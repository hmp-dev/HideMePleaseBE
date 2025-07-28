-- Fix M2M Relation for Event Categories

-- 1. 기존 잘못된 설정 삭제
DELETE FROM directus_fields WHERE collection = 'Space' AND field = 'SpaceEventCategory';
DELETE FROM directus_relations WHERE many_collection = 'SpaceEventCategory';

-- 2. 올바른 M2M 필드 추가
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
    translations, 
    note, 
    conditions, 
    required, 
    "group", 
    validation, 
    validation_message
)
VALUES (
    'Space',
    'eventCategories',  -- 필드명을 더 직관적으로 변경
    'm2m',
    'list-m2m',
    '{
        "layout": "table",
        "fields": ["eventCategoryId.name", "eventCategoryId.nameEn"],
        "template": "{{eventCategoryId.name}}",
        "enableCreate": false,
        "enableSelect": true
    }'::json,
    'related-values',
    '{"template": "{{eventCategoryId.name}}"}'::json,
    false,
    false,
    30,
    'full',
    null,
    'Event categories for this space',
    null,
    false,  -- required = false
    null,
    null,
    null
);

-- 3. 관계 재설정
INSERT INTO directus_relations (
    many_collection,
    many_field,
    one_collection,
    one_field,
    one_collection_field,
    one_allowed_collections,
    junction_field,
    sort_field,
    one_deselect_action
)
VALUES
    -- M2M 관계의 첫 번째 부분 (Space -> Junction)
    (
        'SpaceEventCategory',
        'spaceId',
        'Space',
        'eventCategories',  -- Space 컬렉션의 필드명
        null,
        null,
        'eventCategoryId',
        null,
        'delete'
    ),
    -- M2M 관계의 두 번째 부분 (EventCategory -> Junction)
    (
        'SpaceEventCategory',
        'eventCategoryId',
        'EventCategory',
        null,
        null,
        null,
        'spaceId',
        null,
        'delete'
    );

-- 4. 확인
SELECT 
    f.collection,
    f.field,
    f.special,
    f.interface,
    f.required
FROM directus_fields f
WHERE f.collection = 'Space' 
AND f.field = 'eventCategories';