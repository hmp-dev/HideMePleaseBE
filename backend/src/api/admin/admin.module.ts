import { Module } from '@nestjs/common';

import { AdminNftController } from '@/api/admin/admin-nft.controller';
import { AdminNftService } from '@/api/admin/admin-nft.service';
import { AdminAnnouncementController } from '@/api/admin/admin-announcement.controller';
import { AdminAnnouncementService } from '@/api/admin/admin-announcement.service';
import { AdminOwnerController } from '@/api/admin/admin-owner.controller';
import { AdminOwnerService } from '@/api/admin/admin-owner.service';
import { PublicModule } from '@/api/public/public.module';
import { AuthModule } from '@/api/auth/auth.module';
import { MediaModule } from '@/modules/media/media.module';
import { PushNotificationModule } from '@/api/push-notification/push-notification.module';

@Module({
	imports: [AuthModule, PublicModule, MediaModule, PushNotificationModule],
	controllers: [AdminNftController, AdminAnnouncementController, AdminOwnerController],
	providers: [AdminNftService, AdminAnnouncementService, AdminOwnerService],
	exports: [AdminNftService, AdminAnnouncementService, AdminOwnerService],
})
export class AdminModule {}