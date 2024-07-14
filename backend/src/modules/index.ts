import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import * as redisStore from 'cache-manager-redis-store';
import { AcceptLanguageResolver, I18nModule } from 'nestjs-i18n';
import { LoggerModule } from 'nestjs-pino';
import path from 'path';
import { Options } from 'pino-http';

import { GLOBAL_LANG } from '@/constants';
import { KlaytnModule } from '@/modules/klaytn/klaytn.module';
import { MediaModule } from '@/modules/media/media.module';
import { validateEnv } from '@/utils/env';
import { isDevelopment, isTest } from '@/utils/predicates';

import { PrismaModule } from './prisma/prisma.module';

const DEFAULT_MODULES = [
	ConfigModule.forRoot({
		validate: !isTest() ? validateEnv : undefined,
		isGlobal: true,
		ignoreEnvFile: true,
		cache: true,
	}),
	CacheModule.register({
		isGlobal: true,
		store: redisStore,
		host: process.env.REDIS_HOST,
		port: Number(process.env.REDIS_PORT),
	}),

	PrismaModule,

	I18nModule.forRoot({
		fallbackLanguage: GLOBAL_LANG,
		loaderOptions: {
			path: path.join(__dirname, '..', '/i18n/'),
			watch: true,
		},
		resolvers: [AcceptLanguageResolver],
	}),
	ScheduleModule.forRoot(),
	MediaModule,
	KlaytnModule,
];

/* c8 ignore next */
if (!isTest()) {
	const redact = {
		paths: ['req.headers.authorization'],
	};
	const pinoHttp: Options = {
		level: 'debug',
		transport: {
			target: 'pino-pretty',
			options: {
				translateTime: 'dd-mm-yyyy hh:mm:ss TT',
				colorize: isDevelopment(),
				singleLine: !isDevelopment(),
			},
		},
		redact,
	};

	DEFAULT_MODULES.push(
		LoggerModule.forRoot({
			pinoHttp,
		}),
	);
}

export { DEFAULT_MODULES, PrismaModule };
