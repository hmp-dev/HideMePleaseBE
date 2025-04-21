import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Patch,
	Post,
	Query,
	Req,
	UseGuards,
} from '@nestjs/common';
import {
	ApiBearerAuth,
	ApiOperation,
	ApiQuery,
	ApiTags,
} from '@nestjs/swagger';
import { SupportedChains } from '@prisma/client';

import { AuthGuard } from '@/api/auth/auth.guard';
import { EnsureUserService } from '@/api/auth/ensure-user.service';
import { BenefitUsageType } from '@/api/nft/nft.types';
import { NftBenefitsService } from '@/api/nft/nft-benefits.service';
import { NftCommunityService } from '@/api/nft/nft-community.service';
import { UserLocationService } from '@/api/users/user-location.service';
import { UserNftService } from '@/api/users/user-nft.service';
import {
	SelectedNftOrderDTO,
	SelectNftDTO,
	UpdateLastKnownLocationDTO,
	UpdateUserProfileDTO,
} from '@/api/users/users.dto';
import { UsersService } from '@/api/users/users.service';
import { EnumValidationPipe } from '@/exception-filters/enum-validation.pipe';
import { AuthContext, SortOrder } from '@/types';

@ApiTags('User')
@ApiBearerAuth()
@Controller('user')
export class UserController {
	constructor(
		private ensureUserService: EnsureUserService,
		private usersService: UsersService,
		private userLocationService: UserLocationService,
		private userNftService: UserNftService,
		private nftCommunityService: NftCommunityService,
		private nftBenefitsService: NftBenefitsService,
	) {}

	@ApiOperation({
		summary: 'Gets base user',
	})
	@UseGuards(AuthGuard)
	@Get('/')
	async getUser(@Req() request: Request) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;
		return this.ensureUserService.getOrCreateUser({ authContext });
	}

	@ApiOperation({
		summary: 'Delete user',
	})
	@UseGuards(AuthGuard)
	@Delete('/')
	async deleteUser(@Req() request: Request) {
		return this.usersService.deleteUser({ request });
	}

	@ApiOperation({
		summary: 'Gets user profile',
	})
	@UseGuards(AuthGuard)
	@Get('/profile')
	async getUserProfile(@Req() request: Request) {
		return this.usersService.getUserProfile({ request });
	}

	@ApiOperation({ summary: 'Check if user exists by nickName' })
	@Get('/nickName/exists')
	async doesUserExistByNickName(
		@Query('nickName') nickName: string,
	): Promise<boolean> {
		return this.usersService.doesUserExistByNickName(nickName);
	}

	@ApiOperation({
		summary: 'Update user profile',
	})
	@UseGuards(AuthGuard)
	@Patch('/profile')
	async updateUserProfile(
		@Req() request: Request,
		@Body() updateUserProfileDTO: UpdateUserProfileDTO,
	) {
		return this.usersService.updateUserProfile({
			request,
			updateUserProfileDTO,
		});
	}

	@ApiOperation({
		summary: 'Update last known location',
	})
	@UseGuards(AuthGuard)
	@Post('/location')
	async updateUserLocation(
		@Req() request: Request,
		@Body() updateLastKnownLocationDTO: UpdateLastKnownLocationDTO,
	) {
		return this.userLocationService.updateUserLocation({
			request,
			updateLastKnownLocationDTO,
		});
	}

	@ApiOperation({
		summary: 'Gets my selected NFT collections',
	})
	@UseGuards(AuthGuard)
	@Get('/collections/selected')
	getSelectedNftCollections(@Req() request: Request) {
		return this.userNftService.getSelectedNfts({
			request,
		});
	}

	@ApiOperation({
		summary: 'Gets my selected NFT collections with points',
	})
	@UseGuards(AuthGuard)
	@Get('/collections/selected/points')
	getSelectedNftCollectionsWithPoints(@Req() request: Request) {
		return this.userNftService.getSelectedNftsWithPoints({
			request,
		});
	}

	@ApiOperation({
		summary: 'Update selected nft order',
	})
	@UseGuards(AuthGuard)
	@Post('/nft/selected/order')
	updateSelectedNftOrder(
		@Req() request: Request,
		@Body() selectedNftOrderDTO: SelectedNftOrderDTO,
	) {
		return this.userNftService.updateSelectedNftOrder({
			request,
			selectedNftOrderDTO,
		});
	}

	@ApiOperation({
		summary: 'Toggle nft token selected',
	})
	@UseGuards(AuthGuard)
	@Post('nft/select')
	async toggleNftSelected(
		@Req() request: Request,
		@Body() selectNftDTO: SelectNftDTO,
	) {
		return this.userNftService.toggleNftSelected({ request, selectNftDTO });
	}

	@ApiOperation({
		summary: 'Gets all NFT collections in my wallets',
	})
	@ApiQuery({
		name: 'chain',
		enum: SupportedChains,
		required: false,
	})
	@ApiQuery({
		name: 'next',
		type: 'string',
		description: 'next cursor for pagination',
		required: false,
	})
	@UseGuards(AuthGuard)
	@Get('/collections')
	getNftCollections(
		@Req() request: Request,
		@Query() { next }: { next?: string },
		@Query('chain', new EnumValidationPipe(SupportedChains, false))
		chain: SupportedChains,
	) {
		return this.userNftService.getNftCollections({
			request,
			chain,
			nextCursor: next,
		});
	}

	@ApiOperation({
		summary: 'Gets populated page NFT collections in my wallets',
	})
	@ApiQuery({
		name: 'chain',
		enum: SupportedChains,
		required: false,
	})
	@ApiQuery({
		name: 'next',
		type: 'string',
		description: 'next cursor for pagination',
		required: false,
	})
	@UseGuards(AuthGuard)
	@Get('/collections/populated')
	getNftCollectionsPopulated(
		@Req() request: Request,
		@Query() { next }: { next?: string },
		@Query('chain', new EnumValidationPipe(SupportedChains, false))
		chain: SupportedChains,
	) {
		return this.userNftService.getNftCollectionsPopulated({
			request,
			chain,
			nextCursor: next,
		});
	}

	@ApiOperation({
		summary: 'Get user nft communities',
	})
	@UseGuards(AuthGuard)
	@Get('/collections/communities')
	getUserNftCommunities(@Req() request: Request) {
		return this.nftCommunityService.getUserNftCommunities({
			request,
		});
	}

	@ApiOperation({
		summary: 'Get nft collection usage history',
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
	@UseGuards(AuthGuard)
	@Get('/collection/:tokenAddress/usage-history')
	getNftCollectionUsageHistory(
		@Req() request: Request,
		@Param('tokenAddress') tokenAddress: string,
		@Query() { type }: { type?: BenefitUsageType },
		@Query() { page }: { page: number },
		@Query() { order }: { order?: SortOrder },
	) {
		return this.nftBenefitsService.getNftCollectionUsageHistory({
			request,
			tokenAddress,
			type,
			page,
			order,
		});
	}
}
