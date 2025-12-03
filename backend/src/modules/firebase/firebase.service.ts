import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { auth, messaging } from 'firebase-admin';
import { App, cert, initializeApp, ServiceAccount } from 'firebase-admin/app';
import { Message } from 'firebase-admin/lib/messaging';

import { NotificationType } from '@/api/notification/notification.types';
import { EnvironmentVariables } from '@/utils/env';

// Live Activity ContentState 인터페이스
export interface LiveActivityContentState {
	groupProgress: string; // 예: "3/5"
	currentMembers: number;
	requiredMembers: number;
	checkedInAt: string; // ISO 8601 형식
	elapsedMinutes: number;
	spaceName: string;
	spaceId: string;
	isCompleted: boolean;
	bonusPoints?: number;
}

// Live Activity 이벤트 타입
export type LiveActivityEvent = 'update' | 'end';

@Injectable()
export class FirebaseService implements OnModuleInit {
	private readonly logger = new Logger(FirebaseService.name);
	private _app: App | null = null;
	private _firebaseAuth: auth.Auth | null = null;

	public set app(app: App) {
		this._app = app;
	}

	public get app(): App {
		if (!this._app) {
			throw new Error('firebase app not initialized');
		}

		return this._app;
	}

	public set auth(auth: auth.Auth) {
		this._firebaseAuth = auth;
	}

	public get auth(): auth.Auth {
		if (!this._firebaseAuth) {
			throw new Error('firebase auth not initialized');
		}

		return this._firebaseAuth;
	}

	constructor(
		private configService: ConfigService<EnvironmentVariables, true>,
	) {}

	onModuleInit() {
		this.logger.log('initializing firebase app');
		const config = {
			clientEmail: this.configService.get<string>(
				'FIREBASE_CLIENT_EMAIL',
			),
			projectId: this.configService.get<string>('FIREBASE_PROJECT_ID'),
			privateKey: JSON.parse(
				this.configService.get<string>('FIREBASE_PRIVATE_KEY'),
			) as string,
		} satisfies ServiceAccount;

		this.app = initializeApp({
			credential: cert(config),
		});
		this.auth = auth();
	}

	async decodeBearerToken(token: string) {
		try {
			return await this.auth.verifyIdToken(token);
		} catch (e) {
			this.logger.error('invalid auth token %o', e);
			throw new Error('invalid token');
		}
	}

	async sendNotifications(message: Message) {
		try {
			const result = await messaging().send(message);
			this.logger.log(`FCM notification sent successfully: ${result}`);
			return result;
		} catch (error) {
			this.logger.error(`FCM notification failure ${error}`);
			throw error;
		}
	}

	buildNotification({
		type,
		title,
		body,
		fcmToken,
	}: {
		type: NotificationType;
		title: string;
		body: string;
		fcmToken: string;
	}) {
		return {
			data: {
				type,
			},
			notification: {
				title,
				body,
			},
			token: fcmToken,
		};
	}

	async buildAndSendNotification(params: {
		type: NotificationType;
		title: string;
		body: string;
		fcmToken: string;
	}) {
		const notification = this.buildNotification(params);
		if (!notification) {
			return;
		}

		await this.sendNotifications(notification);
	}

	// Live Activity 업데이트 전송
	async sendLiveActivityUpdate({
		liveActivityToken,
		contentState,
		event = 'update',
		dismissalDate,
	}: {
		liveActivityToken: string;
		contentState: LiveActivityContentState;
		event?: LiveActivityEvent;
		dismissalDate?: Date;
	}): Promise<string | null> {
		const bundleId = this.configService.get<string>('IOS_BUNDLE_ID');

		if (!bundleId) {
			this.logger.warn('IOS_BUNDLE_ID 환경 변수가 설정되지 않음');
			return null;
		}

		try {
			const message: Message = {
				token: liveActivityToken,
				apns: {
					headers: {
						'apns-push-type': 'liveactivity',
						'apns-topic': `${bundleId}.push-type.liveactivity`,
						'apns-priority': '10',
					},
					payload: {
						aps: {
							timestamp: Math.floor(Date.now() / 1000),
							event: event,
							'content-state': contentState,
							...(dismissalDate && {
								'dismissal-date': Math.floor(
									dismissalDate.getTime() / 1000,
								),
							}),
						},
					},
				},
			};

			const result = await messaging().send(message);
			this.logger.log(`Live Activity ${event} 전송 성공: ${result}`);
			return result;
		} catch (error) {
			this.logger.error(`Live Activity ${event} 전송 실패:`, error);
			return null;
		}
	}

	// Live Activity 종료
	async endLiveActivity({
		liveActivityToken,
		contentState,
		dismissalDate,
	}: {
		liveActivityToken: string;
		contentState: LiveActivityContentState;
		dismissalDate?: Date;
	}): Promise<string | null> {
		return this.sendLiveActivityUpdate({
			liveActivityToken,
			contentState,
			event: 'end',
			dismissalDate:
				dismissalDate || new Date(Date.now() + 4 * 60 * 60 * 1000), // 기본 4시간 후 종료
		});
	}
}
