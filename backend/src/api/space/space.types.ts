import { JwtType } from '@/types';

export interface DecodedBenefitToken {
	type: JwtType.SPACE_BENEFIT;
	spaceId: string;
	generatedAt: Date;
	validTill: Date;
	generatedBy: string;
}

export interface SpaceWithLocation {
	spaceId: string;
	latitude: number;
	longitude: number;
}

export enum DayOfWeek {
	MONDAY = 'MONDAY',
	TUESDAY = 'TUESDAY',
	WEDNESDAY = 'WEDNESDAY',
	THURSDAY = 'THURSDAY',
	FRIDAY = 'FRIDAY',
	SATURDAY = 'SATURDAY',
	SUNDAY = 'SUNDAY',
}

export interface SpaceBusinessHours {
	dayOfWeek: DayOfWeek;
	openTime: string | null;
	closeTime: string | null;
	breakStartTime: string | null;
	breakEndTime: string | null;
	isClosed: boolean;
}
