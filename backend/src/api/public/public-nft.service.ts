import { Injectable, NotFoundException } from '@nestjs/common';
import * as path from 'path';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { ProfileImageGeneratorService } from '@/modules/profile-image/profile-image-generator.service';
import { ProfileImageCacheService } from '@/modules/profile-image/profile-image-cache.service';

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
		private profileImageGenerator: ProfileImageGeneratorService,
		private profileImageCache: ProfileImageCacheService,
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
		imageBuffer?: Buffer;
		mimeType?: string;
		exists: boolean;
		profilePartsString?: string;
	}> {
		const user = await this.prisma.user.findFirst({
			where: {
				id: userId,
				deleted: false,
			},
			select: {
				finalProfileImageUrl: true,
				profilePartsString: true,
			},
		});

		if (!user) {
			return { exists: false };
		}

		// If user has finalProfileImageUrl, use it
		if (user.finalProfileImageUrl) {
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

		// If no finalProfileImageUrl but has profilePartsString, generate image
		if (user.profilePartsString) {
			const parts = this.profileImageGenerator.parseProfileParts(user.profilePartsString);
			if (parts) {
				const partsHash = this.profileImageGenerator.generatePartsHash(parts);
				const cacheKey = this.profileImageCache.getCacheKey(userId, partsHash);

				// Check cache first
				let imageBuffer = await this.profileImageCache.get(cacheKey);

				if (!imageBuffer) {
					// Generate new image
					imageBuffer = await this.profileImageGenerator.generateImageWithFallback(parts);
					// Store in cache
					await this.profileImageCache.set(cacheKey, imageBuffer);
				}

				return {
					imageBuffer,
					mimeType: 'image/png',
					exists: true,
					profilePartsString: user.profilePartsString,
				};
			}
		}

		// No image available
		return { exists: true };
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