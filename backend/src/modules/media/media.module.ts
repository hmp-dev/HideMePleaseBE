import { Global, Module } from '@nestjs/common';

import { AwsModule } from '@/modules/aws/aws.module';
import { MediaService } from '@/modules/media/media.service';

@Global()
@Module({
	imports: [AwsModule],
	providers: [MediaService],
	exports: [MediaService],
})
export class MediaModule {}
