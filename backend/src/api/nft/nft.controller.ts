import {
	Body,
	Controller,
	Get,
	Param,
	ParseFloatPipe,
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

import { SelectedNftOrderDTO, SelectNftDTO } from '@/api/nft/nft.dto';
import { NftService } from '@/api/nft/nft.service';
import { BenefitUsageType } from '@/api/nft/nft.types';
import { NftBenefitsService } from '@/api/nft/nft-benefits.service';
import { NftOwnershipService } from '@/api/nft/nft-ownership.service';
import { EnumValidationPipe } from '@/exception-filters/enum-validation.pipe';
import { AuthContext, SortOrder } from '@/types';

import { AuthGuard } from '../auth/auth.guard';

@ApiTags('NFT')
@ApiBearerAuth()
@Controller('nft')
export class NftController {
	constructor(
		private nftService: NftService,
		private nftBenefitsService: NftBenefitsService,
		private nftOwnershipService: NftOwnershipService,
	) {}

	@ApiOperation({
		summary: 'Gets welcome nft',
	})
	@UseGuards(AuthGuard)
	@Get('/welcome')
	getWelcomeNft() {
		return this.nftService.getWelcomeNft();
	}

	@ApiOperation({
		summary: 'Consume welcome nft',
	})
	@UseGuards(AuthGuard)
	@Get('/welcome/:welcomeNftId')
	consumeWelcomeNft(
		@Req() request: Request,
		@Param('welcomeNftId') welcomeNftId: number,
	) {
		return this.nftService.consumeWelcomeNft({ request, welcomeNftId });
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
		return this.nftService.getNftCollections({
			request,
			chain,
			nextCursor: next,
		});
	}

	@ApiOperation({
		summary: 'Gets my selected NFT collections',
	})
	@UseGuards(AuthGuard)
	@Get('/nfts/selected')
	getSelectedNftCollections(@Req() request: Request) {
		return this.nftService.getSelectedNfts({
			request,
		});
	}

	@ApiOperation({
		summary: 'Gets my selected NFT collections with points',
	})
	@UseGuards(AuthGuard)
	@Get('/nfts/selected/points')
	getSelectedNftCollectionsWithPoints(@Req() request: Request) {
		return this.nftService.getSelectedNftsWithPoints({
			request,
		});
	}

	@ApiOperation({
		summary: 'Get benefits for collection',
	})
	@UseGuards(AuthGuard)
	@ApiQuery({
		name: 'page',
		type: 'number',
		required: false,
	})
	@ApiQuery({
		name: 'pageSize',
		type: 'number',
		required: false,
	})
	@ApiQuery({
		name: 'spaceId',
		type: 'string',
		required: false,
	})
	@Get('/collection/:tokenAddress/benefits')
	getNftBenefits(
		@Req() request: Request,
		@Param('tokenAddress') tokenAddress: string,
		@Query() { page }: { page: number },
		@Query() { pageSize }: { pageSize?: number },
		@Query() { spaceId }: { spaceId?: string },
	) {
		return this.nftBenefitsService.getCollectionBenefits({
			request,
			tokenAddress,
			page,
			pageSize,
			spaceId,
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

	@ApiOperation({
		summary: 'Get nft collection chain information',
	})
	@UseGuards(AuthGuard)
	@Get('/collection/:tokenAddress/network-info')
	getNftCollectionNetworkInfo(
		@Req() request: Request,
		@Param('tokenAddress') tokenAddress: string,
	) {
		return this.nftBenefitsService.getNftCollectionNetworkInfo({
			request,
			tokenAddress,
		});
	}

	@ApiOperation({
		summary: 'Get nearest spaces for this nft',
	})
	@ApiQuery({
		name: 'latitude',
		type: 'number',
	})
	@ApiQuery({
		name: 'longitude',
		type: 'number',
	})
	@UseGuards(AuthGuard)
	@Get('/collection/:tokenAddress/spaces')
	getNftCollectionSpaces(
		@Req() request: Request,
		@Param('tokenAddress') tokenAddress: string,
		@Query('latitude', ParseFloatPipe) latitude: number,
		@Query('longitude', ParseFloatPipe) longitude: number,
	) {
		return this.nftBenefitsService.getNftCollectionSpaces({
			request,
			tokenAddress,
			latitude,
			longitude,
		});
	}

	@ApiOperation({
		summary: 'Get nft members with rankings',
	})
	@ApiQuery({
		name: 'page',
		type: 'number',
		required: false,
	})
	@UseGuards(AuthGuard)
	@Get('/collection/:tokenAddress/members')
	getNftCollectionMembers(
		@Req() request: Request,
		@Param('tokenAddress') tokenAddress: string,
		@Query() { page }: { page: number },
	) {
		return this.nftBenefitsService.getNftCollectionMembers({
			request,
			tokenAddress,
			page,
		});
	}
	@ApiOperation({
		summary: 'Get top nft collections',
	})
	@UseGuards(AuthGuard)
	@Get('/collections/top')
	getTopNftCollections() {
		return this.nftBenefitsService.getTopNftCollections();
	}

	@ApiOperation({
		summary: 'Update selected nft order',
	})
	@UseGuards(AuthGuard)
	@Post('/collections/selected/order')
	updateSelectedNftCollectionOrder(
		@Req() request: Request,
		@Body() selectedNftOrderDTO: SelectedNftOrderDTO,
	) {
		return this.nftService.updateSelectedNftCollectionOrder({
			request,
			selectedNftOrderDTO,
		});
	}

	@ApiOperation({
		summary: 'Toggle collection token selected',
	})
	@UseGuards(AuthGuard)
	@Post('token/select')
	async toggleNftSelected(
		@Req() request: Request,
		@Body() selectNftDTO: SelectNftDTO,
	) {
		return this.nftService.toggleNftSelected({ request, selectNftDTO });
	}

	@ApiOperation({
		summary: 'Trigger manual ownership check',
	})
	@UseGuards(AuthGuard)
	@Post('ownership-check')
	async triggerOwnershipCheck(@Req() request: Request) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;
		return this.nftOwnershipService.checkUserNftOwnership(
			authContext.userId,
		);
	}
}
