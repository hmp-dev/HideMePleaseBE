import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { Axios } from 'axios';

import { EnvironmentVariables } from '@/utils/env';

@Injectable()
export class SendbirdService {
	private client: Axios;

	constructor(
		private configService: ConfigService<EnvironmentVariables, true>,
	) {
		this.client = new Axios({
			...axios.defaults,
			baseURL: `https://api-${this.configService.get('SENDBIRD_APP_ID')}.sendbird.com/v3`,
			headers: {
				'Api-Token': this.configService.get<string>('SENDBIRD_TOKEN'),
				'Content-Type': 'application/json; charset=utf8',
			},
		});
	}

	async createUser({
		userId,
		nickname,
	}: {
		userId: string;
		nickname: string;
	}): Promise<string> {
		const res = await this.client.post<{ access_token: string }>('users', {
			user_id: userId,
			nickname,
			issue_access_token: true,
			profile_url: '',
		});

		return res.data.access_token;
	}

	async updateUser({
		userId,
		nickname,
		profileImageUrl,
	}: {
		userId: string;
		nickname?: string;
		profileImageUrl?: string;
	}) {
		await this.client.put<{ access_token: string }>(`users/${userId}`, {
			nickname,
			profile_url: profileImageUrl,
		});
	}

	async createGroupChannel({
		name,
		userIds,
		channelImageURl,
		channelUrl,
	}: {
		name: string;
		userIds: string[];
		channelUrl: string;
		channelImageURl: string;
	}) {
		await this.client.post(`group_channels`, {
			name,
			channel_url: channelUrl,
			user_ids: userIds,
			cover_url: channelImageURl,
			is_public: true,
			// is_super: true,
		});
	}

	async addUserToGroupChannel({
		userId,
		channelUrl,
	}: {
		userId: string;
		channelUrl: string;
	}) {
		await this.client.post(`group_channels/${channelUrl}/invite`, {
			user_ids: [userId],
		});
	}
}
