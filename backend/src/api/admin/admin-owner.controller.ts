import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Post,
	Query,
	UseGuards,
} from '@nestjs/common';
import {
	ApiBearerAuth,
	ApiOperation,
	ApiParam,
	ApiTags,
} from '@nestjs/swagger';

import { AdminOwnerService } from '@/api/admin/admin-owner.service';
import {
	GetPendingSpacesQueryDTO,
	ApproveSpaceDTO,
	RejectSpaceDTO,
	SetOwnerDTO,
	CreateAdminSpaceDTO,
} from '@/api/admin/admin-owner.dto';
import { AuthGuard } from '@/api/auth/auth.guard';
import { UserPermissionsGuard } from '@/api/auth/user-permission.guard';
import { SetAccessRoles } from '@/api/auth/role.decorator';

@ApiTags('Admin Owner')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(AuthGuard, UserPermissionsGuard)
export class AdminOwnerController {
	constructor(private adminOwnerService: AdminOwnerService) {}

	@ApiOperation({
		summary: '매장 등록',
		description: '관리자가 직접 매장을 등록합니다 (관리자 권한 필요)',
	})
	@SetAccessRoles('SPACE_ADMIN')
	@Post('spaces')
	createSpace(@Body() dto: CreateAdminSpaceDTO) {
		return this.adminOwnerService.createSpace(dto);
	}

	@ApiOperation({
		summary: '승인 대기 매장 목록',
		description: '승인 대기 중인 매장 목록을 조회합니다 (관리자 권한 필요)',
	})
	@SetAccessRoles('SPACE_ADMIN')
	@Get('spaces/pending')
	getPendingSpaces(@Query() query: GetPendingSpacesQueryDTO) {
		return this.adminOwnerService.getPendingSpaces(query);
	}

	@ApiOperation({
		summary: '매장 승인',
		description: '매장 노출을 승인합니다 (관리자 권한 필요)',
	})
	@ApiParam({ name: 'spaceId', description: '매장 ID' })
	@SetAccessRoles('SPACE_ADMIN')
	@Post('spaces/:spaceId/approve')
	approveSpace(
		@Param('spaceId') spaceId: string,
		@Body() dto: ApproveSpaceDTO,
	) {
		return this.adminOwnerService.approveSpace(spaceId, dto);
	}

	@ApiOperation({
		summary: '매장 거부',
		description: '매장 노출을 거부합니다 (관리자 권한 필요)',
	})
	@ApiParam({ name: 'spaceId', description: '매장 ID' })
	@SetAccessRoles('SPACE_ADMIN')
	@Post('spaces/:spaceId/reject')
	rejectSpace(@Param('spaceId') spaceId: string, @Body() dto: RejectSpaceDTO) {
		return this.adminOwnerService.rejectSpace(spaceId, dto);
	}

	@ApiOperation({
		summary: '점주 목록',
		description: '점주 목록을 조회합니다 (관리자 권한 필요)',
	})
	@SetAccessRoles('SPACE_ADMIN')
	@Get('owners')
	getOwners() {
		return this.adminOwnerService.getOwners();
	}

	@ApiOperation({
		summary: '점주 권한 부여',
		description: '사용자에게 점주 권한을 부여합니다 (관리자 권한 필요)',
	})
	@ApiParam({ name: 'userId', description: '사용자 ID' })
	@SetAccessRoles('SPACE_ADMIN')
	@Post('users/:userId/set-owner')
	setUserAsOwner(@Param('userId') userId: string, @Body() dto: SetOwnerDTO) {
		return this.adminOwnerService.setUserAsOwner(userId, dto);
	}

	@ApiOperation({
		summary: '점주 권한 해제',
		description: '사용자의 점주 권한을 해제합니다 (관리자 권한 필요)',
	})
	@ApiParam({ name: 'userId', description: '사용자 ID' })
	@SetAccessRoles('SPACE_ADMIN')
	@Delete('users/:userId/revoke-owner')
	revokeOwner(@Param('userId') userId: string) {
		return this.adminOwnerService.revokeOwner(userId);
	}
}
