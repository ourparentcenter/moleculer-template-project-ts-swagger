/* eslint-disable no-underscore-dangle */
'use strict';
/**
 * Service for tenant catalog data in db
 */
import { Context, Errors } from 'moleculer';
import { Action, Method, Service } from '@ourparentcenter/moleculer-decorators-extended';
import { sign, verify } from 'jsonwebtoken';
import { errorHandler } from '@ServiceHelpers';
import { BaseService } from '@Factories';

const MoleculerClientError = Errors.MoleculerClientError;
/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */
@Service({
	name: 'guard',
	version: 1,
})
export default class GuardService extends BaseService {
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
		this.logger.debug('♻ Attempting to check JWT...');
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
		this.logger.warn('Generating service JWT. Use only for development!');
		return await this._generateJWT(service);
	}

	/**
	 * Generate a JWT token for services
	 *
	 * @param {String} service
	 */
	@Method
	private async _generateJWT(service: string) {
		this.logger.debug('♻ Attempting to generating service JWT...');
		return new this.Promise((resolve, reject) =>
			sign({ service }, process.env.API_JWT_SECRET!, (err: unknown, token: unknown) => {
				if (err) {
					this.logger.error('JWT service token generation error:', err);
					return reject(
						new MoleculerClientError(
							'Unable to generate token',
							500,
							'UNABLE_GENERATE_TOKEN',
						),
					);
				}
				this.logger.debug('♻ Returning generated service JWT');
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
			this.logger.debug('♻ Attempting to verify service JWT...');
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
				this.logger.debug('♻ Verified service JWT');
				resolve(token);
			});
		});
	}
}
