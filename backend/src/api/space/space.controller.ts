import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Post,
	Req,
	UseGuards,
} from '@nestjs/common';
import {
	ApiBearerAuth,
	ApiOperation,
	ApiParam,
	ApiTags,
} from '@nestjs/swagger';
import { SpaceUserRole } from '@prisma/client';

import { SetAccessRoles } from '@/api/auth/role.decorator';
import { UserPermissionsGuard } from '@/api/auth/user-permission.guard';
import { RedeemBenefitsDTO } from '@/api/space/space.dto';
import { SpaceService } from '@/api/space/space.service';

import { AuthGuard } from '../auth/auth.guard';

@ApiTags('Space')
@ApiBearerAuth()
@Controller('space')
export class SpaceController {
	constructor(private spaceService: SpaceService) {}

	@ApiOperation({
		summary: 'Generate space benefit token',
	})
	@ApiParam({
		name: 'spaceId',
		type: 'string',
	})
	@UseGuards(UserPermissionsGuard)
	@UseGuards(AuthGuard)
	@SetAccessRoles(SpaceUserRole.SPACE_ADMIN)
	@Get('benefits/token/:spaceId')
	generateBenefitsToken(
		@Req() request: Request,
		@Param('spaceId') spaceId: string,
	) {
		return this.spaceService.generateBenefitsToken({ spaceId, request });
	}

	@ApiOperation({
		summary: 'Generate space benefit token using backdoor',
	})
	@ApiParam({
		name: 'spaceId',
		type: 'string',
	})
	@UseGuards(AuthGuard)
	@Get('benefits/token-backdoor/:spaceId')
	generateBenefitsTokenBackdoor(
		@Req() request: Request,
		@Param('spaceId') spaceId: string,
	) {
		return this.spaceService.generateBenefitsTokenBackdoor({
			spaceId,
			request,
		});
	}

	@ApiOperation({
		summary: 'Redeem space benefit',
	})
	@ApiParam({
		name: 'benefitId',
		type: 'string',
	})
	@HttpCode(HttpStatus.NO_CONTENT)
	@UseGuards(AuthGuard)
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
}
