import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUrl } from 'class-validator';

export class MintPfpNftDto {
	@ApiProperty({
		description: '민팅할 지갑 주소',
		example: '0x1234567890abcdef...',
	})
	@IsString()
	walletAddress!: string;

	@ApiProperty({
		description: 'PFP 이미지 URL',
		example: 'https://example.com/image.png',
	})
	@IsUrl()
	imageUrl!: string;

	@ApiProperty({
		description: 'NFT 메타데이터 URL',
		example: 'https://example.com/metadata.json',
	})
	@IsUrl()
	metadataUrl!: string;

	@ApiProperty({
		description: 'NFT 이름',
		required: false,
		example: 'My PFP #1',
	})
	@IsOptional()
	@IsString()
	name?: string;

	@ApiProperty({
		description: 'NFT 설명',
		required: false,
		example: '나만의 특별한 PFP NFT입니다',
	})
	@IsOptional()
	@IsString()
	description?: string;
}

export class PfpNftResponseDto {
	@ApiProperty({
		description: '성공 여부',
		example: true,
	})
	success!: boolean;

	@ApiProperty({
		description: 'NFT ID',
		example: '0xabc123_1',
	})
	nftId!: string;

	@ApiProperty({
		description: '토큰 ID',
		example: 1,
	})
	tokenId!: number;

	@ApiProperty({
		description: '컬렉션 주소',
		example: '0x765339b4Dd866c72f3b8fb77251330744F34D1D0',
	})
	tokenAddress!: string;

	@ApiProperty({
		description: '트랜잭션 해시',
		example: '0x123abc...',
	})
	transactionHash?: string;

	@ApiProperty({
		description: '이미지 URL',
		example: 'https://example.com/image.png',
	})
	imageUrl!: string;

	@ApiProperty({
		description: '블록체인 네트워크',
		example: 'AVALANCHE',
	})
	chain!: string;

	@ApiProperty({
		description: '응답 메시지',
		example: 'PFP NFT가 성공적으로 민팅되었습니다.',
	})
	message!: string;
}

export class GetPfpNftResponseDto {
	@ApiProperty({
		description: 'NFT ID',
		example: '0xabc123_1',
	})
	id!: string;

	@ApiProperty({
		description: 'NFT 이름',
		example: 'PFP #1',
	})
	name!: string;

	@ApiProperty({
		description: '토큰 ID',
		example: '1',
	})
	tokenId!: string;

	@ApiProperty({
		description: '토큰 주소',
		example: '0x765339b4Dd866c72f3b8fb77251330744F34D1D0',
	})
	tokenAddress!: string;

	@ApiProperty({
		description: '이미지 URL',
		example: 'https://example.com/image.png',
	})
	imageUrl!: string;

	@ApiProperty({
		description: '소유자 지갑 주소',
		example: '0x1234567890abcdef...',
	})
	ownedWalletAddress!: string;
}