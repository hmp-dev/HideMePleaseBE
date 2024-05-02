import { Nft } from '@prisma/client';

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
