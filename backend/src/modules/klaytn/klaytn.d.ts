declare module 'caver-js-ext-kas' {
	class CaverExtKAS {
		constructor(
			chainId: string,
			accessKey: string,
			accessKeySecret: string,
		);

		kas = {
			kip17: {
				deploy(
					name: string,
					symbol: string,
					alias: string,
				): Promise<{ status: string; transactionHash: string }> {},
				getContractList(): Promise<{
					cursor: string;
					items: {
						address: string;
						alias: string;
						name: string;
						symbol: string;
					}[];
				}> {},
				mint(
					aliasOrAddress: string,
					destinationWalletAddress: string,
					tokenId: string,
					tokenUri: string,
				): Promise<{ status: string; transactionHash: string }> {},
			},
		};
	}

	export = CaverExtKAS;
}
