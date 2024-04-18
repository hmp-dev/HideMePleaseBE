import { Module } from '@nestjs/common';

import { AuthModule } from '@/api/auth/auth.module';
import { NftController } from '@/api/nft/nft.controller';
import { NftService } from '@/api/nft/nft.service';
import { UsersModule } from '@/api/users/users.module';
import { MoralisModule } from '@/modules/moralis/moralis.module';

@Module({
	imports: [AuthModule, UsersModule, MoralisModule],
	controllers: [NftController],
	providers: [NftService],
	exports: [NftService],
})
export class NftModule {}
