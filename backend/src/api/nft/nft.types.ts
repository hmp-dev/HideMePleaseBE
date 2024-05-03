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
	| 'tokenAddress'
	| 'tokenId'
	| 'tokenUpdatedAt'
	| 'ownedWalletAddress'
	| 'lastOwnershipCheck'
>;

export interface NftCreateWithCollection extends NftCreateDTO {
	contractType: string;
	symbol: string;
}

export type NftCollectionCursor = {
	cursorType?: SupportedChains;
	cursor?: string | null;
	nextWalletAddress?: string;
	liveData: boolean;
} | null;
