<template>
	<div class="container">
		<img class="thumbnail" v-bind:src="value" alt="" />
	</div>
</template>

<style>
.container {
	padding: 16px;
	display: flex;
	justify-content: center;

	border-radius: var(--theme--border-radius);
	border: var(--theme--border-width) solid
		var(
			--v-list-item-border-color,
			var(--theme--form--field--input--border-color)
		);
}
.thumbnail {
	max-height: 280px;
}
</style>

<script lang="ts">
export default {
	props: {
		value: {
			type: String,
			default: null,
		},
	},
	inject: ['values'],
	setup(props) {
		return { image: props.value };
	},
};
</script>
