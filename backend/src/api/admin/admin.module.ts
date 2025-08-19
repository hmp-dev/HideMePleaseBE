import { Module } from '@nestjs/common';

import { AdminNftController } from '@/api/admin/admin-nft.controller';
import { AdminNftService } from '@/api/admin/admin-nft.service';
import { PublicModule } from '@/api/public/public.module';
import { AuthModule } from '@/api/auth/auth.module';
import { MediaModule } from '@/modules/media/media.module';

@Module({
	imports: [AuthModule, PublicModule, MediaModule],
	controllers: [AdminNftController],
	providers: [AdminNftService],
	exports: [AdminNftService],
})
export class AdminModule {}