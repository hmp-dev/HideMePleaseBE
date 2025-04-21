import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginType } from '@prisma/client';
import type { Cache } from 'cache-manager';

import { FirebaseLoginDTO, WorldcoinLoginDTO } from '@/api/auth/auth.dto';
import { worldAuthTokenCacheKey } from '@/api/auth/auth.utils';
import { EnsureUserService } from '@/api/auth/ensure-user.service';
import { FirebaseService } from '@/modules/firebase/firebase.service';
import { WorldcoinService } from '@/modules/worldcoin/worldcoin.service';
import { AuthContext } from '@/types';
import { ErrorCodes } from '@/utils/errorCodes';

@Injectable()
export class AuthService {
	constructor(
		private firebaseService: FirebaseService,
		private jwtService: JwtService,
		private worldcoinService: WorldcoinService,
		private ensureUserService: EnsureUserService,
		@Inject(CACHE_MANAGER) private cacheManager: Cache,
	) {
		setTimeout(() => {
			this.jwtService
				.signAsync({ userId: '217e5a68-8e15-4f2b-8679-a30de7699cec' })
				.then(token => {
					console.log('Test Token:', token);
				});
		}, 3000);
	}

	async firebaseLogin({
		firebaseLoginDTO: { token },
	}: {
		firebaseLoginDTO: FirebaseLoginDTO;
	}) {
		const decodedIdToken =
			await this.firebaseService.decodeBearerToken(token);

		console.log('decodedIdToken', decodedIdToken);

		const partialContext = {
			firebaseId: decodedIdToken.uid,
			loginType: LoginType.FIREBASE,
		};

		const user = await this.ensureUserService.getOrCreateUser({
			authContext: partialContext,
			name: decodedIdToken['name'] as string,
			email: decodedIdToken['email'] as string,
		});

		const authContext: AuthContext = {
			...partialContext,
			userId: user.id,
		};

		return this.jwtService.signAsync(authContext);
	}

	async worldcoinLogin({
		worldcoinLoginDTO,
	}: {
		worldcoinLoginDTO: WorldcoinLoginDTO;
	}) {
		const nullifierHash =
			await this.worldcoinService.verifyCredentials(worldcoinLoginDTO);

		const partialContext = {
			loginType: LoginType.WORLD_ID,
			nullifierHash,
		};

		const user = await this.ensureUserService.getOrCreateUser({
			authContext: partialContext,
		});

		const authContext: AuthContext = {
			...partialContext,
			userId: user.id,
		};

		const signedJwt = await this.jwtService.signAsync(authContext);
		await this.cacheManager.set(
			worldAuthTokenCacheKey(worldcoinLoginDTO.appVerifierId),
			signedJwt,
		);
	}

	async exchangeWorldToken({ appVerifierId }: { appVerifierId: string }) {
		const token = await this.cacheManager.get(
			worldAuthTokenCacheKey(appVerifierId),
		);
		if (token) {
			await this.cacheManager.del(worldAuthTokenCacheKey(appVerifierId));
			return token;
		}

		throw new BadRequestException(ErrorCodes.VERIFIER_DOES_NOT_EXIST);
	}
}
