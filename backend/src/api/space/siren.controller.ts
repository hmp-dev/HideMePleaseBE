import {
	Body,
	Controller,
	Delete,
	Get,
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
	ApiTags,
	ApiResponse,
	ApiBody,
} from '@nestjs/swagger';

import { SirenService } from '@/api/space/siren.service';
import {
	CreateSirenDTO,
	GetSirensDTO,
	SirenListResponse,
	CreateSirenResponse,
	SirenStatsResponse,
	SirenSortBy,
} from '@/api/space/siren.dto';
import { AuthGuard } from '@/api/auth/auth.guard';

@ApiTags('Siren')
@ApiBearerAuth()
@Controller('space/siren')
export class SirenController {
	constructor(private sirenService: SirenService) {}

	@ApiOperation({
		summary: 'Create a siren message',
		description: '매장에 사이렌 메시지를 남깁니다. 만료일이 길수록 더 많은 포인트가 소모됩니다.',
	})
	@ApiBody({ type: CreateSirenDTO })
	@ApiResponse({
		status: 201,
		description: '사이렌 생성 성공',
		type: CreateSirenResponse,
	})
	@ApiResponse({
		status: 400,
		description: '잘못된 요청 (포인트 부족, 만료일 오류, 메시지 길이 오류 등)',
	})
	@ApiResponse({
		status: 404,
		description: '매장을 찾을 수 없음',
	})
	@UseGuards(AuthGuard)
	@Post()
	createSiren(@Req() request: Request, @Body() createSirenDTO: CreateSirenDTO) {
		return this.sirenService.createSiren({ createSirenDTO, request });
	}

	@ApiOperation({
		summary: 'Get sirens list',
		description: '사이렌 목록을 조회합니다. 거리순 또는 시간순 정렬을 지원합니다.',
	})
	@ApiQuery({
		name: 'sortBy',
		enum: SirenSortBy,
		required: false,
		description: '정렬 기준 (distance: 거리순, time: 시간순)',
	})
	@ApiQuery({
		name: 'latitude',
		type: 'number',
		required: false,
		description: '사용자 위도 (거리순 정렬 시 필수)',
	})
	@ApiQuery({
		name: 'longitude',
		type: 'number',
		required: false,
		description: '사용자 경도 (거리순 정렬 시 필수)',
	})
	@ApiQuery({
		name: 'page',
		type: 'number',
		required: false,
		description: '페이지 번호 (기본값: 1)',
	})
	@ApiQuery({
		name: 'limit',
		type: 'number',
		required: false,
		description: '페이지당 개수 (기본값: 20, 최대: 100)',
	})
	@ApiQuery({
		name: 'spaceId',
		type: 'string',
		required: false,
		description: '특정 매장만 필터링 (옵션)',
	})
	@ApiResponse({
		status: 200,
		description: '사이렌 목록 조회 성공',
		type: SirenListResponse,
	})
	@ApiResponse({
		status: 400,
		description: '거리순 정렬 시 위도/경도 누락',
	})
	@UseGuards(AuthGuard)
	@Get()
	getSirens(@Req() request: Request, @Query() getSirensDTO: GetSirensDTO) {
		return this.sirenService.getSirens({ getSirensDTO, request });
	}

	@ApiOperation({
		summary: 'Get my sirens',
		description: '내가 작성한 사이렌 목록을 조회합니다 (활성/만료 모두 포함).',
	})
	@ApiResponse({
		status: 200,
		description: '내 사이렌 목록 조회 성공',
	})
	@UseGuards(AuthGuard)
	@Get('my')
	getMySirens(@Req() request: Request) {
		return this.sirenService.getMySirens({ request });
	}

	@ApiOperation({
		summary: 'Delete a siren',
		description: '사이렌을 삭제합니다. 본인이 작성한 사이렌만 삭제 가능하며, 포인트는 환불되지 않습니다.',
	})
	@ApiParam({
		name: 'sirenId',
		type: 'string',
		description: '사이렌 ID',
	})
	@ApiResponse({
		status: 200,
		description: '사이렌 삭제 성공',
		schema: {
			example: {
				success: true,
			},
		},
	})
	@ApiResponse({
		status: 400,
		description: '본인의 사이렌이 아님',
	})
	@ApiResponse({
		status: 404,
		description: '사이렌을 찾을 수 없음',
	})
	@UseGuards(AuthGuard)
	@Delete(':sirenId')
	deleteSiren(@Req() request: Request, @Param('sirenId') sirenId: string) {
		return this.sirenService.deleteSiren({ sirenId, request });
	}

	@ApiOperation({
		summary: 'Get siren statistics for a space',
		description: '특정 매장의 사이렌 통계를 조회합니다.',
	})
	@ApiParam({
		name: 'spaceId',
		type: 'string',
		description: '매장 ID',
	})
	@ApiResponse({
		status: 200,
		description: '사이렌 통계 조회 성공',
		type: SirenStatsResponse,
	})
	@ApiResponse({
		status: 404,
		description: '매장을 찾을 수 없음',
	})
	@UseGuards(AuthGuard)
	@Get('stats/:spaceId')
	getSirenStats(@Param('spaceId') spaceId: string) {
		return this.sirenService.getSirenStats({ spaceId });
	}
}
