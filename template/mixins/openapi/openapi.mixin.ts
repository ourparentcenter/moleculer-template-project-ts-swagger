/* eslint-disable prefer-arrow/prefer-arrow-functions */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
'use strict';
/**
 * Mixin for swagger
 */
import { writeFileSync, readFileSync } from 'fs';
import { Errors } from 'moleculer';
import ApiGateway from 'moleculer-web';
import SwaggerUI from 'swagger-ui-dist';
import _ from 'lodash';
import swaggerJSDoc from 'swagger-jsdoc';
import * as pkg from '../../package.json';
import { Config } from '../../common';
import { RequestMessage } from 'types';
import { replaceInFile } from 'replace-in-file';
// import swJSON from '../../swagger.json';
import { isEqual } from 'lodash';
// eslint-disable-next-line @typescript-eslint/naming-convention
const MoleculerServerError = Errors.MoleculerServerError;

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

export const openAPIMixin = (mixinOptions?: any) => {
	mixinOptions = _.defaultsDeep(mixinOptions, {
		routeOptions: {
			path: '/openapi',
		},
		schema: null,
	});

	let shouldUpdateSchema = true;

	return {
		events: {
			'$services.changed'() {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				this.invalidateOpenApiSchema();
			},
		},

		methods: {
			/**
			 * Invalidate the generated OpenAPI schema
			 */
			invalidateOpenApiSchema() {
				shouldUpdateSchema = true;
			},

			/**
			 * Generate OpenAPI Schema
			 */
			generateOpenAPISchema(): any {
				try {
					const swaggerDefinition = {
						info: {
							title: `${pkg.name} API Documentation`, // Title of the documentation
							version: pkg.version, // Version of the app
							description:
								// eslint-disable-next-line max-len
								'Moleculer JS Microservice Boilerplate with Typescript, TypeORM, CLI, Service Clients, Swagger, Jest, Docker, Eslint support and everything you will ever need to deploy rock solid projects..', // Short description of the app
						},
						host: `${Config.SWAGGER_HOST}:${Config.SWAGGER_PORT}`, // The host or url of the app
						basePath: `${Config.SWAGGER_BASEPATH}`, // The basepath of your endpoint
					};
					// Options for the swagger docs
					const options = {
						// Import swaggerDefinitions
						definition: swaggerDefinition,
						explorer: true,
						enableCORS: false,

						// Path to the API docs
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						apis: JSON.parse(Config.SWAGGER_APIS),
					};
					// Initialize swagger-jsdoc
					const swaggerSpec = swaggerJSDoc(options);

					return swaggerSpec;
				} catch (err) {
					throw new MoleculerServerError(
						'Unable to compile OpenAPI schema',
						500,
						'UNABLE_COMPILE_OPENAPI_SCHEMA',
						{ err },
					);
				}
			},
		},

		async created() {
			const pathToSwaggerUi = `${SwaggerUI.absolutePath()}/swagger-initializer.js`;
			const options = {
				encoding: 'utf8',
				files: pathToSwaggerUi,
				from: [
					/(?:(?:https?|undefined):(\/\/|undefined?)|www\.)(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[-A-Z0-9+&@#\/%=~_|$?!:,.])*(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[A-Z0-9+&@#\/%=~_|$])/gim,
					/StandaloneLayout/g,
				],
				to: [`${Config.BASE_URL}:${Config.BASE_PORT}/openapi/swagger.json`, 'BaseLayout'],
			};
			try {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				this.logger.info(
					`♻ Testing for matches to modify in swagger initalize at ${pathToSwaggerUi}/swagger-initializer.js`,
				);
				const dryRun = replaceInFile({ dry: true, countMatches: true, ...options });
				dryRun
					.then((results) => {
						if (results[0]['hasChanged'] == true) {
							// @ts-ignore
							this.logger.info(
								`♻ Found matches in swagger initalize, updating file...`,
							);
							replaceInFile(options)
								.then(
									// @ts-ignore
									this.logger.info(
										`♻ Updated swagger initalize at ${pathToSwaggerUi}/swagger-initializer.js`,
									),
								)
								.catch((err) =>
									// @ts-ignore
									this.logger.error(
										`♻ Error updating swagger initalize at ${pathToSwaggerUi}/swagger-initializer.js: ${err}`,
									),
								);
						} else {
							// @ts-ignore
							this.logger.info(
								'♻ No changes needed, swagger initialize has the correct values',
							);
						}
					})
					.catch((err) =>
						// @ts-ignore
						this.logger.error(`♻ Error testing for matches: ${err}`),
					);
			} catch (err) {
				// @ts-ignore
				this.logger.error(err);
			}

			const route = _.defaultsDeep(mixinOptions.routeOptions, {
				use: [ApiGateway.serveStatic(SwaggerUI.absolutePath())],
				// rate lime for swagger api doc route
				rateLimit: {
					// How long to keep record of requests in memory (in milliseconds).
					// Defaults to 60000 (1 min)
					window: 60 * 1000,

					// Max number of requests during window. Defaults to 30
					limit: 5,

					// Set rate limit headers to response. Defaults to false
					headers: true,

					// Function used to generate keys. Defaults to:
					key: (req: RequestMessage) => {
						return req.headers['x-forwarded-for'] || req.socket.remoteAddress;
					},
					//StoreFactory: CustomStore
				},

				aliases: {
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					'GET /swagger.json'(req: any, res: any) {
						try {
							const swJSON = require('../../swagger.json');
							const ctx = req.$ctx;
							ctx.meta.responseType = 'application/json';
							// @ts-ignore
							const generatedScheme = this.generateOpenAPISchema();
							// @ts-ignore
							this.logger.info('♻ Checking if Swagger JSON schema needs updating...');
							if (isEqual(swJSON, generatedScheme)) {
								// @ts-ignore
								this.logger.info(
									'♻ No changes needed, swagger json schema has the correct values',
								);
								// eslint-disable-next-line @typescript-eslint/ban-ts-comment
								// @ts-ignore
								return this.sendResponse(req, res, generatedScheme);
							} else {
								// @ts-ignore
								this.logger.info(
									'♻ Swagger JSON schema needs updating, updating file...',
								);
								writeFileSync(
									'./swagger.json',
									JSON.stringify(generatedScheme, null, 4),
									'utf8',
								);
								// @ts-ignore
								this.logger.info(`♻ Updated swagger JSON`);
								// @ts-ignore
								return this.sendResponse(req, res, generatedScheme);
							}
						} catch (err) {
							// @ts-ignore
							this.logger.error(`♻ Error updating swagger JSOn schema: ${err}`);
						}
					},
				},

				mappingPolicy: 'restrict',
			});

			// Add route
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			this.settings.routes.unshift(route);
		},

		async started() {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			this.logger.info(
				`♻ OpenAPI swagger Docs server is available at ${mixinOptions.routeOptions.path}`,
			);
		},
	};
};

module.exports = { openAPIMixin };
