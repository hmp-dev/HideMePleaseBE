import { AdminModule } from '@/api/admin/admin.module';
import { AuthModule } from '@/api/auth/auth.module';
import { CmsModule } from '@/api/cms/cms.module';
import { EventCategoryModule } from '@/api/event-category/event-category.module';
import { NftModule } from '@/api/nft/nft.module';
import { PointModule } from '@/api/points/point.module';
import { PublicModule } from '@/api/public/public.module';
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
	EventCategoryModule,
	PublicModule,
	AdminModule,
	PointModule,
];
