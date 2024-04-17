import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

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
}
