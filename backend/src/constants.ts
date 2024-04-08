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

export const CACHE_TTL = {};
