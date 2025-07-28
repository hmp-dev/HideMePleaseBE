import { Module } from '@nestjs/common';
import { EventCategoryService } from './event-category.service';
import { EventCategoryController } from './event-category.controller';
import { PrismaModule } from '@/modules/prisma/prisma.module';

@Module({
	imports: [PrismaModule],
	controllers: [EventCategoryController],
	providers: [EventCategoryService],
	exports: [EventCategoryService],
})
export class EventCategoryModule {}