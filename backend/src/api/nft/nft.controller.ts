import {
	Body,
	Controller,
	Get,
	Param,
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
import { NftBenefitsService } from '@/api/nft/nft-benefits.service';
import { NftOwnershipService } from '@/api/nft/nft-ownership.service';
import { EnumValidationPipe } from '@/exception-filters/enum-validation.pipe';
import { AuthContext } from '@/types';

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
		summary: 'Get benefits for collection',
	})
	@UseGuards(AuthGuard)
	@Get('/collection/:collectionId/benefits')
	getNftBenefits(
		@Req() request: Request,
		@Param('collectionId') collectionId: string,
	) {
		return this.nftBenefitsService.getCollectionBenefits({
			request,
			collectionId,
		});
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
