import { Module } from '@nestjs/common';

import { AuthModule } from '@/api/auth/auth.module';
import { UsersModule } from '@/api/users/users.module';
import { WalletController } from '@/api/wallet/wallet.controller';
import { WalletService } from '@/api/wallet/wallet.service';

@Module({
	imports: [AuthModule, UsersModule],
	controllers: [WalletController],
	providers: [WalletService],
	exports: [WalletService],
})
export class WalletModule {}
