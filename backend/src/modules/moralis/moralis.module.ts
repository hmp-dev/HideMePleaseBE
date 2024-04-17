import { Module } from '@nestjs/common';

import { UsersService } from '@/api/users/users.service';

@Module({
	imports: [],
	providers: [UsersService],
	exports: [UsersService],
})
export class UsersModule {}
