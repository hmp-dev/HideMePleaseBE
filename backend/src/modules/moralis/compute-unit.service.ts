import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';

import { EnvironmentVariables } from '@/utils/env';
import { sleep } from '@/utils/timer';

// const BACK_OFF_TIME_IN_MS = 1500;

const MIN_BACK_OFF_TIME_IN_MS = 1000;
interface ComputeUnit {
	amount: number;
	creationTime: Date;
}

@Injectable()
export class ComputeUnitService {
	totalComputeUnits: number;
	availableUnits: number;
	// private readonly logger = new Logger(ComputeUnitService.name);

	executorQueue: {
		resolver: (value: ComputeUnit) => void;
		computeUnits: number;
	}[] = [];
	constructor(
		private configService: ConfigService<EnvironmentVariables, true>,
	) {
		this.totalComputeUnits = this.availableUnits = Number(
			this.configService.get('MORALIS_CU_PER_SECOND'),
		);
	}

	createPromise(): [Promise<ComputeUnit>, (value: ComputeUnit) => void] {
		let resolver: (value: ComputeUnit) => void;

		return [
			new Promise((resolve) => {
				resolver = resolve;
			}),
			// @ts-expect-error this is okay
			resolver,
		];
	}

	async requestComputeUnits(computeUnits: number): Promise<ComputeUnit> {
		if (this.availableUnits >= computeUnits) {
			this.availableUnits -= computeUnits;
			// this.logger.log(`Consuming ${computeUnits} units, remaining: ${this.availableUnits}`);

			return {
				amount: computeUnits,
				creationTime: new Date(),
			};
		}

		// this.logger.log(`Compute units not available at this time, pushing to waiting queue for ${computeUnits} units`);

		const [promise, resolver] = this.createPromise();
		this.executorQueue.push({ resolver, computeUnits });

		return promise;
	}

	async releaseComputeUnits(computeUnit: ComputeUnit) {
		this.processExecutorQueue();
		// const releaseTime = new Date();
		// const diffInMs = releaseTime.getTime() - computeUnit.creationTime.getTime();

		// if (diffInMs < BACK_OFF_TIME_IN_MS) {
		await sleep(MIN_BACK_OFF_TIME_IN_MS);
		// }

		this.availableUnits += computeUnit.amount;
		// this.logger.log(`Released ${computeUnit.amount}, have ${this.availableUnits}`);
		this.processExecutorQueue();
	}

	@Cron(CronExpression.EVERY_SECOND)
	private processExecutorQueue() {
		const [head] = this.executorQueue;
		if (!head) {
			return;
		}
		if (this.availableUnits >= head.computeUnits) {
			this.availableUnits -= head.computeUnits;
			// this.logger.log(`Executor queue consuming ${head.computeUnits}, available: ${this.availableUnits}`);
			head.resolver({
				amount: head.computeUnits,
				creationTime: new Date(),
			});
			this.executorQueue.shift();
		}
	}
}
