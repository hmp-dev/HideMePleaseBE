import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core/constants';

import { API_MODULES } from '@/api';
import { HttpExceptionFilter } from '@/exception-filters/http-exception.filter';
import { DEFAULT_MODULES } from '@/modules';

import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
	imports: [...DEFAULT_MODULES, ...API_MODULES],
	controllers: [AppController],
	providers: [
		AppService,
		{
			provide: APP_FILTER,
			useClass: HttpExceptionFilter,
		},
	],
})
export class AppModule {}
