import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { UsersService } from '@/api/users/users.service';

import { AuthGuard } from '../auth/auth.guard';

@ApiTags('User')
@ApiBearerAuth()
@Controller('user')
export class UsersController {
	constructor(private usersService: UsersService) {}

	@ApiOperation({
		summary: 'Gets base user',
	})
	@UseGuards(AuthGuard)
	@Get('/')
	async getUser(@Req() request: Request) {
		return this.usersService.getOrCreateUser({ request });
	}
}
