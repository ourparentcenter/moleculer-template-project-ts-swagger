/* eslint-disable no-underscore-dangle */
'use strict';
/**
 * Service for tenant catalog data in db
 */
import moleculer, { Context, Errors } from 'moleculer';
import { Action, Method, Service } from 'moleculer-decorators-extended';
import { sign, verify } from 'jsonwebtoken';
import errorHandler from '../../helpers/error.helper';

// eslint-disable-next-line @typescript-eslint/naming-convention
const MoleculerClientError = Errors.MoleculerClientError;
/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */
@Service({
	name: 'guard',
})
class GuardService extends moleculer.Service {
	/**
	 * Actions
	 */

	/**
	 * Check token and service
	 * @param ctx
	 */
	@Action({
		name: 'check',
		params: {
			token: 'string',
			services: {
				type: 'array',
				items: 'string',
			},
		},
	})
	public async check(ctx: Context<Record<string, never>>) {
		const { token, services } = ctx.params;
		return await this._verifyJWT(ctx, token, services);
	}

	/**
	 * Generate a JWT token for services.
	 * @param {Context} ctx
	 */
	@Action({
		name: 'generate',
		params: {
			service: 'string',
		},
	})
	public async generate(ctx: Context<Record<string, string>>) {
		const { service } = ctx.params;
		this.logger.warn('Only for development!');
		return await this._generateJWT(service);
	}

	/**
	 * Generate a JWT token for services
	 *
	 * @param {String} service
	 */
	@Method
	private async _generateJWT(service: string) {
		return new this.Promise((resolve, reject) =>
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			sign({ service }, process.env.API_JWT_SECRET, (err: unknown, token: unknown) => {
				if (err) {
					this.logger.warn('JWT token generation error:', err);
					return reject(
						new MoleculerClientError(
							'Unable to generate token',
							500,
							'UNABLE_GENERATE_TOKEN',
						),
					);
				}

				resolve(token);
			}),
		);
	}

	@Method
	private async _verifyJWT(
		ctx: Context<Record<string, never>>,
		token: string,
		services: unknown[],
	) {
		return new this.Promise((resolve, reject) => {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			verify(token, process.env.API_JWT_SECRET, (err, decoded: any) => {
				if (err) {
					errorHandler(ctx, 'JWT verifying error:', err);
					return reject(new MoleculerClientError('Invalid token', 401, 'INVALID_TOKEN'));
				}

				if (services && services.indexOf(decoded.service) === -1) {
					errorHandler(ctx, 'Forbidden service call:');
					return reject(new MoleculerClientError('Forbidden', 401, 'FORBIDDEN_SERVICE'));
				}
				resolve(token);
			});
		});
	}
}
module.exports = GuardService;
