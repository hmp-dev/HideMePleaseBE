import 'reflect-metadata';

import { plainToInstance } from 'class-transformer';
import {
	IsEnum,
	IsNotEmpty,
	IsNumber,
	IsPositive,
	IsString,
	validateSync,
} from 'class-validator';

import { Environment } from '@/constants';

export class EnvironmentVariables {
	@IsEnum(Environment)
	NODE_ENV!: Environment;

	@IsPositive()
	SERVER_PORT!: number;

	@IsString()
	WLD_APP_ID!: string;

	@IsNotEmpty()
	@IsString()
	FIREBASE_PROJECT_ID!: string;

	@IsNotEmpty()
	@IsString()
	FIREBASE_CLIENT_EMAIL!: string;

	@IsNotEmpty()
	@IsString()
	FIREBASE_PRIVATE_KEY!: string;

	@IsNotEmpty()
	@IsString()
	JWT_SECRET!: string;

	@IsNotEmpty()
	@IsNumber()
	MORALIS_CU_PER_SECOND!: number;

	@IsNotEmpty()
	@IsString()
	MORALIS_API_KEY!: string;

	@IsNotEmpty()
	@IsString()
	AWS_REGION!: string;

	@IsNotEmpty()
	@IsString()
	S3_ACCESS_KEY!: string;

	@IsNotEmpty()
	@IsString()
	S3_ACCESS_SECRET!: string;

	@IsNotEmpty()
	@IsString()
	S3_BUCKET!: string;

	@IsNotEmpty()
	@IsNumber()
	MAX_DISTANCE_FROM_SPACE!: number;
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
