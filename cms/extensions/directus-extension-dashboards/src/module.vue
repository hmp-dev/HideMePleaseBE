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
		<!--		<template #actions>-->
		<!--			<v-input class="module-search" :model-value="search">-->
		<!--				<template #prepend><v-icon name="search" /></template>-->
		<!--			</v-input>-->
		<!--			<v-button v-tooltip.bottom="'COOL'" icon rounded>-->
		<!--				<v-icon name="launch" />-->
		<!--			</v-button>-->
		<!--		</template>-->

		<router-view name="dashboards" :page="page" />
		<div class="page-container">
			<user-ranking v-if="page === null" />
			<nft-ranking v-if="page === 'nft-ranking'" />
		</div>
	</private-view>
</template>

<style>
.page-container {
	margin: 16px;
	padding: 16px;
}
</style>

<script lang="ts">
import { defineComponent } from 'vue';
import { ref, watch } from 'vue';
import { useApi } from '@directus/extensions-sdk';
import PageNavigation from './components/navigation.vue';
import UserRanking from './components/user-ranking.vue';
import NftRanking from './components/nft-ranking.vue';
export default defineComponent({
	components: {
		PageNavigation,
		UserRanking,
		NftRanking,
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

		const api = useApi();
		const pageTitle = ref('');
		const breadcrumb = ref([
			{
				name: 'Dashboards',
				to: `/dashboards`,
			},
		]);

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
		]);

		renderPage(props.page);

		watch(
			() => props.page,
			() => {
				renderPage(props.page);
			},
		);

		return { page_title: pageTitle, breadcrumb, allPages };
	},
});
</script>
