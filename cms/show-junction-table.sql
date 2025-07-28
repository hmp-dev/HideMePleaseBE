-- Junction Table을 Directus에서 보이게 설정

-- 1. Collection을 보이게 설정
UPDATE directus_collections 
SET 
    hidden = false,
    icon = 'link',
    note = 'Space와 Event Category 연결 관리'
WHERE collection = 'SpaceEventCategory';

-- 2. 확인
SELECT collection, hidden, icon, note 
FROM directus_collections 
WHERE collection = 'SpaceEventCategory';