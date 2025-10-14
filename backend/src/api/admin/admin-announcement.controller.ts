import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Post,
	Put,
	UseGuards,
} from '@nestjs/common';
import {
	ApiBearerAuth,
	ApiBody,
	ApiOperation,
	ApiParam,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';

import { AdminAnnouncementService } from '@/api/admin/admin-announcement.service';
import {
	CreateAnnouncementDTO,
	UpdateAnnouncementDTO,
	CreateAnnouncementResponse,
} from '@/api/admin/admin-announcement.dto';
import { AuthGuard } from '@/api/auth/auth.guard';
import { UserPermissionsGuard } from '@/api/auth/user-permission.guard';
import { SetAccessRoles } from '@/api/auth/role.decorator';

@ApiTags('Admin Announcements')
@ApiBearerAuth()
@Controller('admin/announcements')
@UseGuards(AuthGuard, UserPermissionsGuard)
export class AdminAnnouncementController {
	constructor(private adminAnnouncementService: AdminAnnouncementService) {}

	@ApiOperation({
		summary: 'Create announcement',
		description: '공지사항을 생성하고 전체 유저에게 알림을 발송합니다 (관리자 권한 필요)',
	})
	@ApiBody({ type: CreateAnnouncementDTO })
	@ApiResponse({
		status: 201,
		description: '공지사항 생성 성공',
		type: CreateAnnouncementResponse,
	})
	@ApiResponse({
		status: 403,
		description: '권한 없음',
	})
	@SetAccessRoles('SPACE_ADMIN')
	@Post()
	createAnnouncement(@Body() dto: CreateAnnouncementDTO) {
		return this.adminAnnouncementService.createAnnouncement(dto);
	}

	@ApiOperation({
		summary: 'Update announcement',
		description: '공지사항을 수정합니다 (관리자 권한 필요)',
	})
	@ApiParam({
		name: 'announcementId',
		type: 'string',
		description: '공지사항 ID',
	})
	@ApiBody({ type: UpdateAnnouncementDTO })
	@ApiResponse({
		status: 200,
		description: '공지사항 수정 성공',
		schema: {
			example: {
				success: true,
				message: '공지사항이 수정되었습니다',
				announcement: {
					id: 'uuid',
					title: '수정된 제목',
					description: '수정된 내용',
					createdAt: '2024-01-01T00:00:00.000Z',
				},
			},
		},
	})
	@ApiResponse({
		status: 404,
		description: '공지사항을 찾을 수 없음',
	})
	@SetAccessRoles('SPACE_ADMIN')
	@Put(':announcementId')
	updateAnnouncement(
		@Param('announcementId') announcementId: string,
		@Body() dto: UpdateAnnouncementDTO,
	) {
		return this.adminAnnouncementService.updateAnnouncement(announcementId, dto);
	}

	@ApiOperation({
		summary: 'Delete announcement',
		description: '공지사항을 삭제합니다 (관리자 권한 필요)',
	})
	@ApiParam({
		name: 'announcementId',
		type: 'string',
		description: '공지사항 ID',
	})
	@ApiResponse({
		status: 204,
		description: '공지사항 삭제 성공',
	})
	@ApiResponse({
		status: 404,
		description: '공지사항을 찾을 수 없음',
	})
	@SetAccessRoles('SPACE_ADMIN')
	@Delete(':announcementId')
	@HttpCode(HttpStatus.NO_CONTENT)
	async deleteAnnouncement(@Param('announcementId') announcementId: string) {
		await this.adminAnnouncementService.deleteAnnouncement(announcementId);
	}

	@ApiOperation({
		summary: 'Get announcement',
		description: '공지사항 상세 조회 (관리자 권한 필요)',
	})
	@ApiParam({
		name: 'announcementId',
		type: 'string',
		description: '공지사항 ID',
	})
	@ApiResponse({
		status: 200,
		description: '공지사항 조회 성공',
		schema: {
			example: {
				id: 'uuid',
				title: '공지사항 제목',
				description: '공지사항 내용',
				createdAt: '2024-01-01T00:00:00.000Z',
			},
		},
	})
	@ApiResponse({
		status: 404,
		description: '공지사항을 찾을 수 없음',
	})
	@SetAccessRoles('SPACE_ADMIN')
	@Get(':announcementId')
	getAnnouncement(@Param('announcementId') announcementId: string) {
		return this.adminAnnouncementService.getAnnouncement(announcementId);
	}
}
