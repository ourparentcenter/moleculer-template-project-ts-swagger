<template lang="pug">
div
	div.row.justify-center
		h3 Configuration
	div.row.items-start.justify-center.q-gutter-md
		q-card.my-card.text-white.text-center(bordered, style="background: radial-gradient(circle, #35a2ff 0%, #014a88 100%);")
			q-card-section
				div.text-h6 Namespace
			q-separator(dark inset)
			q-card-section {{{{raw-helper}}}}{{ (!isEmpty(broker) && !isEmpty(broker.namespace)) ? broker.namespace : '&lt;not set&gt;' }}{{{{/raw-helper}}}}
		q-card.my-card.text-white.text-center(bordered, style="background: radial-gradient(circle, #35a2ff 0%, #014a88 100%);")
			q-card-section
				div.text-h6 Transporter
			q-separator(dark inset)
			q-card-section {{{{raw-helper}}}}{{ (!isEmpty(broker) && !isEmpty(broker.namespace)) ? broker.transporter : '&lt;no transporter&gt;' }}{{{{/raw-helper}}}}
		q-card.my-card.text-white.text-center(bordered, style="background: radial-gradient(circle, #35a2ff 0%, #014a88 100%);")
			q-card-section
				div.text-h6 Serializer
			q-separator(dark inset)
			q-card-section {{{{raw-helper}}}}{{ !isEmpty(broker) ? broker.serializer || "JSON" : '&lt;not set&gt;' }}{{{{/raw-helper}}}}
		q-card.my-card.text-white.text-center(bordered, style="background: radial-gradient(circle, #35a2ff 0%, #014a88 100%);")
			q-card-section
				div.text-h6 Strategy
			q-separator(dark inset)
			q-card-section {{{{raw-helper}}}}{{ !isEmpty(broker) ? broker.registry.strategy : '&lt;not set&gt;' }}{{{{/raw-helper}}}}
		q-card.my-card.text-white.text-center(bordered, style="background: radial-gradient(circle, #35a2ff 0%, #014a88 100%);")
			q-card-section
				div.text-h6 Cacher
			q-separator(dark inset)
			q-card-section {{{{raw-helper}}}}{{ !isEmpty(broker) ? 'Enabled' : 'Disabled' }}{{{{/raw-helper}}}}
		q-card.my-card.text-white.text-center(bordered, style="background: radial-gradient(circle, #35a2ff 0%, #014a88 100%);")
			q-card-section
				div.text-h6 Logger
			q-separator(dark inset)
			q-card-section {{{{raw-helper}}}}{{ !isEmpty(broker) ? 'Enabled' : 'Disabled' }}{{{{/raw-helper}}}}
		q-card.my-card.text-white.text-center(bordered, style="background: radial-gradient(circle, #35a2ff 0%, #014a88 100%);")
			q-card-section
				div.text-h6 Metrics
			q-separator(dark inset)
			q-card-section {{{{raw-helper}}}}{{ !isEmpty(broker) ? 'Enabled' : 'Disabled' }}{{{{/raw-helper}}}}
		q-card.my-card.text-white.text-center(bordered, style="background: radial-gradient(circle, #35a2ff 0%, #014a88 100%);")
			q-card-section
				div.text-h6 Tracing
			q-separator(dark inset)
			q-card-section {{{{raw-helper}}}}{{ !isEmpty(broker) ? 'Enabled' : 'Disabled' }}{{{{/raw-helper}}}}

	div.column.items-center.justify-evenly
		h3.cursor-pointer(@click="showBrokerOptions = !showBrokerOptions") Broker options
			q-icon(:name="'expand_' + (showBrokerOptions ? 'less' : 'more')")
		q-slide-transition
			div(v-show="showBrokerOptions").broker-options
				pre
					q-card
						q-card-section {{{{raw-helper}}}}{{ broker }}{{{{/raw-helper}}}}
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import { _ } from '../boot/lodash';
import { useQuasar } from 'quasar';
{{#if_eq httptransport "AXIOS"}}
import { axios } from '../boot/axios';
{{/if_eq}}
{{#if_eq httptransport "SOCKET"}}
import { socketIO } from '../boot/socketIO';
import { onBeforeRouteLeave } from 'vue-router';
const socket = socketIO('http://localhost:3000/brokercomponent');
// let interval: unknown = undefined;
let socketDisconnected = false;
{{/if_eq}}

export default defineComponent({
	name: 'BrokerComponent',

	{{#if_eq httptransport "AXIOS"}}
	setup() {
		const $q = useQuasar();
		const broker = ref();

		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/unbound-method
		const isEmpty = _.isEmpty;
		// eslint-disable-next-line @typescript-eslint/unbound-method
		const showBrokerOptions = ref(false);
		async function loadData(url: string) {
			await axios
				.get(url)
				.then((response) => {
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					broker.value = response.data;
				})
				.catch(() => {
					$q.notify({
						color: 'negative',
						position: 'top',
						message: 'Loading failed',
						icon: 'report_problem',
					});
				});
		}
		function updateBrokerOptions() {
			void loadData('/api/~node/options');
		}

		onMounted(() => updateBrokerOptions());
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		return { isEmpty, broker, showBrokerOptions };
	},
	{{/if_eq}}
	{{#if_eq httptransport "SOCKET"}}
	setup() {
		const $q = useQuasar();
		const broker = ref();
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/unbound-method
		const isEmpty = _.isEmpty;
		// eslint-disable-next-line @typescript-eslint/unbound-method
		const showBrokerOptions = ref(false);

		socket.on('connected', (res: string) => {
			$q.notify({
				color: 'positive',
				position: 'top',
				message: res,
			})
		});
		socket.on('connect_error',
			() => {
				$q.notify({
					color: 'negative',
					position: 'top',
					message: 'Loading failed',
					icon: 'report_problem',
				})
			}
		);
		socket.emit('call', {
			action: '$node.options'
		}, (res: Record<string, unknown>) => {
			broker.value = res;
		});

		onMounted(() => {
			if (socketDisconnected) {
				socket.connect();
				socketDisconnected = false;
			}
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		onBeforeRouteLeave((to: any, from: any, next: any) => {
			socket.disconnect();
			socketDisconnected = true;
			next();
		});

		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		return { isEmpty, broker, showBrokerOptions };
	},
	{{/if_eq}}
});
</script>

<style lang="sass" scoped>
.my-card
	width: 100%
	max-width: 200px

pre.broker-options
	display: inline-block
	text-align: left
	font-size: 0.9em
</style>
