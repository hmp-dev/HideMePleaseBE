export function getNumberWithOrdinal(num: number) {
	const s = ['th', 'st', 'nd', 'rd'],
		v = num % 100;
	return num + (s[(v - 20) % 10] || s[v] || s[0]);
}
