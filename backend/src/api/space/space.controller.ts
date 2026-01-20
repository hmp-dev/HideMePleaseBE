import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Post,
	Query,
	Req,
	UseGuards,
} from '@nestjs/common';
import {
	ApiBearerAuth,
	ApiOperation,
	ApiParam,
	ApiQuery,
	ApiSecurity,
	ApiTags,
	ApiResponse,
	ApiBody,
} from '@nestjs/swagger';
import { SpaceCategory } from '@prisma/client';

import { CreateSpaceDTO, RedeemBenefitsDTO } from '@/api/space/space.dto';
import { SpaceService } from '@/api/space/space.service';
import { SpaceCheckInService } from '@/api/space/space-checkin.service';
import {
	CheckInDTO,
	CheckOutDTO,
	CheckInStatusResponse,
	CheckInUsersResponse,
	CurrentGroupResponse,
	CheckOutAllUsersResponse,
	HeartbeatDTO,
	HeartbeatResponse,
	CheckInStatusDTO,
	RegisterLiveActivityTokenDTO
} from '@/api/space/space-checkin.dto';
import { LiveActivityService } from '@/api/space/live-activity.service';
import { EnumValidationPipe } from '@/exception-filters/enum-validation.pipe';

import { AuthOrApiKeyGuard } from '../auth/auth-or-api-key.guard';

@ApiTags('Space')
@ApiBearerAuth()
@ApiSecurity('X-API-Key')
@Controller('space')
export class SpaceController {
	constructor(
		private spaceService: SpaceService,
		private spaceCheckInService: SpaceCheckInService,
		private liveActivityService: LiveActivityService,
	) {}

	@ApiOperation({
		summary: 'Create a new space',
		description: '새로운 매장을 등록합니다.',
	})
	@ApiBody({ type: CreateSpaceDTO })
	@ApiResponse({
		status: 201,
		description: '매장 생성 성공',
	})
	@UseGuards(AuthOrApiKeyGuard)
	@Post()
	createSpace(@Body() createSpaceDTO: CreateSpaceDTO) {
		return this.spaceService.createSpace({ createSpaceDTO });
	}

	@ApiOperation({
		summary: 'Get spaces list',
		description: '매장 목록을 조회합니다. 각 매장의 체크인 수가 포함됩니다.',
	})
	@ApiQuery({
		name: 'page',
		type: 'number',
		required: false,
		description: '페이지 번호 (기본값: 1)',
	})
	@ApiQuery({
		name: 'category',
		enum: SpaceCategory,
		required: false,
		description: '매장 카테고리',
	})
	@ApiQuery({
		name: 'latitude',
		type: 'number',
		description: '사용자 위도',
	})
	@ApiQuery({
		name: 'longitude',
		type: 'number',
		description: '사용자 경도',
	})
	@ApiResponse({
		status: 200,
		description: '매장 목록 조회 성공',
		schema: {
			example: [
				{
					id: 'uuid-here',
					name: '매장명',
					checkInCount: 5,
					hot: true,
					hotPoints: 100,
				},
			],
		},
	})
	@UseGuards(AuthOrApiKeyGuard)
	@Get()
	getSpaceList(
		@Req() request: Request,
		@Query() { page }: { page: number },
		@Query('latitude') latitude: number,
		@Query('longitude') longitude: number,
		@Query('category', new EnumValidationPipe(SpaceCategory, false))
		category: SpaceCategory,
	) {
		return this.spaceService.getSpaceList({
			page,
			request,
			category,
			latitude,
			longitude,
		});
	}

	@ApiOperation({
		summary: 'Get space recommendations',
	})
	@UseGuards(AuthOrApiKeyGuard)
	@Get('recommendations')
	getSpaceRecommendations() {
		return this.spaceService.getSpaceRecommendations();
	}

	@ApiOperation({
		summary: 'Get new spaces',
	})
	@UseGuards(AuthOrApiKeyGuard)
	@Get('new-spaces')
	getNewSpaces() {
		return this.spaceService.getNewSpaces();
	}

	@ApiOperation({
		summary: 'Get space details',
		description: '매장 상세 정보를 조회합니다. 체크인 정보도 포함됩니다.',
	})
	@ApiParam({
		name: 'spaceId',
		type: 'string',
		description: '매장 ID',
	})
	@ApiResponse({
		status: 200,
		description: '매장 정보 조회 성공',
		schema: {
			example: {
				id: 'uuid-here',
				name: '매장명',
				checkInCount: 10,
				isUserCheckedIn: false,
				currentGroupProgress: '3/5',
				checkedInUsers: [
					{
						userId: 'user-uuid',
						nickName: '사용자명',
						profileImageUrl: 'https://...',
						checkedInAt: '2025-01-19T12:00:00Z',
					},
				],
			},
		},
	})
	@UseGuards(AuthOrApiKeyGuard)
	@Get('space/:spaceId')
	getSpace(@Req() request: Request, @Param('spaceId') spaceId: string) {
		return this.spaceService.getSpace({ request, spaceId });
	}

	@ApiOperation({
		summary: 'Get space benefits',
	})
	@UseGuards(AuthOrApiKeyGuard)
	@Get('space/:spaceId/benefits')
	getSpaceBenefits(
		@Req() request: Request,
		@Param('spaceId') spaceId: string,
	) {
		return this.spaceService.getSpaceBenefits({ request, spaceId });
	}

	@ApiOperation({
		summary: 'Redeem space benefit',
	})
	@ApiParam({
		name: 'benefitId',
		type: 'string',
	})
	@HttpCode(HttpStatus.NO_CONTENT)
	@UseGuards(AuthOrApiKeyGuard)
	@Post('benefits/redeem/:benefitId')
	redeemBenefit(
		@Req() request: Request,
		@Body() redeemBenefitsDTO: RedeemBenefitsDTO,
		@Param('benefitId') benefitId: string,
	) {
		return this.spaceService.redeemBenefit({
			redeemBenefitsDTO,
			request,
			benefitId,
		});
	}

	@ApiOperation({
		summary: 'Check in to a space',
		description: '매장에 체크인합니다. 200m 이내에 있어야 하며, 5명이 모이면 보너스 포인트를 받습니다. 다른 매장에 이미 체크인되어 있는 경우 자동으로 체크아웃한 후 새로운 매장에 체크인됩니다.',
	})
	@ApiParam({
		name: 'spaceId',
		type: 'string',
		description: '체크인할 매장 ID',
	})
	@ApiBody({
		type: CheckInDTO,
		description: '체크인 위치 정보',
	})
	@ApiResponse({
		status: 201,
		description: '체크인 성공',
		schema: {
			example: {
				success: true,
				checkInId: 'uuid-here',
				groupProgress: '2/5',
				earnedPoints: 5,
			},
		},
	})
	@ApiResponse({
		status: 400,
		description: '같은 매장에 이미 체크인한 상태이거나 거리가 너무 멀 때, 또는 체크인 제한에 걸릴 때',
	})
	@ApiResponse({
		status: 404,
		description: '매장을 찾을 수 없음',
	})
	@UseGuards(AuthOrApiKeyGuard)
	@Post(':spaceId/check-in')
	checkIn(
		@Req() request: Request,
		@Param('spaceId') spaceId: string,
		@Body() checkInDTO: CheckInDTO,
	) {
		return this.spaceCheckInService.checkIn({
			spaceId,
			checkInDTO,
			request,
		});
	}

	@ApiOperation({
		summary: 'Check out from a space',
		description: '매장에서 체크아웃합니다.',
	})
	@ApiParam({
		name: 'spaceId',
		type: 'string',
		description: '체크아웃할 매장 ID',
	})
	@ApiBody({
		type: CheckOutDTO,
		description: '체크아웃 위치 정보',
	})
	@ApiResponse({
		status: 200,
		description: '체크아웃 성공',
		schema: {
			example: {
				success: true,
			},
		},
	})
	@ApiResponse({
		status: 400,
		description: '체크인하지 않은 상태',
	})
	@UseGuards(AuthOrApiKeyGuard)
	@Delete(':spaceId/check-out')
	checkOut(
		@Req() request: Request,
		@Param('spaceId') spaceId: string,
		@Body() checkOutDTO: CheckOutDTO,
	) {
		return this.spaceCheckInService.checkOut({
			spaceId,
			checkOutDTO,
			request,
		});
	}

	@ApiOperation({
		summary: 'Get check-in status for current user',
		description: '현재 사용자의 체크인 상태를 조회합니다.',
	})
	@ApiParam({
		name: 'spaceId',
		type: 'string',
		description: '매장 ID',
	})
	@ApiResponse({
		status: 200,
		description: '체크인 상태 조회 성공',
		type: CheckInStatusResponse,
	})
	@UseGuards(AuthOrApiKeyGuard)
	@Get(':spaceId/check-in-status')
	getCheckInStatus(
		@Req() request: Request,
		@Param('spaceId') spaceId: string,
	) {
		return this.spaceCheckInService.getCheckInStatus({
			spaceId,
			request,
		});
	}

	@ApiOperation({
		summary: 'Get checked-in users for a space',
		description: '매장에 체크인한 사용자 목록을 조회합니다.',
	})
	@ApiParam({
		name: 'spaceId',
		type: 'string',
		description: '매장 ID',
	})
	@ApiResponse({
		status: 200,
		description: '체크인 사용자 목록 조회 성공',
		type: CheckInUsersResponse,
	})
	@UseGuards(AuthOrApiKeyGuard)
	@Get(':spaceId/check-in-users')
	getCheckInUsers(@Param('spaceId') spaceId: string) {
		return this.spaceCheckInService.getCheckInUsers({ spaceId });
	}

	@ApiOperation({
		summary: 'Get current check-in group for a space',
		description: '매장의 현재 진행 중인 5명 그룹 상태를 조회합니다.',
	})
	@ApiParam({
		name: 'spaceId',
		type: 'string',
		description: '매장 ID',
	})
	@ApiResponse({
		status: 200,
		description: '그룹 상태 조회 성공',
		type: CurrentGroupResponse,
	})
	@UseGuards(AuthOrApiKeyGuard)
	@Get(':spaceId/current-group')
	getCurrentGroup(@Param('spaceId') spaceId: string) {
		return this.spaceCheckInService.getCurrentGroup({ spaceId });
	}

	@ApiOperation({
		summary: 'Check out all users from a space',
		description: '매장에 체크인된 모든 사용자를 관리자 권한으로 체크아웃시킵니다.',
	})
	@ApiParam({
		name: 'spaceId',
		type: 'string',
		description: '체크아웃할 매장 ID',
	})
	@ApiResponse({
		status: 200,
		description: '전체 체크아웃 성공',
		type: CheckOutAllUsersResponse,
	})
	@ApiResponse({
		status: 404,
		description: '매장을 찾을 수 없음',
	})
	@UseGuards(AuthOrApiKeyGuard)
	@Delete(':spaceId/check-out-all')
	checkOutAllUsers(
		@Req() request: Request,
		@Param('spaceId') spaceId: string,
	) {
		return this.spaceCheckInService.checkOutAllUsers({
			spaceId,
			request,
		});
	}

	@ApiOperation({
		summary: 'Send heartbeat for active check-in',
		description: '활성 체크인에 대한 하트비트를 전송합니다. 3분마다 호출해야 합니다.',
	})
	@ApiBody({
		type: HeartbeatDTO,
		description: '하트비트 정보',
	})
	@ApiResponse({
		status: 200,
		description: '하트비트 처리 성공',
		type: HeartbeatResponse,
	})
	@ApiResponse({
		status: 401,
		description: '인증 실패',
	})
	@UseGuards(AuthOrApiKeyGuard)
	@Post('checkin/heartbeat')
	heartbeat(
		@Req() request: Request,
		@Body() heartbeatDTO: HeartbeatDTO,
	) {
		return this.spaceCheckInService.heartbeat({
			heartbeatDTO,
			request,
		});
	}

	@ApiOperation({
		summary: 'Get current check-in status',
		description: '현재 사용자의 활성 체크인 상태를 조회합니다.',
	})
	@ApiResponse({
		status: 200,
		description: '체크인 상태 조회 성공',
		type: CheckInStatusDTO,
	})
	@ApiResponse({
		status: 401,
		description: '인증 실패',
	})
	@UseGuards(AuthOrApiKeyGuard)
	@Get('checkin/status')
	getCurrentCheckInStatus(@Req() request: Request) {
		return this.spaceCheckInService.getCurrentCheckInStatus({ request });
	}

	@ApiOperation({
		summary: 'Register Live Activity token',
		description: 'iOS Live Activity용 Push Token을 등록합니다.',
	})
	@ApiBody({
		type: RegisterLiveActivityTokenDTO,
	})
	@ApiResponse({
		status: 200,
		description: '토큰 등록 성공',
	})
	@ApiResponse({
		status: 401,
		description: '인증 실패',
	})
	@UseGuards(AuthOrApiKeyGuard)
	@Post('checkin/live-activity-token')
	async registerLiveActivityToken(
		@Req() request: Request,
		@Body() dto: RegisterLiveActivityTokenDTO,
	) {
		const authContext = Reflect.get(request, 'authContext') as { userId: string };
		await this.liveActivityService.registerLiveActivityToken({
			userId: authContext.userId,
			liveActivityToken: dto.liveActivityToken,
		});
		return { success: true };
	}

	@ApiOperation({
		summary: 'Remove Live Activity token',
		description: 'iOS Live Activity용 Push Token을 제거합니다.',
	})
	@ApiResponse({
		status: 200,
		description: '토큰 제거 성공',
	})
	@ApiResponse({
		status: 401,
		description: '인증 실패',
	})
	@UseGuards(AuthOrApiKeyGuard)
	@Delete('checkin/live-activity-token')
	async removeLiveActivityToken(@Req() request: Request) {
		const authContext = Reflect.get(request, 'authContext') as { userId: string };
		await this.liveActivityService.removeLiveActivityToken(authContext.userId);
		return { success: true };
	}
}
