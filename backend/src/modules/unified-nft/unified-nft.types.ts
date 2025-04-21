import { SupportedChains } from '@prisma/client';

export type UnifiedNftNext = {
	nextChain?: SupportedChains;
	nextPage?: string;
} | null;
