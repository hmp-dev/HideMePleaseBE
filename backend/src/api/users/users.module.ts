import { Module } from '@nestjs/common';

import { AuthModule } from '@/api/auth/auth.module';
import { UsersController } from '@/api/users/users.controller';
import { WorldcoinModule } from '@/modules/worldcoin/worldcoin.module';

@Module({
	imports: [WorldcoinModule, AuthModule],
	controllers: [UsersController],
	providers: [],
	exports: [],
})
export class UsersModule {}
