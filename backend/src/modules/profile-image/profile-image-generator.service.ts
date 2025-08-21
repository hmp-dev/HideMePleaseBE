import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';
import * as crypto from 'crypto';
import * as path from 'path';
import * as fs from 'fs/promises';

export interface ProfileParts {
	gender: 'male' | 'female';
	background: string;
	body: string;
	clothes: string;
	earAccessory?: string;
	eyes: string;
	hair: string;
	nose: string;
}

@Injectable()
export class ProfileImageGeneratorService {
	private readonly logger = new Logger(ProfileImageGeneratorService.name);
	private readonly imageSize = { width: 512, height: 512 };
	private readonly assetsBasePath = path.join(__dirname, '../../assets');

	/**
	 * Parse profile parts from JSON string
	 */
	parseProfileParts(partsString: string): ProfileParts | null {
		try {
			const parts = JSON.parse(partsString);
			if (!this.validateParts(parts)) {
				return null;
			}
			return parts as ProfileParts;
		} catch (error) {
			this.logger.error(`Failed to parse profile parts: ${error instanceof Error ? error.message : String(error)}`);
			return null;
		}
	}

	/**
	 * Validate profile parts structure
	 */
	private validateParts(parts: any): boolean {
		const requiredFields = ['gender', 'background', 'body', 'clothes', 'eyes', 'hair', 'nose'];
		return requiredFields.every(field => field in parts);
	}

	/**
	 * Generate hash from profile parts for caching
	 */
	generatePartsHash(parts: ProfileParts): string {
		const sortedParts = JSON.stringify(parts, Object.keys(parts).sort());
		return crypto.createHash('md5').update(sortedParts).digest('hex');
	}

	/**
	 * Generate profile image from parts
	 */
	async generateImage(parts: ProfileParts): Promise<Buffer> {
		try {
			// Log base paths for debugging
			this.logger.debug(`__dirname: ${__dirname}`);
			this.logger.debug(`assetsBasePath: ${this.assetsBasePath}`);
			this.logger.debug(`process.cwd(): ${process.cwd()}`);

			// Define layer order (bottom to top)
			const layers = [
				parts.background,
				parts.body,
				parts.clothes,
				parts.earAccessory,
				parts.eyes,
				parts.hair,
				parts.nose,
			].filter(Boolean); // Remove undefined/null values

			// Start with transparent base
			let composite = sharp({
				create: {
					width: this.imageSize.width,
					height: this.imageSize.height,
					channels: 4,
					background: { r: 0, g: 0, b: 0, alpha: 0 },
				},
			});

			// Prepare composite layers
			const compositeInputs = [];
			let successCount = 0;
			let failedLayers = [];
			
			for (const layerPath of layers) {
				if (!layerPath) continue; // Skip undefined/null values
				
				// Remove 'assets/' prefix if it exists since assetsBasePath already includes it
				const cleanPath = layerPath.startsWith('assets/') 
					? layerPath.substring(7) // Remove 'assets/' prefix
					: layerPath;
				
				const fullPath = path.join(this.assetsBasePath, cleanPath);
				
				// Log path transformation
				this.logger.debug(`Layer path transformation:`);
				this.logger.debug(`  Original: ${layerPath}`);
				this.logger.debug(`  Clean: ${cleanPath}`);
				this.logger.debug(`  Full: ${fullPath}`);
				
				// Check if file exists
				try {
					await fs.access(fullPath);
					this.logger.debug(`  ✓ File exists: ${fullPath}`);
					compositeInputs.push({
						input: fullPath,
						top: 0,
						left: 0,
					});
					successCount++;
				} catch (error) {
					this.logger.warn(`  ✗ Asset file not found: ${fullPath}`);
					failedLayers.push(fullPath);
					// Continue with other layers if one is missing
				}
			}

			this.logger.debug(`Layer loading summary: ${successCount} success, ${failedLayers.length} failed`);
			if (failedLayers.length > 0) {
				this.logger.warn(`Failed layers: ${failedLayers.join(', ')}`);
			}

			// If no valid layers found, throw error
			if (compositeInputs.length === 0) {
				throw new Error('No valid asset files found for profile parts');
			}

			// Composite all layers
			composite = composite.composite(compositeInputs);

			// Convert to PNG buffer
			const buffer = await composite.png().toBuffer();
			
			return buffer;
		} catch (error) {
			this.logger.error(`Failed to generate image: ${error instanceof Error ? error.message : String(error)}`);
			throw error;
		}
	}

	/**
	 * Generate a placeholder image when assets are not available
	 */
	async generatePlaceholderImage(parts: ProfileParts): Promise<Buffer> {
		try {
			// Create a simple colored square as placeholder
			const colors = {
				male: { r: 100, g: 149, b: 237 }, // Cornflower blue
				female: { r: 255, g: 182, b: 193 }, // Light pink
			};

			const background = colors[parts.gender] || colors.female;

			const svg = `
				<svg width="${this.imageSize.width}" height="${this.imageSize.height}" xmlns="http://www.w3.org/2000/svg">
					<rect width="100%" height="100%" fill="rgb(${background.r}, ${background.g}, ${background.b})" />
					<circle cx="${this.imageSize.width / 2}" cy="${this.imageSize.height / 2}" r="150" fill="rgba(255, 255, 255, 0.3)" />
					<text x="50%" y="50%" font-family="Arial" font-size="24" fill="white" text-anchor="middle" dominant-baseline="middle">
						Profile NFT
					</text>
				</svg>
			`;

			const buffer = await sharp(Buffer.from(svg))
				.png()
				.toBuffer();

			return buffer;
		} catch (error) {
			this.logger.error(`Failed to generate placeholder: ${error instanceof Error ? error.message : String(error)}`);
			throw error;
		}
	}

	/**
	 * Try to generate image with fallback to placeholder
	 */
	async generateImageWithFallback(parts: ProfileParts): Promise<Buffer> {
		try {
			// First, try to generate with actual assets
			return await this.generateImage(parts);
		} catch (error) {
			this.logger.warn(`Falling back to placeholder image: ${error instanceof Error ? error.message : String(error)}`);
			// If assets are missing, generate placeholder
			return await this.generatePlaceholderImage(parts);
		}
	}
}