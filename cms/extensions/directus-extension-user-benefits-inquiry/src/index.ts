import { defineInterface } from '@directus/extensions';
import UserBenefits from './user-benefits.vue';

export default defineInterface({
	id: 'user-benefits',
	name: 'User Benefits',
	description: 'Custom interface for showing user benefits',
	icon: 'box',
	component: UserBenefits,
	types: ['alias'],
	localTypes: ['presentation'],
	group: 'presentation',
	options: [],
});
