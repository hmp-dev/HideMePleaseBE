export enum NotificationType {
	UserCommunityRankChange = 'UserCommunityRankChange',
	UserCommunityRankFallen = 'UserCommunityRankFallen',
	Admin = 'Admin',
}

export interface UserCommunityRankChangeNotification {
	type: NotificationType.UserCommunityRankChange;
	userId: string;
	newRank: number;
	tokenAddress: string;
}

export interface UserCommunityRankFallenNotification {
	type: NotificationType.UserCommunityRankFallen;
	userId: string;
	oldRank: number;
	newRank: number;
	tokenAddress: string;
}
export interface AdminNotification {
	type: NotificationType.Admin;
	userId: string | null;
	title: string;
	body: string;
}

export type UnifiedNotification =
	| UserCommunityRankChangeNotification
	| UserCommunityRankFallenNotification
	| AdminNotification;
