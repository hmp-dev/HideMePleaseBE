import { EvmNft } from '@moralisweb3/common-evm-utils';
import { BenefitLevel } from '@prisma/client';

import { BENEFIT_POINT_CAP } from '@/api/nft/nft.constants';
import { NftCreateWithCollection } from '@/api/nft/nft.types';

export function getBenefitLevel(points: number): BenefitLevel {
	if (points <= BENEFIT_POINT_CAP.LEVEL1) {
		return BenefitLevel.LEVEL1;
	} else if (points <= BENEFIT_POINT_CAP.LEVEL2) {
		return BenefitLevel.LEVEL2;
	} else if (points <= BENEFIT_POINT_CAP.LEVEL3) {
		return BenefitLevel.LEVEL3;
	} else if (points <= BENEFIT_POINT_CAP.LEVEL4) {
		return BenefitLevel.LEVEL4;
	}

	return BenefitLevel.LEVEL5;
}

export function getCompositeTokenId(
	tokenAddress: string,
	tokenId: string | number,
) {
	return `${tokenAddress}_${tokenId}`;
}

export function evmNftToNft(token: EvmNft): NftCreateWithCollection {
	return {
		id: getCompositeTokenId(token.tokenAddress.toJSON(), token.tokenId),
		name: token.name || '',
		imageUrl: token.media?.mediaCollection?.medium.url || '',
		tokenAddress: token.tokenAddress.toJSON(),
		tokenId: token.tokenId.toString(),
		tokenUpdatedAt: token.media?.updatedAt as Date,
		ownedWalletAddress: token.ownerOf?.toJSON() as unknown as string,
		lastOwnershipCheck: new Date(),
		contractType: token.contractType || '',
		symbol: token.symbol || '',
	};
}
