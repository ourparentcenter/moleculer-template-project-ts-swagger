/* eslint-disable prefer-arrow/prefer-arrow-functions */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
'use strict';
/**
 * Mixin for swagger
 */
import { writeFileSync } from 'fs';
import { Errors } from 'moleculer';
import ApiGateway from 'moleculer-web';
import SwaggerUI from 'swagger-ui-dist';
import _ from 'lodash';
import swaggerJSDoc from 'swagger-jsdoc';
import * as pkg from '../../package.json';
import { Config } from '../../common';
import { RequestMessage } from 'types';
import { replaceInFile } from 'replace-in-file';
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

	return {
		methods: {
			/**
			 * Generate OpenAPI Schema
			 */
			generateOpenAPISchema(): any {
				try {
					const swaggerDefinition = {
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
							schemas: {
								VerificationToken: {
									type: 'object',
									properties: {
										verificationToken: {
											type: 'string',
											description: 'Token to activate user',
											example:
												'pl9A3MLkTRy7O7fVyIG5WUmdKDxvYPH14on3lQ7G31Clwhmhcd6Nqv4OeM9l5hDS',
										},
									},
								},
								Product: {
									type: 'object',
									properties: {
										name: {
											type: 'string',
											description: 'Name of product',
											example: 'Samsung Galaxy S20 Edge',
										},
										quantity: {
											type: 'number',
											description: 'Quantity of product',
											example: 10,
										},
										price: {
											type: 'number',
											description: 'Cost of product',
											example: 875,
										},
									},
								},
								User: {
									type: 'object',
									properties: {
										login: {
											type: 'string',
											description: 'Login to be used',
											example: 'joeLogin',
										},
										firstName: {
											type: 'string',
											description: 'First Name',
											default: 'Joe',
										},
										lastName: {
											type: 'string',
											description: 'Surname',
											example: 'Doe',
										},
										email: {
											type: 'string',
											description: 'Email',
											example: 'joedoe@test.com',
										},
										password: {
											type: 'string',
											description: 'Password',
											example: 'testPass1234',
										},
										langKey: {
											type: 'string',
											description: 'User language',
											example: 'en',
										},
									},
								},
								UserAdditional: {
									type: 'object',
									properties: {
										active: {
											type: 'boolean',
											description: 'user enabled',
											example: false,
										},
										createdBy: {
											type: 'string',
											description: 'User id',
											example: '5eb71ba74676dfca3fef434f',
										},
										createdDate: {
											type: 'string',
											description: 'Created date',
											default: '2022-09-12T17:22:32.243Z',
										},
										lastModifiedBy: {
											type: 'string',
											description: 'User id',
											example: '5eb71ba74676dfca3fef434f',
										},
										lastModifiedDate: {
											type: 'string',
											description: 'Last modified date',
											example: '2022-09-12T17:43:28.957Z',
										},
									},
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
					.catch((err) => {
						// @ts-ignore
						this.logger.error(`♻ Error testing for matches: ${err}`);
						throw new MoleculerServerError(
							'♻ Error testing for matches in swagger-initializer.js',
							500,
							'ERROR_TESTING_MATCHES',
							{ err },
						);
					});
			} catch (err) {
				throw new MoleculerServerError(
					'♻ unable to update swagger-initializer.js',
					500,
					'UNABLE_EDIT_SWAGGER_INITIALIZER',
					{ err },
				);
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
					'GET /swagger.json'(req: any, res: any): void {
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
								// return req.end(generatedScheme);
							}
						} catch (err) {
							throw new MoleculerServerError(
								'♻ Error updating swagger JSON schema',
								500,
								'UNABLE_UPDATE_SWAGGER_JSON',
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
				`♻ OpenAPI swagger Docs server is available at ${mixinOptions.routeOptions.path}`,
			);
		},
	};
};

module.exports = { openAPIMixin };
