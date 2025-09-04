import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { EnvironmentVariables } from '@/utils/env';
import { SBT_ABI, SBT_BYTECODE, PFP_ABI } from './abi';

@Injectable()
export class AvalancheNftService {
    private provider: ethers.JsonRpcProvider;
    private wallet: ethers.Wallet;

    constructor(
        private configService: ConfigService<EnvironmentVariables, true>,
    ) {
        this.provider = new ethers.JsonRpcProvider(
            this.configService.get('AVALANCHE_RPC_URL')
        );
        this.wallet = new ethers.Wallet(
            this.configService.get('AVALANCHE_PRIVATE_KEY'),
            this.provider
        );
    }

    async deployContract({
        name,
        symbol,
        alias,
    }: {
        name: string;
        symbol: string;
        alias: string;
    }) {
        // ERC721 컨트랙트 팩토리 생성
        // ERC721 컨트랙트 ABI,ERC721 컨트랙트 바이트코드,wallet
        const factory = new ethers.ContractFactory(SBT_ABI,SBT_BYTECODE,this.wallet);

        // 컨트랙트 배포
        const contract = await factory.deploy(name, symbol);
        await contract.waitForDeployment();

        return {
            address: await contract.getAddress(),
            alias: alias
        };
    }

    async getContractList() {
        // Avalanche에서는 컨트랙트 목록을 직접 조회할 수 없으므로
        // 데이터베이스에서 관리하는 것이 좋습니다
        return {
            items: []
        };
    }

    async mintToken({
        contractAddress,
        destinationWalletAddress,
        tokenUri
    }: {
        contractAddress: string;
        destinationWalletAddress: string;
        tokenUri: string;
    }) {
        const contract = new ethers.Contract(
            contractAddress,
            [
                "function mintNFT(address recipient, string memory imageURI, bool _isSBT) public"
            ],
            this.wallet
        );

        const tx = await contract.mintNFT(
            destinationWalletAddress,
            tokenUri,
            true
        );
        await tx.wait();

        return tx;
    }

    async mintPfpToken({
        contractAddress,
        destinationWalletAddress,
        tokenUri,
        isSBT = true
    }: {
        contractAddress: string;
        destinationWalletAddress: string;
        tokenUri: string;
        isSBT?: boolean;
    }) {
        const contract = new ethers.Contract(
            contractAddress,
            PFP_ABI,
            this.wallet
        );

        const tx = await contract.mintNFT(
            destinationWalletAddress,
            tokenUri,
            isSBT // Use the isSBT parameter (default true for PFP)
        );
        
        const receipt = await tx.wait();
        
        return {
            hash: tx.hash,
            transactionHash: tx.hash,
            from: tx.from,
            to: tx.to,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString(),
        };
    }
} 