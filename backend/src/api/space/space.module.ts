import { Module } from '@nestjs/common';

import { AuthModule } from '@/api/auth/auth.module';
import { NftModule } from '@/api/nft/nft.module';
import { SpaceController } from '@/api/space/space.controller';
import { SpaceService } from '@/api/space/space.service';

@Module({
	imports: [AuthModule, NftModule],
	controllers: [SpaceController],
	providers: [SpaceService],
})
export class SpaceModule {}
