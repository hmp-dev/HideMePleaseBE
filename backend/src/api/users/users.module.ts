import { Module } from '@nestjs/common';

import { AuthModule } from '@/api/auth/auth.module';
import { NftModule } from '@/api/nft/nft.module';
import { UserLocationService } from '@/api/users/user-location.service';
import { UserNftService } from '@/api/users/user-nft.service';
import { UsersController } from '@/api/users/users.controller';
import { UsersService } from '@/api/users/users.service';
import { WalletModule } from '@/api/wallet/wallet.module';
import { CovalentModule } from '@/modules/covalent/covalent.module';
import { MoralisModule } from '@/modules/moralis/moralis.module';
import { SendbirdModule } from '@/modules/sendbird/sendbird.module';
import { SystemConfigModule } from '@/modules/system-config/system-config.module';
import { UnifiedNftModule } from '@/modules/unified-nft/unified-nft.module';
import { WorldcoinModule } from '@/modules/worldcoin/worldcoin.module';

import { UserController } from './user.controller';

@Module({
	imports: [
		WorldcoinModule,
		AuthModule,
		MoralisModule,
		NftModule,
		CovalentModule,
		UnifiedNftModule,
		SystemConfigModule,
		WalletModule,
		SendbirdModule,
	],
	controllers: [UsersController, UserController],
	providers: [UsersService, UserLocationService, UserNftService],
	exports: [UserLocationService],
})
export class UsersModule {}
