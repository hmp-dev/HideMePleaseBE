export interface SimpleHashNftForAddressResponse {
	next_cursor: string;
	nfts?: SimpleHashNftAsset[];
}

export interface SimpleHashNftAsset {
	contract_address: string;
	name: string;
	description: string;
	image_url: string;
	video_url: string;
	token_id: string;

	collection: {
		collection_id: string;
		name: string;
		symbol: string;
		image_url: string;
	};
}
