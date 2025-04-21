import { defineDisplay } from '@directus/extensions-sdk';
import DisplayComponent from './display.vue';

export default defineDisplay({
	id: 'locale-date',
	name: 'Locale Date',
	icon: 'box',
	description: 'Shows local date',
	component: DisplayComponent,
	options: null,
	types: ['date', 'dateTime', 'time', 'timestamp'],
});
