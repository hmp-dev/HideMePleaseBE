import { Injectable } from '@nestjs/common';

import { MediaService } from '@/modules/media/media.service';

@Injectable()
export class CmsService {
	constructor(private mediaService: MediaService) {}

	async uploadImage({
		file,
	}: {
		request: Request;
		file: Express.Multer.File;
	}) {
		const media = await this.mediaService.uploadMedia(file);

		return this.mediaService.getUrl(media);
	}
}
