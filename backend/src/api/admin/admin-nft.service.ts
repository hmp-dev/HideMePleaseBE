import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { CreateUserNftMetadataDTO, UpdateUserNftMetadataDTO, SetUserImageDTO } from '@/api/admin/admin-nft.dto';
import { PublicNftService } from '@/api/public/public-nft.service';
import { PrismaService } from '@/modules/prisma/prisma.service';

@Injectable()
export class AdminNftService {
	constructor(
		private prisma: PrismaService,
		private publicNftService: PublicNftService,
	) {}

	async createUserNftMetadata(
		userId: string,
		dto: CreateUserNftMetadataDTO,
	): Promise<void> {
		const user = await this.prisma.user.findFirst({
			where: { id: userId },
		});

		if (!user) {
			throw new NotFoundException('User not found');
		}

		const updateData: any = {};

		// 이미지 URL 또는 경로 설정
		if (dto.imageUrl || dto.imagePath) {
			updateData.finalProfileImageUrl = dto.imageUrl || dto.imagePath;
		}

		// 추가 메타데이터가 필요한 경우 profilePartsString에 JSON으로 저장
		if (dto.attributes) {
			updateData.profilePartsString = JSON.stringify(dto.attributes);
		}

		if (Object.keys(updateData).length > 0) {
			await this.prisma.user.update({
				where: { id: userId },
				data: updateData,
			});
		}
	}

	async updateUserNftMetadata(
		userId: string,
		dto: UpdateUserNftMetadataDTO,
	): Promise<void> {
		const user = await this.prisma.user.findFirst({
			where: { id: userId },
		});

		if (!user) {
			throw new NotFoundException('User not found');
		}

		const updateData: any = {};

		// 이미지 URL 또는 경로 업데이트
		if (dto.imageUrl !== undefined || dto.imagePath !== undefined) {
			updateData.finalProfileImageUrl = dto.imageUrl || dto.imagePath || null;
		}

		// 메타데이터 업데이트
		if (dto.attributes !== undefined) {
			updateData.profilePartsString = dto.attributes 
				? JSON.stringify(dto.attributes)
				: null;
		}

		if (Object.keys(updateData).length > 0) {
			await this.prisma.user.update({
				where: { id: userId },
				data: updateData,
			});
		}
	}

	async setUserImage(userId: string, dto: SetUserImageDTO): Promise<void> {
		if (!dto.imageUrl && !dto.imagePath) {
			throw new BadRequestException('Either imageUrl or imagePath must be provided');
		}

		const user = await this.prisma.user.findFirst({
			where: { id: userId },
		});

		if (!user) {
			throw new NotFoundException('User not found');
		}

		await this.publicNftService.updateUserProfileImage(
			userId,
			dto.imageUrl,
			dto.imagePath,
		);
	}

	async deleteUserNftMetadata(userId: string): Promise<void> {
		const user = await this.prisma.user.findFirst({
			where: { id: userId },
		});

		if (!user) {
			throw new NotFoundException('User not found');
		}

		await this.prisma.user.update({
			where: { id: userId },
			data: {
				finalProfileImageUrl: null,
				profilePartsString: null,
			},
		});
	}

	async uploadUserImage(
		userId: string,
		file: Express.Multer.File,
	): Promise<{ imagePath: string }> {
		const user = await this.prisma.user.findFirst({
			where: { id: userId },
		});

		if (!user) {
			throw new NotFoundException('User not found');
		}

		// 파일 저장 경로 (실제 구현에서는 S3 등 사용)
		const uploadPath = `/uploads/profiles/${userId}/${file.filename}`;

		await this.prisma.user.update({
			where: { id: userId },
			data: {
				finalProfileImageUrl: uploadPath,
			},
		});

		return { imagePath: uploadPath };
	}
}