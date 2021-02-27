<template>
	<q-table title="Service Status" :rows="filteredServices" :columns="columns" row-key="name">
		<template #header="props">
			<q-tr :props="props">
				<q-th auto-width />
				<q-th v-for="col in props.cols" :key="col.name" :props="props">{{
					col.label
				}}</q-th>
			</q-tr>
		</template>

		<template #body="props">
			<q-tr :props="props">
				<q-td auto-width>
					<q-btn
						size="sm"
						color="accent"
						round
						dense
						@click="props.expand = !props.expand"
						:icon="props.expand ? 'remove' : 'add'"
					/>
				</q-td>

				<q-td key="name" :props="props">
					{{ props.row.name }}
					<q-badge v-if="props.row.version" transparent color="black">{{
						'v' + props.row.version
					}}</q-badge>
				</q-td>

				<q-td key="nodes" :props="props">
					<q-chip
						v-for="nodeID in props.row.nodes"
						:key="nodeID"
						class="glossy"
						square
						color="grey"
						text-color="white"
						>{{ nodeID }}</q-chip
					>
				</q-td>

				<q-td key="status" :props="props">
					<q-chip
						class="glossy"
						square
						:color="props.row.nodes.length > 0 ? 'teal' : 'red'"
						text-color="white"
						:icon="props.row.nodes.length > 0 ? 'done' : 'priority_high'"
						>{{ props.row.nodes.length > 0 ? 'Online' : 'Offline' }}</q-chip
					>
				</q-td>
			</q-tr>
			<q-tr v-show="props.expand" :props="props">
				<q-td colspan="100%">
					<q-markup-table>
						<thead>
							<tr>
								<th class="text-left">Action Name</th>
								<th class="text-center">Rest</th>
								<th class="text-center">Paramaters</th>
								<th class="text-right"></th>
							</tr>
						</thead>
						<tbody>
							<tr
								v-for="action in getServiceActions(props.row)"
								:class="{
									action: true,
									offline: !action.available,
									local: action.hasLocal,
								}"
								:key="action.name"
							>
								<td>
									{{ action.name }}
									<q-badge
										v-if="action.action.cache"
										transparent
										color="orange"
										text-color="black"
										>cached</q-badge
									>
								</td>
								<td v-html="getActionREST(props.row, action)"></td>
								<td :title="getActionParams(action, 40)">
									{{ getActionParams(action, 40) }}
								</td>
								<td></td>
								<td>
									<q-chip
										class="glossy"
										square
										:color="action.available ? 'teal' : 'red'"
										text-color="white"
										:icon="action.available ? 'done' : 'priority_high'"
										>{{ action.available ? 'Online' : 'Offline' }}</q-chip
									>
								</td>
							</tr>
						</tbody>
					</q-markup-table>
				</q-td>
			</q-tr>
		</template>
	</q-table>
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { defineComponent, ref, computed, onMounted } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import { axios } from 'boot/axios';
import { useQuasar } from 'quasar';

let interval: unknown = undefined;

const columns = [
	{
		name: 'name',
		required: true,
		label: 'Service name',
		align: 'left',
		field: (row: Record<string, unknown>) => row.name,
		format: (val: unknown) => `${val}`,
		sortable: true,
	},
	{
		name: 'nodes',
		align: 'center',
		label: 'Instances',
		field: 'nodes',
		sortable: true,
	},
	{
		name: 'status',
		align: 'center',
		label: 'Status',
		field: 'nodes',
		sortable: true,
	},
];

export default defineComponent({
	name: 'CompositionComponent',

	setup() {
		const $q = useQuasar();
		const services = ref([]);
		let actions = {};

		async function loadData(url: string) {
			return await axios
				.get(url)
				.then((response) => {
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

		const filteredServices = computed(() => {
			const servicesFiltered = services.value.filter(
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(svc: Record<string, any>) => !svc.name.startsWith('$'),
			);
			return servicesFiltered;
		});

		async function updateServiceList() {
			void (await loadData('/api/~node/services?withActions=true')
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				.then((res: any) => {
					services.value = res;
					res.sort((a: Record<string, string>, b: Record<string, string>) =>
						a.name.localeCompare(b.name),
					);
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					res.forEach((svc: Record<string, any[]>) => svc.nodes.sort());
				})
				.then(async () => await loadData('/api/~node/actions'))
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				.then((res: any) => {
					res.sort((a: Record<string, string>, b: Record<string, string>) =>
						a.name.localeCompare(b.name),
					);
					const serviceActions = res.reduce(
						(a: Record<string, unknown>, b: Record<string, string>) => {
							a[b.name] = b;
							return a;
						},
						{},
					);

					// Vue.set(this, 'actions', actions);
					actions = serviceActions;
				}));
		}

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		function getServiceActions(svc: Record<string, any>) {
			const srvActions = Object.keys(svc.actions)
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				.map((name: string) => actions[name])
				.filter((action) => !!action);
			return srvActions;
		}

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		function getActionParams(action: Record<string, any>, maxLen: number) {
			if (action.action && action.action.params) {
				const s = Object.keys(action.action.params).join(', ');
				return s.length > maxLen ? s.substr(0, maxLen) + '…' : s;
			}
			return '-';
		}

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		function getActionREST(svc: Record<string, any>, action: Record<string, any>) {
			if (action.action.rest) {
				let prefix = svc.fullName || svc.name;
				if (typeof svc.settings.rest == 'string') prefix = svc.settings.rest;

				if (typeof action.action.rest == 'string') {
					if (action.action.rest.indexOf(' ') !== -1) {
						const p = action.action.rest.split(' ');
						return `<div role="alert" class="q-badge flex inline items-center no-wrap q-badge--single-line bg-${
							p[0] == 'GET'
								? 'blue'
								: p[0] == 'POST'
								? 'green'
								: p[0] == 'PUT'
								? 'orange'
								: 'red'
						} q-badge--transparent">${p[0]}</div> ${prefix}${p[1]}`;
					} else {
						return `<div role="alert" class="q-badge flex inline items-center no-wrap q-badge--single-line bg-black q-badge--transparent">*</div> ${prefix}${action.action.rest}`;
					}
				} else {
					return `<div role="alert" class="q-badge flex inline items-center no-wrap q-badge--single-line bg-black q-badge--transparent">${
						action.action.rest.method || '*'
					}</div>	${prefix}${action.action.rest.path}`;
				}
			}
			return '';
		}

		onMounted(() => {
			interval = <never>setInterval(() => {
				void updateServiceList();
			}, 2000);
		});
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		onBeforeRouteLeave((to: any, from: any, next: any) => {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			clearInterval(interval);
			next();
		});
		return { filteredServices, getActionREST, getActionParams, getServiceActions, columns };
	},
});
</script>

<style lang="sass" scoped></style>
