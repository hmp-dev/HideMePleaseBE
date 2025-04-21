import { AuthModule } from '@/api/auth/auth.module';
import { CmsModule } from '@/api/cms/cms.module';
import { NftModule } from '@/api/nft/nft.module';
import { SpaceModule } from '@/api/space/space.module';
import { UsersModule } from '@/api/users/users.module';
import { WalletModule } from '@/api/wallet/wallet.module';

export const API_MODULES = [
	AuthModule,
	UsersModule,
	NftModule,
	WalletModule,
	CmsModule,
	SpaceModule,
];
