import { BenefitLevel } from '@prisma/client';

import { BENEFIT_POINT_CAP } from '@/api/nft/nft.constants';

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

export function getCompositeTokenId(tokenAddress: string, tokenId: string) {
	return `${tokenAddress}_${tokenId}`;
}
