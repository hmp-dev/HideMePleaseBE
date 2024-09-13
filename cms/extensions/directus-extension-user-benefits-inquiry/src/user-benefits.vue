<template>
	<div
		style="
			display: flex;
			justify-content: end;
			gap: 8px;
			margin-bottom: 12px;
		"
	>
		<v-select
			class="custom-select"
			v-model="timeframe"
			:items="selectOptions"
			v-bind="state"
		/>
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

<style>
.custom-select .v-input {
	width: 200px !important;
}
</style>

<script lang="ts">
import { ref, watch } from 'vue';

enum TIMEFRAMES {
	LAST_7_DAYS = 'Last 7 Days',
	LAST_30_DAYS = 'Last 30 Days',
}

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
				text: 'Nickname',
				value: 'nickName',
				align: 'left',
				description: null,
				width: 200,
			},
			{
				text: 'Benefit',
				value: 'benefit',
				align: 'left',
				description: null,
				width: 250,
			},
			{
				text: 'Space',
				value: 'space',
				align: 'left',
				description: null,
				width: 250,
			},
			{
				text: 'Time',
				value: 'createdAt',
				align: 'left',
				description: null,
				width: 200,
			},
			{
				text: 'NFT Name',
				value: 'nftName',
				align: 'left',
				description: null,
				width: 200,
			},
			{
				text: 'Symbol',
				value: 'nftSymbol',
				align: 'left',
				description: null,
				width: 150,
			},
			{
				text: 'Token address',
				value: 'tokenAddress',
				align: 'left',
				description: null,
				width: 250,
			},
		]);

		const loading = ref(true);
		const data = ref([]);

		const selectOptions = [
			{
				text: TIMEFRAMES.LAST_7_DAYS,
				value: TIMEFRAMES.LAST_7_DAYS,
			},
			{
				text: TIMEFRAMES.LAST_30_DAYS,
				value: TIMEFRAMES.LAST_30_DAYS,
			},
			{
				text: TIMEFRAMES.LAST_90_DAYS,
				value: TIMEFRAMES.LAST_90_DAYS,
			},
			{
				text: TIMEFRAMES.ALL,
				value: TIMEFRAMES.ALL,
			},
		];

		const timeframe = ref(TIMEFRAMES.LAST_7_DAYS);

		function getStartDate(timeframe: TIMEFRAMES) {
			const now = new Date();
			switch (timeframe) {
				case TIMEFRAMES.LAST_7_DAYS:
					now.setDate(now.getDate() - 7);
					break;
				case TIMEFRAMES.LAST_30_DAYS:
					now.setDate(now.getDate() - 30);
					break;
			}

			return `startDate=${now.toISOString()}`;
		}

		async function fetchBenefitUsages(userId: string) {
			try {
				loading.value = true;
				const res = await fetch(`/directus-extension-custom-proxy`, {
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json',
					},
					method: 'POST',
					body: JSON.stringify({
						url: `/v1/cms/user/${userId}/benefit-usage?${getStartDate(timeframe.value)}`,
					}),
				});

				data.value = await res.json();

				data.value = data.value.map((item) => ({
					...item,
					createdAt: new Date(item.createdAt).toLocaleString(),
				}));
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
				fetchBenefitUsages(props.primaryKey);
			},
		);

		watch(
			() => timeframe.value,
			() => {
				fetchBenefitUsages(props.primaryKey);
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
			downloadJSONAsCSV(
				data.value,
				`user-benefit-usage-${props.primaryKey}`,
			);
		}

		return {
			tableHeaders,
			data,
			loading,
			downloadCsv,
			selectOptions,
			timeframe,
		};
	},
};
</script>
