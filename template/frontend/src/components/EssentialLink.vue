<template>
	<q-item clickable tag="a" :to="{ name: link }" exact>
		<q-item-section v-if="icon" avatar>
			<q-icon :name="icon" />
		</q-item-section>

		<q-item-section>
			<q-item-label>{{{{raw-helper}}}}{{ title }}{{{{/raw-helper}}}}</q-item-label>
			<q-item-label caption>
				{{{{raw-helper}}}}{{ caption }}{{{{/raw-helper}}}}
			</q-item-label>
		</q-item-section>
	</q-item>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
	name: 'EssentialLink',
	props: {
		title: {
			type: String,
			required: true,
		},

		caption: {
			type: String,
			default: '',
		},

		link: {
			type: String,
			default: '#',
		},

		icon: {
			type: String,
			default: '',
		},
	},
});
</script>
