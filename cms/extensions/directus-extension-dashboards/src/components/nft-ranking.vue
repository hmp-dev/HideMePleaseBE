<template>
	<div style="display: flex; justify-content: end">
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

	<v-table v-if="!loading" :headers="tableHeaders" :items="nfts" show-resize>
		<template #[`item.tokenAddress`]="{ item }">
			<router-link :to="getLinkForItem(item)" class="item-link">
				<display-formatted-value
					type="string"
					:item="item"
					:value="item.tokenAddress"
				/>
			</router-link>
		</template>

		<template #[`item.name`]="{ item }">
			<router-link :to="getLinkForItem(item)" class="item-link">
				<display-formatted-value
					type="string"
					:item="item"
					:value="item.name"
				/>
			</router-link>
		</template>
	</v-table>
</template>

<script>
import { ref, watch } from 'vue';
import { TIMEFRAMES } from '../constants';
import { downloadJSONAsCSV, getStartDate } from '../utils';

export default {
	name: 'NftRanking',
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
				text: 'NFT Token Address',
				value: 'tokenAddress',
				align: 'left',
				description: null,
				width: 250,
			},
			{
				text: 'Name',
				value: 'name',
				// sortable: true,
				align: 'left',
				description: null,
				width: 200,
			},
			{
				text: 'Points Made',
				value: 'totalPoints',
				align: 'left',
				description: null,
			},
		]);

		const loading = ref(true);
		const nfts = ref([]);

		async function fetchTopNfts() {
			try {
				loading.value = true;
				const res = await fetch(`/directus-extension-custom-proxy`, {
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json',
					},
					method: 'POST',
					body: JSON.stringify({
						url: `/v1/cms/top-nfts?${getStartDate(props.timeframe)}`,
					}),
				});

				nfts.value = await res.json();
			} catch (e) {
				console.log('unable to get top nfts: ', e);
			} finally {
				loading.value = false;
			}
		}

		watch(
			() => props.timeframe,
			() => {
				fetchTopNfts();
			},
		);

		fetchTopNfts();

		function getLinkForItem(nft) {
			return `/content/NftCollection/${nft.tokenAddress}`;
		}

		function downloadCsv() {
			downloadJSONAsCSV(nfts.value, 'nft-ranking');
		}

		return { tableHeaders, nfts, loading, getLinkForItem, downloadCsv };
	},
};
</script>
