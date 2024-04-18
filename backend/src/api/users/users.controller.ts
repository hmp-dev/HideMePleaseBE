import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { AuthContext } from '@/types';

import { AuthGuard } from '../auth/auth.guard';
import { EnsureUserService } from '../auth/ensure-user.service';

@ApiTags('User')
@ApiBearerAuth()
@Controller('user')
export class UsersController {
	constructor(private usersService: EnsureUserService) {}

	@ApiOperation({
		summary: 'Gets base user',
	})
	@UseGuards(AuthGuard)
	@Get('/')
	async getUser(@Req() request: Request) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;
		return this.usersService.getOrCreateUser({ authContext });
	}
}
