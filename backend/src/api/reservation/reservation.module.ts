import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { AuthModule } from '@/api/auth/auth.module';
import { AgentReservationController } from '@/api/reservation/agent-reservation.controller';
import { ReservationController } from '@/api/reservation/reservation.controller';
import { ReservationService } from '@/api/reservation/reservation.service';

@Module({
	imports: [AuthModule, ScheduleModule.forRoot()],
	controllers: [ReservationController, AgentReservationController],
	providers: [ReservationService],
	exports: [ReservationService],
})
export class ReservationModule {}
