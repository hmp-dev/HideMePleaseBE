-- Directus CMS에서 영업시간 입력을 위한 간단한 설정
-- 실서버에서 실행할 SQL 스크립트

-- 1. Space 컬렉션에 새 필드들 추가
-- 영어 필드들
INSERT INTO "directus_fields" ("collection", "field", "special", "interface", "options", "display", "display_options", "readonly", "hidden", "sort", "width", "translations", "note", "conditions", "required", "group", "validation", "validation_message") VALUES 
('Space', 'nameEn', NULL, 'input', '{"placeholder":"English name"}', NULL, NULL, false, false, 7, 'half', NULL, 'Space name in English', NULL, false, 'Baics', NULL, NULL),
('Space', 'addressEn', NULL, 'input', '{"placeholder":"English address"}', NULL, NULL, false, false, 8, 'full', NULL, 'Address in English', NULL, false, 'Baics', NULL, NULL),
('Space', 'introductionEn', NULL, 'input-multiline', '{"placeholder":"English introduction"}', NULL, NULL, false, false, 9, 'full', NULL, 'Introduction in English', NULL, false, 'Baics', NULL, NULL);

-- 임시 휴무 그룹 생성
INSERT INTO "directus_fields" ("collection", "field", "special", "interface", "options", "display", "display_options", "readonly", "hidden", "sort", "width", "translations", "note", "conditions", "required", "group", "validation", "validation_message") VALUES 
('Space', 'tempClosure', 'alias,no-data,group', 'group-detail', '{"headerIcon":"schedule","headerColor":"#FFC23B","start":"closed"}', NULL, NULL, false, false, 10, 'full', NULL, NULL, NULL, false, NULL, NULL, NULL);

-- 임시 휴무 관련 필드들
INSERT INTO "directus_fields" ("collection", "field", "special", "interface", "options", "display", "display_options", "readonly", "hidden", "sort", "width", "translations", "note", "conditions", "required", "group", "validation", "validation_message") VALUES 
('Space', 'isTemporarilyClosed', 'cast-boolean', 'boolean', NULL, NULL, NULL, false, false, 1, 'half', NULL, '임시 휴무 여부', NULL, false, 'tempClosure', NULL, NULL),
('Space', 'temporaryClosureReason', NULL, 'input-multiline', '{"placeholder":"휴무 사유를 입력하세요"}', NULL, NULL, false, false, 2, 'full', NULL, '임시 휴무 사유', '[{"name":"require-field","options":{},"rule":{"_and":[{"isTemporarilyClosed":{"_eq":true}}]}}]', false, 'tempClosure', NULL, NULL),
('Space', 'temporaryClosureEndDate', NULL, 'datetime', '{"includeSeconds":false}', NULL, NULL, false, false, 3, 'half', NULL, '휴무 종료 예정일', '[{"name":"require-field","options":{},"rule":{"_and":[{"isTemporarilyClosed":{"_eq":true}}]}}]', false, 'tempClosure', NULL, NULL);

-- 2. SpaceBusinessHours 컬렉션 생성
INSERT INTO "directus_collections" ("collection", "icon", "note", "display_template", "hidden", "singleton", "translations", "archive_field", "archive_app_filter", "archive_value", "unarchive_value", "sort_field", "accountability", "color", "item_duplication_fields", "sort", "group", "collapse", "preview_url", "versioning") VALUES 
('SpaceBusinessHours', 'access_time', '스페이스 요일별 영업시간 관리', '{{dayOfWeek}}: {{openTime}}-{{closeTime}}', false, false, NULL, NULL, true, NULL, NULL, 'dayOfWeek', 'all', '#2ECDA7', NULL, 4, 'Space', 'open', NULL, false);

-- SpaceBusinessHours 필드들
INSERT INTO "directus_fields" ("collection", "field", "special", "interface", "options", "display", "display_options", "readonly", "hidden", "sort", "width", "translations", "note", "conditions", "required", "group", "validation", "validation_message") VALUES 
('SpaceBusinessHours', 'id', 'uuid', NULL, NULL, NULL, NULL, false, true, 1, 'full', NULL, NULL, NULL, false, NULL, NULL, NULL),
('SpaceBusinessHours', 'createdAt', NULL, NULL, NULL, NULL, NULL, false, true, 2, 'full', NULL, NULL, NULL, false, NULL, NULL, NULL),
('SpaceBusinessHours', 'updatedAt', NULL, NULL, NULL, NULL, NULL, false, true, 3, 'full', NULL, NULL, NULL, false, NULL, NULL, NULL),
('SpaceBusinessHours', 'spaceId', 'uuid', 'select-dropdown-m2o', '{"template":"{{name}}"}', NULL, NULL, false, false, 4, 'full', NULL, '소속 스페이스', NULL, true, NULL, NULL, NULL),
('SpaceBusinessHours', 'dayOfWeek', NULL, 'select-dropdown-custom', '{"choices":[{"text":"월요일","value":"MONDAY"},{"text":"화요일","value":"TUESDAY"},{"text":"수요일","value":"WEDNESDAY"},{"text":"목요일","value":"THURSDAY"},{"text":"금요일","value":"FRIDAY"},{"text":"토요일","value":"SATURDAY"},{"text":"일요일","value":"SUNDAY"}]}', NULL, NULL, false, false, 5, 'half', NULL, '요일', NULL, true, NULL, NULL, NULL),
('SpaceBusinessHours', 'isClosed', 'cast-boolean', 'boolean', NULL, NULL, NULL, false, false, 6, 'half', NULL, '이 날 휴무인가요?', NULL, false, NULL, NULL, NULL);

-- 영업시간 그룹
INSERT INTO "directus_fields" ("collection", "field", "special", "interface", "options", "display", "display_options", "readonly", "hidden", "sort", "width", "translations", "note", "conditions", "required", "group", "validation", "validation_message") VALUES 
('SpaceBusinessHours', 'hours', 'alias,no-data,group', 'group-detail', '{"headerIcon":"schedule","headerColor":"#2ECDA7","start":"open"}', NULL, NULL, false, false, 7, 'full', NULL, NULL, '[{"name":"hide-field","options":{},"rule":{"_and":[{"isClosed":{"_eq":true}}]}}]', false, NULL, NULL, NULL);

-- 시간 필드들
INSERT INTO "directus_fields" ("collection", "field", "special", "interface", "options", "display", "display_options", "readonly", "hidden", "sort", "width", "translations", "note", "conditions", "required", "group", "validation", "validation_message") VALUES 
('SpaceBusinessHours', 'openTime', NULL, 'input', '{"placeholder":"09:00","iconLeft":"schedule"}', NULL, NULL, false, false, 1, 'half', NULL, '오픈 시간', '[{"name":"hide-field","options":{},"rule":{"_and":[{"isClosed":{"_eq":true}}]}}]', false, 'hours', 'regex', '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'),
('SpaceBusinessHours', 'closeTime', NULL, 'input', '{"placeholder":"22:00","iconLeft":"schedule"}', NULL, NULL, false, false, 2, 'half', NULL, '마감 시간', '[{"name":"hide-field","options":{},"rule":{"_and":[{"isClosed":{"_eq":true}}]}}]', false, 'hours', 'regex', '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'),
('SpaceBusinessHours', 'breakStartTime', NULL, 'input', '{"placeholder":"15:00","iconLeft":"coffee"}', NULL, NULL, false, false, 3, 'half', NULL, '브레이크 시작 (선택)', '[{"name":"hide-field","options":{},"rule":{"_and":[{"isClosed":{"_eq":true}}]}}]', false, 'hours', 'regex', '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'),
('SpaceBusinessHours', 'breakEndTime', NULL, 'input', '{"placeholder":"16:00","iconLeft":"coffee"}', NULL, NULL, false, false, 4, 'half', NULL, '브레이크 종료 (선택)', '[{"name":"hide-field","options":{},"rule":{"_and":[{"isClosed":{"_eq":true}}]}}]', false, 'hours', 'regex', '^([01]?[0-9]|2[0-3]):[0-5][0-9]$');

-- 3. Space에 businessHours 관계 추가
INSERT INTO "directus_fields" ("collection", "field", "special", "interface", "options", "display", "display_options", "readonly", "hidden", "sort", "width", "translations", "note", "conditions", "required", "group", "validation", "validation_message") VALUES 
('Space', 'businessHours', 'o2m', 'list-o2m', '{"layout":"table","fields":["dayOfWeek","openTime","closeTime","breakStartTime","breakEndTime","isClosed"],"enableCreate":true,"enableSelect":false,"enableSearchFilter":false,"enableLink":true,"limit":7,"template":"{{dayOfWeek}}: {{openTime}}-{{closeTime}}","sort":"dayOfWeek"}', 'related-values', '{"template":"{{count}}개 요일 설정"}', false, false, 11, 'full', NULL, '요일별 영업시간', NULL, false, 'Advanced', NULL, NULL);

-- 4. 관계 정의
INSERT INTO "directus_relations" ("many_collection", "many_field", "one_collection", "one_field", "one_collection_field", "one_allowed_collections", "junction_field", "sort_field", "one_deselect_action") VALUES 
('SpaceBusinessHours', 'spaceId', 'Space', 'businessHours', NULL, NULL, NULL, 'dayOfWeek', 'nullify');

-- 5. Space 카테고리에 WALKERHILL, ETC 추가
UPDATE "directus_fields" 
SET "options" = '{"choices":[{"text":"Pub","value":"PUB"},{"text":"Cafe","value":"CAFE"},{"text":"Coworking","value":"COWORKING"},{"text":"Music","value":"MUSIC"},{"text":"Meal","value":"MEAL"},{"text":"Walkerhill","value":"WALKERHILL"},{"text":"ETC","value":"ETC"}]}'
WHERE "collection" = 'Space' AND "field" = 'category';

-- 설정 완료 확인
SELECT 'Directus 영업시간 설정이 완료되었습니다!' as status;