import {
	Controller,
	Get,
	NotFoundException,
	Param,
	Res,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

import { PublicNftService } from '@/api/public/public-nft.service';

@ApiTags('Public NFT')
@Controller('public/nft')
export class PublicNftController {
	constructor(private publicNftService: PublicNftService) {}

	@ApiOperation({
		summary: 'Get user NFT metadata',
		description: '사용자 프로필 NFT 메타데이터를 조회합니다 (인증 불필요)',
	})
	@ApiParam({
		name: 'userId',
		type: 'string',
		description: '사용자 ID',
	})
	@ApiResponse({
		status: 200,
		description: 'NFT 메타데이터',
		schema: {
			example: {
				name: 'HideMe Profile - UserNickname',
				description: 'HideMe User Profile NFT for UserNickname',
				image: 'https://api.hideme.plus/public/nft/user/userId/image',
				external_url: 'https://hideme.plus/user/userId',
				attributes: [
					{
						trait_type: 'User ID',
						value: 'user-uuid',
					},
					{
						trait_type: 'Nickname',
						value: 'UserNickname',
					},
					{
						trait_type: 'Profile Parts',
						value: 'parts-string',
					},
					{
						trait_type: 'Created Date',
						display_type: 'date',
						value: 1234567890,
					},
				],
			},
		},
	})
	@ApiResponse({
		status: 404,
		description: '사용자를 찾을 수 없음',
	})
	@Get('user/:userId/metadata')
	async getUserNftMetadata(@Param('userId') userId: string) {
		return this.publicNftService.getUserNftMetadata(userId);
	}

	@ApiOperation({
		summary: 'Get user NFT image',
		description: '사용자 프로필 NFT 이미지를 반환합니다 (인증 불필요)',
	})
	@ApiParam({
		name: 'userId',
		type: 'string',
		description: '사용자 ID',
	})
	@ApiResponse({
		status: 200,
		description: '이미지 파일',
		content: {
			'image/png': {},
			'image/jpeg': {},
		},
	})
	@ApiResponse({
		status: 302,
		description: '외부 URL로 리다이렉트',
	})
	@ApiResponse({
		status: 404,
		description: '사용자를 찾을 수 없음',
	})
	@Get('user/:userId/image')
	async getUserImage(
		@Param('userId') userId: string,
		@Res() response: Response,
	) {
		const imageInfo = await this.publicNftService.getUserImageInfo(userId);

		if (!imageInfo.exists) {
			throw new NotFoundException('User not found');
		}

		// 이미지 URL이 없는 경우 기본 이미지 반환
		if (!imageInfo.imageUrl && !imageInfo.imagePath) {
			const defaultPath = this.publicNftService.getDefaultImagePath();
			if (fs.existsSync(defaultPath)) {
				response.setHeader('Content-Type', 'image/svg+xml');
				response.setHeader('Cache-Control', 'public, max-age=3600');
				return response.sendFile(path.resolve(defaultPath));
			}
			throw new NotFoundException('Default image not found');
		}

		// URL인 경우 리다이렉트
		if (imageInfo.imageUrl) {
			return response.redirect(imageInfo.imageUrl);
		}

		// 로컬 파일 경로인 경우
		if (imageInfo.imagePath) {
			const imagePath = path.resolve(imageInfo.imagePath);
			
			if (fs.existsSync(imagePath)) {
				const mimeType = imageInfo.mimeType || 'image/png';
				response.setHeader('Content-Type', mimeType);
				response.setHeader('Cache-Control', 'public, max-age=3600');
				return response.sendFile(imagePath);
			}
		}

		// 파일을 찾을 수 없는 경우 기본 이미지
		const defaultPath = this.publicNftService.getDefaultImagePath();
		if (fs.existsSync(defaultPath)) {
			response.setHeader('Content-Type', 'image/svg+xml');
			response.setHeader('Cache-Control', 'public, max-age=3600');
			return response.sendFile(path.resolve(defaultPath));
		}

		throw new NotFoundException('Image not found');
	}
}