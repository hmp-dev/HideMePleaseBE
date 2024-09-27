import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';

import { AppService } from './app.service';

@Controller({ version: VERSION_NEUTRAL })
export class AppController {
	constructor(private readonly appService: AppService) {}

	@ApiOperation({
		summary: 'Gets App Health',
	})
	@Get()
	getHealthCheck(): string {
		return this.appService.healthCheck();
	}

	@Get('/debug-sentry')
	getError() {
		throw new Error('My first Sentry error!');
	}
}
