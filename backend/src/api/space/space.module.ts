import { Module, forwardRef } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { AuthModule } from '@/api/auth/auth.module';
import { NftModule } from '@/api/nft/nft.module';
import { SpaceController } from '@/api/space/space.controller';
import { SpaceService } from '@/api/space/space.service';
import { SpaceCheckInService } from '@/api/space/space-checkin.service';
import { SpaceLocationModuleModule } from '@/api/space/space-location.module';
import { UsersModule } from '@/api/users/users.module';
import { SystemConfigModule } from '@/modules/system-config/system-config.module';

import { NotificationModule } from '../notification/notification.module';

@Module({
	imports: [
		AuthModule,
		NftModule,
		UsersModule,
		SystemConfigModule,
		SpaceLocationModuleModule,
		NotificationModule,
		ScheduleModule.forRoot(),
	],
	controllers: [SpaceController],
	providers: [SpaceService, SpaceCheckInService],
	exports: [SpaceCheckInService],
})
export class SpaceModule {}
