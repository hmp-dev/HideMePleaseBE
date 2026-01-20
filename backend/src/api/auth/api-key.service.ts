import { Injectable, Logger } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';

import { PrismaService } from '@/modules/prisma/prisma.service';

@Injectable()
export class ApiKeyService {
	private readonly logger = new Logger(ApiKeyService.name);

	constructor(private prisma: PrismaService) {}

	/**
	 * API 키 생성
	 * @param name API 키 이름 (예: "Partner Integration")
	 * @param userId 연결할 사용자 ID
	 * @param expiresAt 만료일 (null이면 무제한)
	 * @returns 원본 키와 ID (원본 키는 이 시점에만 반환됨)
	 */
	async createApiKey(
		name: string,
		userId: string,
		expiresAt?: Date,
	): Promise<{ key: string; id: string; keyPrefix: string }> {
		const rawKey = this.generateApiKey();
		const hashedKey = this.hashKey(rawKey);
		const keyPrefix = rawKey.substring(0, 8);

		const apiKey = await this.prisma.apiKey.create({
			data: {
				name,
				key: hashedKey,
				keyPrefix,
				userId,
				expiresAt,
			},
		});

		this.logger.log(`API key created: ${name} (prefix: ${keyPrefix}) for user: ${userId}`);

		return {
			key: rawKey,
			id: apiKey.id,
			keyPrefix,
		};
	}

	/**
	 * API 키 검증 및 정보 반환
	 * @param rawKey 원본 API 키
	 * @returns API 키 정보 (userId 포함) 또는 null
	 */
	async validateApiKey(
		rawKey: string,
	): Promise<{ id: string; userId: string | null } | null> {
		const hashedKey = this.hashKey(rawKey);

		const apiKey = await this.prisma.apiKey.findFirst({
			where: {
				key: hashedKey,
				isActive: true,
				OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
			},
			select: {
				id: true,
				userId: true,
			},
		});

		if (apiKey) {
			// 마지막 사용 시간 업데이트 (비동기로 처리)
			this.prisma.apiKey
				.update({
					where: { id: apiKey.id },
					data: { lastUsedAt: new Date() },
				})
				.catch((err) => {
					this.logger.error('Failed to update lastUsedAt', err);
				});

			return { id: apiKey.id, userId: apiKey.userId };
		}

		return null;
	}

	/**
	 * API 키 목록 조회
	 */
	async listApiKeys() {
		const apiKeys = await this.prisma.apiKey.findMany({
			select: {
				id: true,
				name: true,
				keyPrefix: true,
				isActive: true,
				createdAt: true,
				lastUsedAt: true,
				expiresAt: true,
				userId: true,
				user: {
					select: {
						id: true,
						nickName: true,
						email: true,
					},
				},
			},
			orderBy: { createdAt: 'desc' },
		});

		return apiKeys;
	}

	/**
	 * API 키 상세 조회
	 */
	async getApiKey(id: string) {
		return this.prisma.apiKey.findUnique({
			where: { id },
			select: {
				id: true,
				name: true,
				keyPrefix: true,
				isActive: true,
				createdAt: true,
				lastUsedAt: true,
				expiresAt: true,
				userId: true,
				user: {
					select: {
						id: true,
						nickName: true,
						email: true,
					},
				},
			},
		});
	}

	/**
	 * API 키 비활성화
	 */
	async deactivateApiKey(id: string) {
		const apiKey = await this.prisma.apiKey.update({
			where: { id },
			data: { isActive: false },
		});

		this.logger.log(`API key deactivated: ${apiKey.name} (${apiKey.keyPrefix})`);

		return { success: true };
	}

	/**
	 * API 키 활성화
	 */
	async activateApiKey(id: string) {
		const apiKey = await this.prisma.apiKey.update({
			where: { id },
			data: { isActive: true },
		});

		this.logger.log(`API key activated: ${apiKey.name} (${apiKey.keyPrefix})`);

		return { success: true };
	}

	/**
	 * API 키 삭제
	 */
	async deleteApiKey(id: string) {
		const apiKey = await this.prisma.apiKey.delete({
			where: { id },
		});

		this.logger.log(`API key deleted: ${apiKey.name} (${apiKey.keyPrefix})`);

		return { success: true };
	}

	/**
	 * 랜덤 API 키 생성 (sk_로 시작하는 32자리)
	 */
	private generateApiKey(): string {
		const bytes = randomBytes(24);
		return `sk_${bytes.toString('hex')}`;
	}

	/**
	 * API 키 해시
	 */
	private hashKey(key: string): string {
		return createHash('sha256').update(key).digest('hex');
	}
}
