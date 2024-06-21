import { Module } from '@nestjs/common';

import { AuthModule } from '@/api/auth/auth.module';
import { NftModule } from '@/api/nft/nft.module';
import { SpaceController } from '@/api/space/space.controller';
import { SpaceService } from '@/api/space/space.service';
import { UsersModule } from '@/api/users/users.module';
import { SystemConfigModule } from '@/modules/system-config/system-config.module';

@Module({
	imports: [AuthModule, NftModule, UsersModule, SystemConfigModule],
	controllers: [SpaceController],
	providers: [SpaceService],
})
export class SpaceModule {}
