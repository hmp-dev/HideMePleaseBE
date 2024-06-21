import { Module } from '@nestjs/common';

import { CmsController } from '@/api/cms/cms.controller';
import { CmsService } from '@/api/cms/cms.service';
import { SystemConfigModule } from '@/modules/system-config/system-config.module';

@Module({
	imports: [SystemConfigModule],
	controllers: [CmsController],
	providers: [CmsService],
})
export class CmsModule {}
