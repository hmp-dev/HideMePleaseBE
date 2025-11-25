import {
	Controller,
	Delete,
	Get,
	Param,
	Patch,
	Post,
	Query,
	Req,
	UseGuards,
} from '@nestjs/common';
import {
	ApiBearerAuth,
	ApiOperation,
	ApiParam,
	ApiQuery,
	ApiTags,
} from '@nestjs/swagger';

import { AuthGuard } from '@/api/auth/auth.guard';
import { PushNotificationService } from '@/api/push-notification/push-notification.service';

@ApiTags('Push Notification')
@ApiBearerAuth()
@Controller('push-notification')
export class PushNotificationController {
	constructor(
		private pushNotificationService: PushNotificationService,
	) {}

	@ApiOperation({
		summary: '사용자 푸시 알림 목록 조회',
	})
	@ApiQuery({
		name: 'page',
		type: 'number',
		required: false,
		description: '페이지 번호 (기본값: 1)',
	})
	@UseGuards(AuthGuard)
	@Get('/')
	async getUserNotifications(
		@Req() request: Request,
		@Query('page') page?: number,
	) {
		return this.pushNotificationService.getUserNotifications({
			request,
			page: page || 1,
		});
	}

	@ApiOperation({
		summary: '읽지 않은 알림 개수 조회',
	})
	@UseGuards(AuthGuard)
	@Get('/unread/count')
	async getUnreadCount(@Req() request: Request) {
		return this.pushNotificationService.getUnreadCount({ request });
	}

	@ApiOperation({
		summary: '알림 읽음 처리',
	})
	@ApiParam({
		name: 'id',
		type: 'string',
		description: '알림 ID',
	})
	@UseGuards(AuthGuard)
	@Patch('/:id/read')
	async markAsRead(@Req() request: Request, @Param('id') id: string) {
		return this.pushNotificationService.markAsRead({
			notificationId: id,
			request,
		});
	}

	@ApiOperation({
		summary: '모든 알림 읽음 처리',
	})
	@UseGuards(AuthGuard)
	@Post('/read-all')
	async markAllAsRead(@Req() request: Request) {
		return this.pushNotificationService.markAllAsRead({ request });
	}

	@ApiOperation({
		summary: '알림 삭제',
	})
	@ApiParam({
		name: 'id',
		type: 'string',
		description: '알림 ID',
	})
	@UseGuards(AuthGuard)
	@Delete('/:id')
	async deleteNotification(
		@Req() request: Request,
		@Param('id') id: string,
	) {
		return this.pushNotificationService.deleteNotification({
			notificationId: id,
			request,
		});
	}
}
