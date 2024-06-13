import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginType } from '@prisma/client';

import { FirebaseLoginDTO, WorldcoinLoginDTO } from '@/api/auth/auth.dto';
import { EnsureUserService } from '@/api/auth/ensure-user.service';
import { FirebaseService } from '@/modules/firebase/firebase.service';
import { WorldcoinService } from '@/modules/worldcoin/worldcoin.service';
import { AuthContext } from '@/types';

@Injectable()
export class AuthService {
	constructor(
		private firebaseService: FirebaseService,
		private jwtService: JwtService,
		private worldcoinService: WorldcoinService,
		private ensureUserService: EnsureUserService,
	) {}

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

		return this.jwtService.signAsync(authContext);
	}
}
