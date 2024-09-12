<template>
	<div style="display: flex; justify-content: end; margin-bottom: 4px">
		<v-button rounded icon @click="downloadCsv">
			<v-icon name="download"></v-icon>
		</v-button>
	</div>
	<div v-if="loading">
		<v-skeleton-loader />
	</div>

	<v-table v-if="!loading" :headers="tableHeaders" :items="data" show-resize>
	</v-table>
</template>

<script lang="ts">
import { ref, watch } from 'vue';

export default {
	props: {
		primaryKey: {
			type: String,
			default: null,
		},
	},
	setup(props) {
		const tableHeaders = ref([
			{
				text: 'Usage Frequency 7 Days',
				value: 'usageFrequency7Day',
				align: 'left',
				description: null,
				width: 250,
			},
			{
				text: 'Usage Frequency 30 Days',
				value: 'usageFrequency30Day',
				align: 'left',
				description: null,
				width: 250,
			},
		]);

		const loading = ref(true);
		const data = ref([]);

		async function fetchUsageFrequency(tokenAddress: string) {
			try {
				loading.value = true;
				const res = await fetch(`/directus-extension-custom-proxy`, {
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json',
					},
					method: 'POST',
					body: JSON.stringify({
						url: `/v1/cms/nft-usage-frequency/${tokenAddress}`,
					}),
				});

				const jsonRes = await res.json();
				data.value = [jsonRes];

				console.log('data va', data.value);
			} catch (e) {
				console.log('unable to get nft usage frequency: ', e);
			} finally {
				loading.value = false;
			}
		}

		watch(
			() => props.primaryKey,
			() => {
				if (props.primaryKey?.length < 3) {
					return;
				}
				fetchUsageFrequency(props.primaryKey);
			},
		);

		function downloadJSONAsCSV(jsonData, fileName = 'data') {
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

		function downloadCsv() {
			downloadJSONAsCSV(data.value, `nft-usage-${props.primaryKey}`);
		}

		return { tableHeaders, data, loading, downloadCsv };
	},
};
</script>
