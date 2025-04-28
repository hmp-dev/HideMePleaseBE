import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';

import { EnvironmentVariables } from '@/utils/env';

@Injectable()
export class SendbirdService {
	private client;

	constructor(
		private configService: ConfigService<EnvironmentVariables, true>,
	) {
		this.client = axios.create({
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
		try {
			const res = await this.client.post('users', {
				user_id: userId,
				nickname,
				issue_access_token: true,
				profile_url: '',
			});

			return res.data.access_token;
		} catch (error) {
			if (error instanceof AxiosError) {
				console.error('Sendbird createUser error:', error.response?.data || error.message);
			} else {
				console.error('Sendbird createUser error:', error);
			}
			throw error;
		}
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
			is_super: true,
		});
	}

	async updateGroupChannelToSuper({ channelUrl }: { channelUrl: string }) {
		const channelData = await this.getGroupChannel({
			channelUrl: channelUrl,
		});

		if (
			channelData.channels.length > 0 &&
			!channelData.channels[0].is_super
		) {
			await this.client.put(`group_channels/${channelUrl}`, {
				is_super: true,
			});
		}
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

	async checkUserAddedToGroupChannel({
		userId,
		channelUrl,
	}: {
		userId: string;
		channelUrl: string;
	}): Promise<{
		is_member: boolean;
	}> {
		const response = await this.client.get(
			`group_channels/${channelUrl}/members/${userId}`,
		);
		return response.data as { is_member: boolean };
	}

	async getGroupChannel({ channelUrl }: { channelUrl: string }): Promise<{
		channels: any[];
	}> {
		const response = await this.client.get(
			`group_channels?channel_urls=${channelUrl}`,
		);
		return response.data as { channels: any[] };
	}

	async getGroupChannelMembers({
		channelUrl,
		limit = 10,
	}: {
		channelUrl: string;
		limit?: number;
	}): Promise<{
		members: any[];
		next: string;
	}> {
		const response = await this.client.get(
			`group_channels/${channelUrl}/members?limit=${limit}`,
		);
		return response.data as { members: any[]; next: string };
	}
}
