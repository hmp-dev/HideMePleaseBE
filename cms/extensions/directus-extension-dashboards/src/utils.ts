import { TIMEFRAMES } from './constants';

export function getStartDate(timeframe: TIMEFRAMES) {
	const now = new Date();
	switch (timeframe) {
		case TIMEFRAMES.ALL:
			return '';
		case TIMEFRAMES.LAST_7_DAYS:
			now.setDate(now.getDate() - 7);
			break;
		case TIMEFRAMES.LAST_30_DAYS:
			now.setDate(now.getDate() - 30);
			break;
		case TIMEFRAMES.LAST_90_DAYS:
			now.setDate(now.getDate() - 90);
			break;
	}

	return `startDate=${now.toISOString()}`;
}

export function downloadJSONAsCSV(jsonData, fileName = 'data') {
	let csvData = jsonToCsv(jsonData); // Add .items.data
	// Create a CSV file and allow the user to download it
	let blob = new Blob([csvData], { type: 'text/csv' });
	let url = window.URL.createObjectURL(blob);
	let a = document.createElement('a');
	a.href = url;
	a.download = `${fileName}-${new Date().toISOString()}.csv`;
	document.body.appendChild(a);
	a.click();
}
function jsonToCsv(jsonData) {
	let csv = '';
	// Get the headers
	let headers = Object.keys(jsonData[0]);
	csv += headers.join(',') + '\n';
	// Add the data
	jsonData.forEach(function (row) {
		let data = headers
			.map((header) => JSON.stringify(row[header]))
			.join(','); // Add JSON.stringify statement
		csv += data + '\n';
	});
	return csv;
}
