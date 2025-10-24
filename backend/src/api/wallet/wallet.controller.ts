import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Post,
	Req,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { CreateWalletDTO } from '@/api/wallet/wallet.dto';
import { WalletService } from '@/api/wallet/wallet.service';

import { AuthGuard } from '../auth/auth.guard';

@ApiTags('Wallet')
@ApiBearerAuth()
@Controller('wallet')
export class WalletController {
	constructor(private walletService: WalletService) {}

	@ApiOperation({
		summary: 'Get wallets for user',
	})
	@UseGuards(AuthGuard)
	@Throttle({ default: { limit: 5, ttl: 10000 } }) // More strict: 5 requests per 10 seconds
	@Get()
	async getWallets(@Req() request: Request) {
		return this.walletService.getWallets({ request });
	}

	@ApiOperation({
		summary: 'Link new wallet',
	})
	@UseGuards(AuthGuard)
	@Post()
	async createWallet(
		@Req() request: Request,
		@Body() createWalletDTO: CreateWalletDTO,
	) {
		return this.walletService.createWallet({ request, createWalletDTO });
	}

	@ApiOperation({
		summary: 'delete a wallet',
	})
	@UseGuards(AuthGuard)
	@Delete('id/:publicAddress')
	async deleteWallet(
		@Req() request: Request,
		@Param('publicAddress') publicAddress: string,
	) {
		return this.walletService.deleteWallet({ request, publicAddress });
	}
}
