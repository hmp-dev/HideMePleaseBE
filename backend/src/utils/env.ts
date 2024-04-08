import 'reflect-metadata';

import { plainToInstance } from 'class-transformer';
import { IsEnum, IsPositive, validateSync } from 'class-validator';

import { Environment } from '@/constants';

export class EnvironmentVariables {
	@IsEnum(Environment)
	NODE_ENV!: Environment;

	@IsPositive()
	SERVER_PORT!: number;
}

export function validateEnv(config: Record<string, unknown>) {
	const validatedConfig = plainToInstance(EnvironmentVariables, config, {
		enableImplicitConversion: true,
	});
	const errors = validateSync(validatedConfig, {
		skipMissingProperties: false,
	});

	if (errors.length > 0) {
		throw new Error(errors.toString());
	}
	return validatedConfig;
}
