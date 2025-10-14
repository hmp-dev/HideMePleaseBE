import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateAnnouncementDTO {
	@ApiProperty({
		description: '공지사항 제목',
		example: '시스템 점검 안내',
	})
	@IsString()
	@IsNotEmpty()
	title!: string;

	@ApiProperty({
		description: '공지사항 내용',
		example: '2024년 1월 1일 오전 2시부터 4시까지 시스템 점검이 예정되어 있습니다.',
	})
	@IsString()
	@IsNotEmpty()
	description!: string;

	@ApiProperty({
		description: '푸시 알림 발송 여부',
		default: true,
		required: false,
	})
	@IsOptional()
	sendNotification?: boolean = true;
}

export class UpdateAnnouncementDTO {
	@ApiProperty({
		description: '공지사항 제목',
		required: false,
	})
	@IsOptional()
	@IsString()
	title?: string;

	@ApiProperty({
		description: '공지사항 내용',
		required: false,
	})
	@IsOptional()
	@IsString()
	description?: string;
}

export class CreateAnnouncementResponse {
	@ApiProperty()
	success!: boolean;

	@ApiProperty()
	message!: string;

	@ApiProperty()
	announcementId!: string;

	@ApiProperty({
		description: '알림 발송 결과',
		required: false,
	})
	notificationResult?: {
		totalUsers: number;
		successCount: number;
		failCount: number;
	};
}
