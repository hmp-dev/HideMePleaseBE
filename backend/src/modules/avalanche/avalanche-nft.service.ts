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
        try {
            // Check wallet balance first
            const balance = await this.provider.getBalance(this.wallet.address);
            console.log(`Minting wallet balance: ${ethers.formatEther(balance)} AVAX`);
            
            if (balance < ethers.parseEther("0.01")) {
                throw new Error(`insufficient funds: wallet has ${ethers.formatEther(balance)} AVAX, need at least 0.01 AVAX for gas`);
            }
            
            // Verify contract exists
            const code = await this.provider.getCode(contractAddress);
            if (code === '0x') {
                throw new Error(`contract not found at address ${contractAddress}`);
            }
            
            const contract = new ethers.Contract(
                contractAddress,
                PFP_ABI,
                this.wallet
            );
            
            console.log(`Calling mintNFT on contract ${contractAddress}`);
            console.log(`Parameters: recipient=${destinationWalletAddress}, tokenUri=${tokenUri}, isSBT=${isSBT}`);
            
            // Estimate gas first
            let gasEstimate;
            try {
                gasEstimate = await contract.mintNFT.estimateGas(
                    destinationWalletAddress,
                    tokenUri,
                    isSBT
                );
                console.log(`Gas estimate: ${gasEstimate.toString()}`);
            } catch (estimateError: any) {
                console.error(`Gas estimation failed: ${estimateError.message}`);
                // If gas estimation fails, it usually means the transaction will fail
                throw new Error(`Transaction will fail: ${estimateError.reason || estimateError.message}`);
            }
            
            // Add 20% buffer to gas estimate
            const gasLimit = gasEstimate * 120n / 100n;
            
            const tx = await contract.mintNFT(
                destinationWalletAddress,
                tokenUri,
                isSBT,
                { gasLimit }
            );
            
            console.log(`Transaction sent: ${tx.hash}`);
            console.log(`Waiting for confirmation...`);
            
            const receipt = await tx.wait();
            
            console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
            
            return {
                hash: tx.hash,
                transactionHash: tx.hash,
                from: tx.from,
                to: tx.to,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString(),
            };
        } catch (error: any) {
            console.error(`mintPfpToken failed: ${error.message}`);
            console.error(`Full error:`, error);
            
            // Re-throw with more context
            if (error.message?.includes('insufficient funds')) {
                throw error;
            }
            if (error.message?.includes('contract not found')) {
                throw error;
            }
            if (error.code === 'NONCE_EXPIRED' || error.message?.includes('nonce')) {
                throw new Error(`nonce error: ${error.message}`);
            }
            if (error.code === 'REPLACEMENT_UNDERPRICED') {
                throw new Error(`gas price too low: ${error.message}`);
            }
            
            throw new Error(`Minting failed: ${error.reason || error.message || 'Unknown error'}`);
        }
    }
} 