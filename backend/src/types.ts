import { LoginType } from '@prisma/client';

export enum SupportedLanguage {
	ENGLISH = 'en',
	KOREAN = 'ko',
}

export interface AuthContext {
	loginType: LoginType;
	userId: string;
	firebaseId?: string;
	nullifierHash?: string;
	isApiKey?: boolean;
	isAdmin?: boolean;
}

// API 키 인증 시 사용되는 컨텍스트 (userId가 없을 수 있음)
export interface ApiKeyAuthContext {
	isApiKey: true;
	isAdmin?: boolean;
	userId?: string;
}

export enum JwtType {
	SPACE_BENEFIT = 'SPACE_BENEFIT',
}

export enum SortOrder {
	NEWEST = 'NEWEST',
	OLDEST = 'OLDEST',
}

export type PickKey<T, K extends keyof T> = Extract<keyof T, K>;
