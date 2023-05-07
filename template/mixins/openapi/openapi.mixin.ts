/* eslint-disable prefer-arrow/prefer-arrow-functions */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
'use strict';
/**
 * Mixin for swagger
 */
import { existsSync, writeFileSync } from 'fs';
import { Errors } from 'moleculer';
import ApiGateway from 'moleculer-web';
import SwaggerUI from 'swagger-ui-dist';
import _, { isEqual } from 'lodash';
import { Config } from '../../common';
import { RequestMessage } from 'types';
import { replaceInFile } from 'replace-in-file';
import { generateOpenAPISchema } from '@ServiceHelpers/openAPISchema.helper';
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
			generateOpenAPISchema,
		},
		actions: {
			getOpenApiSchema(ctx: any): void {
				try {
					ctx.meta.$responseType = 'application/json';
					const swJSONFile = existsSync('./swagger.json');
					let swJSON;
					// @ts-ignore
					const generatedScheme = this.generateOpenAPISchema();

					return !swJSONFile
						? // @ts-ignore
						  (this.logger.warn('♻ No Swagger JSON file found, creating it.'),
						  writeFileSync(
								'./swagger.json',
								JSON.stringify(generatedScheme, null, 4),
								'utf8',
						  ),
						  generatedScheme)
						: ((swJSON = require('../../swagger.json')),
						  // @ts-ignore
						  this.logger.debug('♻ Checking if Swagger JSON schema needs updating...'),
						  isEqual(swJSON, generatedScheme)
								? // @ts-ignore
								  (this.logger.debug(
										'♻ No changes needed, swagger json schema has the correct values',
								  ),
								  generatedScheme)
								: // @ts-ignore
								  (this.logger.debug(
										'♻ Swagger JSON schema needs updating, updating file...',
								  ),
								  writeFileSync(
										'./swagger.json',
										JSON.stringify(generatedScheme, null, 4),
										'utf8',
								  ),
								  // @ts-ignore
								  this.logger.debug(`♻ Updated swagger JSON`),
								  generatedScheme));
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
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			this.logger.debug(
				`♻ Testing for matches to modify in swagger initalize at ${pathToSwaggerUi}/swagger-initializer.js`,
			);
			replaceInFile({ dry: true, countMatches: true, ...options })
				.then((results) => {
					results[0]['hasChanged'] === true
						? // @ts-ignore
						  (this.logger.debug(
								`♻ Found matches in swagger initalize, updating file...`,
						  ),
						  replaceInFile(options)
								.then(
									// @ts-ignore
									this.logger.debug(
										`♻ Updated swagger initalize at ${pathToSwaggerUi}/swagger-initializer.js`,
									),
								)
								.catch((err) =>
									// @ts-ignore
									this.logger.error(
										`♻ Error updating swagger initalize at ${pathToSwaggerUi}/swagger-initializer.js: ${err}`,
									),
								))
						: // @ts-ignore
						  this.logger.debug(
								'♻ No changes needed, swagger initialize has the correct values',
						  );
				})
				.catch((err) => {
					// @ts-ignore
					this.logger.error(`♻ Error testing for matches: ${err}`);
					throw new MoleculerServerError(
						'♻ unable to update swagger-initializer.js',
						500,
						'UNABLE_EDIT_SWAGGER_INITIALIZER',
						{ err },
					);
				});

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
					'GET /swagger.json': 'api.getOpenApiSchema',
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
			this.logger.debug(
				`♻ OpenAPI swagger Docs server is available at ${mixinOptions.routeOptions.path}`,
			);
		},
	};
};
