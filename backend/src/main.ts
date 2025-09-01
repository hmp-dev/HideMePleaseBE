import './instrument';

import { VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import {
	DocumentBuilder,
	SwaggerDocumentOptions,
	SwaggerModule,
} from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import * as path from 'path';

import { ApiVersions } from '@/constants';
import { PrismaExceptionFilter } from '@/exception-filters/prisma-exception';
import { MoralisApiService } from '@/modules/moralis/moralis-api.service';
import { EnvironmentVariables } from '@/utils/env';

import { AppModule } from './app';
import { setupValidationPipe } from './utils/configuration';

(async () => {
	const app = await NestFactory.create<NestExpressApplication>(AppModule, {
		bufferLogs: true,
	});
	app.useLogger(app.get(Logger));

	app.enableVersioning({
		type: VersioningType.URI,
		defaultVersion: ApiVersions.V1,
	});
	app.enableCors();

	// Static files serving for character images
	app.useStaticAssets(path.join(__dirname, 'assets'), {
		prefix: '/assets/',
	});

	const config = new DocumentBuilder()
		.setTitle('Hidemeplease API')
		.setDescription('Hidemeplease-API Swagger')
		.setVersion(ApiVersions.V1)
		.addTag('Hidemeplease-api')
		.addBearerAuth()
		.build();
	const documentOptions: SwaggerDocumentOptions = {
		operationIdFactory: (_: string, methodKey: string) => methodKey,
	};
	const document = SwaggerModule.createDocument(app, config, documentOptions);
	SwaggerModule.setup('api/doc', app, document, {
		swaggerOptions: {
			persistAuthorization: true,
		},
	});

	setupValidationPipe(app);

	app.useGlobalFilters(new PrismaExceptionFilter());

	const configService = app.get(ConfigService<EnvironmentVariables, true>);
	const moralisApiService = app.get(MoralisApiService);
	void moralisApiService.init();

	const port = configService.get<number>('SERVER_PORT');
	await app.listen(port);
})();
