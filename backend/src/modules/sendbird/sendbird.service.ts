import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import SendbirdChat from '@sendbird/chat';

import { EnvironmentVariables } from '@/utils/env';

@Injectable()
export class SendbirdService {
	private client: SendbirdChat;

	constructor(
		private configService: ConfigService<EnvironmentVariables, true>,
	) {
		this.client = SendbirdChat.init({
			appId: this.configService.get<string>('SENDBIRD_APP_ID'),
		});

		console.log(this.client);
	}
}
