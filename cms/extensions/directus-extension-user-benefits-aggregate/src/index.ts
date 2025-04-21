import { defineInterface } from '@directus/extensions';
import UserBenefitsAggregate from './user-benefits-aggregate.vue';

export default defineInterface({
	id: 'user-benefits-aggregate',
	name: 'User Benefits Aggregate',
	description: 'Custom interface for showing User benefits aggregate',
	icon: 'box',
	component: UserBenefitsAggregate,
	types: ['alias'],
	localTypes: ['presentation'],
	group: 'presentation',
	options: [],
});
