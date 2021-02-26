import { RouteRecordRaw } from 'vue-router';
import MoleculerRoutes from 'src/router/DynamicRoutes/moleculerRoutes';

const routes: RouteRecordRaw[] = [
	{
		path: '/',
		component: () => import('layouts/MainLayout.vue'),
		children: [MoleculerRoutes],
	},

	// Always leave this as last one,
	// but you can also remove it
	{
		path: '/:catchAll(.*)*',
		component: () => import('pages/Error404.vue'),
	},
];

export default routes;
