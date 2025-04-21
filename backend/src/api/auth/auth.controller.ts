import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { FirebaseLoginDTO, WorldcoinLoginDTO } from '@/api/auth/auth.dto';
import { AuthService } from '@/api/auth/auth.service';

@ApiTags('Auth')
@ApiBearerAuth()
@Controller('auth')
export class AuthController {
	constructor(private authService: AuthService) {}

	@ApiOperation({
		summary: 'login via firebase',
	})
	@Post('/firebase/login')
	async firebaseLogin(@Body() firebaseLoginDTO: FirebaseLoginDTO) {
		return this.authService.firebaseLogin({ firebaseLoginDTO });
	}

	@ApiOperation({
		summary: 'login via worldcoin',
	})
	@Post('/wld/login')
	async worldcoinLogin(@Body() worldcoinLoginDTO: WorldcoinLoginDTO) {
		return this.authService.worldcoinLogin({ worldcoinLoginDTO });
	}

	@ApiOperation({
		summary: 'exchange app verifier id with jwt token',
	})
	@Get('/wld/login/:appVerifierId')
	async exchangeWorldToken(@Param('appVerifierId') appVerifierId: string) {
		return this.authService.exchangeWorldToken({ appVerifierId });
	}
}
