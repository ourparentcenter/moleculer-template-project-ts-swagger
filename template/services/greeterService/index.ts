/* eslint-disable @typescript-eslint/explicit-member-accessibility */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
'use strict';
import { Context } from 'moleculer';
import { Get, Post, Service } from '@ourparentcenter/moleculer-decorators-extended';
import { Config } from '@Common';
import { GreeterWelcomeParams, RestOptions } from '@CoreTypes';
import { BaseService } from '@Factories';
import { EncryptionUtils } from '@ServiceHelpers';
/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */
@Service({
	name: 'greeter',
	version: 1,
	mergeActions: true,
	/**
	 * Service guard token
	 */
	authToken: Config.GREETER_AUTH_TOKEN,
	/**
	 * Settings
	 */
	settings: {
		idField: '_id',
		// Available fields in the responses
		fields: ['_id', 'name', 'quantity', 'price'],
		// Base path
		rest: '/',
		// rest: '/v1/greeter',
		// Validator for the `create` & `insert` actions.
		entityValidator: {
			name: 'string|min:3',
		},
	},
})
export default class GreeterService extends BaseService {
	/**
	 *  @swagger
	 *
	 *  /api/v1/greeter/hello:
	 *    get:
	 *      tags:
	 *      - "Greeter"
	 *      summary: Say a 'Hello' action
	 *      description: Say a 'Hello' action
	 *      responses:
	 *        200:
	 *          description: Hello result
	 *          content: {}
	 *        403:
	 *          description: Server error
	 *          content: {}
	 */
	@Get<RestOptions>('/hello', {
		name: 'hello',
		/**
		 * Service guard services allowed to connect
		 */
		restricted: ['api'],
	})
	async hello() {
		this.logger.debug('♻ Returning hello string');
		const woman = EncryptionUtils.encrypt('Hot woman here, decrypt me!!');
		const decryptedWoman = EncryptionUtils.decrypt(woman);
		this.logger.warn('Encrypted woman: ', woman);
		this.logger.warn('Explicit content: ', decryptedWoman);
		return 'Hello Moleculer';
	}
	/**
	 *  @swagger
	 *
	 *  /api/v1/greeter/welcome:
	 *    post:
	 *      tags:
	 *      - "Greeter"
	 *      summary:  Welcome a username
	 *      description: Welcome a username
	 *      requestBody:
	 *        content:
	 *          application/json:
	 *            schema:
	 *              required:
	 *              - name
	 *              type: object
	 *              properties:
	 *                name:
	 *                  type: string
	 *                  description: Name to be used
	 *                  default: John
	 *        required: false
	 *      responses:
	 *        200:
	 *          description: welcome result
	 *          content: {}
	 *        422:
	 *          description: Missing parameters
	 *          content: {}
	 *      x-codegen-request-body-name: params
	 */
	@Post<RestOptions>('/welcome', {
		name: 'welcome',
		/**
		 * Service guard services allowed to connect
		 */
		restricted: ['api'],
		params: {
			name: 'string',
		},
	})
	async welcome(ctx: Context<GreeterWelcomeParams, Record<string, unknown>>) {
		this.logger.debug('♻ Returning Welcome <user name> string');
		return `Welcome, ${ctx.params.name}`;
	}
}
