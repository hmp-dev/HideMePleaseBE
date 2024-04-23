import { Module } from '@nestjs/common';

import { AuthModule } from '@/api/auth/auth.module';
import { UsersController } from '@/api/users/users.controller';
import { UsersService } from '@/api/users/users.service';
import { WorldcoinModule } from '@/modules/worldcoin/worldcoin.module';

@Module({
	imports: [WorldcoinModule, AuthModule],
	controllers: [UsersController],
	providers: [UsersService],
	exports: [],
})
export class UsersModule {}
