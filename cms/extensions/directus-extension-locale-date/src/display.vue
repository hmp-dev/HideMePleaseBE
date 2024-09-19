<template>
	<div>{{ new Date(value).toLocaleString() }}</div>
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
});
</script>
