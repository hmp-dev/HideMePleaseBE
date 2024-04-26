import { BenefitLevel } from '@prisma/client';

export const BENEFIT_POINT_CAP: Record<BenefitLevel, number> = {
	[BenefitLevel.LEVEL1]: 100,
	[BenefitLevel.LEVEL2]: 200,
	[BenefitLevel.LEVEL3]: 300,
	[BenefitLevel.LEVEL4]: 400,
	[BenefitLevel.LEVEL5]: Infinity,
};
