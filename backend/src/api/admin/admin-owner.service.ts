import { Injectable, NotFoundException } from '@nestjs/common';
import { StoreStatus } from '@prisma/client';

import {
	GetPendingSpacesQueryDTO,
	ApproveSpaceDTO,
	RejectSpaceDTO,
	SetOwnerDTO,
	CreateAdminSpaceDTO,
} from '@/api/admin/admin-owner.dto';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { MediaService } from '@/modules/media/media.service';

@Injectable()
export class AdminOwnerService {
	constructor(
		private prisma: PrismaService,
		private mediaService: MediaService,
	) {}

	async getPendingSpaces(query: GetPendingSpacesQueryDTO) {
		const page = query.page || 1;
		const limit = query.limit || 20;
		const skip = (page - 1) * limit;

		const where: any = {
			deleted: false,
		};

		if (query.status) {
			where.storeStatus = query.status;
		} else {
			where.storeStatus = StoreStatus.PENDING;
		}

		const [spaces, total] = await Promise.all([
			this.prisma.space.findMany({
				where,
				include: {
					owner: {
						select: {
							id: true,
							nickName: true,
							email: true,
						},
					},
					image: {
						select: {
							id: true,
							filename_download: true,
							filename_disk: true,
						},
					},
				},
				orderBy: { createdAt: 'desc' },
				skip,
				take: limit,
			}),
			this.prisma.space.count({ where }),
		]);

		return {
			spaces: spaces.map((space) => ({
				...space,
				ownerName: space.owner?.nickName,
				ownerEmail: space.owner?.email,
				imageUrl: space.image
					? this.mediaService.getUrl(space.image as any)
					: null,
			})),
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		};
	}

	async approveSpace(spaceId: string, _dto: ApproveSpaceDTO) {
		const space = await this.prisma.space.findFirst({
			where: {
				id: spaceId,
				deleted: false,
			},
		});

		if (!space) {
			throw new NotFoundException('매장을 찾을 수 없습니다');
		}

		const updated = await this.prisma.space.update({
			where: { id: spaceId },
			data: {
				storeStatus: StoreStatus.APPROVED,
			},
		});

		return {
			success: true,
			message: '매장이 승인되었습니다',
			space: updated,
		};
	}

	async rejectSpace(spaceId: string, dto: RejectSpaceDTO) {
		const space = await this.prisma.space.findFirst({
			where: {
				id: spaceId,
				deleted: false,
			},
		});

		if (!space) {
			throw new NotFoundException('매장을 찾을 수 없습니다');
		}

		const updated = await this.prisma.space.update({
			where: { id: spaceId },
			data: {
				storeStatus: StoreStatus.REJECTED,
			},
		});

		return {
			success: true,
			message: '매장이 거부되었습니다',
			reason: dto.reason,
			space: updated,
		};
	}

	async setUserAsOwner(userId: string, _dto: SetOwnerDTO) {
		const user = await this.prisma.user.findUnique({
			where: { id: userId },
		});

		if (!user) {
			throw new NotFoundException('사용자를 찾을 수 없습니다');
		}

		const updated = await this.prisma.user.update({
			where: { id: userId },
			data: {
				isOwner: true,
			},
		});

		return {
			success: true,
			message: '점주 권한이 부여되었습니다',
			user: {
				id: updated.id,
				nickName: updated.nickName,
				email: updated.email,
				isOwner: updated.isOwner,
			},
		};
	}

	async revokeOwner(userId: string) {
		const user = await this.prisma.user.findUnique({
			where: { id: userId },
		});

		if (!user) {
			throw new NotFoundException('사용자를 찾을 수 없습니다');
		}

		const updated = await this.prisma.user.update({
			where: { id: userId },
			data: {
				isOwner: false,
			},
		});

		return {
			success: true,
			message: '점주 권한이 해제되었습니다',
			user: {
				id: updated.id,
				nickName: updated.nickName,
				email: updated.email,
				isOwner: updated.isOwner,
			},
		};
	}

	async getOwners() {
		const owners = await this.prisma.user.findMany({
			where: {
				isOwner: true,
				deleted: false,
			},
			select: {
				id: true,
				nickName: true,
				email: true,
				createdAt: true,
				_count: {
					select: {
						OwnedSpaces: true,
					},
				},
			},
			orderBy: { createdAt: 'desc' },
		});

		return owners.map((owner) => ({
			id: owner.id,
			nickName: owner.nickName,
			email: owner.email,
			createdAt: owner.createdAt,
			spaceCount: owner._count.OwnedSpaces,
		}));
	}

	async createSpace(dto: CreateAdminSpaceDTO) {
		const space = await this.prisma.space.create({
			data: {
				name: dto.name,
				nameEn: dto.nameEn,
				latitude: dto.latitude,
				longitude: dto.longitude,
				address: dto.address,
				addressEn: dto.addressEn,
				webLink: dto.webLink || '',
				businessHoursStart: dto.businessHoursStart,
				businessHoursEnd: dto.businessHoursEnd,
				category: dto.category,
				introduction: dto.introduction || '',
				introductionEn: dto.introductionEn,
				imageId: dto.imageId,
				ownerId: dto.ownerId,
				storeStatus: dto.storeStatus || StoreStatus.APPROVED,
			},
			include: {
				owner: {
					select: {
						id: true,
						nickName: true,
						email: true,
					},
				},
				image: {
					select: {
						id: true,
						filename_download: true,
						filename_disk: true,
					},
				},
			},
		});

		return {
			success: true,
			message: '매장이 등록되었습니다',
			space: {
				...space,
				ownerName: space.owner?.nickName,
				ownerEmail: space.owner?.email,
				imageUrl: space.image
					? this.mediaService.getUrl(space.image as any)
					: null,
			},
		};
	}
}
