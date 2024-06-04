import { Module } from '@nestjs/common';

import { AuthModule } from '@/api/auth/auth.module';
import { NftController } from '@/api/nft/nft.controller';
import { NftService } from '@/api/nft/nft.service';
import { NftBenefitsService } from '@/api/nft/nft-benefits.service';
import { NftOwnershipService } from '@/api/nft/nft-ownership.service';
import { NftPointService } from '@/api/nft/nft-point.service';
import { NotificationModule } from '@/api/notification/notification.module';
import { UsersModule } from '@/api/users/users.module';
import { MoralisModule } from '@/modules/moralis/moralis.module';

@Module({
	imports: [AuthModule, UsersModule, MoralisModule, NotificationModule],
	controllers: [NftController],
	providers: [
		NftService,
		NftBenefitsService,
		NftOwnershipService,
		NftPointService,
	],
	exports: [NftService, NftPointService, NftBenefitsService],
})
export class NftModule {}
