import { Module } from '@nestjs/common';

import { AuthModule } from '@/api/auth/auth.module';
import { NftController } from '@/api/nft/nft.controller';
import { NftService } from '@/api/nft/nft.service';

@Module({
	imports: [AuthModule],
	controllers: [NftController],
	providers: [NftService],
	exports: [NftService],
})
export class NftModule {}
