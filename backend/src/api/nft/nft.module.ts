import { Module } from '@nestjs/common';

import { AuthModule } from '@/api/auth/auth.module';
import { NftController } from '@/api/nft/nft.controller';
import { NftService } from '@/api/nft/nft.service';
import { NftBenefitsService } from '@/api/nft/nft-benefits.service';
import { UsersModule } from '@/api/users/users.module';
import { MoralisModule } from '@/modules/moralis/moralis.module';

@Module({
	imports: [AuthModule, UsersModule, MoralisModule],
	controllers: [NftController],
	providers: [NftService, NftBenefitsService],
	exports: [NftService],
})
export class NftModule {}
