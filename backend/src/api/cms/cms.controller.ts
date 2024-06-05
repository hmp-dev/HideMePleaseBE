import {
	Controller,
	Get,
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
}
