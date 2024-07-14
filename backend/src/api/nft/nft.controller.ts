import {
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

import { NftCommunitySortOrder } from '@/api/nft/nft.types';
import { NftBenefitsService } from '@/api/nft/nft-benefits.service';
import { NftCommunityService } from '@/api/nft/nft-community.service';
import { WelcomeNftService } from '@/api/nft/welcome-nft.service';

import { AuthGuard } from '../auth/auth.guard';

@ApiTags('NFT')
@ApiBearerAuth()
@Controller('nft')
export class NftController {
	constructor(
		private nftService: WelcomeNftService,
		private nftBenefitsService: NftBenefitsService,
		private nftCommunityService: NftCommunityService,
	) {}

	@ApiOperation({
		summary: 'Gets welcome nft',
	})
	@ApiQuery({
		name: 'latitude',
		type: 'number',
		required: false,
	})
	@ApiQuery({
		name: 'longitude',
		type: 'number',
		required: false,
	})
	@UseGuards(AuthGuard)
	@Get('/welcome')
	getWelcomeNft(
		@Query('latitude') latitude: number,
		@Query('longitude') longitude: number,
	) {
		return this.nftService.getWelcomeNft({
			latitude,
			longitude,
		});
	}

	@ApiOperation({
		summary: 'Consume welcome nft',
	})
	@UseGuards(AuthGuard)
	@Post('/welcome/:tokenAddress')
	consumeWelcomeNft(
		@Req() request: Request,
		@Param('tokenAddress') tokenAddress: string,
	) {
		return this.nftService.consumeWelcomeNft({ request, tokenAddress });
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
	@ApiQuery({
		name: 'latitude',
		type: 'number',
		required: false,
	})
	@ApiQuery({
		name: 'longitude',
		type: 'number',
		required: false,
	})
	@Get('/collection/:tokenAddress/benefits')
	getNftBenefits(
		@Req() request: Request,
		@Param('tokenAddress') tokenAddress: string,
		@Query() { page }: { page: number },
		@Query() { pageSize }: { pageSize?: number },
		@Query() { spaceId }: { spaceId?: string },
		@Query() { latitude }: { latitude?: number },
		@Query() { longitude }: { longitude?: number },
	) {
		return this.nftBenefitsService.getCollectionBenefits({
			request,
			tokenAddress,
			page,
			pageSize,
			spaceId,
			latitude,
			longitude,
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
		summary: 'Get nft collection information',
	})
	@UseGuards(AuthGuard)
	@Get('/collection/:tokenAddress/info')
	getNftCollectionInfo(
		@Req() request: Request,
		@Param('tokenAddress') tokenAddress: string,
	) {
		return this.nftCommunityService.getNftCollectionInfo({
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
		summary: 'Get ranked nft collections',
	})
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
	@UseGuards(AuthGuard)
	@Get('/collections')
	getTopNftCollections(
		@Req() request: Request,
		@Query() { page }: { page: number },
		@Query() { pageSize }: { pageSize?: number },
	) {
		return this.nftBenefitsService.getTopNftCollections({
			page,
			pageSize,
			request,
		});
	}

	@ApiOperation({
		summary: 'Get nft communities',
	})
	@ApiQuery({
		name: 'order',
		enum: NftCommunitySortOrder,
	})
	@ApiQuery({
		name: 'page',
		type: 'number',
		required: false,
	})
	@UseGuards(AuthGuard)
	@Get('/collections/communities')
	getNftCommunities(
		@Req() request: Request,
		@Query() { page }: { page: number },
		@Query() { order }: { order: NftCommunitySortOrder },
	) {
		return this.nftCommunityService.getNftCommunities({
			request,
			page,
			order,
		});
	}

	@ApiOperation({
		summary: 'Get hottest nft communities',
	})
	@UseGuards(AuthGuard)
	@Get('/collections/communities/hot')
	getHottestNftCommunities(@Req() request: Request) {
		return this.nftCommunityService.getHottestNftCommunities({
			request,
		});
	}
}
