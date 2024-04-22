import {
	Body,
	Controller,
	Get,
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

import { SelectNftDTO } from '@/api/nft/nft.dto';
import { NftService } from '@/api/nft/nft.service';
import { EnumValidationPipe } from '@/exception-filters/enum-validation.pipe';

import { AuthGuard } from '../auth/auth.guard';

@ApiTags('NFT')
@ApiBearerAuth()
@Controller('nft')
export class NftController {
	constructor(private nftService: NftService) {}

	@ApiOperation({
		summary: 'Gets welcome nft',
	})
	@UseGuards(AuthGuard)
	@Get('/welcome')
	getUser(@Req() request: Request) {
		return this.nftService.getWelcomeNft({ request });
	}

	@ApiOperation({
		summary: 'Gets my nft collections',
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
