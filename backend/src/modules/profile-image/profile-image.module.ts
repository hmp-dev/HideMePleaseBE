import { Module } from '@nestjs/common';
import { ProfileImageGeneratorService } from './profile-image-generator.service';
import { ProfileImageCacheService } from './profile-image-cache.service';

@Module({
	providers: [ProfileImageGeneratorService, ProfileImageCacheService],
	exports: [ProfileImageGeneratorService, ProfileImageCacheService],
})
export class ProfileImageModule {}