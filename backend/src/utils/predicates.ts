import { Environment } from '@/constants';

export function isDevelopment(): boolean {
	return process.env.NODE_ENV === Environment.Development;
}

export function isProduction(): boolean {
	return process.env.NODE_ENV === Environment.Production;
}

export function isTest(): boolean {
	return process.env.NODE_ENV === Environment.Test;
}

export function isValidDate(d: unknown) {
	// @ts-expect-error this is a good way of checking
	return d instanceof Date && !isNaN(d);
}
