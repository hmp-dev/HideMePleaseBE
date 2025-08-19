import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

import { MediaService } from '@/modules/media/media.service';
import { PrismaService } from '@/modules/prisma/prisma.service';

interface NftMetadata {
	name: string;
	description: string;
	image: string;
	external_url: string;
	attributes: Array<{
		trait_type: string;
		value: string | number;
		display_type?: string;
	}>;
}

@Injectable()
export class PublicNftService {
	constructor(
		private prisma: PrismaService,
		private mediaService: MediaService,
	) {}

	async getUserNftMetadata(userId: string): Promise<NftMetadata> {
		const user = await this.prisma.user.findFirst({
			where: {
				id: userId,
				deleted: false,
			},
			select: {
				id: true,
				nickName: true,
				finalProfileImageUrl: true,
				profilePartsString: true,
				createdAt: true,
			},
		});

		if (!user) {
			throw new NotFoundException('User not found');
		}

		const baseUrl = process.env.API_BASE_URL || 'https://api.hideme.plus';
		const imageUrl = `${baseUrl}/public/nft/user/${userId}/image`;

		const metadata: NftMetadata = {
			name: `HideMe Profile - ${user.nickName || user.id}`,
			description: `HideMe User Profile NFT for ${user.nickName || 'User'}`,
			image: imageUrl,
			external_url: `https://hideme.plus/user/${userId}`,
			attributes: [
				{
					trait_type: 'User ID',
					value: user.id,
				},
			],
		};

		if (user.nickName) {
			metadata.attributes.push({
				trait_type: 'Nickname',
				value: user.nickName,
			});
		}

		if (user.profilePartsString) {
			metadata.attributes.push({
				trait_type: 'Profile Parts',
				value: user.profilePartsString,
			});
		}

		metadata.attributes.push({
			trait_type: 'Created Date',
			display_type: 'date',
			value: Math.floor(user.createdAt.getTime() / 1000),
		});

		return metadata;
	}

	async getUserImageInfo(userId: string): Promise<{
		imageUrl?: string;
		imagePath?: string;
		mimeType?: string;
		exists: boolean;
	}> {
		const user = await this.prisma.user.findFirst({
			where: {
				id: userId,
				deleted: false,
			},
			select: {
				finalProfileImageUrl: true,
			},
		});

		if (!user) {
			return { exists: false };
		}

		if (!user.finalProfileImageUrl) {
			return { exists: true };
		}

		// URL인 경우
		if (user.finalProfileImageUrl.startsWith('http')) {
			return {
				imageUrl: user.finalProfileImageUrl,
				exists: true,
			};
		}

		// 로컬 경로인 경우
		return {
			imagePath: user.finalProfileImageUrl,
			mimeType: this.getMimeTypeFromPath(user.finalProfileImageUrl),
			exists: true,
		};
	}

	getDefaultImagePath(): string {
		// 기본 이미지 경로
		return path.join(__dirname, '../../assets/default-profile.svg');
	}

	private getMimeTypeFromPath(filePath: string): string {
		const ext = path.extname(filePath).toLowerCase();
		switch (ext) {
			case '.png':
				return 'image/png';
			case '.jpg':
			case '.jpeg':
				return 'image/jpeg';
			case '.gif':
				return 'image/gif';
			case '.webp':
				return 'image/webp';
			default:
				return 'image/png';
		}
	}

	async updateUserProfileImage(
		userId: string,
		imageUrl?: string,
		imagePath?: string,
	): Promise<void> {
		const finalUrl = imageUrl || imagePath;
		
		if (!finalUrl) {
			throw new Error('Either imageUrl or imagePath must be provided');
		}

		await this.prisma.user.update({
			where: { id: userId },
			data: {
				finalProfileImageUrl: finalUrl,
			},
		});
	}
}