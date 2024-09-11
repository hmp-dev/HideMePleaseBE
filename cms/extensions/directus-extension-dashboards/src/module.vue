<template>
	<private-view :title="page_title">
		<template v-if="breadcrumb" #headline>
			<v-breadcrumb :items="breadcrumb" />
		</template>
		<template #title-outer:prepend>
			<v-button class="header-icon" rounded disabled icon secondary>
				<v-icon name="person" />
			</v-button>
		</template>
		<template #navigation>
			<page-navigation :current="page" :pages="allPages" />
		</template>
		<template #actions>
			<template>
				<v-select
					class="custom-select"
					v-model="timeframe"
					:items="selectOptions"
					v-bind="state"
				/>
			</template>
		</template>

		<router-view name="dashboards" :page="page" />
		<div class="page-container">
			<user-ranking :timeframe="timeframe" v-if="page === null" />
			<nft-ranking :timeframe="timeframe" v-if="page === 'nft-ranking'" />
			<space-ranking
				:timeframe="timeframe"
				v-if="page === 'space-ranking'"
			/>
		</div>
	</private-view>
</template>

<style>
.page-container {
	margin: 16px;
	padding: 16px;
}

.custom-select .v-input {
	width: 200px !important;
}
</style>

<script lang="ts">
import { defineComponent } from 'vue';
import { ref, watch } from 'vue';
import PageNavigation from './components/navigation.vue';
import UserRanking from './components/user-ranking.vue';
import NftRanking from './components/nft-ranking.vue';
import SpaceRanking from './components/space-ranking.vue';
import { TIMEFRAMES } from './constants';

export default defineComponent({
	components: {
		PageNavigation,
		UserRanking,
		NftRanking,
		SpaceRanking,
	},
	props: {
		page: {
			type: String,
			default: null,
		},
	},

	setup(props) {
		function renderPage(page) {
			if (page === null) {
				pageTitle.value = 'User Ranking';
				breadcrumb.value[1] = {};
			} else {
				switch (page) {
					case 'nft-ranking':
						pageTitle.value = 'NFT Ranking';
						break;
					case 'space-ranking':
						pageTitle.value = 'Space Ranking';
						break;
					default:
						pageTitle.value = '404: Not Found';
				}

				if (page === 'dashboards') {
					breadcrumb.value[1] = {};
				} else {
					breadcrumb.value[1] = {
						name: pageTitle.value,
						to: `/dashboards/${page}`,
					};
				}
			}
		}

		const pageTitle = ref('');
		const breadcrumb = ref([
			{
				name: 'Dashboards',
				to: `/dashboards`,
			},
		]);
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

		const allPages = ref([
			{
				label: 'User Ranking',
				uri: 'dashboards',
				to: '/dashboards',
				icon: 'person',
				color: '',
			},
			{
				label: 'NFT Ranking',
				uri: 'nft-ranking',
				to: '/dashboards/nft-ranking',
				icon: 'public',
				color: '',
			},
			{
				label: 'Space Ranking',
				uri: 'space-ranking',
				to: '/dashboards/space-ranking',
				icon: 'public',
				color: '',
			},
		]);

		renderPage(props.page);

		watch(
			() => props.page,
			() => {
				renderPage(props.page);
				timeframe.value = TIMEFRAMES.LAST_7_DAYS;
			},
		);

		return {
			page_title: pageTitle,
			breadcrumb,
			allPages,
			selectOptions,
			timeframe,
		};
	},
});
</script>
