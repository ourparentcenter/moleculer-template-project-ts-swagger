'use strict';
const MoleculerRoutes = {
	path: '',
	component: async () => await import(/* webpackChunkName: "home.index" */ 'pages/Index.vue'),
	children: [
		{
			path: '',
			name: 'broker',
			component: async () =>
				await import(
					/* webpackChunkName: "broker.component" */ 'components/BrokerComponent.vue'
				),
		},
		{
			path: '/greeter',
			name: 'greeter',
			component: async () =>
				await import(
					/* webpackChunkName: "greeter.component" */ 'components/GreeterComponent.vue'
				),
		},
		{
			path: '/products',
			name: 'products',
			component: async () =>
				await import(
					/* webpackChunkName: "products.component" */ 'components/ProductComponent.vue'
				),
		},
		{
			path: '/nodes',
			name: 'nodes',
			component: async () =>
				await import(
					/* webpackChunkName: "nodes.component" */ 'components/NodesComponent.vue'
				),
		},
		{
			path: '/services',
			name: 'services',
			component: async () =>
				await import(
					/* webpackChunkName: "services.component" */ 'components/ServicesComponent.vue'
				),
		},
	],
};
export default MoleculerRoutes;
