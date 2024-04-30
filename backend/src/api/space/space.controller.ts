import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	ParseFloatPipe,
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
		summary: 'Gets nearest spaces',
	})
	@ApiQuery({
		name: 'latitude',
		type: 'number',
	})
	@ApiQuery({
		name: 'longitude',
		type: 'number',
	})
	@UseGuards(AuthGuard)
	@Get('nearby')
	getWelcomeNft(
		@Req() request: Request,
		@Query('latitude', ParseFloatPipe) latitude: number,
		@Query('longitude', ParseFloatPipe) longitude: number,
	) {
		return this.spaceService.getNearestSpaces({
			request,
			latitude,
			longitude,
		});
	}

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
