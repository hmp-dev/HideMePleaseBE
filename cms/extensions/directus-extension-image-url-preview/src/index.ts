import { defineInterface } from '@directus/extensions-sdk';

import InterfaceComponent from './interface.vue';

export default defineInterface({
	id: 'image-url-preview',
	name: 'Image url preview',
	icon: 'box',
	description: 'Custom preview for image url',
	component: InterfaceComponent,
	types: ['string', 'text', 'unknown'],
});
