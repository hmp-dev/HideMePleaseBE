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
}

export enum JwtType {
	SPACE_BENEFIT = 'SPACE_BENEFIT',
}

export enum SortOrder {
	NEWEST = 'NEWEST',
	OLDEST = 'OLDEST',
}

export type PickKey<T, K extends keyof T> = Extract<keyof T, K>;
