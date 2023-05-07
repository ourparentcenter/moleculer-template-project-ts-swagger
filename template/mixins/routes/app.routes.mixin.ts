import { isArray } from 'lodash';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const getAppRoutes = (logger: any, app: string) => {
	const routes: object[] = [];
	const appPath = join(__dirname, `../../apps/${app}/`);
	const appRoutes = require(`${appPath.replace(/\\/g, '/')}/route`).default;
	// @ts-ignore
	logger.debug(`Loading routes for app: ${app}`);
	if (!isArray(appRoutes)) {
		routes.push(appRoutes);
	} else {
		routes.push(...appRoutes);
	}

	return routes;
};

export const appRoutesMixin = (/* logger?: any */) => {
	return {
		methods: {
			getApp() {
				const appRoutes: object[] = [];
				// const app = this;
				// @ts-ignore
				const appName = `${this.name.toLowerCase().charAt(0).toUpperCase()}${this.name
					.toLowerCase()
					.slice(1)}`;

				// const appFolders = readdirSync(join(__dirname, '../apps'));
				// const cleanedArray = appFolders.filter((app) => app !== 'README.md');

				// cleanedArray.forEach((app) => {
				// 	// @ts-ignore
				// 	this.logger.debug(`Accessing ${app} to gather routes`);
				// 	const appPath = join(__dirname, `../apps/${app}/`);
				// 	const appPackage = existsSync(`${appPath.replace(/\\/g, '/')}package.json`)
				// 		? require(`${appPath.replace(/\\/g, '/')}package.json`)
				// 		: false;

				// 	if (!appPackage || appPackage.hasroutes === false) {
				// 		// @ts-ignore
				// 		this.logger.debug(`App ${app} has no routes`);
				// 		return;
				// 	}
				// 	if (appPackage.hasroutes === true) {
				// 		// @ts-ignore
				// 		this.logger.debug(`App ${app} has routes, gathering them`);
				// 		apps.push(...getAppRoutes(/* logger, */ app));
				// 	}
				// });

				// @ts-ignore
				const appPath = join(__dirname, `../../apps/${appName}/`);
				const appPackage = existsSync(`${appPath.replace(/\\/g, '/')}package.json`)
					? require(`${appPath.replace(/\\/g, '/')}package.json`)
					: false;

				if (!appPackage || appPackage.hasroutes === false) {
					// @ts-ignore
					this.logger.debug(`App ${appName} has no routes`);
					return;
				}
				if (appPackage.hasroutes === true) {
					// @ts-ignore
					this.logger.debug(`App ${appName} has routes, gathering them`);
					// @ts-ignore
					appRoutes.push(...getAppRoutes(this.logger, appName));
				}

				// @ts-ignore
				this.broker
					.waitForServices('api', 5000)
					.then(() =>
						appRoutes.forEach((route: object) => {
							// @ts-ignore
							this.broker.call('api.addRoute', { route: route, toBottom: true });
						}),
					)
					.catch((err: any) => {
						// @ts-ignore
						this.logger.error(`Error waiting for api service to be available: ${err}`);
					});

				/* appRoutes.forEach((route: object) => {
					// @ts-ignore
					this.broker.call('api.addRoute', { route: route, toBottom: true });
				}); */

				// @ts-ignore
				this.logger.debug(
					`Returning ${appRoutes.length} routes from installed app ${appName}`,
				);
				// return appRoutes;
				return;
			},
		},
		async started(): Promise<void> {
			// @ts-ignore
			await this.getApp();
		},
	};
};
