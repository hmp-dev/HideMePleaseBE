import 'reflect-metadata';

import { plainToInstance, Transform } from 'class-transformer';
import {
	IsArray,
	IsEnum,
	IsNotEmpty,
	IsNumber,
	IsOptional,
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
	@IsString()
	COVALENT_API_KEY!: string;

	@IsNotEmpty()
	@Transform(({ value }) => splitStringIntoNonBlankArray(value as string))
	@IsArray()
	@IsString({ each: true })
	UNMARSHAL_API_KEYS!: string[];

	@IsNotEmpty()
	@IsString()
	KLAYTN_ACCESS_KEY!: string;

	@IsNotEmpty()
	@IsString()
	KLAYTN_ACCESS_KEY_SECRET!: string;

	@IsNotEmpty()
	@IsNumber()
	KLAYTN_CHAIN_ID!: number;

	@IsNotEmpty()
	@IsString()
	SENDBIRD_APP_ID!: string;

	@IsNotEmpty()
	@IsString()
	SENDBIRD_TOKEN!: string;

	@IsNotEmpty()
	@IsString()
	REDIS_HOST!: string;

	@IsNotEmpty()
	@IsNumber()
	REDIS_PORT!: number;

	@IsNotEmpty()
	@IsString()
	HELIUS_API_KEY!: string;

	@IsNotEmpty()
	@IsString()
	SIMPLEHASH_API_KEY!: string;

	@IsNotEmpty()
	@IsString()
	AVALANCHE_RPC_URL!: string;

	@IsNotEmpty()
	@IsString()
	AVALANCHE_PRIVATE_KEY!: string;

	@IsNotEmpty()
	@IsString()
	API_BASE_URL!: string;

	@IsNotEmpty()
	@IsString()
	SBT_ABI!: string;

	@IsNotEmpty()
	@IsString()
	SBT_BYTECODE!: string;

	@IsOptional()
	@IsString()
	IOS_BUNDLE_ID?: string;
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

function splitStringIntoNonBlankArray(value: string, delim = ','): string[] {
	return value
		.split(delim)
		.map((v) => v.trim())
		.filter(Boolean);
}
