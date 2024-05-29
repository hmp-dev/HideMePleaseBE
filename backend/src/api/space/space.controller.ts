import {
	Body,
	Controller,
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
	ApiTags,
} from '@nestjs/swagger';
import { SpaceCategory } from '@prisma/client';

import { RedeemBenefitsDTO } from '@/api/space/space.dto';
import { SpaceService } from '@/api/space/space.service';
import { EnumValidationPipe } from '@/exception-filters/enum-validation.pipe';

import { AuthGuard } from '../auth/auth.guard';

@ApiTags('Space')
@ApiBearerAuth()
@Controller('space')
export class SpaceController {
	constructor(private spaceService: SpaceService) {}

	@ApiOperation({
		summary: 'Get spaces list',
	})
	@ApiQuery({
		name: 'page',
		type: 'number',
		required: false,
	})
	@ApiQuery({
		name: 'category',
		enum: SpaceCategory,
		required: false,
	})
	@UseGuards(AuthGuard)
	@Get()
	getSpaceList(
		@Req() request: Request,
		@Query() { page }: { page: number },
		@Query('category', new EnumValidationPipe(SpaceCategory, false))
		category: SpaceCategory,
	) {
		return this.spaceService.getSpaceList({ page, request, category });
	}

	@ApiOperation({
		summary: 'Get space recommendations',
	})
	@UseGuards(AuthGuard)
	@Get('recommendations')
	getSpaceRecommendations() {
		return this.spaceService.getSpaceRecommendations();
	}

	@ApiOperation({
		summary: 'Get new spaces',
	})
	@UseGuards(AuthGuard)
	@Get('new-spaces')
	getNewSpaces() {
		return this.spaceService.getNewSpaces();
	}

	@ApiOperation({
		summary: 'Get space details',
	})
	@UseGuards(AuthGuard)
	@Get('space/:spaceId')
	getSpace(@Req() request: Request, @Param('spaceId') spaceId: string) {
		return this.spaceService.getSpace({ request, spaceId });
	}

	@ApiOperation({
		summary: 'Get space benefits',
	})
	@ApiQuery({
		name: 'next',
		type: 'string',
		description: 'next cursor for pagination',
		required: false,
	})
	@UseGuards(AuthGuard)
	@Get('space/:spaceId/benefits')
	getSpaceBenefits(
		@Req() request: Request,
		@Param('spaceId') spaceId: string,
		@Query() { next }: { next: string },
	) {
		return this.spaceService.getSpaceBenefits({ request, spaceId, next });
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
