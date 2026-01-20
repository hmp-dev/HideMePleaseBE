import { Module } from '@nestjs/common';

import { AuthModule } from '@/api/auth/auth.module';
import { ReservationController } from '@/api/reservation/reservation.controller';
import { ReservationService } from '@/api/reservation/reservation.service';

@Module({
	imports: [AuthModule],
	controllers: [ReservationController],
	providers: [ReservationService],
	exports: [ReservationService],
})
export class ReservationModule {}
