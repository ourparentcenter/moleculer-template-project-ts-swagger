import { isArray } from 'lodash';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const getAppRoutes = (/* logger: any, */ app: string) => {
	const routes: object[] = [];
	const appPath = join(__dirname, `../apps/${app}/`);
	const appRoutes = require(`${appPath.replace(/\\/g, '/')}/route`).default;
	// @ts-ignore
	this.logger.debug(`Loading routes for app: ${app}`);
	if (!isArray(appRoutes)) {
		routes.push(appRoutes);
	} else {
		routes.push(...appRoutes);
	}

	return routes;
};

export const getApps = (/* logger?: any */) => {
	const apps: object[] = [];
	const appFolders = readdirSync(join(__dirname, '../apps'));
	const cleanedArray = appFolders.filter((app) => app !== 'README.md');

	cleanedArray.forEach((app) => {
		// @ts-ignore
		this.logger.debug(`Accessing ${app} to gather routes`);
		const appPath = join(__dirname, `../apps/${app}/`);
		const appPackage = existsSync(`${appPath.replace(/\\/g, '/')}package.json`)
			? require(`${appPath.replace(/\\/g, '/')}package.json`)
			: false;

		if (!appPackage || appPackage.hasroutes === false) {
			// @ts-ignore
			this.logger.debug(`App ${app} has no routes`);
			return;
		}
		if (appPackage.hasroutes === true) {
			// @ts-ignore
			this.logger.debug(`App ${app} has routes, gathering them`);
			apps.push(...getAppRoutes(/* logger, */ app));
		}
	});

	// @ts-ignore
	this.logger.debug(`Returning ${apps.length} routes from installed apps`);
	return apps;
};
