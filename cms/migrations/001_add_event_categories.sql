-- Migration: Add Event Categories
-- Date: 2025-07-26
-- Description: Add EventCategory and SpaceEventCategory tables with Directus configuration

-- 1. Check if tables already exist
DO $$ 
BEGIN
    -- Check EventCategory table
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'EventCategory') THEN
        CREATE TABLE "EventCategory" (
            "id" UUID NOT NULL DEFAULT gen_random_uuid(),
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "deleted" BOOLEAN NOT NULL DEFAULT false,
            "name" TEXT NOT NULL,
            "nameEn" TEXT,
            "description" TEXT,
            "descriptionEn" TEXT,
            "displayOrder" INTEGER NOT NULL DEFAULT 0,
            "isActive" BOOLEAN NOT NULL DEFAULT true,
            "colorCode" TEXT,
            "iconUrl" TEXT,
            CONSTRAINT "EventCategory_pkey" PRIMARY KEY ("id")
        );
        
        CREATE UNIQUE INDEX "EventCategory_name_key" ON "EventCategory"("name");
        
        RAISE NOTICE 'EventCategory table created successfully';
    ELSE
        RAISE NOTICE 'EventCategory table already exists';
    END IF;

    -- Check SpaceEventCategory table
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'SpaceEventCategory') THEN
        CREATE TABLE "SpaceEventCategory" (
            "id" UUID NOT NULL DEFAULT gen_random_uuid(),
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "spaceId" UUID NOT NULL,
            "eventCategoryId" UUID NOT NULL,
            CONSTRAINT "SpaceEventCategory_pkey" PRIMARY KEY ("id")
        );
        
        CREATE UNIQUE INDEX "SpaceEventCategory_spaceId_eventCategoryId_key" ON "SpaceEventCategory"("spaceId", "eventCategoryId");
        
        ALTER TABLE "SpaceEventCategory" ADD CONSTRAINT "SpaceEventCategory_spaceId_fkey" 
            FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        ALTER TABLE "SpaceEventCategory" ADD CONSTRAINT "SpaceEventCategory_eventCategoryId_fkey" 
            FOREIGN KEY ("eventCategoryId") REFERENCES "EventCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
            
        RAISE NOTICE 'SpaceEventCategory table created successfully';
    ELSE
        RAISE NOTICE 'SpaceEventCategory table already exists';
    END IF;
END $$;

-- 2. Directus Collections (only if not exists)
INSERT INTO directus_collections (collection, icon, note, display_template, hidden, singleton, translations, accountability, color, sort, "group", collapse, versioning)
VALUES 
    ('EventCategory', 'category', 'Event categories for spaces', '{{name}}', false, false, null, 'all', '#FF6644', 1, null, 'open', false),
    ('SpaceEventCategory', 'link', 'Space to Event Category relationship', null, true, false, null, 'all', null, 2, null, 'open', false)
ON CONFLICT (collection) DO NOTHING;

-- 3. Directus Fields for EventCategory (with conflict handling)
INSERT INTO directus_fields (collection, field, special, interface, options, display, display_options, readonly, hidden, sort, width, translations, note, conditions, required, "group", validation, validation_message)
VALUES 
    ('EventCategory', 'id', 'uuid', 'input', null, 'formatted-value', null, true, true, 1, 'full', null, null, null, false, null, null, null),
    ('EventCategory', 'createdAt', 'date-created', 'datetime', null, 'datetime', '{"relative":true}', true, false, 2, 'half', null, null, null, false, null, null, null),
    ('EventCategory', 'updatedAt', 'date-updated', 'datetime', null, 'datetime', '{"relative":true}', true, false, 3, 'half', null, null, null, false, null, null, null),
    ('EventCategory', 'deleted', null, 'boolean', '{"label":"Deleted"}', 'boolean', null, false, true, 4, 'half', null, null, null, false, null, null, null),
    ('EventCategory', 'name', null, 'input', '{"placeholder":"이벤트 카테고리명"}', 'formatted-value', null, false, false, 5, 'half', null, 'Korean name', null, true, null, null, null),
    ('EventCategory', 'nameEn', null, 'input', '{"placeholder":"Event category name"}', 'formatted-value', null, false, false, 6, 'half', null, 'English name', null, false, null, null, null),
    ('EventCategory', 'description', null, 'input-multiline', '{"placeholder":"카테고리 설명"}', 'formatted-value', null, false, false, 7, 'half', null, 'Korean description', null, false, null, null, null),
    ('EventCategory', 'descriptionEn', null, 'input-multiline', '{"placeholder":"Category description"}', 'formatted-value', null, false, false, 8, 'half', null, 'English description', null, false, null, null, null),
    ('EventCategory', 'displayOrder', null, 'input', '{"min":0}', 'formatted-value', null, false, false, 9, 'half', null, 'Display order (lower number appears first)', null, false, null, null, null),
    ('EventCategory', 'isActive', null, 'boolean', '{"label":"Active"}', 'boolean', null, false, false, 10, 'half', null, 'Whether this category is active', null, false, null, null, null),
    ('EventCategory', 'colorCode', null, 'input-color', null, 'color', null, false, false, 11, 'half', null, 'Category color', null, false, null, null, null),
    ('EventCategory', 'iconUrl', null, 'input', '{"placeholder":"https://..."}', 'formatted-value', null, false, false, 12, 'half', null, 'Icon URL', null, false, null, null, null),
    ('EventCategory', 'spaces', 'o2m', 'list-o2m', '{"template":"{{spaceId.name}}","enableCreate":false,"enableSelect":false}', 'related-values', '{"template":"{{spaceId.name}}"}', true, false, 13, 'full', null, 'Spaces using this category', null, false, null, null, null)
ON CONFLICT (collection, field) DO UPDATE SET
    interface = EXCLUDED.interface,
    options = EXCLUDED.options,
    display = EXCLUDED.display,
    display_options = EXCLUDED.display_options,
    sort = EXCLUDED.sort;

-- 4. Directus Fields for SpaceEventCategory
INSERT INTO directus_fields (collection, field, special, interface, options, display, display_options, readonly, hidden, sort, width, translations, note, conditions, required, "group", validation, validation_message)
VALUES 
    ('SpaceEventCategory', 'id', 'uuid', 'input', null, 'formatted-value', null, true, true, 1, 'full', null, null, null, false, null, null, null),
    ('SpaceEventCategory', 'createdAt', 'date-created', 'datetime', null, 'datetime', '{"relative":true}', true, true, 2, 'half', null, null, null, false, null, null, null),
    ('SpaceEventCategory', 'updatedAt', 'date-updated', 'datetime', null, 'datetime', '{"relative":true}', true, true, 3, 'half', null, null, null, false, null, null, null),
    ('SpaceEventCategory', 'spaceId', 'm2o', 'select-dropdown-m2o', '{"template":"{{name}}"}', 'related-values', '{"template":"{{name}}"}', false, false, 4, 'half', null, null, null, true, null, null, null),
    ('SpaceEventCategory', 'eventCategoryId', 'm2o', 'select-dropdown-m2o', '{"template":"{{name}}"}', 'related-values', '{"template":"{{name}}"}', false, false, 5, 'half', null, null, null, true, null, null, null)
ON CONFLICT (collection, field) DO UPDATE SET
    interface = EXCLUDED.interface,
    options = EXCLUDED.options,
    display = EXCLUDED.display,
    display_options = EXCLUDED.display_options,
    sort = EXCLUDED.sort;

-- 5. Add eventCategories field to Space collection
INSERT INTO directus_fields (collection, field, special, interface, options, display, display_options, readonly, hidden, sort, width, translations, note, conditions, required, "group", validation, validation_message)
VALUES 
    ('Space', 'eventCategories', 'm2m', 'list-m2m', '{"template":"{{eventCategoryId.name}}","enableCreate":false,"enableSelect":true,"junctionCollection":"SpaceEventCategory","junctionField":"spaceId"}', 'related-values', '{"template":"{{eventCategoryId.name}}"}', false, false, 30, 'full', null, 'Event categories for this space', null, false, null, null, null)
ON CONFLICT (collection, field) DO UPDATE SET
    interface = EXCLUDED.interface,
    options = EXCLUDED.options,
    display = EXCLUDED.display,
    display_options = EXCLUDED.display_options,
    sort = EXCLUDED.sort;

-- 6. Directus Relations
DELETE FROM directus_relations WHERE many_collection = 'SpaceEventCategory';

INSERT INTO directus_relations (many_collection, many_field, one_collection, one_field, one_collection_field, one_allowed_collections, junction_field, sort_field, one_deselect_action)
VALUES 
    ('SpaceEventCategory', 'spaceId', 'Space', 'eventCategories', null, null, 'eventCategoryId', null, 'nullify'),
    ('SpaceEventCategory', 'eventCategoryId', 'EventCategory', 'spaces', null, null, 'spaceId', null, 'nullify');