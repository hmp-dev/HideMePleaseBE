export function getTodayAt3AM() {
	const time = new Date();
	time.setHours(3);
	time.setMinutes(0);
	time.setSeconds(0);

	return time;
}

export function benefitUsageResetTime() {
	const todayAt3AM = getTodayAt3AM();
	const now = new Date();
	if (todayAt3AM > now) {
		// get 3am yesterday
		todayAt3AM.setDate(todayAt3AM.getDate() - 1);
		return todayAt3AM;
	}

	return todayAt3AM;
}
