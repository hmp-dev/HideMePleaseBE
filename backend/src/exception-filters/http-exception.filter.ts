import {
	ArgumentsHost,
	Catch,
	ExceptionFilter,
	HttpException,
} from '@nestjs/common';
import { Response } from 'express';
import { I18nService } from 'nestjs-i18n';

import { ErrorCodes } from '@/utils/errorCodes';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
	constructor(private i18n: I18nService) {}

	catch(exception: HttpException, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();
		const status = exception.getStatus();

		const code = exception.message as unknown as ErrorCodes;

		const message = this.i18n.t(`error.${code}`, {
			defaultValue: '',
		});

		const exceptionResponse = exception.getResponse();
		let fallbackMessage: string | string[];
		if (typeof exceptionResponse === 'string') {
			fallbackMessage = exceptionResponse;
		} else {
			if ('message' in exceptionResponse) {
				fallbackMessage = exceptionResponse.message as string[];
			} else {
				fallbackMessage = exceptionResponse.toString();
			}
		}

		response.status(status).json({
			error: {
				code,
				message: message || fallbackMessage,
			},
		});
	}
}
