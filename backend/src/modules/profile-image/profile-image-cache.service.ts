import { Injectable, Logger } from '@nestjs/common';
import { LRUCache } from 'lru-cache';
import * as fs from 'fs/promises';
import * as path from 'path';

interface CacheEntry {
	buffer: Buffer;
	timestamp: number;
}

@Injectable()
export class ProfileImageCacheService {
	private readonly logger = new Logger(ProfileImageCacheService.name);
	private readonly memoryCache: LRUCache<string, CacheEntry>;
	private readonly cacheDir = path.join(process.cwd(), 'uploads', 'profile-cache');
	private readonly maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

	constructor() {
		// Initialize LRU cache with max 100 items and 100MB size
		this.memoryCache = new LRUCache<string, CacheEntry>({
			max: 100, // Maximum number of items
			maxSize: 100 * 1024 * 1024, // 100MB max size
			sizeCalculation: (value) => value.buffer.length,
			ttl: this.maxAge, // Time to live
			updateAgeOnGet: true, // Reset TTL on access
		});

		// Ensure cache directory exists
		this.ensureCacheDirectory();
	}

	/**
	 * Ensure cache directory exists
	 */
	private async ensureCacheDirectory(): Promise<void> {
		try {
			await fs.mkdir(this.cacheDir, { recursive: true });
			this.logger.log(`Cache directory ensured at: ${this.cacheDir}`);
		} catch (error) {
			this.logger.error(`Failed to create cache directory: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	/**
	 * Generate cache key
	 */
	getCacheKey(userId: string, partsHash: string): string {
		return `${userId}-${partsHash}`;
	}

	/**
	 * Get cached image from memory or file system
	 */
	async get(key: string): Promise<Buffer | null> {
		// Try memory cache first
		const memoryEntry = this.memoryCache.get(key);
		if (memoryEntry) {
			this.logger.debug(`Cache hit (memory): ${key}`);
			return memoryEntry.buffer;
		}

		// Try file cache
		const filePath = this.getFilePath(key);
		try {
			const stats = await fs.stat(filePath);
			
			// Check if file is expired
			if (Date.now() - stats.mtime.getTime() > this.maxAge) {
				this.logger.debug(`Cache expired (file): ${key}`);
				await this.deleteFile(key);
				return null;
			}

			const buffer = await fs.readFile(filePath);
			
			// Store in memory cache for faster subsequent access
			this.memoryCache.set(key, {
				buffer,
				timestamp: stats.mtime.getTime(),
			});

			this.logger.debug(`Cache hit (file): ${key}`);
			return buffer;
		} catch (error: any) {
			// File doesn't exist or error reading
			if (error?.code !== 'ENOENT') {
				this.logger.error(`Error reading cache file: ${error instanceof Error ? error.message : String(error)}`);
			}
			return null;
		}
	}

	/**
	 * Set cache with image buffer
	 */
	async set(key: string, buffer: Buffer): Promise<void> {
		try {
			const entry: CacheEntry = {
				buffer,
				timestamp: Date.now(),
			};

			// Store in memory cache
			this.memoryCache.set(key, entry);

			// Store in file system
			const filePath = this.getFilePath(key);
			await fs.writeFile(filePath, buffer);

			this.logger.debug(`Cache set: ${key} (${buffer.length} bytes)`);
		} catch (error) {
			this.logger.error(`Failed to set cache: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	/**
	 * Delete cache entry
	 */
	async delete(key: string): Promise<void> {
		// Remove from memory cache
		this.memoryCache.delete(key);

		// Remove from file system
		await this.deleteFile(key);

		this.logger.debug(`Cache deleted: ${key}`);
	}

	/**
	 * Clear all cache
	 */
	async clear(): Promise<void> {
		// Clear memory cache
		this.memoryCache.clear();

		// Clear file cache
		try {
			const files = await fs.readdir(this.cacheDir);
			await Promise.all(
				files.map(file => fs.unlink(path.join(this.cacheDir, file)))
			);
			this.logger.log('All cache cleared');
		} catch (error) {
			this.logger.error(`Failed to clear file cache: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	/**
	 * Get file path for cache key
	 */
	private getFilePath(key: string): string {
		return path.join(this.cacheDir, `${key}.png`);
	}

	/**
	 * Delete file from cache
	 */
	private async deleteFile(key: string): Promise<void> {
		try {
			const filePath = this.getFilePath(key);
			await fs.unlink(filePath);
		} catch (error: any) {
			if (error?.code !== 'ENOENT') {
				this.logger.error(`Failed to delete cache file: ${error instanceof Error ? error.message : String(error)}`);
			}
		}
	}

	/**
	 * Clean up expired cache files
	 */
	async cleanupExpired(): Promise<void> {
		try {
			const files = await fs.readdir(this.cacheDir);
			const now = Date.now();
			let deletedCount = 0;

			for (const file of files) {
				const filePath = path.join(this.cacheDir, file);
				const stats = await fs.stat(filePath);

				if (now - stats.mtime.getTime() > this.maxAge) {
					await fs.unlink(filePath);
					deletedCount++;
				}
			}

			if (deletedCount > 0) {
				this.logger.log(`Cleaned up ${deletedCount} expired cache files`);
			}
		} catch (error) {
			this.logger.error(`Failed to cleanup expired cache: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	/**
	 * Get cache statistics
	 */
	getStats(): {
		memoryCount: number;
		memorySize: number;
		maxMemorySize: number;
	} {
		return {
			memoryCount: this.memoryCache.size,
			memorySize: this.memoryCache.calculatedSize || 0,
			maxMemorySize: 100 * 1024 * 1024, // 100MB
		};
	}
}