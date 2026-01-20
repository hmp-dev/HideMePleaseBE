// 푸시 알림 타입 상수
export const PUSH_NOTIFICATION_TYPES = {
	// 친구 관련
	FRIEND_REQUEST: 'FRIEND_REQUEST',
	FRIEND_ACCEPTED: 'FRIEND_ACCEPTED',

	// SAV 포인트 관련
	SAV_EARN: 'SAV_EARN',
	SAV_USAGE: 'SAV_USAGE',

	// 사이렌 관련
	SIREN: 'SIREN',

	// 매칭 관련
	MATCHING_COMPLETE: 'MATCHING_COMPLETE',

	// 체크인 관련
	CHECK_IN_SUCCESS: 'CHECK_IN_SUCCESS',

	// 커뮤니티 관련
	COMMUNITY: 'COMMUNITY',

	// 혜택 관련
	BENEFITS: 'BENEFITS',

	// 이벤트 관련
	EVENT: 'EVENT',

	// 자동 체크아웃 관련
	AUTO_CHECKOUT: 'AUTO_CHECKOUT',

	// 공지사항 관련
	ANNOUNCEMENT: 'ANNOUNCEMENT',

	// 점주용 알림 타입
	OWNER_NEW_RESERVATION: 'OWNER_NEW_RESERVATION',
	OWNER_RESERVATION_CANCELLED: 'OWNER_RESERVATION_CANCELLED',
} as const;

export type PushNotificationType =
	(typeof PUSH_NOTIFICATION_TYPES)[keyof typeof PUSH_NOTIFICATION_TYPES];

// 알림 생성 DTO
export interface CreatePushNotificationDto {
	userId: string;
	type: string;
	title: string;
	body: string;
	params?: any;
}

// 알림 응답 DTO
export interface PushNotificationResponseDto {
	id: string;
	createdAt: Date;
	type: string;
	title: string;
	body: string;
	params?: any;
	isRead: boolean;
}
