import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { directus_files, MediaFile } from '@prisma/client';

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

	async uploadJson(json: string): Promise<MediaFile> {
		const bucket = this.configService.get<string>('S3_BUCKET');
		const { Key: key } = await this.s3Service.uploadJson({ json, bucket });

		return await this.prisma.mediaFile.create({
			data: {
				key,
				mimeType: 'application/json',
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

	private getS3Url(mediaFile: MediaFile) {
		return `https://${mediaFile.bucket}.s3.${this.configService.get(
			'AWS_REGION',
		)}.amazonaws.com/${mediaFile.key}`;
	}

	private getDirectusS3Url(mediaFile: directus_files) {
		return `https://${this.configService.get(
			'S3_BUCKET',
		)}.s3.${this.configService.get('AWS_REGION')}.amazonaws.com/${
			mediaFile.filename_disk
		}`;
	}

	async uploadDirectusFile(
		file: Express.Multer.File,
	): Promise<directus_files> {
		const bucket = this.configService.get<string>('S3_BUCKET');
		const { Key: key } = await this.s3Service.uploadFile({ file, bucket });

		return await this.prisma.directus_files.create({
			data: {
				id: require('crypto').randomUUID(),
				storage: 's3',
				filename_disk: key,
				filename_download: file.originalname,
				type: file.mimetype,
				filesize: file.size,
			},
		});
	}

	getUrl(mediaFile?: MediaFile | directus_files | null) {
		if (!mediaFile) {
			return undefined;
		}

		if ('filename_disk' in mediaFile) {
			return this.getDirectusS3Url(mediaFile);
		}

		return this.getS3Url(mediaFile);
	}
}
