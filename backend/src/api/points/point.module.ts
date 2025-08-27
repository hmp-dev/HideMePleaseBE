import { Module } from '@nestjs/common';

import { NotificationModule } from '@/api/notification/notification.module';
import { PointController, AdminPointController } from '@/api/points/point.controller';
import { PointService } from '@/api/points/point.service';
import { PrismaModule } from '@/modules/prisma/prisma.module';

@Module({
	imports: [PrismaModule, NotificationModule],
	controllers: [PointController, AdminPointController],
	providers: [PointService],
	exports: [PointService],
})
export class PointModule {}