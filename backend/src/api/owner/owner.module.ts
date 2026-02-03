import { Module } from '@nestjs/common';

import { AuthModule } from '@/api/auth/auth.module';
import { OwnerController } from '@/api/owner/owner.controller';
import { OwnersController } from '@/api/owner/owners.controller';
import { OwnerService } from '@/api/owner/owner.service';
import { OwnerGuard, OwnerSpaceGuard } from '@/api/owner/owner.guard';

@Module({
	imports: [AuthModule],
	controllers: [OwnerController, OwnersController],
	providers: [OwnerService, OwnerGuard, OwnerSpaceGuard],
	exports: [OwnerService, OwnerGuard, OwnerSpaceGuard],
})
export class OwnerModule {}
