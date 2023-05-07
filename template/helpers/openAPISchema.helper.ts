import * as pkg from '../package.json';
import { Config } from '../common';
import swaggerJSDoc from 'swagger-jsdoc';
import { Errors } from 'moleculer';
import { swComponents, swSecurity } from '@Mixins/swComponents';

const MoleculerServerError = Errors.MoleculerServerError;
/**
 * Generate OpenAPI Schema
 */
export const generateOpenAPISchema = (): any => {
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
			components: swComponents,
			security: swSecurity,
		};
		// Options for the swagger docs
		const options = {
			// failOnErrors: true,
			// verbose: true,
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
		// @ts-ignore
		this.logger.error('Unable to compile OpenAPI schema', err);
		throw new MoleculerServerError(
			'Unable to compile OpenAPI schema',
			500,
			'UNABLE_COMPILE_OPENAPI_SCHEMA',
			{ err },
		);
	}
};
