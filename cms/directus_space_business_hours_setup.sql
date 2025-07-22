-- Directus CMS에서 Space 영업시간 관리를 위한 필드 설정

-- 1. Space 컬렉션에 새 필드 추가 (영어 필드, 임시 휴무 필드)
INSERT INTO "directus_fields" ("id", "collection", "field", "special", "interface", "options", "display", "display_options", "readonly", "hidden", "sort", "width", "translations", "note", "conditions", "required", "group", "validation", "validation_message") VALUES 
(DEFAULT, 'Space', 'nameEn', NULL, 'input', NULL, NULL, NULL, false, false, 7, 'half', NULL, 'English name for the space', NULL, false, 'Baics', NULL, NULL);

INSERT INTO "directus_fields" ("id", "collection", "field", "special", "interface", "options", "display", "display_options", "readonly", "hidden", "sort", "width", "translations", "note", "conditions", "required", "group", "validation", "validation_message") VALUES 
(DEFAULT, 'Space', 'addressEn', NULL, 'input', NULL, NULL, NULL, false, false, 8, 'full', NULL, 'English address', NULL, false, 'Baics', NULL, NULL);

INSERT INTO "directus_fields" ("id", "collection", "field", "special", "interface", "options", "display", "display_options", "readonly", "hidden", "sort", "width", "translations", "note", "conditions", "required", "group", "validation", "validation_message") VALUES 
(DEFAULT, 'Space', 'introductionEn', NULL, 'input-multiline', NULL, NULL, NULL, false, false, 9, 'full', NULL, 'English introduction', NULL, false, 'Baics', NULL, NULL);

-- 임시 휴무 관련 필드들
INSERT INTO "directus_fields" ("id", "collection", "field", "special", "interface", "options", "display", "display_options", "readonly", "hidden", "sort", "width", "translations", "note", "conditions", "required", "group", "validation", "validation_message") VALUES 
(DEFAULT, 'Space', 'tempClosure', 'alias,no-data,group', 'group-detail', '{"headerIcon":"schedule","headerColor":"#FFC23B"}', NULL, NULL, false, false, 10, 'full', NULL, NULL, NULL, false, NULL, NULL, NULL);

INSERT INTO "directus_fields" ("id", "collection", "field", "special", "interface", "options", "display", "display_options", "readonly", "hidden", "sort", "width", "translations", "note", "conditions", "required", "group", "validation", "validation_message") VALUES 
(DEFAULT, 'Space', 'isTemporarilyClosed', 'cast-boolean', 'boolean', NULL, NULL, NULL, false, false, 1, 'half', NULL, 'Is the space temporarily closed?', NULL, false, 'tempClosure', NULL, NULL);

INSERT INTO "directus_fields" ("id", "collection", "field", "special", "interface", "options", "display", "display_options", "readonly", "hidden", "sort", "width", "translations", "note", "conditions", "required", "group", "validation", "validation_message") VALUES 
(DEFAULT, 'Space', 'temporaryClosureReason', NULL, 'input-multiline', NULL, NULL, NULL, false, false, 2, 'full', NULL, 'Reason for temporary closure', '[[{"name":"require-field","options":{"field":"isTemporarilyClosed"},"rule":{"_and":[{"isTemporarilyClosed":{"_eq":true}}]}}]]', false, 'tempClosure', NULL, NULL);

INSERT INTO "directus_fields" ("id", "collection", "field", "special", "interface", "options", "display", "display_options", "readonly", "hidden", "sort", "width", "translations", "note", "conditions", "required", "group", "validation", "validation_message") VALUES 
(DEFAULT, 'Space', 'temporaryClosureEndDate', NULL, 'datetime', '{"includeSeconds":false}', NULL, NULL, false, false, 3, 'half', NULL, 'When will the space reopen?', '[[{"name":"require-field","options":{"field":"isTemporarilyClosed"},"rule":{"_and":[{"isTemporarilyClosed":{"_eq":true}}]}}]]', false, 'tempClosure', NULL, NULL);

-- 2. SpaceBusinessHours 컬렉션 생성
INSERT INTO "directus_collections" ("collection", "icon", "note", "display_template", "hidden", "singleton", "translations", "archive_field", "archive_app_filter", "archive_value", "unarchive_value", "sort_field", "accountability", "color", "item_duplication_fields", "sort", "group", "collapse", "preview_url", "versioning") VALUES 
('SpaceBusinessHours', 'schedule', 'Business hours for each space by day of week', '{{dayOfWeek}} - {{openTime}} to {{closeTime}}', false, false, NULL, NULL, true, NULL, NULL, 'dayOfWeek', 'all', NULL, NULL, NULL, NULL, 'open', NULL, false);

-- SpaceBusinessHours 필드 정의
INSERT INTO "directus_fields" ("id", "collection", "field", "special", "interface", "options", "display", "display_options", "readonly", "hidden", "sort", "width", "translations", "note", "conditions", "required", "group", "validation", "validation_message") VALUES 
(DEFAULT, 'SpaceBusinessHours', 'id', 'uuid', NULL, NULL, NULL, NULL, false, true, 1, 'full', NULL, NULL, NULL, false, NULL, NULL, NULL);

INSERT INTO "directus_fields" ("id", "collection", "field", "special", "interface", "options", "display", "display_options", "readonly", "hidden", "sort", "width", "translations", "note", "conditions", "required", "group", "validation", "validation_message") VALUES 
(DEFAULT, 'SpaceBusinessHours', 'createdAt', NULL, NULL, NULL, NULL, NULL, false, true, 2, 'full', NULL, NULL, NULL, false, NULL, NULL, NULL);

INSERT INTO "directus_fields" ("id", "collection", "field", "special", "interface", "options", "display", "display_options", "readonly", "hidden", "sort", "width", "translations", "note", "conditions", "required", "group", "validation", "validation_message") VALUES 
(DEFAULT, 'SpaceBusinessHours', 'updatedAt', NULL, NULL, NULL, NULL, NULL, false, true, 3, 'full', NULL, NULL, NULL, false, NULL, NULL, NULL);

INSERT INTO "directus_fields" ("id", "collection", "field", "special", "interface", "options", "display", "display_options", "readonly", "hidden", "sort", "width", "translations", "note", "conditions", "required", "group", "validation", "validation_message") VALUES 
(DEFAULT, 'SpaceBusinessHours', 'spaceId', 'uuid', 'select-dropdown-m2o', '{"template":"{{name}}","enableCreate":false}', NULL, NULL, false, false, 4, 'full', NULL, 'Related space', NULL, true, NULL, NULL, NULL);

INSERT INTO "directus_fields" ("id", "collection", "field", "special", "interface", "options", "display", "display_options", "readonly", "hidden", "sort", "width", "translations", "note", "conditions", "required", "group", "validation", "validation_message") VALUES 
(DEFAULT, 'SpaceBusinessHours', 'dayOfWeek', NULL, 'select-dropdown-custom', '{"choices":[{"text":"Monday","value":"MONDAY"},{"text":"Tuesday","value":"TUESDAY"},{"text":"Wednesday","value":"WEDNESDAY"},{"text":"Thursday","value":"THURSDAY"},{"text":"Friday","value":"FRIDAY"},{"text":"Saturday","value":"SATURDAY"},{"text":"Sunday","value":"SUNDAY"}]}', NULL, NULL, false, false, 5, 'half', NULL, 'Day of the week', NULL, true, NULL, NULL, NULL);

INSERT INTO "directus_fields" ("id", "collection", "field", "special", "interface", "options", "display", "display_options", "readonly", "hidden", "sort", "width", "translations", "note", "conditions", "required", "group", "validation", "validation_message") VALUES 
(DEFAULT, 'SpaceBusinessHours', 'isClosed', 'cast-boolean', 'boolean', NULL, NULL, NULL, false, false, 6, 'half', NULL, 'Is closed on this day?', NULL, false, NULL, NULL, NULL);

INSERT INTO "directus_fields" ("id", "collection", "field", "special", "interface", "options", "display", "display_options", "readonly", "hidden", "sort", "width", "translations", "note", "conditions", "required", "group", "validation", "validation_message") VALUES 
(DEFAULT, 'SpaceBusinessHours', 'businessHours', 'alias,no-data,group', 'group-detail', '{"headerIcon":"access_time","headerColor":"#2ECDA7"}', NULL, NULL, false, false, 7, 'full', NULL, NULL, '[[{"name":"hide-field","options":{"field":"isClosed"},"rule":{"_and":[{"isClosed":{"_eq":true}}]}}]]', false, NULL, NULL, NULL);

INSERT INTO "directus_fields" ("id", "collection", "field", "special", "interface", "options", "display", "display_options", "readonly", "hidden", "sort", "width", "translations", "note", "conditions", "required", "group", "validation", "validation_message") VALUES 
(DEFAULT, 'SpaceBusinessHours', 'openTime', NULL, 'input', '{"placeholder":"09:00","iconLeft":"access_time"}', NULL, NULL, false, false, 1, 'half', NULL, 'Opening time (HH:MM)', '[[{"name":"hide-field","options":{"field":"isClosed"},"rule":{"_and":[{"isClosed":{"_eq":true}}]}}]]', false, 'businessHours', 'regex', '^([01]?[0-9]|2[0-3]):[0-5][0-9]$');

INSERT INTO "directus_fields" ("id", "collection", "field", "special", "interface", "options", "display", "display_options", "readonly", "hidden", "sort", "width", "translations", "note", "conditions", "required", "group", "validation", "validation_message") VALUES 
(DEFAULT, 'SpaceBusinessHours', 'closeTime', NULL, 'input', '{"placeholder":"22:00","iconLeft":"access_time"}', NULL, NULL, false, false, 2, 'half', NULL, 'Closing time (HH:MM)', '[[{"name":"hide-field","options":{"field":"isClosed"},"rule":{"_and":[{"isClosed":{"_eq":true}}]}}]]', false, 'businessHours', 'regex', '^([01]?[0-9]|2[0-3]):[0-5][0-9]$');

INSERT INTO "directus_fields" ("id", "collection", "field", "special", "interface", "options", "display", "display_options", "readonly", "hidden", "sort", "width", "translations", "note", "conditions", "required", "group", "validation", "validation_message") VALUES 
(DEFAULT, 'SpaceBusinessHours', 'breakTime', 'alias,no-data,group', 'group-detail', '{"headerIcon":"coffee","headerColor":"#FFC23B","start":"open"}', NULL, NULL, false, false, 3, 'full', NULL, NULL, '[[{"name":"hide-field","options":{"field":"isClosed"},"rule":{"_and":[{"isClosed":{"_eq":true}}]}}]]', false, 'businessHours', NULL, NULL);

INSERT INTO "directus_fields" ("id", "collection", "field", "special", "interface", "options", "display", "display_options", "readonly", "hidden", "sort", "width", "translations", "note", "conditions", "required", "group", "validation", "validation_message") VALUES 
(DEFAULT, 'SpaceBusinessHours', 'breakStartTime', NULL, 'input', '{"placeholder":"15:00","iconLeft":"coffee"}', NULL, NULL, false, false, 1, 'half', NULL, 'Break start time (optional)', '[[{"name":"hide-field","options":{"field":"isClosed"},"rule":{"_and":[{"isClosed":{"_eq":true}}]}}]]', false, 'breakTime', 'regex', '^([01]?[0-9]|2[0-3]):[0-5][0-9]$');

INSERT INTO "directus_fields" ("id", "collection", "field", "special", "interface", "options", "display", "display_options", "readonly", "hidden", "sort", "width", "translations", "note", "conditions", "required", "group", "validation", "validation_message") VALUES 
(DEFAULT, 'SpaceBusinessHours', 'breakEndTime', NULL, 'input', '{"placeholder":"16:00","iconLeft":"coffee"}', NULL, NULL, false, false, 2, 'half', NULL, 'Break end time (optional)', '[[{"name":"hide-field","options":{"field":"isClosed"},"rule":{"_and":[{"isClosed":{"_eq":true}}]}}]]', false, 'breakTime', 'regex', '^([01]?[0-9]|2[0-3]):[0-5][0-9]$');

-- 3. Space 컬렉션에 SpaceBusinessHours 관계 추가
INSERT INTO "directus_fields" ("id", "collection", "field", "special", "interface", "options", "display", "display_options", "readonly", "hidden", "sort", "width", "translations", "note", "conditions", "required", "group", "validation", "validation_message") VALUES 
(DEFAULT, 'Space', 'businessHours', 'o2m', 'list-o2m', '{"layout":"table","fields":["dayOfWeek","openTime","closeTime","breakStartTime","breakEndTime","isClosed"],"enableCreate":true,"enableSelect":false,"enableSearchFilter":false,"enableLink":true,"limit":7,"template":"{{dayOfWeek}}: {{openTime}} - {{closeTime}}"}', 'related-values', '{"template":"{{count}} business hour entries"}', false, false, 6, 'full', NULL, 'Weekly business hours', NULL, false, 'Advanced', NULL, NULL);

-- 4. SpaceBusinessHours의 관계 정의 
INSERT INTO "directus_relations" ("id", "many_collection", "many_field", "one_collection", "one_field", "one_collection_field", "one_allowed_collections", "junction_field", "sort_field", "one_deselect_action") VALUES 
(DEFAULT, 'SpaceBusinessHours', 'spaceId', 'Space', 'businessHours', NULL, NULL, NULL, 'dayOfWeek', 'nullify');

-- 5. Space 카테고리 업데이트 (WALKERHILL, ETC 추가)
UPDATE "directus_fields" SET "options" = '{"choices":[{"text":"Pub","value":"PUB"},{"text":"Cafe","value":"CAFE"},{"text":"Coworking","value":"COWORKING"},{"text":"Music","value":"MUSIC"},{"text":"Meal","value":"MEAL"},{"text":"Walkerhill","value":"WALKERHILL"},{"text":"ETC","value":"ETC"}]}' 
WHERE "collection" = 'Space' AND "field" = 'category';