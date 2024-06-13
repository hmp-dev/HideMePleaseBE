export interface UnmarshalNftForAddressResponse {
	items_on_page: number;
	next_offset: number;
	nft_assets?: UnmarshalNftAsset[];
}

export interface UnmarshalNftAsset {
	asset_contract: string;
	token_id: string;
	owner: string;
	issuer_specific_data: IssuerSpecificData;
	price: string;
	asset_contract_name: string;
	description: string;
	external_link: string;
}

export interface IssuerSpecificData {
	image_url: string;
	name: string;
}
