import { PublicKey } from '@solana/web3.js';

export function isSolanaAddress(walletAddress: string) {
	try {
		new PublicKey(walletAddress);
		// return PublicKey.isOnCurve(address);
		return true;
	} catch (e) {
		return false;
	}
}

export function stripNftName(name: string) {
	return name
		.replace(/[0-9]/g, '')
		.replaceAll('#', '')
		.replaceAll(' ', '_')
		.trim();
}
