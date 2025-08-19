import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class CheckInDTO {
	@ApiProperty()
	@IsNumber()
	latitude!: number;

	@ApiProperty()
	@IsNumber()
	longitude!: number;
}

export class CheckOutDTO {
	@ApiProperty()
	@IsNumber()
	latitude!: number;

	@ApiProperty()
	@IsNumber()
	longitude!: number;
}

export class CheckInStatusResponse {
	@ApiProperty()
	isCheckedIn!: boolean;

	@ApiProperty({ required: false })
	checkedInAt?: Date;

	@ApiProperty({ required: false })
	groupProgress?: string;

	@ApiProperty({ required: false })
	earnedPoints?: number;

	@ApiProperty({ required: false })
	groupId?: string;
}

export class CheckInUserInfo {
	@ApiProperty()
	userId!: string;

	@ApiProperty({ required: false })
	nickName?: string;

	@ApiProperty({ required: false })
	profileImageUrl?: string;

	@ApiProperty()
	checkedInAt!: Date;
}

export class CurrentGroupResponse {
	@ApiProperty()
	groupId!: string;

	@ApiProperty()
	progress!: string;

	@ApiProperty()
	isCompleted!: boolean;

	@ApiProperty({ type: [CheckInUserInfo] })
	members!: CheckInUserInfo[];

	@ApiProperty()
	bonusPoints!: number;
}

export class CheckInUsersResponse {
	@ApiProperty()
	totalCount!: number;

	@ApiProperty({ type: [CheckInUserInfo] })
	users!: CheckInUserInfo[];

	@ApiProperty({ required: false })
	currentGroup?: CurrentGroupResponse;
}