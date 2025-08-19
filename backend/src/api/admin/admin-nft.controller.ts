import {
	Body,
	Controller,
	Delete,
	HttpCode,
	HttpStatus,
	Param,
	Post,
	Put,
	UploadedFile,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
	ApiBearerAuth,
	ApiBody,
	ApiConsumes,
	ApiOperation,
	ApiParam,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

import { AdminNftService } from '@/api/admin/admin-nft.service';
import {
	CreateUserNftMetadataDTO,
	UpdateUserNftMetadataDTO,
	SetUserImageDTO,
} from '@/api/admin/admin-nft.dto';
import { AuthGuard } from '@/api/auth/auth.guard';
import { UserPermissionsGuard } from '@/api/auth/user-permission.guard';
import { SetAccessRoles } from '@/api/auth/role.decorator';

const multerOptions = {
	storage: diskStorage({
		destination: './uploads/profiles',
		filename: (_req, file, callback) => {
			const fileExtName = path.extname(file.originalname);
			const fileName = `${uuidv4()}${fileExtName}`;
			callback(null, fileName);
		},
	}),
	fileFilter: (_req: any, file: any, callback: any) => {
		if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
			return callback(new Error('Only image files are allowed'), false);
		}
		callback(null, true);
	},
	limits: {
		fileSize: 5 * 1024 * 1024, // 5MB
	},
};

@ApiTags('Admin NFT')
@ApiBearerAuth()
@Controller('admin/nft')
@UseGuards(AuthGuard, UserPermissionsGuard)
export class AdminNftController {
	constructor(private adminNftService: AdminNftService) {}

	@ApiOperation({
		summary: 'Create user NFT metadata',
		description: '사용자 NFT 메타데이터를 생성합니다 (관리자 권한 필요)',
	})
	@ApiParam({
		name: 'userId',
		type: 'string',
		description: '사용자 ID',
	})
	@ApiBody({
		type: CreateUserNftMetadataDTO,
	})
	@ApiResponse({
		status: 201,
		description: 'NFT 메타데이터 생성 성공',
	})
	@ApiResponse({
		status: 404,
		description: '사용자를 찾을 수 없음',
	})
	@SetAccessRoles('SPACE_ADMIN')
	@Post('user/:userId/profile')
	async createUserNftMetadata(
		@Param('userId') userId: string,
		@Body() dto: CreateUserNftMetadataDTO,
	) {
		await this.adminNftService.createUserNftMetadata(userId, dto);
		return { success: true, message: 'NFT metadata created successfully' };
	}

	@ApiOperation({
		summary: 'Update user NFT metadata',
		description: '사용자 NFT 메타데이터를 업데이트합니다 (관리자 권한 필요)',
	})
	@ApiParam({
		name: 'userId',
		type: 'string',
		description: '사용자 ID',
	})
	@ApiBody({
		type: UpdateUserNftMetadataDTO,
	})
	@ApiResponse({
		status: 200,
		description: 'NFT 메타데이터 업데이트 성공',
	})
	@ApiResponse({
		status: 404,
		description: '사용자를 찾을 수 없음',
	})
	@SetAccessRoles('SPACE_ADMIN')
	@Put('user/:userId/profile')
	async updateUserNftMetadata(
		@Param('userId') userId: string,
		@Body() dto: UpdateUserNftMetadataDTO,
	) {
		await this.adminNftService.updateUserNftMetadata(userId, dto);
		return { success: true, message: 'NFT metadata updated successfully' };
	}

	@ApiOperation({
		summary: 'Set user profile image',
		description: '사용자 프로필 이미지 URL 또는 경로를 설정합니다 (관리자 권한 필요)',
	})
	@ApiParam({
		name: 'userId',
		type: 'string',
		description: '사용자 ID',
	})
	@ApiBody({
		type: SetUserImageDTO,
	})
	@ApiResponse({
		status: 200,
		description: '이미지 설정 성공',
	})
	@ApiResponse({
		status: 400,
		description: 'imageUrl 또는 imagePath가 필요함',
	})
	@ApiResponse({
		status: 404,
		description: '사용자를 찾을 수 없음',
	})
	@SetAccessRoles('SPACE_ADMIN')
	@Put('user/:userId/image')
	async setUserImage(
		@Param('userId') userId: string,
		@Body() dto: SetUserImageDTO,
	) {
		await this.adminNftService.setUserImage(userId, dto);
		return { success: true, message: 'User image set successfully' };
	}

	@ApiOperation({
		summary: 'Upload user profile image',
		description: '사용자 프로필 이미지 파일을 업로드합니다 (관리자 권한 필요)',
	})
	@ApiParam({
		name: 'userId',
		type: 'string',
		description: '사용자 ID',
	})
	@ApiConsumes('multipart/form-data')
	@ApiBody({
		schema: {
			type: 'object',
			properties: {
				file: {
					type: 'string',
					format: 'binary',
				},
			},
		},
	})
	@ApiResponse({
		status: 201,
		description: '이미지 업로드 성공',
		schema: {
			example: {
				success: true,
				imagePath: '/uploads/profiles/userId/filename.png',
			},
		},
	})
	@ApiResponse({
		status: 400,
		description: '잘못된 파일 형식',
	})
	@ApiResponse({
		status: 404,
		description: '사용자를 찾을 수 없음',
	})
	@SetAccessRoles('SPACE_ADMIN')
	@Post('user/:userId/image/upload')
	@UseInterceptors(FileInterceptor('file', multerOptions))
	async uploadUserImage(
		@Param('userId') userId: string,
		@UploadedFile() file: Express.Multer.File,
	) {
		if (!file) {
			throw new Error('No file uploaded');
		}

		const result = await this.adminNftService.uploadUserImage(userId, file);
		return { success: true, ...result };
	}

	@ApiOperation({
		summary: 'Delete user NFT metadata',
		description: '사용자 NFT 메타데이터를 삭제합니다 (관리자 권한 필요)',
	})
	@ApiParam({
		name: 'userId',
		type: 'string',
		description: '사용자 ID',
	})
	@ApiResponse({
		status: 204,
		description: 'NFT 메타데이터 삭제 성공',
	})
	@ApiResponse({
		status: 404,
		description: '사용자를 찾을 수 없음',
	})
	@SetAccessRoles('SPACE_ADMIN')
	@Delete('user/:userId/profile')
	@HttpCode(HttpStatus.NO_CONTENT)
	async deleteUserNftMetadata(@Param('userId') userId: string) {
		await this.adminNftService.deleteUserNftMetadata(userId);
	}
}