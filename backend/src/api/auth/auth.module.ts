import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AuthController } from '@/api/auth/auth.controller';
import { AuthGuard } from '@/api/auth/auth.guard';
import { AuthService } from '@/api/auth/auth.service';
import { EnsureUserService } from '@/api/auth/ensure-user.service';
import { CACHE_TTL } from '@/constants';
import { FirebaseModule } from '@/modules/firebase/firebase.module';

@Module({
	imports: [
		PassportModule,
		ConfigModule,
		JwtModule.register({
			global: true,
			secret: process.env.JWT_SECRET,
			signOptions: { expiresIn: CACHE_TTL.ONE_MONTH_IN_SECONDS },
		}),
		FirebaseModule,
	],
	controllers: [AuthController],
	providers: [AuthGuard, AuthService, EnsureUserService],
	exports: [AuthGuard, EnsureUserService],
})
export class AuthModule {}
