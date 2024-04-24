import { Module } from '@nestjs/common';

import { CmsController } from '@/api/cms/cms.controller';
import { CmsService } from '@/api/cms/cms.service';

@Module({
	controllers: [CmsController],
	providers: [CmsService],
})
export class CmsModule {}
