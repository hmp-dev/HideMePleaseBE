import { Module } from '@nestjs/common';

import { AuthModule } from '@/api/auth/auth.module';
import { SpaceController } from '@/api/space/space.controller';
import { SpaceService } from '@/api/space/space.service';

@Module({
	imports: [AuthModule],
	controllers: [SpaceController],
	providers: [SpaceService],
})
export class SpaceModule {}
