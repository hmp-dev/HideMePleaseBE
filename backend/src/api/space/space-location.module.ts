import { Module } from '@nestjs/common';

import { SpaceLocationService } from '@/api/space/space-location.service';

@Module({
	providers: [SpaceLocationService],
	exports: [SpaceLocationService],
})
export class SpaceLocationModuleModule {}
