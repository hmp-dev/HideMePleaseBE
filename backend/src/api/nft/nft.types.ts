import { Nft, SupportedChains } from '@prisma/client';

export interface NftTokenResponse {
	tokenId: string;
	imageUrl: string;
	name: string;
}

export type NftCreateDTO = Pick<
	Nft,
	| 'id'
	| 'name'
	| 'imageUrl'
	| 'videoUrl'
	| 'tokenAddress'
	| 'tokenId'
	| 'ownedWalletAddress'
>;

export type NftCollectionCursor = {
	nextChain?: SupportedChains;
	nextWalletAddress?: string;
	nextPage?: string;
	liveData: boolean;
} | null;

export enum BenefitUsageType {
	SPACE_VISIT = 'SPACE_VISIT',
	COMMUNITY = 'COMMUNITY',
}

export enum NftCommunitySortOrder {
	POINTS = 'points',
	MEMBERS = 'members',
}

export enum BenefitState {
	AVAILABLE = 'available',
	UNAVAILABLE = 'unavailable',
	USED = 'used',
}
