-- Rollback Migration: Remove Event Categories
-- Date: 2025-07-26
-- Description: Rollback script to remove EventCategory and SpaceEventCategory tables

-- WARNING: This will delete all event category data!

-- 1. Remove Directus configuration
DELETE FROM directus_relations WHERE many_collection = 'SpaceEventCategory';
DELETE FROM directus_fields WHERE collection IN ('EventCategory', 'SpaceEventCategory');
DELETE FROM directus_fields WHERE collection = 'Space' AND field = 'eventCategories';
DELETE FROM directus_collections WHERE collection IN ('EventCategory', 'SpaceEventCategory');

-- 2. Drop tables (CASCADE will remove all related data)
DROP TABLE IF EXISTS "SpaceEventCategory" CASCADE;
DROP TABLE IF EXISTS "EventCategory" CASCADE;

-- 3. Notify completion
DO $$ 
BEGIN
    RAISE NOTICE 'Event Categories rollback completed successfully';
END $$;