<template>
	<q-page class="column items-center">
		<div class="text-center">
			<h3>Welcome to your Moleculer microservices with Quasar project!</h3>
			<p>
				Check out the
				<a href="https://moleculer.services/docs/0.14/" target="_blank">
					Moleculer documentation
				</a>
				to learn how to customize this project.
			</p>
		</div>
		<router-view />
	</q-page>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
	name: 'PageIndex',
});
</script>
