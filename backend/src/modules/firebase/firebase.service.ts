import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { auth, messaging } from 'firebase-admin';
import { App, cert, initializeApp, ServiceAccount } from 'firebase-admin/app';
import { Message } from 'firebase-admin/lib/messaging';

import { NotificationType } from '@/api/notification/notification.types';
import { EnvironmentVariables } from '@/utils/env';

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
			await messaging().send(message);
		} catch (error) {
			this.logger.error(`FCM notification failure ${error}`);
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
}
