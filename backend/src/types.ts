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

export enum LoginType {
	FIREBASE = 'FIREBASE',
	WORLDCOIN = 'WORLDCOIN',
}
