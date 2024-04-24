import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { UpdateUserProfileDTO } from '@/api/users/users.dto';
import { UsersService } from '@/api/users/users.service';
import { AuthContext } from '@/types';

import { AuthGuard } from '../auth/auth.guard';
import { EnsureUserService } from '../auth/ensure-user.service';

@ApiTags('User')
@ApiBearerAuth()
@Controller('user')
export class UsersController {
	constructor(
		private ensureUserService: EnsureUserService,
		private usersService: UsersService,
	) {}

	@ApiOperation({
		summary: 'Gets base user',
	})
	@UseGuards(AuthGuard)
	@Get('/')
	async getUser(@Req() request: Request) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;
		return this.ensureUserService.getOrCreateUser({ authContext });
	}

	@ApiOperation({
		summary: 'Gets user profile',
	})
	@UseGuards(AuthGuard)
	@Get('/profile')
	async getUserProfile(@Req() request: Request) {
		return this.usersService.getUserProfile({ request });
	}

	@ApiOperation({
		summary: 'Update user profile',
	})
	@UseGuards(AuthGuard)
	@Patch('/profile')
	async updateUserProfile(
		@Req() request: Request,
		@Body() updateUserProfileDTO: UpdateUserProfileDTO,
	) {
		return this.usersService.updateUserProfile({
			request,
			updateUserProfileDTO,
		});
	}
}
