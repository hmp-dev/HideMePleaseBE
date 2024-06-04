export enum NotificationType {
	UserCommunityRankChange = 'UserCommunityRankChange',
	UserCommunityRankFallen = 'UserCommunityRankFallen',
}

export interface UserCommunityRankChangeNotification {
	type: NotificationType.UserCommunityRankChange;
	userId: string;
	oldRank?: number;
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

export type UnifiedNotification =
	| UserCommunityRankChangeNotification
	| UserCommunityRankFallenNotification;
