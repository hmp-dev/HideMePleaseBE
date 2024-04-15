import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { FirebaseLoginDTO, WorldcoinLoginDTO } from '@/api/auth/auth.dto';
import { FirebaseService } from '@/modules/firebase/firebase.service';
import { WorldcoinService } from '@/modules/worldcoin/worldcoin.service';
import { AuthContext, LoginType } from '@/types';

@Injectable()
export class AuthService {
	constructor(
		private firebaseService: FirebaseService,
		private jwtService: JwtService,
		private worldcoinService: WorldcoinService,
	) {}

	async firebaseLogin({
		firebaseLoginDTO: { token },
	}: {
		firebaseLoginDTO: FirebaseLoginDTO;
	}) {
		const decodedIdToken =
			await this.firebaseService.decodeBearerToken(token);

		const authContext: AuthContext = {
			firebaseId: decodedIdToken.uid,
			loginType: LoginType.FIREBASE,
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

		const authContext: AuthContext = {
			loginType: LoginType.WORLDCOIN,
			nullifierHash,
		};

		return this.jwtService.signAsync(authContext);
	}
}
