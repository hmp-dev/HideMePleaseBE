import { AuthModule } from '@/api/auth/auth.module';
import { NftModule } from '@/api/nft/nft.module';
import { UsersModule } from '@/api/users/users.module';
import { WalletModule } from '@/api/wallet/wallet.module';

export const API_MODULES = [AuthModule, UsersModule, NftModule, WalletModule];
