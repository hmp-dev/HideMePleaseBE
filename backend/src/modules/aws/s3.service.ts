import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MediaFile } from '@prisma/client';
import AWS, { S3 } from 'aws-sdk';
import { v4 as uuid } from 'uuid';

import { FILE_EXPIRY_DURATION } from '@/modules/aws/aws.constants';
import { EnvironmentVariables } from '@/utils/env';

@Injectable()
export class S3Service {
	s3: S3;

	constructor(
		private configService: ConfigService<EnvironmentVariables, true>,
	) {
		this.s3 = new AWS.S3({
			credentials: {
				accessKeyId: this.configService.get('S3_ACCESS_KEY'),
				secretAccessKey: this.configService.get('S3_ACCESS_SECRET'),
			},
		});
	}

	async uploadFile({
		file,
		bucket,
	}: {
		file: Express.Multer.File;
		bucket: string;
	}) {
		const params = {
			Bucket: bucket,
			Key: uuid(),
			Body: file.buffer,
			ContentType: file.mimetype,
			ContentDisposition: 'inline',
			CreateBucketConfiguration: {
				LocationConstraint:
					this.configService.get<string>('AWS_REGION'),
			},
		};

		return this.s3.upload(params).promise();
	}

	getSignedUrl({ bucket, key }: MediaFile): string | undefined {
		return this.s3.getSignedUrl('getObject', {
			Bucket: bucket,
			Key: key,
			Expires: FILE_EXPIRY_DURATION,
		});
	}

	async deleteFile({ bucket, key }: MediaFile) {
		const params = {
			Bucket: bucket,
			Key: key,
		};

		return this.s3.deleteObject(params).promise();
	}
}
