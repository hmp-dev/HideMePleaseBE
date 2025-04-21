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
	<v-table v-if="!loading" :headers="tableHeaders" :items="users" show-resize>
		<template #[`item.userId`]="{ item }">
			<router-link :to="getLinkForItem(item)" class="item-link">
				<display-formatted-value
					type="string"
					:item="item"
					:value="item.userId"
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
	name: 'UserRanking',
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
				text: 'User Id',
				value: 'userId',
				align: 'left',
				description: null,
				width: 350,
			},
			{
				text: 'Nickname',
				value: 'name',
				// sortable: true,
				align: 'left',
				description: null,
			},
			{
				text: 'Points Made',
				value: 'totalPoints',
				align: 'left',
				description: null,
			},
		]);

		const loading = ref(true);
		const users = ref([]);

		async function fetchTopUsers() {
			try {
				loading.value = true;
				const res = await fetch(`/directus-extension-custom-proxy`, {
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json',
					},
					method: 'POST',
					body: JSON.stringify({
						url: `/v1/cms/top-users?${getStartDate(props.timeframe)}`,
					}),
				});

				users.value = await res.json();
			} catch (e) {
				console.log('unable to get top users: ', e);
			} finally {
				loading.value = false;
			}
		}

		watch(
			() => props.timeframe,
			() => {
				fetchTopUsers();
			},
		);
		fetchTopUsers();

		function getLinkForItem(user) {
			return `/content/User/${user.userId}`;
		}

		function downloadCsv() {
			downloadJSONAsCSV(users.value, 'user-ranking');
		}

		return { tableHeaders, users, loading, getLinkForItem, downloadCsv };
	},
};
</script>
