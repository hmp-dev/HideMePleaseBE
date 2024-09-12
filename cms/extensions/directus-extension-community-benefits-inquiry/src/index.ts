import { defineInterface } from '@directus/extensions';
import CommunityBenefits from './community-benefits.vue';

export default defineInterface({
	id: 'community-benefits',
	name: 'Community Benefits',
	description: 'Custom interface for showing community benefits',
	icon: 'box',
	component: CommunityBenefits,
	types: ['alias'],
	localTypes: ['presentation'],
	group: 'presentation',
});
