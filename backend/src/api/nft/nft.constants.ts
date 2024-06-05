import { BenefitLevel } from '@prisma/client';

export const BENEFIT_POINT_CAP: Record<BenefitLevel, number> = {
	[BenefitLevel.LEVEL1]: 100,
	[BenefitLevel.LEVEL2]: 200,
	[BenefitLevel.LEVEL3]: 300,
	[BenefitLevel.LEVEL4]: 400,
	[BenefitLevel.LEVEL5]: Infinity,
};

export const OWNERSHIP_CHECK_CONCURRENCY = 4;
export const CHAIN_CHECK_CONCURRENCY = 2;
export const PAGINATION_DEPTH_FOR_NFTS = 2;

export const BENEFIT_USAGE_PAGE_SIZE = 10;
export const BENEFIT_PAGE_SIZE = 10;
export const NFT_MEMBERS_PAGE_SIZE = 10;

export const NFT_COMMUNITY_PAGE_SIZE = 10;
