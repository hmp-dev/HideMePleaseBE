export function getWalletDeleteName(publicAddress: string) {
	return `${publicAddress}_deleted_${Date.now()}`;
}
