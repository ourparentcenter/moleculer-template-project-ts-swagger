/* eslint-disable prefer-arrow/prefer-arrow-functions */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
'use strict';
/**
 * Mixin for swagger
 */
import { writeFileSync, readFileSync } from 'fs';
import { Errors } from 'moleculer';
import ApiGateway from 'moleculer-web';
import _ from 'lodash';
import { RequestMessage } from 'types';
import { replaceInFile } from 'replace-in-file';
import { isEqual } from 'lodash';
import YAML from 'js-yaml';
import { Config } from '../../common';
import path from 'path';
import swaggerJSDoc from 'swagger-jsdoc';
import * as pkg from '../../package.json';
// eslint-disable-next-line @typescript-eslint/naming-convention
const MoleculerServerError = Errors.MoleculerServerError;
// console.log(SwaggerUI.absolutePath());
const isJSON = (str: any) => {
	// basic test: "does this look like JSON?"
	let regex = /^[ \r\n\t]*[{[]/;

	return regex.test(str);
};

const makePadding = (len: any) => {
	let str = '';

	while (str.length < len) {
		str += ' ';
	}

	return str;
};
const editorPath = (path.resolve('./') + '\\node_modules\\swagger-editor-dist').replace(/\\/g, '/');

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

export const editorMixin = (mixinOptions?: any) => {
	mixinOptions = _.defaultsDeep(mixinOptions, {
		routeOptions: {
			path: '/editor',
			cors: {
				origin: ['*'],
				methods: ['GET', 'OPTIONS', 'POST', 'PUT', 'DELETE'],
				credentials: false,
				maxAge: 3600,
			},
			whitelist: [
				// Access to any actions in all services under "/api" URL
				'**',
			],
		},
		schema: null,
	});

	return {
		methods: {
			/**
			 * Generate OpenAPI Schema
			 */
			generateOpenAPISchema(): any {
				try {
					const swaggerDefinition = {
						/* swagger: '2.0',
						info: {
							title: `${pkg.name} API Documentation`, // Title of the documentation
							version: pkg.version, // Version of the app
							description:
								// eslint-disable-next-line max-len
								'Moleculer JS Microservice Boilerplate with Typescript, TypeORM, CLI, Service Clients, Swagger, Jest, Docker, Eslint support and everything you will ever need to deploy rock solid projects..', // Short description of the app
						},
						host: `${Config.SWAGGER_HOST}:${Config.SWAGGER_PORT}`, // The host or url of the app
						basePath: `${Config.SWAGGER_BASEPATH}`, // The basepath of your endpoint */
						openapi: '3.0.1',
						info: {
							title: `${pkg.name} API Documentation`, // Title of the documentation
							description:
								// eslint-disable-next-line max-len
								'Moleculer JS Microservice Boilerplate with Typescript, TypeORM, CLI, Service Clients, Swagger, Jest, Docker, Eslint support and everything you will ever need to deploy rock solid projects..', // Short description of the app
							version: pkg.version, // Version of the app
						},
						servers: [
							{
								url: `//${Config.SWAGGER_HOST}:${Config.SWAGGER_PORT}`, // base url to server
							},
						],
						components: {
							securitySchemes: {
								bearerAuth: {
									type: 'http',
									scheme: 'bearer',
									bearerFormat: 'JWT',
								},
							},
						},
						security: [
							{
								bearerAuth: [],
							},
						],
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

			/**
			 * Generate OpenAPI Schema
			 */
			generateYAML(json: any): any {
				try {
					const originalStr = json;
					if (!isJSON(originalStr)) {
						return;
					}

					let yamlString;
					try {
						yamlString = YAML.dump(YAML.load(originalStr), {
							lineWidth: -1, // don't generate line folds
						});
					} catch (err) {
						throw new MoleculerServerError(
							`♻ Error dumping swagger YAML schema`,
							500,
							'UNABLE_DUMP_YAML_SCHEME',
							{ err },
						);
					}

					// update the pasted content
					return yamlString;
				} catch (err) {
					throw new MoleculerServerError(
						`♻ Error generating swagger YAML schema`,
						500,
						'UNABLE_GENERATE_YAML_SCHEME',
						{ err },
					);
				}
			},
		},

		async created() {
			const pathToSwaggerEitorHtml = `${editorPath}/index.html`;
			const options = {
				encoding: 'utf8',
				files: pathToSwaggerEitorHtml,
				from: [/SwaggerEditorBundle\({(.*?)}\)/s],
				to: [
					`SwaggerEditorBundle({
					url: '${Config.BASE_URL}:${Config.BASE_PORT}/editor/swagger.yaml',
					dom_id: '#swagger-editor',
					layout: 'StandaloneLayout',
					presets: [
						SwaggerEditorStandalonePreset
					],
					queryConfigEnabled: false,
					})`,
				],
			};
			try {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				this.logger.info(
					`♻ Testing for matches to modify in swagger editor html at ${pathToSwaggerEitorHtml}`,
				);
				const dryRun = replaceInFile({ dry: true, countMatches: true, ...options });
				// check the sgwgger editor html to see if changes need to be mae, then make them.
				dryRun
					.then((results) => {
						if (results[0]['hasChanged'] == true) {
							// @ts-ignore
							this.logger.info(
								`♻ Found matches in swagger editor html, updating file...`,
							);
							replaceInFile(options)
								.then(
									// @ts-ignore
									this.logger.info(
										`♻ Updated swagger editor html at ${pathToSwaggerEitorHtml}`,
									),
								)
								.catch((err) =>
									// @ts-ignore
									this.logger.error(
										`♻ Error updating swagger editor html at ${pathToSwaggerEitorHtml}: ${err}`,
									),
								);
						} else {
							// @ts-ignore
							this.logger.info(
								'♻ No changes needed, swagger editor html has the correct values',
							);
						}
					})
					.catch((err) => {
						// @ts-ignore
						this.logger.error(`♻ Error testing for matches: ${err}`);
						throw new MoleculerServerError(
							`♻ Error testing for matches in ${pathToSwaggerEitorHtml}`,
							500,
							'ERROR_TESTING_MATCHES',
							{ err },
						);
					});
			} catch (err) {
				throw new MoleculerServerError(
					`♻ Unable to update swagger editor html at ${pathToSwaggerEitorHtml}`,
					500,
					'UNABLE_EDIT_SWAGGER_HTML',
					{ err },
				);
			}

			// merge route with api gateway
			const route = _.defaultsDeep(mixinOptions.routeOptions, {
				use: [ApiGateway.serveStatic(editorPath)],
				// rate lime for swagger api doc route
				rateLimit: {
					// How long to keep record of requests in memory (in milliseconds).
					// Defaults to 60000 (1 min)
					window: 60 * 1000,

					// Max number of requests during window. Defaults to 30
					limit: 30,

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
					'GET /swagger.yaml'(req: any, res: any): void {
						try {
							const swJSON = require('../../swagger.json');
							try {
								const ctx = req.$ctx;
								ctx.meta.responseType = 'application/json';
								// @ts-ignore
								const generatedScheme = this.generateOpenAPISchema();
								// @ts-ignore
								this.logger.info(
									'♻ Checking if Swagger JSON schema needs updating...',
								);
								if (isEqual(swJSON, generatedScheme)) {
									// @ts-ignore
									this.logger.info(
										'♻ No changes needed, swagger json schema has the correct values',
									);
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
								}
							} catch (err) {
								throw new MoleculerServerError(
									'♻ Error updating swagger JSON schema',
									500,
									'UNABLE_UPDATE_SWAGGER_JSON',
									{ err },
								);
							}
							const swYAML = YAML.load(readFileSync('./swagger.yaml', 'utf8'));
							const ctx = req.$ctx;
							ctx.meta.responseType = 'application/x-yaml';
							// @ts-ignore
							const generatedYAML = this.generateYAML(JSON.stringify(swJSON));
							// @ts-ignore
							this.logger.info('♻ Checking if Swagger YAML schema needs updating...');
							if (isEqual(swYAML, swJSON)) {
								// @ts-ignore
								this.logger.info(
									'♻ No changes needed, swagger YAML schema has the correct values',
								);
								return res.end(generatedYAML);
							} else {
								// @ts-ignore
								this.logger.info(
									'♻ Swagger YAML schema needs updating, updating file...',
								);
								writeFileSync('./swagger.yaml', generatedYAML, 'utf8');
								// @ts-ignore
								this.logger.info(`♻ Updated swagger YAML`);
								return res.end(generatedYAML);
							}
						} catch (err) {
							throw new MoleculerServerError(
								`♻ Error updating swagger YAML schema`,
								500,
								'UNABLE_UPDATE_YAML_SCHEME',
								{ err },
							);
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
				`♻ Swagger Editor server is available at ${mixinOptions.routeOptions.path}`,
			);
		},
	};
};

module.exports = { editorMixin };
