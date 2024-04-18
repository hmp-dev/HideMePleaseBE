import { EvmChain } from '@moralisweb3/common-evm-utils';
import { SupportedChains } from '@prisma/client';

export const SupportedChainsList = [
	SupportedChains.ETHEREUM,
	SupportedChains.POLYGON,
];

export const SupportedChainMapping = {
	[SupportedChains.ETHEREUM]: EvmChain.ETHEREUM,
	[SupportedChains.POLYGON]: EvmChain.POLYGON,
	[SupportedChains.MUMBAI]: EvmChain.MUMBAI,
} satisfies Record<SupportedChains, EvmChain>;
