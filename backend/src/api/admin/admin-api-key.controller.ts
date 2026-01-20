import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Patch,
	Post,
	UseGuards,
} from '@nestjs/common';
import {
	ApiBearerAuth,
	ApiOperation,
	ApiParam,
	ApiTags,
} from '@nestjs/swagger';

import { CreateApiKeyDTO } from '@/api/admin/admin-api-key.dto';
import { AuthGuard } from '@/api/auth/auth.guard';
import { UserPermissionsGuard } from '@/api/auth/user-permission.guard';
import { SetAccessRoles } from '@/api/auth/role.decorator';
import { ApiKeyService } from '@/api/auth/api-key.service';

@ApiTags('Admin API Keys')
@ApiBearerAuth()
@Controller('admin/api-keys')
@UseGuards(AuthGuard, UserPermissionsGuard)
@SetAccessRoles('SPACE_ADMIN')
export class AdminApiKeyController {
	constructor(private apiKeyService: ApiKeyService) {}

	@ApiOperation({
		summary: 'API 키 생성',
		description:
			'새 API 키를 생성합니다. 원본 키는 생성 시 한 번만 반환됩니다. userId에 연결된 사용자의 권한으로 동작합니다.',
	})
	@Post()
	createApiKey(@Body() dto: CreateApiKeyDTO) {
		const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : undefined;
		return this.apiKeyService.createApiKey(dto.name, dto.userId, expiresAt);
	}

	@ApiOperation({
		summary: 'API 키 목록',
		description: '등록된 모든 API 키 목록을 조회합니다.',
	})
	@Get()
	listApiKeys() {
		return this.apiKeyService.listApiKeys();
	}

	@ApiOperation({
		summary: 'API 키 상세',
		description: 'API 키 상세 정보를 조회합니다.',
	})
	@ApiParam({ name: 'id', description: 'API 키 ID' })
	@Get(':id')
	getApiKey(@Param('id') id: string) {
		return this.apiKeyService.getApiKey(id);
	}

	@ApiOperation({
		summary: 'API 키 비활성화',
		description: 'API 키를 비활성화합니다.',
	})
	@ApiParam({ name: 'id', description: 'API 키 ID' })
	@Patch(':id/deactivate')
	deactivateApiKey(@Param('id') id: string) {
		return this.apiKeyService.deactivateApiKey(id);
	}

	@ApiOperation({
		summary: 'API 키 활성화',
		description: 'API 키를 활성화합니다.',
	})
	@ApiParam({ name: 'id', description: 'API 키 ID' })
	@Patch(':id/activate')
	activateApiKey(@Param('id') id: string) {
		return this.apiKeyService.activateApiKey(id);
	}

	@ApiOperation({
		summary: 'API 키 삭제',
		description: 'API 키를 완전히 삭제합니다.',
	})
	@ApiParam({ name: 'id', description: 'API 키 ID' })
	@Delete(':id')
	deleteApiKey(@Param('id') id: string) {
		return this.apiKeyService.deleteApiKey(id);
	}
}
