import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { MediaFile } from '@prisma/client';

import { S3Service } from '@/modules/aws/s3.service';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { EnvironmentVariables } from '@/utils/env';

@Injectable()
export class MediaService {
	constructor(
		private prisma: PrismaService,
		private s3Service: S3Service,
		private configService: ConfigService<EnvironmentVariables, true>,
	) {}

	async uploadMedia(file: Express.Multer.File): Promise<MediaFile> {
		const bucket = this.configService.get<string>('S3_BUCKET');
		const { Key: key } = await this.s3Service.uploadFile({ file, bucket });

		return await this.prisma.mediaFile.create({
			data: {
				key,
				mimeType: file.mimetype,
				bucket,
			},
		});
	}

	async deleteMedia(mediaFile: MediaFile): Promise<void> {
		await this.s3Service.deleteFile(mediaFile);
		await this.prisma.mediaFile.delete({
			where: {
				id: mediaFile.id,
			},
		});
	}

	getS3Url(mediaFile: MediaFile) {
		return `https://${mediaFile.bucket}.s3.${this.configService.get(
			'AWS_REGION',
		)}.amazonaws.com/${mediaFile.key}`;
	}

	getUrl(mediaFile?: MediaFile | null) {
		if (!mediaFile) {
			return undefined;
		}

		return this.getS3Url(mediaFile);
	}
}
