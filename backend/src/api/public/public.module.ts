import { Module } from '@nestjs/common';

import { PublicNftController } from '@/api/public/public-nft.controller';
import { PublicNftService } from '@/api/public/public-nft.service';
import { MediaModule } from '@/modules/media/media.module';
import { ProfileImageModule } from '@/modules/profile-image/profile-image.module';

@Module({
	imports: [MediaModule, ProfileImageModule],
	controllers: [PublicNftController],
	providers: [PublicNftService],
	exports: [PublicNftService],
})
export class PublicModule {}