import { Module } from '@nestjs/common';

import { AuthModule } from '@/api/auth/auth.module';
import { NftController } from '@/api/nft/nft.controller';
import { NftBenefitsService } from '@/api/nft/nft-benefits.service';
import { NftCommunityService } from '@/api/nft/nft-community.service';
import { NftOwnershipService } from '@/api/nft/nft-ownership.service';
import { NftPointService } from '@/api/nft/nft-point.service';
import { WelcomeNftService } from '@/api/nft/welcome-nft.service';
import { NotificationModule } from '@/api/notification/notification.module';
import { KlaytnModule } from '@/modules/klaytn/klaytn.module';
import { MoralisModule } from '@/modules/moralis/moralis.module';
import { SystemConfigModule } from '@/modules/system-config/system-config.module';
import { UnifiedNftModule } from '@/modules/unified-nft/unified-nft.module';

@Module({
	imports: [
		AuthModule,
		NotificationModule,
		UnifiedNftModule,
		MoralisModule,
		KlaytnModule,
		SystemConfigModule,
	],
	controllers: [NftController],
	providers: [
		WelcomeNftService,
		NftBenefitsService,
		NftOwnershipService,
		NftPointService,
		NftCommunityService,
	],
	exports: [
		WelcomeNftService,
		NftPointService,
		NftBenefitsService,
		NftOwnershipService,
		NftCommunityService,
	],
})
export class NftModule {}
