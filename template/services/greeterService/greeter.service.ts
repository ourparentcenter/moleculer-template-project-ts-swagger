/* eslint-disable @typescript-eslint/explicit-member-accessibility */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
'use strict';
import moleculer, { Context } from 'moleculer';
import { Get, Post, Service } from '@ourparentcenter/moleculer-decorators-extended';
import { Config } from '../../common';
import { GreeterWelcomeParams } from '../../types';
import EncryptionUtil from '../../helpers/encryption.helper';
/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */
@Service({
	name: 'greeter',
	version: 1,
	/**
	 * Service guard token
	 */
	authToken: Config.GREETER_AUTH_TOKEN,
})
export default class GreeterService extends moleculer.Service {
	/**
	 *  @swagger
	 *
	 *  /v1/greeter/hello:
	 *    get:
	 *      tags:
	 *      - "Greeter"
	 *      summary: Say a 'Hello' action
	 *      description: Say a 'Hello' action
	 *      produces:
	 *        - application/json
	 *      consumes:
	 *        - application/json
	 *      responses:
	 *        200:
	 *          description: Hello result
	 *        403:
	 *          description: Server error
	 */
	@Get('/hello', {
		name: 'hello',
		/**
		 * Service guard services allowed to connect
		 */
		restricted: ['api'],
	})
	async hello() {
		const test = EncryptionUtil.encrypt('hello there!');
		console.log(test);
		const test2 = EncryptionUtil.decrypt(test);
		console.log(test2);
		const test3 = EncryptionUtil.bcrypt('hello there!');
		console.log(test3);
		const test4 = EncryptionUtil.compare('hello there!', test3);
		console.log(test4);
		return 'Hello Moleculer';
	}
	/**
	 *  @swagger
	 *
	 *  /v1/greeter/welcome:
	 *    post:
	 *      tags:
	 *      - "Greeter"
	 *      summary:  Welcome a username
	 *      description: Welcome a username
	 *      produces:
	 *        - application/json
	 *      consumes:
	 *        - application/json
	 *      parameters:
	 *        - in: body
	 *          name: params
	 *          schema:
	 *            type: object
	 *            required:
	 *              - name
	 *            properties:
	 *              name:
	 *                type: string
	 *                default: John
	 *                description: Name to be used
	 *      responses:
	 *        200:
	 *          description: welcome result
	 *        422:
	 *          description: Missing parameters
	 */
	@Post('/welcome', {
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
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		return `Welcome, ${ctx.params.name}`;
	}
}
