import {
	Controller,
	Get,
	ParseFloatPipe,
	Query,
	Req,
	UseGuards,
} from '@nestjs/common';
import {
	ApiBearerAuth,
	ApiOperation,
	ApiQuery,
	ApiTags,
} from '@nestjs/swagger';

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
}
