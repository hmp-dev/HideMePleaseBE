import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
	ApiBearerAuth,
	ApiOperation,
	ApiQuery,
	ApiSecurity,
	ApiTags,
} from '@nestjs/swagger';

import { BenefitUsageType } from '@/api/nft/nft.types';
import { NftBenefitsService } from '@/api/nft/nft-benefits.service';
import { userIdToRequest } from '@/api/users/user.utils';
import { UserNftService } from '@/api/users/user-nft.service';
import { UsersService } from '@/api/users/users.service';
import { SortOrder } from '@/types';

import { AuthOrApiKeyGuard } from '../auth/auth-or-api-key.guard';

@ApiTags('Users')
@ApiBearerAuth()
@ApiSecurity('X-API-Key')
@Controller('users/:userId')
export class UsersController {
	constructor(
		private usersService: UsersService,
		private userNftService: UserNftService,
		private nftBenefitsService: NftBenefitsService,
	) {}

	@ApiOperation({
		summary: 'Gets user profile by userId',
		description: '6.9 Member Details_NFT',
	})
	@UseGuards(AuthOrApiKeyGuard)
	@Get('/profile')
	async getUserProfileById(@Param('userId') userId: string) {
		const request = userIdToRequest(userId);

		return this.usersService.getUserProfile({ request });
	}

	@ApiOperation({
		summary: 'Gets selected NFT collections by userId',
		description: '6.9 Member Details_NFT',
	})
	@UseGuards(AuthOrApiKeyGuard)
	@Get('/collections/selected')
	getSelectedNftCollections(@Param('userId') userId: string) {
		const request = userIdToRequest(userId);

		return this.userNftService.getSelectedNfts({
			request,
		});
	}

	@ApiOperation({
		summary: 'Gets selected NFT collections with points by userId',
	})
	@UseGuards(AuthOrApiKeyGuard)
	@Get('/collections/selected/points')
	getSelectedNftCollectionsWithPoints(@Param('userId') userId: string) {
		const request = userIdToRequest(userId);

		return this.userNftService.getSelectedNftsWithPoints({
			request,
		});
	}

	@ApiOperation({
		summary: 'Get nft collection usage history by userId',
	})
	@ApiQuery({
		name: 'type',
		enum: BenefitUsageType,
		required: false,
	})
	@ApiQuery({
		name: 'page',
		type: 'number',
		required: false,
	})
	@ApiQuery({
		name: 'order',
		enum: SortOrder,
		required: false,
	})
	@UseGuards(AuthOrApiKeyGuard)
	@Get('/collection/:tokenAddress/usage-history')
	getNftCollectionUsageHistory(
		@Param('userId') userId: string,
		@Param('tokenAddress') tokenAddress: string,
		@Query() { type }: { type?: BenefitUsageType },
		@Query() { page }: { page: number },
		@Query() { order }: { order?: SortOrder },
	) {
		const request = userIdToRequest(userId);

		return this.nftBenefitsService.getNftCollectionUsageHistory({
			request,
			tokenAddress,
			type,
			page,
			order,
		});
	}
}
