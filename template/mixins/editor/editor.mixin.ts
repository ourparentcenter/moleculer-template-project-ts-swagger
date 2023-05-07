/* eslint-disable prefer-arrow/prefer-arrow-functions */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
'use strict';
/**
 * Mixin for swagger
 */
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { Errors } from 'moleculer';
import ApiGateway from 'moleculer-web';
import _, { isEqual } from 'lodash';
import { RequestMessage } from 'types';
import { replaceInFile } from 'replace-in-file';
import YAML from 'js-yaml';
import { Config } from '../../common';
import path from 'path';
import { generateOpenAPISchema } from '@ServiceHelpers';
// eslint-disable-next-line @typescript-eslint/naming-convention
const MoleculerServerError = Errors.MoleculerServerError;
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
			generateOpenAPISchema,

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
			// deepcode ignore NoRateLimitingForExpensiveWebOperation: rate limit handled by api gateway
			async getSwaggerFile(req: any, res: any): Promise<any> {
				try {
					const ctx = req.$ctx;
					const swJSON = await ctx.call('api.getOpenApiSchema');

					ctx.meta.responseType = 'application/x-yaml';
					// @ts-ignore
					const generatedYAML = this.generateYAML(JSON.stringify(swJSON));
					const YAMLFile = existsSync('./swagger.yaml');
					let swYAML;

					return !YAMLFile
						? // @ts-ignore
						  (this.logger.warn('♻ No YAML file found, creating it.'),
						  writeFileSync('./swagger.yaml', generatedYAML, 'utf8'),
						  res.end(generatedYAML))
						: ((swYAML = YAML.load(readFileSync('./swagger.yaml', 'utf8'))),
						  // @ts-ignore
						  this.logger.debug('♻ Checking if Swagger YAML schema needs updating...'),
						  isEqual(swYAML, swJSON)
								? // @ts-ignore
								  (this.logger.debug(
										'♻ No changes needed, swagger YAML schema has the correct values',
								  ),
								  res.end(generatedYAML))
								: // @ts-ignore
								  (this.logger.debug(
										'♻ Swagger YAML schema needs updating, updating file...',
								  ),
								  writeFileSync('./swagger.yaml', generatedYAML, 'utf8'),
								  // @ts-ignore
								  this.logger.debug('♻ Updated swagger YAML'),
								  res.end(generatedYAML)));
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

			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			this.logger.debug(
				`♻ Testing for matches to modify in swagger editor html at ${pathToSwaggerEitorHtml}`,
			);
			replaceInFile({ dry: true, countMatches: true, ...options })
				.then((results) => {
					results[0]['hasChanged'] === true
						? // @ts-ignore
						  (this.logger.debug(
								`♻ Found matches in swagger editor html, updating file...`,
						  ),
						  replaceInFile(options)
								.then(
									// @ts-ignore
									this.logger.debug(
										`♻ Updated swagger editor html at ${pathToSwaggerEitorHtml}`,
									),
								)
								.catch((err) =>
									// @ts-ignore
									this.logger.error(
										`♻ Error updating swagger editor html at ${pathToSwaggerEitorHtml}: ${err}`,
									),
								))
						: // @ts-ignore
						  this.logger.debug(
								'♻ No changes needed, swagger editor html has the correct values',
						  );
				})
				.catch((err) => {
					// @ts-ignore
					this.logger.error(`♻ Error testing for matches: ${err}`);
					throw new MoleculerServerError(
						`♻ Unable to update swagger editor html at ${pathToSwaggerEitorHtml}`,
						500,
						'UNABLE_EDIT_SWAGGER_HTML',
						{ err },
					);
				});

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
					// deepcode ignore NoRateLimitingForExpensiveWebOperation: rate limited by api gateway
					async 'GET /swagger.yaml'(req: any, res: any): void {
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						this.logger.debug('♻ Serving swagger.yaml');
						// @ts-ignore
						this.getSwaggerFile(req, res);
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
			this.logger.debug(
				`♻ Swagger Editor server is available at ${mixinOptions.routeOptions.path}`,
			);
		},
	};
};
