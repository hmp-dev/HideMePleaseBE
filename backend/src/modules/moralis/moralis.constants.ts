import { SupportedChains } from '@prisma/client';

import { CACHE_TTL } from '@/constants';

export enum MoralisEndPoints {
	resolveENSDomain = 'resolveENSDomain',
	getWalletNFTs = 'getWalletNFTs',
	getWalletNFTCollections = 'getWalletNFTCollections',
	getNFTCollectionStats = 'getNFTCollectionStats',
	getNFTLowestPrice = 'getNFTLowestPrice',
}

export const MORALIS_CACHE_TTL = {
	GET_TOKEN_BALANCE_EMPTY_RESPONSE: CACHE_TTL.ONE_MIN,
	GET_TOKEN_BALANCE_NON_EMPTY_RESPONSE: CACHE_TTL.ONE_MIN,
	GET_NATIVE_BALANCE_EMPTY_RESPONSE: CACHE_TTL.ONE_MIN,
	GET_NATIVE_BALANCE_NON_EMPTY_RESPONSE: CACHE_TTL.ONE_MIN,
	GET_TRANSACTIONS_EMPTY_RESPONSE: CACHE_TTL.ONE_MIN,
	GET_TRANSACTIONS_NON_EMPTY_RESPONSE: CACHE_TTL.ONE_MIN,
	RESOLVE_ENS_DOMAIN_CACHE: CACHE_TTL.ONE_MIN,
	DEFAULT_TTL: CACHE_TTL.ONE_MIN,
};

export interface NftCollectionWithTokens {
	chainSymbol: SupportedChains;
	contractType?: string;
	name: string;
	symbol?: string;
	tokenAddress: string;
	walletAddress: string;
	collectionLogo?: string;
	tokens: NftToken[];
}

export interface NftToken {
	id: string;
	tokenId: string;
	name?: string;
	imageUrl?: string;
	selected: boolean;
	ownerWalletAddress: string;
}
