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
import { EnumValidationPipe } from '@/exception-filters/enum-validation.pipe';

import { AuthGuard } from '../auth/auth.guard';

@ApiTags('NFT')
@ApiBearerAuth()
@Controller('nft')
export class NftController {
	constructor(
		private nftService: NftService,
		private nftBenefitsService: NftBenefitsService,
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
		summary: 'Gets all nft collections in my wallets',
	})
	@ApiQuery({
		name: 'chain',
		enum: SupportedChains,
		required: false,
	})
	@ApiQuery({
		name: 'cursor',
		type: 'string',
		description: 'Cursor used for pagination',
		required: false,
	})
	@ApiQuery({
		name: 'cursorType',
		enum: SupportedChains,
		description: 'Chain of cursor',
		required: false,
	})
	@ApiQuery({
		name: 'nextWalletAddress',
		type: 'string',
		description: 'Next wallet address used for pagination',
		required: false,
	})
	@UseGuards(AuthGuard)
	@Get('/collections')
	getNftCollections(
		@Req() request: Request,
		@Query() { cursor }: { cursor?: string },
		@Query() { nextWalletAddress }: { nextWalletAddress?: string },
		@Query('chain', new EnumValidationPipe(SupportedChains, false))
		chain: SupportedChains,
		@Query('cursorType', new EnumValidationPipe(SupportedChains, false))
		cursorType: SupportedChains,
	) {
		return this.nftService.getNftCollections({
			request,
			chain,
			cursor,
			cursorType,
			nextWalletAddress,
		});
	}

	@ApiOperation({
		summary: 'Gets my selected nft collections',
	})
	@UseGuards(AuthGuard)
	@Get('/collections/selected')
	getSelectedNftCollections(@Req() request: Request) {
		return this.nftService.getSelectedNftCollections({
			request,
		});
	}

	@ApiOperation({
		summary: 'Gets my selected nfts',
	})
	@UseGuards(AuthGuard)
	@Get('/nfts/selected')
	getSelectedNfts(@Req() request: Request) {
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
}
