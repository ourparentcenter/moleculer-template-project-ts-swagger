/* eslint-disable arrow-parens */
/* eslint-disable no-shadow */
/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable complexity */
/*
 * Moleculer
 * Copyright (c) 2019 MoleculerJS (https://github.com/moleculerjs/moleculer)
 * MIT Licensed
 */

'use strict';

import fs from 'fs';
import path from 'path';
import chokidar from 'chokidar';
import kleur from 'kleur';
import _ from 'lodash';

const {
	clearRequireCache,
	makeDirs,
	isFunction,
	// eslint-disable-next-line @typescript-eslint/no-var-requires
} = require('../node_modules/moleculer/src/utils');

/* istanbul ignore next */
const HotReloadMiddleware = (broker: any) => {
	const cache = new Map();

	let projectFiles = new Map();
	let prevProjectFiles = new Map();
	const hotReloadModules: any[] = [];

	const hotReloadService = (service: any) => {
		const relPath = path.relative(process.cwd(), service.__filename);

		broker.logger.info(`Hot reload '${service.name}' service...`, kleur.grey(relPath));

		return broker.destroyService(service).then(() => {
			if (fs.existsSync(service.__filename)) {
				return broker.loadService(service.__filename);
			}
		});
	};

	/**
	 * Detect service dependency graph & watch all dependent files & services.
	 *
	 */
	const watchProjectFiles = () => {
		if (!broker.started || !process.mainModule) {
			return;
		}

		cache.clear();
		prevProjectFiles = projectFiles;
		projectFiles = new Map();

		// Read the main module
		const mainModule = process.mainModule;

		// Process the whole module tree
		processModule(mainModule, null, 0, null);

		const needToReload = new Set();

		// Debounced Service reloader function
		const reloadServices = _.debounce(() => {
			broker.logger.info(
				kleur.bgMagenta().white().bold(`Reload ${needToReload.size} service(s)`),
			);

			needToReload.forEach((svc) => {
				if (typeof svc == 'string') {
					return broker.loadService(svc);
				}

				return hotReloadService(svc);
			});
			needToReload.clear();
		}, 500);

		// Close previous watchers
		stopAllFileWatcher(prevProjectFiles);

		// Watching project files
		broker.logger.debug('');
		broker.logger.debug(kleur.yellow().bold('Watching the following project files:'));
		projectFiles.forEach((watchItem, fName) => {
			const relPath = path.relative(process.cwd(), fName);
			if (watchItem.brokerRestart) {
				{
					broker.logger.debug(`  ${relPath}:`, kleur.grey('restart broker.'));
				}
			} else if (watchItem.allServices) {
				{
					broker.logger.debug(`  ${relPath}:`, kleur.grey('reload all services.'));
				}
			} else if (watchItem.services.length > 0) {
				broker.logger.debug(
					`  ${relPath}:`,
					kleur.grey(
						`reload ${watchItem.services.length} service(s) & ${watchItem.others.length} other(s).`,
					) /* , watchItem.services, watchItem.others*/,
				);
				watchItem.services.forEach((svcFullname: any) =>
					broker.logger.debug(kleur.grey(`    ${svcFullname}`)),
				);
				watchItem.others.forEach((filename: any) =>
					broker.logger.debug(
						kleur.grey(`    ${path.relative(process.cwd(), filename)}`),
					),
				);
			}
			// Create watcher
			watchItem.watcher = chokidar
				.watch(fName, { ignoreInitial: true, usePolling: true, interval: 1000 })
				.on('all', (eventType, fName) => {
					const relPath = path.relative(process.cwd(), fName);
					broker.logger.info(
						kleur
							.magenta()
							.bold(
								`The '${relPath}' file is changed. (Event: ${eventType.toString()})`,
							),
					);

					// Clear from require cache
					clearRequireCache(fName);
					if (watchItem.others.length > 0) {
						watchItem.others.forEach((f: unknown) => clearRequireCache(f));
					}

					if (
						watchItem.brokerRestart &&
						broker.runner &&
						isFunction(broker.runner.restartBroker)
					) {
						broker.logger.info(
							kleur.bgMagenta().white().bold('Action: Restart broker...'),
						);
						stopAllFileWatcher(projectFiles);
						// Clear the whole require cache
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						require.cache.length = 0;
						return broker.runner.restartBroker();
					} else if (watchItem.allServices) {
						// Reload all services
						broker.services.forEach((svc: Record<string, unknown>) => {
							if (svc.__filename) {
								needToReload.add(svc);
							}
						});
						reloadServices();
					} else if (watchItem.services.length > 0) {
						// Reload certain services
						broker.services.forEach((svc: Record<string, unknown>) => {
							if (watchItem.services.indexOf(svc.fullName) !== -1) {
								needToReload.add(svc);
							}
						});

						if (needToReload.size === 0) {
							// It means, it's a crashed reloaded service, so we
							// Didn't find it in the loaded services because
							// The previous hot-reload failed. We should load it
							// Broker.loadService
							needToReload.add(relPath);
						}
						reloadServices();
					}
				});
		});

		if (projectFiles.size === 0) {
			broker.logger.debug(kleur.grey('  No files.'));
		}
	};

	const debouncedWatchProjectFiles = _.debounce(watchProjectFiles, 2000);

	/**
	 * Stop all file watchers
	 */
	const stopAllFileWatcher = (items: any) => {
		items.forEach((watchItem: any) => {
			if (watchItem.watcher) {
				watchItem.watcher.close();
				watchItem.watcher = null;
			}
		});
	};

	/**
	 * Get a watch item
	 *
	 * @param {String} fName
	 * @returns {Object}
	 */
	const getWatchItem = (fName: string) => {
		let watchItem = projectFiles.get(fName);
		if (watchItem) {
			return watchItem;
		}

		watchItem = {
			services: [],
			allServices: false,
			brokerRestart: false,
			others: [],
		};
		projectFiles.set(fName, watchItem);

		return watchItem;
	};

	const isMoleculerConfig = (fName: string) =>
		fName.endsWith('moleculer.config.js') ||
		fName.endsWith('moleculer.config.ts') ||
		fName.endsWith('moleculer.config.json');

	/**
	 * Process module children modules.
	 *
	 * @param {*} mod
	 * @param {*} service
	 * @param {Number} level
	 */
	const processModule = (mod: any, service = null, level = 0, parents = null) => {
		const fName = mod.filename;

		// Skip node_modules files, if there is parent project file
		if ((service || parents) && fName.indexOf('node_modules') !== -1) {
			if (hotReloadModules.find((modulePath) => fName.indexOf(modulePath) !== -1) == null) {
				return;
			}
		}

		// Avoid circular dependency in project files
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		if (parents && parents.indexOf(fName) !== -1) {
			return;
		}

		// Console.log(fName);

		// Cache files to avoid cyclic dependencies in node_modules
		if (fName.indexOf('node_modules') !== -1) {
			if (cache.get(fName)) {
				return;
			}
			cache.set(fName, mod);
		}

		if (!service) {
			service = broker.services.find((svc: any) => svc.__filename === fName);
		}

		if (service) {
			// It is a service dependency. We should reload this service if this file has changed.
			const watchItem = getWatchItem(fName);
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			if (!watchItem.services.includes(service.fullName)) {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				watchItem.services.push(service.fullName);
			}

			watchItem.others = _.uniq([].concat(watchItem.others, parents || []));
		} else if (isMoleculerConfig(fName)) {
			const watchItem = getWatchItem(fName);
			watchItem.brokerRestart = true;
		} else {
			// It is not a service dependency, it is a global middleware. We should reload all services if this file has changed.
			if (parents) {
				const watchItem = getWatchItem(fName);
				watchItem.allServices = true;
				watchItem.others = _.uniq([].concat(watchItem.others, parents || []));
			}
		}

		if (mod.children && mod.children.length > 0) {
			if (service) {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				parents = parents ? parents.concat([fName]) : [fName];
			} else if (isMoleculerConfig(fName)) {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				parents = [];
				// Const watchItem = getWatchItem(fName);
				// WatchItem.brokerRestart = true;
			} else if (parents) {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				parents.push(fName);
			}
			mod.children.forEach((m: any) =>
				processModule(m, service, service ? level + 1 : 0, parents),
			);
		}
	};

	const folderWatchers: any[] = [];

	const watchProjectFolders = () => {
		// Debounced Service loader function
		const needToLoad = new Set();
		const loadServices = _.debounce(() => {
			broker.logger.info(
				kleur.bgMagenta().white().bold(`Load ${needToLoad.size} service(s)...`),
			);

			needToLoad.forEach((filename) => {
				try {
					broker.loadService(filename);
				} catch (err) {
					broker.logger.error(`Failed to load service '${filename}'`, err);
					clearRequireCache(filename);
				}
			});
			needToLoad.clear();
		}, 500);

		if (broker.runner && Array.isArray(broker.runner.folders)) {
			const folders = broker.runner.folders;
			if (folders.length > 0) {
				folderWatchers.length = 0;

				broker.logger.debug('');
				broker.logger.debug(kleur.yellow().bold('Watching the following folder(s):'));

				folders.forEach((folder: any) => {
					makeDirs(folder);
					broker.logger.debug(`  ${path.relative(process.cwd(), folder)}/`);
					folderWatchers.push({
						path: folder,
						watcher: chokidar
							.watch(folder, {
								ignoreInitial: true,
								usePolling: true,
								interval: 1000,
							})
							.on('all', (eventType, filename) => {
								if (
									filename.endsWith('.service.js') ||
									filename.endsWith('.service.ts')
								) {
									broker.logger.debug(
										`There is changes in '${folder}' folder: `,
										kleur.bgMagenta().white(eventType),
										filename,
									);
									const fullPath = path.join(folder, filename);
									const isLoaded = broker.services.some(
										(svc: Record<string, unknown>) =>
											svc.__filename === fullPath,
									);

									if (eventType.toString() === 'rename' && !isLoaded) {
										// This is a new file. We should wait for the file fully copied.
										needToLoad.add(fullPath);
										loadServices();
									} else if (eventType.toString() === 'change' && !isLoaded) {
										// This can be a file which is exist but not loaded correctly (e.g. schema error if the file is empty yet)
										needToLoad.add(fullPath);
										loadServices();
									}
								}
							}),
					});
				});
			}
		}
	};

	const stopProjectFolderWatchers = () => {
		broker.logger.debug('');
		broker.logger.debug('Stop watching folders.');
		folderWatchers.forEach((item) => item.watcher && item.watcher.close());
	};

	/**
	 * Expose middleware
	 */
	return {
		name: 'HotReload',

		// After broker started
		// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
		started() {
			watchProjectFiles();
			watchProjectFolders();
		},

		// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
		serviceStarted() {
			// Re-watch new services if broker has already started and a new service started.
			if (broker.started) {
				debouncedWatchProjectFiles();
			}
		},

		// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
		stopped() {
			stopProjectFolderWatchers();
		},
	};
};
export default HotReloadMiddleware;
