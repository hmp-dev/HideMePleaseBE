import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core/constants';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { SentryGlobalFilter } from '@sentry/nestjs/setup';

import { API_MODULES } from '@/api';
import { HttpExceptionFilter } from '@/exception-filters/http-exception.filter';
import { DEFAULT_MODULES } from '@/modules';

import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
	imports: [
		ThrottlerModule.forRoot([
			{
				ttl: 60000, // 60 seconds
				limit: 100, // 100 requests per 60 seconds per IP (global default)
			},
		]),
		...DEFAULT_MODULES,
		...API_MODULES,
	],
	controllers: [AppController],
	providers: [
		AppService,
		{
			provide: APP_GUARD,
			useClass: ThrottlerGuard,
		},
		{
			provide: APP_FILTER,
			useClass: HttpExceptionFilter,
		},
		{
			provide: APP_FILTER,
			useClass: SentryGlobalFilter,
		},
	],
})
export class AppModule {}
