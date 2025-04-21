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
	<v-table
		v-if="!loading"
		:headers="tableHeaders"
		:items="spaces"
		show-resize
	>
		<template #[`item.spaceId`]="{ item }">
			<router-link :to="getLinkForItem(item)" class="item-link">
				<display-formatted-value
					type="string"
					:item="item"
					:value="item.spaceId"
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
	name: 'SpaceRanking',
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
				text: 'Space Id',
				value: 'spaceId',
				align: 'left',
				description: null,
				width: 350,
			},
			{
				text: 'Space Name',
				value: 'name',
				// sortable: true,
				align: 'left',
				width: 350,
				description: null,
			},
			{
				text: 'Points Distributed',
				value: 'totalPoints',
				align: 'left',
				description: null,
			},
		]);

		const loading = ref(true);
		const spaces = ref([]);

		async function fetchTopSpaces() {
			try {
				loading.value = true;
				const res = await fetch(`/directus-extension-custom-proxy`, {
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json',
					},
					method: 'POST',
					body: JSON.stringify({
						url: `/v1/cms/top-spaces?${getStartDate(props.timeframe)}`,
					}),
				});

				spaces.value = await res.json();
			} catch (e) {
				console.log('unable to get top spaces: ', e);
			} finally {
				loading.value = false;
			}
		}

		watch(
			() => props.timeframe,
			() => {
				fetchTopSpaces();
			},
		);

		fetchTopSpaces();

		function getLinkForItem(space) {
			return `/content/Space/${space.spaceId}`;
		}

		function downloadCsv() {
			downloadJSONAsCSV(spaces.value, 'space-ranking');
		}

		return { tableHeaders, spaces, loading, getLinkForItem, downloadCsv };
	},
};
</script>
