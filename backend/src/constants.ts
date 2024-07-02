import { SupportedLanguage } from '@/types';

export enum Messages {
	HEALTH_CHECK = 'healthy',
}

export enum Environment {
	Development = 'development',
	Production = 'production',
	Test = 'test',
}

export enum ApiVersions {
	V1 = '1',
}

export const GLOBAL_LANG = process.env.GLOBAL_LANG ?? SupportedLanguage.ENGLISH;

export const CACHE_TTL = {
	ONE_MONTH_IN_SECONDS: 2630000,
	ONE_MIN: 60000,
	ONE_DAY_IN_SECONDS: 86400,
	ONE_MIN_IN_MILLISECONDS: 60000,
	FIVE_MIN_IN_MILLISECONDS: 300000,
	THIRTY_MIN_IN_MILLISECONDS: 1800000,
	ONE_HOUR_IN_MILLISECONDS: 3600000,
	TEN_MIN_IN_MILLISECONDS: 600000,
};

export const PAGE_SIZES = {
	NFT_COLLECTIONS: 6,
	NOTIFICATION: 10,
};

export const MAX_SELECTED_NFTS = 3;
