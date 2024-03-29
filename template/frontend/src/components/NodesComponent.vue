<template lang="pug">
div.q-pa-md
	q-table(title="Node Status" :rows="nodes" :columns="columns" row-key="name")
		template(#header="props")
			q-tr(:props="props")
				q-th(v-for="col in props.cols" :key="col.name" :props="props") {{{{raw-helper}}}}{{ col.label }}{{{{/raw-helper}}}}
		template(#body="props")
			q-tr(:props="props")
				q-td(key="id" :props="props") {{{{raw-helper}}}}{{ props.row.id }}{{{{/raw-helper}}}}
				q-td(key="type" :props="props") {{{{raw-helper}}}}{{ props.row.client.type }}{{{{/raw-helper}}}}
				q-td(key="version" :props="props")
					q-badge(v-if="props.row.client.version" transparent color="black") {{{{raw-helper}}}}{{ 'v' + props.row.client.version }}{{{{/raw-helper}}}}
				q-td(key="ip" :props="props") {{{{raw-helper}}}}{{ props.row.ipList[0] }}{{{{/raw-helper}}}}
				q-td(key="hostname" :props="props") {{{{raw-helper}}}}{{ props.row.hostname }}{{{{/raw-helper}}}}
				q-td(key="status" :props="props")
					q-chip(
						class="glossy"
						square
						:color="props.row.available ? 'teal' : 'red'"
						text-color="white"
						:icon="props.row.available ? 'done' : 'priority_high'"
					) {{{{raw-helper}}}}{{ props.row.available ? 'Online' : 'Offline' }}{{{{/raw-helper}}}}
				q-td(key="cpu" :props="props") {{{{raw-helper}}}}{{ props.row.cpu != null ? Number(props.row.cpu).toFixed(0) + '%' : '-' }}{{{{/raw-helper}}}}
					div.bar(
						:style="{ width: props.row.cpu != null ? props.row.cpu + '%' : '0', backgroundColor: props.row.cpu >= '60' ? 'rgba(207,0,15,0.6)' : 'rgba(0,0,0,0.3)' }"
					)
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { defineComponent, ref, onMounted } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import { useQuasar } from 'quasar';
{{#if_eq httptransport "AXIOS"}}
import { axios } from '../boot/axios';
{{/if_eq}}
{{#if_eq httptransport "SOCKET"}}
import { socketIO } from '../boot/socketIO';
const socket = socketIO('http://localhost:3000/nodescomponent');
let socketDisconnected = false;
{{/if_eq}}
const columns = [
	{
		name: 'id',
		required: true,
		label: 'Node ID',
		align: 'left',
		field: (row: Record<string, unknown>) => row.id,
		// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
		format: (val: unknown) => `${val}`,
		sortable: true,
	},
	{
		name: 'type',
		align: 'center',
		label: 'Type',
		field: 'client.type',
		sortable: true,
	},
	{
		name: 'version',
		align: 'center',
		label: 'Version',
		field: 'client.version',
		sortable: true,
	},
	{
		name: 'ip',
		align: 'center',
		label: 'IP',
		field: 'ipList',
		sortable: true,
	},
	{
		name: 'hostname',
		align: 'center',
		label: 'Hostname',
		field: 'hostname',
		sortable: true,
	},
	{
		name: 'status',
		align: 'center',
		label: 'Status',
		field: 'available',
		sortable: true,
	},
	{
		name: 'cpu',
		align: 'center',
		label: 'CPU',
		field: 'cpu',
		sortable: true,
	},
];

export default defineComponent({
	name: 'NodesComponent',

	{{#if_eq httptransport "AXIOS"}}
	setup() {
		const $q = useQuasar();
		const nodes = ref([]);
		let interval: unknown = undefined;
		// const data = ref();

		async function loadData(url: string) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			return await axios
				.get(url)
				.then((response) => {
					// eslint-disable-next-line @typescript-eslint/no-unsafe-return
					return response.data;
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

		function updateNodeList() {
			void loadData('/api/~node/list').then((res) => {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
				res.sort((a: Record<string, string>, b: Record<string, string>) =>
					a.id.localeCompare(b.id),
				);
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				nodes.value = res;
			});
		}

		onMounted(() => {
			// const self = this;
			// self.interval = <never>setInterval(() => {
			interval = <never>setInterval(() => {
				updateNodeList();
			}, 2000);
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		onBeforeRouteLeave((to: any, from: any, next: any) => {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			clearInterval(interval);
			next();
		});

		return { nodes, columns };
	},
	{{/if_eq}}
	{{#if_eq httptransport "SOCKET"}}
	setup() {
		const $q = useQuasar();
		const nodes = ref([]);
		let interval: unknown = undefined;
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

		socket.emit(
			'call',
			{ action: '$node.list' },
			(res: []) => {
				res.sort((a: Record<string, string>, b: Record<string, string>) =>
					a.id.localeCompare(b.id),
				);
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				nodes.value = res;
			}
		);

		function updateNodeList() {
			socket.emit('call', {
				action: '$node.list'
			}, (res: []) => {
				res.sort((a: Record<string, string>, b: Record<string, string>) =>
					a.id.localeCompare(b.id),
				);
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				nodes.value = res;
			});
		}

		onMounted(() => {
			if (socketDisconnected) {
				socket.connect();
				socketDisconnected = false;
			}
			interval = <never>setInterval(() => {
				updateNodeList();
			}, 2000);
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		onBeforeRouteLeave((to: any, from: any, next: any) => {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			clearInterval(interval);
			socket.disconnect();
			socketDisconnected = true;
			next();
		});

		return { nodes, columns };
	},
	{{/if_eq}}
});
</script>

<style lang="sass" scoped>
.bar
	position: absolute
	left: 0
	right: 0
	top: 0
	bottom: 0
	width: 0
	height: 100%
	background-color: rgba(0,0,0,0.3)
</style>
