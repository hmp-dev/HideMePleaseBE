<template>
	<div
		style="
			display: flex;
			justify-content: space-between;
			margin-bottom: 8px;
		"
	>
		<v-select
			class="custom-select"
			v-model="selectedOption"
			:items="selectOptions"
			v-bind="state"
		/>
		<v-button rounded icon @click="downloadCsv">
			<v-icon name="download"></v-icon>
		</v-button>
	</div>

	<div v-if="loading">
		<v-skeleton-loader />
		<br />
		<v-skeleton-loader />
		<br />
		<v-skeleton-loader />
		<br />
		<v-skeleton-loader />
	</div>

	<v-table
		v-if="!loading"
		:headers="tableHeaders"
		:items="usages"
		show-resize
	>
		<template #[`item.createdAt`]="{ item }">
			<p>{{ new Date(item.createdAt).toLocaleString() }}</p>
		</template>
	</v-table>
</template>

<script>
import { ref, watch } from 'vue';
import { TIMEFRAMES } from '../constants';
import { downloadJSONAsCSV, getStartDate } from '../utils';

export default {
	name: 'SystemBenefitUsages',
	inheritAttrs: false,
	props: {
		timeframe: {
			type: String,
			default: TIMEFRAMES.ALL,
		},
	},
	setup(props) {
		const tableHeaders = ref([
			{
				text: 'Space Name',
				value: 'spaceName',
				align: 'left',
				description: null,
				width: 200,
			},
			{
				text: 'Benefit',
				value: 'benefitDescription',
				align: 'left',
				description: null,
				width: 300,
			},
			{
				text: 'User Nickname',
				value: 'userName',
				align: 'left',
				description: null,
				width: 150,
			},
			{
				text: 'User Email',
				value: 'userEmail',
				align: 'left',
				description: null,
				width: 150,
			},
			{
				text: 'Created At',
				value: 'createdAt',
				align: 'left',
				description: null,
				width: 200,
			},
			{
				text: 'Nft Name',
				value: 'nftName',
				align: 'left',
				description: null,
				width: 200,
			},
			{
				text: 'Nft Symbol',
				value: 'nftSymbol',
				align: 'left',
				description: null,
				width: 100,
			},
			{
				text: 'Nft Chain',
				value: 'nftChain',
				align: 'left',
				description: null,
				width: 100,
			},
			{
				text: 'Token Address',
				value: 'tokenAddress',
				align: 'left',
				description: null,
				width: 250,
			},
		]);

		const loading = ref(true);
		const usages = ref([]);
		const selectOptions = ref([]);
		const selectedOption = ref(null);

		async function fetchBenefitUsages() {
			if (!selectOptions.value.length) {
				return;
			}
			try {
				loading.value = true;
				const res = await fetch(`/directus-extension-custom-proxy`, {
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json',
					},
					method: 'POST',
					body: JSON.stringify({
						url: `/v1/cms/nft/${selectedOption.value}/benefit-usage?${getStartDate(props.timeframe)}`,
					}),
				});

				usages.value = await res.json();
			} catch (e) {
				console.log('unable to get top usages: ', e);
			} finally {
				loading.value = false;
			}
		}

		async function fetchSystemBenefits() {
			try {
				loading.value = true;
				const res = await fetch(`/directus-extension-custom-proxy`, {
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json',
					},
					method: 'POST',
					body: JSON.stringify({
						url: `/v1/cms/system-nfts`,
					}),
				});

				const data = await res.json();
				selectOptions.value = data.map((item) => ({
					text: item.name,
					value: item.tokenAddress,
				}));
				selectedOption.value = selectOptions.value[0].value;
				void fetchBenefitUsages();
			} catch (e) {
				console.log('unable to get top usages: ', e);
			} finally {
				loading.value = false;
			}
		}

		watch(
			() => props.timeframe,
			() => {
				fetchBenefitUsages();
			},
		);

		watch(
			() => selectedOption.value,
			() => {
				fetchBenefitUsages();
			},
		);
		fetchSystemBenefits();

		function downloadCsv() {
			downloadJSONAsCSV(usages.value, 'nft-benefit-usage');
		}

		return {
			tableHeaders,
			usages,
			loading,
			downloadCsv,
			selectOptions,
			selectedOption,
		};
	},
};
</script>
