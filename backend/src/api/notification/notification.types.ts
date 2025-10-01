export enum NotificationType {
	UserCommunityRankChange = 'UserCommunityRankChange',
	UserCommunityRankFallen = 'UserCommunityRankFallen',
	Admin = 'Admin',
	FriendRequest = 'FriendRequest',
	FriendAccepted = 'FriendAccepted',
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

export interface FriendRequestNotification {
	type: NotificationType.FriendRequest;
	userId: string;
	title: string;
	body: string;
}

export interface FriendAcceptedNotification {
	type: NotificationType.FriendAccepted;
	userId: string;
	title: string;
	body: string;
}

export type UnifiedNotification =
	| UserCommunityRankChangeNotification
	| UserCommunityRankFallenNotification
	| AdminNotification
	| FriendRequestNotification
	| FriendAcceptedNotification;
