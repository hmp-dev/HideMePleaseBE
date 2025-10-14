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

import { FriendsService } from '@/api/friends/friends.service';
import {
	SendFriendRequestDTO,
	GetFriendsDTO,
	GetSentRequestsDTO,
	SearchFriendsDTO,
	FriendListResponse,
	FriendRequestListResponse,
	FriendStatsResponse,
	SendFriendRequestResponse,
	FriendStatusResponse,
} from '@/api/friends/friends.dto';
import { AuthGuard } from '@/api/auth/auth.guard';

@ApiTags('Friends')
@ApiBearerAuth()
@Controller('friends')
export class FriendsController {
	constructor(private friendsService: FriendsService) {}

	@ApiOperation({
		summary: 'Send friend request',
		description: '친구 신청을 보냅니다. 역방향 신청이 있으면 자동으로 수락됩니다.',
	})
	@ApiBody({ type: SendFriendRequestDTO })
	@ApiResponse({
		status: 201,
		description: '친구 신청 성공',
		type: SendFriendRequestResponse,
	})
	@ApiResponse({
		status: 400,
		description: '잘못된 요청 (본인에게 신청, 이미 친구, 차단된 사용자 등)',
	})
	@ApiResponse({
		status: 404,
		description: '사용자를 찾을 수 없음',
	})
	@UseGuards(AuthGuard)
	@Post('request')
	sendFriendRequest(
		@Req() request: Request,
		@Body() sendFriendRequestDTO: SendFriendRequestDTO,
	) {
		return this.friendsService.sendFriendRequest({
			sendFriendRequestDTO,
			request,
		});
	}

	@ApiOperation({
		summary: 'Accept friend request',
		description: '받은 친구 신청을 수락합니다.',
	})
	@ApiParam({
		name: 'friendshipId',
		type: 'string',
		description: '친구 관계 ID',
	})
	@ApiResponse({
		status: 200,
		description: '친구 신청 수락 성공',
		schema: {
			example: {
				success: true,
				message: '친구 신청을 수락했습니다',
			},
		},
	})
	@ApiResponse({
		status: 400,
		description: '잘못된 요청 (본인 신청 아님, PENDING 상태 아님)',
	})
	@ApiResponse({
		status: 404,
		description: '친구 신청을 찾을 수 없음',
	})
	@UseGuards(AuthGuard)
	@Post('accept/:friendshipId')
	acceptFriendRequest(@Req() request: Request, @Param('friendshipId') friendshipId: string) {
		return this.friendsService.acceptFriendRequest({ friendshipId, request });
	}

	@ApiOperation({
		summary: 'Reject friend request',
		description: '받은 친구 신청을 거절합니다.',
	})
	@ApiParam({
		name: 'friendshipId',
		type: 'string',
		description: '친구 관계 ID',
	})
	@ApiResponse({
		status: 200,
		description: '친구 신청 거절 성공',
		schema: {
			example: {
				success: true,
				message: '친구 신청을 거절했습니다',
			},
		},
	})
	@ApiResponse({
		status: 400,
		description: '잘못된 요청',
	})
	@ApiResponse({
		status: 404,
		description: '친구 신청을 찾을 수 없음',
	})
	@UseGuards(AuthGuard)
	@Post('reject/:friendshipId')
	rejectFriendRequest(@Req() request: Request, @Param('friendshipId') friendshipId: string) {
		return this.friendsService.rejectFriendRequest({ friendshipId, request });
	}

	@ApiOperation({
		summary: 'Get friends list',
		description: '내 친구 목록을 조회합니다 (ACCEPTED 상태만).',
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
	@ApiResponse({
		status: 200,
		description: '친구 목록 조회 성공',
		type: FriendListResponse,
	})
	@UseGuards(AuthGuard)
	@Get()
	getFriends(@Req() request: Request, @Query() getFriendsDTO: GetFriendsDTO) {
		return this.friendsService.getFriends({ getFriendsDTO, request });
	}

	@ApiOperation({
		summary: 'Get received friend requests',
		description: '받은 친구 신청 목록을 조회합니다 (PENDING 상태만).',
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
	@ApiResponse({
		status: 200,
		description: '받은 친구 신청 목록 조회 성공',
		type: FriendRequestListResponse,
	})
	@UseGuards(AuthGuard)
	@Get('requests/received')
	getReceivedRequests(@Req() request: Request, @Query() getFriendsDTO: GetFriendsDTO) {
		return this.friendsService.getReceivedRequests({ getFriendsDTO, request });
	}

	@ApiOperation({
		summary: 'Get sent friend requests',
		description: '보낸 친구 신청 목록을 조회합니다. 상태별 필터 가능.',
	})
	@ApiQuery({
		name: 'status',
		enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'BLOCKED'],
		required: false,
		description: '상태 필터',
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
	@ApiResponse({
		status: 200,
		description: '보낸 친구 신청 목록 조회 성공',
		type: FriendRequestListResponse,
	})
	@UseGuards(AuthGuard)
	@Get('requests/sent')
	getSentRequests(@Req() request: Request, @Query() getSentRequestsDTO: GetSentRequestsDTO) {
		return this.friendsService.getSentRequests({ getSentRequestsDTO, request });
	}

	@ApiOperation({
		summary: 'Delete friend',
		description: '친구를 삭제합니다 (친구 끊기).',
	})
	@ApiParam({
		name: 'friendshipId',
		type: 'string',
		description: '친구 관계 ID',
	})
	@ApiResponse({
		status: 200,
		description: '친구 삭제 성공',
		schema: {
			example: {
				success: true,
				message: '친구를 삭제했습니다',
			},
		},
	})
	@ApiResponse({
		status: 400,
		description: '잘못된 요청 (본인 친구 아님, ACCEPTED 상태 아님)',
	})
	@ApiResponse({
		status: 404,
		description: '친구 관계를 찾을 수 없음',
	})
	@UseGuards(AuthGuard)
	@Delete(':friendshipId')
	deleteFriend(@Req() request: Request, @Param('friendshipId') friendshipId: string) {
		return this.friendsService.deleteFriend({ friendshipId, request });
	}

	@ApiOperation({
		summary: 'Block user',
		description: '사용자를 차단합니다. 기존 친구 관계가 있으면 BLOCKED로 변경됩니다.',
	})
	@ApiParam({
		name: 'userId',
		type: 'string',
		description: '차단할 사용자 ID',
	})
	@ApiResponse({
		status: 200,
		description: '차단 성공',
		schema: {
			example: {
				success: true,
				message: '사용자를 차단했습니다',
			},
		},
	})
	@ApiResponse({
		status: 400,
		description: '본인을 차단할 수 없음',
	})
	@ApiResponse({
		status: 404,
		description: '사용자를 찾을 수 없음',
	})
	@UseGuards(AuthGuard)
	@Post('block/:userId')
	blockUser(@Req() request: Request, @Param('userId') userId: string) {
		return this.friendsService.blockUser({ userId, request });
	}

	@ApiOperation({
		summary: 'Unblock user',
		description: '차단을 해제합니다.',
	})
	@ApiParam({
		name: 'userId',
		type: 'string',
		description: '차단 해제할 사용자 ID',
	})
	@ApiResponse({
		status: 200,
		description: '차단 해제 성공',
		schema: {
			example: {
				success: true,
				message: '차단을 해제했습니다',
			},
		},
	})
	@ApiResponse({
		status: 404,
		description: '차단한 사용자가 아님',
	})
	@UseGuards(AuthGuard)
	@Delete('block/:userId')
	unblockUser(@Req() request: Request, @Param('userId') userId: string) {
		return this.friendsService.unblockUser({ userId, request });
	}

	@ApiOperation({
		summary: 'Search friends',
		description: '친구 목록 내에서 닉네임으로 검색합니다.',
	})
	@ApiQuery({
		name: 'query',
		type: 'string',
		description: '검색 쿼리 (닉네임)',
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
	@ApiResponse({
		status: 200,
		description: '친구 검색 성공',
		type: FriendListResponse,
	})
	@UseGuards(AuthGuard)
	@Get('search')
	searchFriends(@Req() request: Request, @Query() searchFriendsDTO: SearchFriendsDTO) {
		return this.friendsService.searchFriends({ searchFriendsDTO, request });
	}

	@ApiOperation({
		summary: 'Get friend statistics',
		description: '친구 통계를 조회합니다 (전체 친구 수, 받은/보낸 신청 수).',
	})
	@ApiResponse({
		status: 200,
		description: '친구 통계 조회 성공',
		type: FriendStatsResponse,
	})
	@UseGuards(AuthGuard)
	@Get('stats')
	getFriendStats(@Req() request: Request) {
		return this.friendsService.getFriendStats({ request });
	}

	@ApiOperation({
		summary: 'Get friend status with specific user',
		description: '특정 사용자와의 친구 관계 상태를 조회합니다.',
	})
	@ApiParam({
		name: 'userId',
		type: 'string',
		description: '확인할 사용자 ID',
	})
	@ApiResponse({
		status: 200,
		description: '친구 관계 상태 조회 성공',
		type: FriendStatusResponse,
	})
	@UseGuards(AuthGuard)
	@Get('status/:userId')
	getFriendStatus(@Req() request: Request, @Param('userId') userId: string) {
		return this.friendsService.getFriendStatus({ userId, request });
	}
}
