import { Module } from '@nestjs/common';

import { SpaceController } from '@/api/space/space.controller';
import { SpaceService } from '@/api/space/space.service';

@Module({
	controllers: [SpaceController],
	providers: [SpaceService],
})
export class SpaceModule {}
