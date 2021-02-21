'use strict';
/**
 * Mixin for all dbs to seed data
 */
import { Errors } from 'moleculer';
import ApiGateway from 'moleculer-web';
import SwaggerUI from 'swagger-ui-dist';
import { writeFileSync, readFileSync } from 'fs';
import _ from 'lodash';
import swaggerJSDoc from 'swagger-jsdoc';
import * as pkg from '../../../package.json';
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

	let shouldUpdateSchema: boolean = true;
	let schema: any = null;

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
								'Moleculer JS Microservice Boilerplate with Typescript, TypeORM, CLI, Service Clients, Swagger, Jest, Docker, Eslint support and everything you will ever need to deploy rock solid projects..', // short description of the app
						},
						host: 'localhost:1337', // the host or url of the app
						basePath: '/api', // the basepath of your endpoint
					};
					// options for the swagger docs
					const options = {
						// import swaggerDefinitions
						definition: swaggerDefinition,
						explorer: true,
						enableCORS: false,

						// path to the API docs
						apis: ['./backend/services/**/*.service.ts'],
					};
					// initialize swagger-jsdoc
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
			const pathToSwaggerUi = SwaggerUI.absolutePath();
			const indexContent = readFileSync(`${pathToSwaggerUi}/index.html`)
				.toString()
				.replace(
					'https://petstore.swagger.io/v2/swagger.json',
					`${process.env.BASE_URL}:${process.env.BASE_PORT}/openapi/swagger.json`,
				);
			writeFileSync(`${pathToSwaggerUi}/index.html`, indexContent);
			const route = _.defaultsDeep(mixinOptions.routeOptions, {
				use: [ApiGateway.serveStatic(SwaggerUI.absolutePath())],

				aliases: {
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					'GET /swagger.json'(req, res) {
						// Send back the generated schema
						if (shouldUpdateSchema || !schema) {
							// Create new server & regenerate GraphQL schema
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment
							// @ts-ignore
							this.logger.info('♻ Regenerate OpenAPI/Swagger schema...');

							try {
								// eslint-disable-next-line @typescript-eslint/ban-ts-comment
								// @ts-ignore
								schema = this.generateOpenAPISchema();

								shouldUpdateSchema = false;

								// eslint-disable-next-line @typescript-eslint/ban-ts-comment
								// @ts-ignore
								this.logger.debug(schema);
								if (process.env.NODE_ENV != 'production')
									writeFileSync(
										'./swagger.json',
										JSON.stringify(schema, null, 4),
										'utf8',
									);
							} catch (err) {
								// eslint-disable-next-line @typescript-eslint/ban-ts-comment
								// @ts-ignore
								this.logger.warn(err);
								// eslint-disable-next-line @typescript-eslint/ban-ts-comment
								// @ts-ignore
								this.sendError(req, res, err);
							}
						}

						const ctx = req.$ctx;
						ctx.meta.responseType = 'application/json';

						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						return this.sendResponse(req, res, schema);
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
				`♻ OpenAPI Docs server is available at ${mixinOptions.routeOptions.path}`,
			);
		},
	};
};

module.exports = { openAPIMixin };
