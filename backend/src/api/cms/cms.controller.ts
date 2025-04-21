import {
	Controller,
	Get,
	Param,
	Put,
	Query,
	Req,
	UploadedFile,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
	ApiBearerAuth,
	ApiBody,
	ApiConsumes,
	ApiOperation,
	ApiParam,
	ApiQuery,
	ApiTags,
} from '@nestjs/swagger';

import { CmsService } from '@/api/cms/cms.service';

import { AuthGuard } from '../auth/auth.guard';

@ApiTags('Cms')
@ApiBearerAuth()
@Controller('cms')
export class CmsController {
	constructor(private cmsService: CmsService) {}

	@ApiOperation({ summary: 'Upload a file' })
	@ApiConsumes('multipart/form-data')
	@ApiBody({
		schema: {
			type: 'object',
			properties: {
				file: {
					type: 'string',
					format: 'binary',
				},
			},
		},
	})
	@UseInterceptors(FileInterceptor('file'))
	@UseGuards(AuthGuard)
	@Put('image')
	async uploadImage(
		@Req() request: Request,
		@UploadedFile() file: Express.Multer.File,
	) {
		return this.cmsService.uploadImage({ request, file });
	}

	@ApiOperation({
		summary: 'Gets announcements',
	})
	@ApiQuery({
		name: 'page',
		type: 'number',
		required: false,
	})
	@UseGuards(AuthGuard)
	@Get('/announcements')
	getAnnouncements(@Query() { page }: { page: number }) {
		return this.cmsService.getAnnouncements({ page });
	}

	@ApiOperation({
		summary: 'Get Settings banner',
	})
	@UseGuards(AuthGuard)
	@Get('/settings/banner')
	getSettingsBanner() {
		return this.cmsService.getSettingsBanner();
	}

	@ApiOperation({
		summary: 'Get Modal banner',
	})
	@UseGuards(AuthGuard)
	@Get('/modal/banner')
	getModalBanner() {
		return this.cmsService.getModalBanner();
	}

	@ApiOperation({
		summary: 'Get Top Ranked users',
	})
	@ApiQuery({
		name: 'startDate',
		type: 'string',
		required: false,
	})
	@Get('/top-users')
	getTopUsers(@Query() { startDate }: { startDate?: string }) {
		return this.cmsService.getTopUsers({ startDate });
	}

	@ApiOperation({
		summary: 'Get Top Ranked NFTs',
	})
	@ApiQuery({
		name: 'startDate',
		type: 'string',
		required: false,
	})
	@Get('/top-nfts')
	getTopNfts(@Query() { startDate }: { startDate?: string }) {
		return this.cmsService.getTopNfts({ startDate });
	}

	@ApiOperation({
		summary: 'Get Top Ranked Spaces',
	})
	@ApiQuery({
		name: 'startDate',
		type: 'string',
		required: false,
	})
	@Get('/top-spaces')
	getTopSpaces(@Query() { startDate }: { startDate?: string }) {
		return this.cmsService.getTopSpaces({ startDate });
	}

	@ApiOperation({
		summary: 'Get Nft usage frequency',
	})
	@ApiParam({
		name: 'tokenAddress',
		type: 'string',
		required: true,
	})
	@Get('/nft-usage-frequency/:tokenAddress')
	getNftUsageFrequency(@Param('tokenAddress') tokenAddress: string) {
		return this.cmsService.getNftUsageFrequency({ tokenAddress });
	}

	@ApiOperation({
		summary: 'Get Nft usage frequency',
	})
	@ApiParam({
		name: 'userId',
		type: 'string',
		required: true,
	})
	@ApiQuery({
		name: 'startDate',
		type: 'string',
		required: false,
	})
	@Get('/user/:userId/benefit-usage')
	getBenefitUsageForUser(
		@Param('userId') userId: string,
		@Query() { startDate }: { startDate?: string },
	) {
		return this.cmsService.getBenefitUsageForUser({ userId, startDate });
	}

	@ApiOperation({
		summary: 'Get Nft usage frequency',
	})
	@ApiParam({
		name: 'userId',
		type: 'string',
		required: true,
	})
	@Get('/user/:userId/benefit-usage-aggregate')
	getAggregateBenefitUsageForUser(@Param('userId') userId: string) {
		return this.cmsService.getAggregateBenefitUsageForUser({ userId });
	}

	@ApiOperation({
		summary: 'Get system nft list',
	})
	@Get('/system-nfts')
	getSystemNfts() {
		return this.cmsService.getSystemNfts();
	}

	@ApiOperation({
		summary: 'Get nft benefit usage',
	})
	@ApiParam({
		name: 'tokenAddress',
		type: 'string',
		required: true,
	})
	@ApiQuery({
		name: 'startDate',
		type: 'string',
		required: false,
	})
	@Get('/nft/:tokenAddress/benefit-usage')
	getNftBenefitUsage(
		@Param('tokenAddress') tokenAddress: string,
		@Query() { startDate }: { startDate?: string },
	) {
		return this.cmsService.getNftBenefitUsage({ tokenAddress, startDate });
	}
}
