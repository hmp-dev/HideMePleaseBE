import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { FriendshipStatus } from '@prisma/client';

export class SendFriendRequestDTO {
	@ApiProperty({
		description: '친구 신청을 보낼 사용자 ID',
	})
	@IsString()
	addresseeId!: string;
}

export class GetFriendsDTO {
	@ApiProperty({
		description: '페이지 번호',
		required: false,
		default: 1,
	})
	@IsOptional()
	@IsNumber()
	@Min(1)
	page?: number = 1;

	@ApiProperty({
		description: '페이지당 개수',
		required: false,
		default: 20,
	})
	@IsOptional()
	@IsNumber()
	@Min(1)
	@Max(100)
	limit?: number = 20;
}

export class GetSentRequestsDTO {
	@ApiProperty({
		description: '상태 필터 (PENDING, ACCEPTED, REJECTED)',
		enum: FriendshipStatus,
		required: false,
	})
	@IsOptional()
	@IsEnum(FriendshipStatus)
	status?: FriendshipStatus;

	@ApiProperty({
		description: '페이지 번호',
		required: false,
		default: 1,
	})
	@IsOptional()
	@IsNumber()
	@Min(1)
	page?: number = 1;

	@ApiProperty({
		description: '페이지당 개수',
		required: false,
		default: 20,
	})
	@IsOptional()
	@IsNumber()
	@Min(1)
	@Max(100)
	limit?: number = 20;
}

export class SearchFriendsDTO {
	@ApiProperty({
		description: '검색 쿼리 (닉네임)',
	})
	@IsString()
	query!: string;

	@ApiProperty({
		description: '페이지 번호',
		required: false,
		default: 1,
	})
	@IsOptional()
	@IsNumber()
	@Min(1)
	page?: number = 1;

	@ApiProperty({
		description: '페이지당 개수',
		required: false,
		default: 20,
	})
	@IsOptional()
	@IsNumber()
	@Min(1)
	@Max(100)
	limit?: number = 20;
}

export class FriendUserInfo {
	@ApiProperty()
	userId!: string;

	@ApiProperty({ required: false })
	nickName?: string;

	@ApiProperty({ required: false })
	profileImageUrl?: string;

	@ApiProperty({ required: false })
	introduction?: string;
}

export class FriendshipResponse {
	@ApiProperty()
	id!: string;

	@ApiProperty({ enum: FriendshipStatus })
	status!: FriendshipStatus;

	@ApiProperty()
	createdAt!: Date;

	@ApiProperty({ type: FriendUserInfo })
	friend!: FriendUserInfo;
}

export class FriendRequestResponse {
	@ApiProperty()
	id!: string;

	@ApiProperty({ enum: FriendshipStatus })
	status!: FriendshipStatus;

	@ApiProperty()
	createdAt!: Date;

	@ApiProperty({ type: FriendUserInfo })
	requester!: FriendUserInfo;
}

export class FriendListResponse {
	@ApiProperty({ type: [FriendshipResponse] })
	friends!: FriendshipResponse[];

	@ApiProperty()
	pagination!: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

export class FriendRequestListResponse {
	@ApiProperty({ type: [FriendRequestResponse] })
	requests!: FriendRequestResponse[];

	@ApiProperty()
	pagination!: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

export class FriendStatsResponse {
	@ApiProperty({ description: '전체 친구 수' })
	totalFriends!: number;

	@ApiProperty({ description: '받은 친구 신청 수 (대기 중)' })
	receivedRequests!: number;

	@ApiProperty({ description: '보낸 친구 신청 수 (대기 중)' })
	sentRequests!: number;
}

export class SendFriendRequestResponse {
	@ApiProperty()
	success!: boolean;

	@ApiProperty()
	friendshipId!: string;

	@ApiProperty()
	message!: string;
}

export class FriendStatusResponse {
	@ApiProperty({ description: '친구 관계 존재 여부' })
	exists!: boolean;

	@ApiProperty({
		enum: FriendshipStatus,
		required: false,
		description: '친구 관계 상태',
	})
	status?: FriendshipStatus;

	@ApiProperty({ required: false, description: '친구 관계 ID' })
	friendshipId?: string;

	@ApiProperty({
		enum: ['sent', 'received'],
		required: false,
		description: '신청 방향 (sent: 내가 보냄, received: 내가 받음)',
	})
	direction?: 'sent' | 'received';
}
