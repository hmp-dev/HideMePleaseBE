<template>
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
import { ref } from 'vue';

export default {
	name: 'UserRanking',
	inheritAttrs: false,
	props: {},
	setup() {
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
				const res = await fetch(`/directus-extension-custom-proxy`, {
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json',
					},
					method: 'POST',
					body: JSON.stringify({
						url: '/v1/cms/top-users',
					}),
				});

				users.value = await res.json();
			} catch (e) {
				console.log('unable to get top users: ', e);
			} finally {
				loading.value = false;
			}
		}

		fetchTopUsers();

		function getLinkForItem(user) {
			return `/content/User/${user.userId}`;
		}

		return { tableHeaders, users, loading, getLinkForItem };
	},
};
</script>
