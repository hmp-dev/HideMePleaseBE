import { JwtType } from '@/types';

export interface DecodedBenefitToken {
	type: JwtType.SPACE_BENEFIT;
	spaceId: string;
	generatedAt: Date;
	validTill: Date;
	generatedBy: string;
}
