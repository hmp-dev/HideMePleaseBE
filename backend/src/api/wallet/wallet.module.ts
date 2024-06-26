import { Module } from '@nestjs/common';

import { AuthModule } from '@/api/auth/auth.module';
import { WalletController } from '@/api/wallet/wallet.controller';
import { WalletService } from '@/api/wallet/wallet.service';

@Module({
	imports: [AuthModule],
	controllers: [WalletController],
	providers: [WalletService],
	exports: [WalletService],
})
export class WalletModule {}
