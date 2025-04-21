import { SupportedChains } from '@prisma/client';

export const UnmarshalSupportedChainMapping = {
	[SupportedChains.ETHEREUM]: 'ethereum',
	[SupportedChains.KLAYTN]: 'klaytn',
	[SupportedChains.SOLANA]: 'solana',
};
