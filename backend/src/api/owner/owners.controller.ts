import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import {
	ApiBearerAuth,
	ApiOperation,
	ApiResponse,
	ApiSecurity,
	ApiTags,
} from '@nestjs/swagger';

import { AuthOrApiKeyGuard } from '@/api/auth/auth-or-api-key.guard';
import { RegisterOwnerDTO } from '@/api/owner/owner.dto';
import { OwnerService } from '@/api/owner/owner.service';

@ApiTags('Owner')
@ApiBearerAuth()
@ApiSecurity('X-API-Key')
@Controller('owners')
export class OwnersController {
	constructor(private ownerService: OwnerService) {}

	@ApiOperation({
		summary: '점주 등록',
		description: '점주 프로필을 등록하고 isOwner를 활성화합니다.',
	})
	@ApiResponse({
		status: 200,
		description: '점주 등록 성공',
	})
	@UseGuards(AuthOrApiKeyGuard)
	@Post('register')
	async registerOwner(@Body() dto: RegisterOwnerDTO, @Req() request: Request) {
		return this.ownerService.registerOwner({ registerOwnerDTO: dto, request });
	}
}
