import { Module } from '@nestjs/common';

import { AuthModule } from '@/api/auth/auth.module';
import { NftModule } from '@/api/nft/nft.module';
import { UserLocationService } from '@/api/users/user-location.service';
import { UserNftService } from '@/api/users/user-nft.service';
import { UsersController } from '@/api/users/users.controller';
import { UsersService } from '@/api/users/users.service';
import { MoralisModule } from '@/modules/moralis/moralis.module';
import { WorldcoinModule } from '@/modules/worldcoin/worldcoin.module';

import { UserController } from './user.controller';

@Module({
	imports: [WorldcoinModule, AuthModule, MoralisModule, NftModule],
	controllers: [UsersController, UserController],
	providers: [UsersService, UserLocationService, UserNftService],
	exports: [UserLocationService],
})
export class UsersModule {}
