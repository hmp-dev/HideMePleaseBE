import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import {
	ApiBearerAuth,
	ApiOperation,
	ApiQuery,
	ApiTags,
} from '@nestjs/swagger';

import { AuthGuard } from '@/api/auth/auth.guard';
import { NotificationService } from '@/api/notification/notification.service';

@ApiTags('Notification')
@ApiBearerAuth()
@Controller('notification')
export class NotificationController {
	constructor(private notificationService: NotificationService) {}

	@ApiOperation({
		summary: 'Get user notifications',
	})
	@ApiQuery({
		name: 'page',
		type: 'number',
		required: false,
	})
	@UseGuards(AuthGuard)
	@Get('/')
	async getUserNotifications(
		@Req() request: Request,
		@Query() { page }: { page: number },
	) {
		return this.notificationService.getUserNotifications({ request, page });
	}
}
