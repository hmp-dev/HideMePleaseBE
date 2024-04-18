import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { NftService } from '@/api/nft/nft.service';

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
	@UseGuards(AuthGuard)
	@Get('/collections')
	getNftCollections(@Req() request: Request) {
		return this.nftService.getNftCollections({ request });
	}
}
