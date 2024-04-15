export enum SupportedLanguage {
	ENGLISH = 'en',
	KOREAN = 'ko',
}

interface FirebaseLoginContext {
	firebaseId: string;
	loginType: LoginType.FIREBASE;
}

interface WorldLoginContext {
	nullifierHash: string;
	loginType: LoginType.WORLDCOIN;
}

export type AuthContext = FirebaseLoginContext | WorldLoginContext;

export enum LoginType {
	FIREBASE = 'FIREBASE',
	WORLDCOIN = 'WORLDCOIN',
}
