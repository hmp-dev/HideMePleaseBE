import { Module } from '@nestjs/common';

import { AdminNftController } from '@/api/admin/admin-nft.controller';
import { AdminNftService } from '@/api/admin/admin-nft.service';
import { AdminAnnouncementController } from '@/api/admin/admin-announcement.controller';
import { AdminAnnouncementService } from '@/api/admin/admin-announcement.service';
import { PublicModule } from '@/api/public/public.module';
import { AuthModule } from '@/api/auth/auth.module';
import { MediaModule } from '@/modules/media/media.module';
import { PushNotificationModule } from '@/api/push-notification/push-notification.module';

@Module({
	imports: [AuthModule, PublicModule, MediaModule, PushNotificationModule],
	controllers: [AdminNftController, AdminAnnouncementController],
	providers: [AdminNftService, AdminAnnouncementService],
	exports: [AdminNftService, AdminAnnouncementService],
})
export class AdminModule {}