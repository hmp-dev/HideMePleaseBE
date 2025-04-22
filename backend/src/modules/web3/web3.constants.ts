import { Chain } from '@covalenthq/client-sdk/dist/services/CovalentClient';
import { EvmChain } from '@moralisweb3/common-evm-utils';
import { SupportedChains } from '@prisma/client';

export const SupportedChainsList = [
	SupportedChains.ETHEREUM,
	SupportedChains.POLYGON,
	SupportedChains.KLAYTN,
	SupportedChains.SOLANA,
	SupportedChains.AVALANCHE,
];

export const SupportedChainMapping = {
	[SupportedChains.ETHEREUM]: EvmChain.ETHEREUM,
	[SupportedChains.POLYGON]: EvmChain.POLYGON,
	[SupportedChains.MUMBAI]: EvmChain.MUMBAI,
	[SupportedChains.AVALANCHE]: EvmChain.AVALANCHE,
} satisfies Record<string, EvmChain>;

export const SupportedChainCovalentMapping = {
	[SupportedChains.ETHEREUM]: 'eth-mainnet',
	[SupportedChains.POLYGON]: 'matic-mainnet',
	[SupportedChains.MUMBAI]: 'matic-mumbai',
	[SupportedChains.AVALANCHE]: 'avalanche-mainnet',
} satisfies Record<string, Chain>;

export const ChainToSymbolMapping = {
	[SupportedChains.ETHEREUM]: 'Eth',
	[SupportedChains.POLYGON]: 'Matic',
	[SupportedChains.MUMBAI]: 'Matic',
	[SupportedChains.SOLANA]: 'Sol',
	[SupportedChains.KLAYTN]: 'Klay',
	[SupportedChains.AVALANCHE]: 'Avax',
};

export const SupportedChainSimpleHashMapping = {
	[SupportedChains.ETHEREUM]: 'ethereum',
	[SupportedChains.SOLANA]: 'solana',
	[SupportedChains.POLYGON]: 'polygon',
	[SupportedChains.AVALANCHE]: 'avalanche',
};
