<template>
	<div>
		{{ formatted }}
	</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
	props: {
		value: {
			type: String,
			default: null,
		},
	},
	inject: ['value'],
	setup(props) {
		const date = new Date(
			props.value.includes('Z') ? props.value : props.value + 'Z',
		);

		function formatDateToYYYYMMDDHHMM(date) {
			const year = date.getFullYear();
			const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
			const day = String(date.getDate()).padStart(2, '0');
			const hours = String(date.getHours()).padStart(2, '0');
			const minutes = String(date.getMinutes()).padStart(2, '0');

			return `${year}/${month}/${day} ${hours}:${minutes}`;
		}

		return { formatted: formatDateToYYYYMMDDHHMM(date) };
	},
});
</script>
