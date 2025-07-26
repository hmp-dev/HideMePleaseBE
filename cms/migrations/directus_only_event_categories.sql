-- Directus UI Configuration Only (테이블은 이미 존재한다고 가정)
-- Date: 2025-07-26
-- Description: Directus 메타데이터만 추가 (컬렉션, 필드, 관계 설정)

-- 1. Directus Collections 추가
DO $$ 
BEGIN
    -- EventCategory collection
    IF NOT EXISTS (SELECT 1 FROM directus_collections WHERE collection = 'EventCategory') THEN
        INSERT INTO directus_collections (collection, icon, note, display_template, hidden, singleton, translations, accountability, color, sort, "group", collapse, versioning)
        VALUES ('EventCategory', 'category', 'Event categories for spaces', '{{name}}', false, false, null, 'all', '#FF6644', 1, null, 'open', false);
    END IF;
    
    -- SpaceEventCategory collection
    IF NOT EXISTS (SELECT 1 FROM directus_collections WHERE collection = 'SpaceEventCategory') THEN
        INSERT INTO directus_collections (collection, icon, note, display_template, hidden, singleton, translations, accountability, color, sort, "group", collapse, versioning)
        VALUES ('SpaceEventCategory', 'link', 'Space to Event Category relationship', null, true, false, null, 'all', null, 2, null, 'open', false);
    END IF;
END $$;

-- 2. EventCategory 필드 설정
DO $$
DECLARE
    field_record RECORD;
    field_data RECORD;
BEGIN
    FOR field_data IN 
        SELECT * FROM (VALUES
            ('EventCategory', 'id', 'uuid', 'input', null::json, 'formatted-value', null::json, true, true, 1, 'full', null::json, null, null::json, false, null, null::json, null),
            ('EventCategory', 'createdAt', 'date-created', 'datetime', null, 'datetime', '{"relative":true}'::json, true, false, 2, 'half', null, null, null, false, null, null, null),
            ('EventCategory', 'updatedAt', 'date-updated', 'datetime', null, 'datetime', '{"relative":true}'::json, true, false, 3, 'half', null, null, null, false, null, null, null),
            ('EventCategory', 'deleted', null, 'boolean', '{"label":"Deleted"}'::json, 'boolean', null, false, true, 4, 'half', null, null, null, false, null, null, null),
            ('EventCategory', 'name', null, 'input', '{"placeholder":"이벤트 카테고리명"}'::json, 'formatted-value', null, false, false, 5, 'half', null, 'Korean name', null, true, null, null, null),
            ('EventCategory', 'nameEn', null, 'input', '{"placeholder":"Event category name"}'::json, 'formatted-value', null, false, false, 6, 'half', null, 'English name', null, false, null, null, null),
            ('EventCategory', 'description', null, 'input-multiline', '{"placeholder":"카테고리 설명"}'::json, 'formatted-value', null, false, false, 7, 'half', null, 'Korean description', null, false, null, null, null),
            ('EventCategory', 'descriptionEn', null, 'input-multiline', '{"placeholder":"Category description"}'::json, 'formatted-value', null, false, false, 8, 'half', null, 'English description', null, false, null, null, null),
            ('EventCategory', 'displayOrder', null, 'input', '{"min":0}'::json, 'formatted-value', null, false, false, 9, 'half', null, 'Display order (lower number appears first)', null, false, null, null, null),
            ('EventCategory', 'isActive', null, 'boolean', '{"label":"Active"}'::json, 'boolean', null, false, false, 10, 'half', null, 'Whether this category is active', null, false, null, null, null),
            ('EventCategory', 'colorCode', null, 'input-color', null, 'color', null, false, false, 11, 'half', null, 'Category color', null, false, null, null, null),
            ('EventCategory', 'iconUrl', null, 'input', '{"placeholder":"https://..."}'::json, 'formatted-value', null, false, false, 12, 'half', null, 'Icon URL', null, false, null, null, null)
        ) AS t(collection, field, special, interface, options, display, display_options, readonly, hidden, sort, width, translations, note, conditions, required, "group", validation, validation_message)
    LOOP
        IF NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection = field_data.collection AND field = field_data.field) THEN
            INSERT INTO directus_fields (collection, field, special, interface, options, display, display_options, readonly, hidden, sort, width, translations, note, conditions, required, "group", validation, validation_message)
            VALUES (field_data.collection, field_data.field, field_data.special, field_data.interface, field_data.options, field_data.display, field_data.display_options, field_data.readonly, field_data.hidden, field_data.sort, field_data.width, field_data.translations, field_data.note, field_data.conditions, field_data.required, field_data."group", field_data.validation, field_data.validation_message);
        END IF;
    END LOOP;
END $$;

-- 3. SpaceEventCategory 필드 설정
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection = 'SpaceEventCategory' AND field = 'id') THEN
        INSERT INTO directus_fields (collection, field, special, interface, options, display, display_options, readonly, hidden, sort, width, translations, note, conditions, required, "group", validation, validation_message)
        VALUES ('SpaceEventCategory', 'id', 'uuid', 'input', null, 'formatted-value', null, true, true, 1, 'full', null, null, null, false, null, null, null);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection = 'SpaceEventCategory' AND field = 'createdAt') THEN
        INSERT INTO directus_fields (collection, field, special, interface, options, display, display_options, readonly, hidden, sort, width, translations, note, conditions, required, "group", validation, validation_message)
        VALUES ('SpaceEventCategory', 'createdAt', 'date-created', 'datetime', null, 'datetime', '{"relative":true}', true, true, 2, 'half', null, null, null, false, null, null, null);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection = 'SpaceEventCategory' AND field = 'updatedAt') THEN
        INSERT INTO directus_fields (collection, field, special, interface, options, display, display_options, readonly, hidden, sort, width, translations, note, conditions, required, "group", validation, validation_message)
        VALUES ('SpaceEventCategory', 'updatedAt', 'date-updated', 'datetime', null, 'datetime', '{"relative":true}', true, true, 3, 'half', null, null, null, false, null, null, null);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection = 'SpaceEventCategory' AND field = 'spaceId') THEN
        INSERT INTO directus_fields (collection, field, special, interface, options, display, display_options, readonly, hidden, sort, width, translations, note, conditions, required, "group", validation, validation_message)
        VALUES ('SpaceEventCategory', 'spaceId', 'm2o', 'select-dropdown-m2o', '{"template":"{{name}}"}', 'related-values', '{"template":"{{name}}"}', false, false, 4, 'half', null, null, null, true, null, null, null);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection = 'SpaceEventCategory' AND field = 'eventCategoryId') THEN
        INSERT INTO directus_fields (collection, field, special, interface, options, display, display_options, readonly, hidden, sort, width, translations, note, conditions, required, "group", validation, validation_message)
        VALUES ('SpaceEventCategory', 'eventCategoryId', 'm2o', 'select-dropdown-m2o', '{"template":"{{name}}"}', 'related-values', '{"template":"{{name}}"}', false, false, 5, 'half', null, null, null, true, null, null, null);
    END IF;
END $$;

-- 4. Space 컬렉션에 eventCategories 필드 추가
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection = 'Space' AND field = 'SpaceEventCategory') THEN
        INSERT INTO directus_fields (collection, field, special, interface, options, display, display_options, readonly, hidden, sort, width, translations, note, conditions, required, "group", validation, validation_message)
        VALUES ('Space', 'SpaceEventCategory', 'm2m', 'list-m2m', '{"template":"{{eventCategoryId.name}}","enableCreate":false,"enableSelect":true,"fields":["eventCategoryId"]}', 'related-values', '{"template":"{{eventCategoryId.name}}"}', false, false, 30, 'full', null, 'Event categories for this space', null, false, null, null, null);
    END IF;
END $$;

-- 5. EventCategory에 spaces 필드 추가 (읽기 전용)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection = 'EventCategory' AND field = 'SpaceEventCategory') THEN
        INSERT INTO directus_fields (collection, field, special, interface, options, display, display_options, readonly, hidden, sort, width, translations, note, conditions, required, "group", validation, validation_message)
        VALUES ('EventCategory', 'SpaceEventCategory', 'o2m', 'list-o2m', '{"template":"{{spaceId.name}}","fields":["spaceId"]}', 'related-values', '{"template":"{{spaceId.name}}"}', true, false, 13, 'full', null, 'Spaces using this category', null, false, null, null, null);
    END IF;
END $$;

-- 6. 관계 설정
DELETE FROM directus_relations WHERE many_collection = 'SpaceEventCategory';

INSERT INTO directus_relations (many_collection, many_field, one_collection, one_field, one_collection_field, one_allowed_collections, junction_field, sort_field, one_deselect_action)
VALUES 
    ('SpaceEventCategory', 'spaceId', 'Space', null, null, null, null, null, 'nullify'),
    ('SpaceEventCategory', 'eventCategoryId', 'EventCategory', null, null, null, null, null, 'nullify'),
    ('SpaceEventCategory', 'spaceId', 'Space', 'SpaceEventCategory', null, null, 'eventCategoryId', null, 'delete'),
    ('SpaceEventCategory', 'eventCategoryId', 'EventCategory', 'SpaceEventCategory', null, null, 'spaceId', null, 'delete');