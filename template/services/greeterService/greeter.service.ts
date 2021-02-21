'use strict';
import moleculer, { Context } from 'moleculer';
import { Action, Service } from 'moleculer-decorators';
/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */
@Service({
	name: 'greeter',
	version: 1,
	/**
	 * Service guard token
	 */
	authToken: process.env.GREETER_AUTH_TOKEN,
})
export default class GreeterService extends moleculer.Service {
	/**
	 *  @swagger
	 *
	 *  /greeter/hello:
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
	@Action({
		name: 'hello',
		/**
		 * Service guard services allowed to connect
		 */
		required: ['api'],
		rest: 'GET /hello',
	})
	async hello() {
		return 'Hello Moleculer';
	}
	/**
	 *  @swagger
	 *
	 *  /greeter/welcome:
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
	@Action({
		name: 'welcome',
		/**
		 * Service guard services allowed to connect
		 */
		required: ['api'],
		rest: 'POST /welcome',
		params: {
			name: 'string',
		},
	})
	async welcome(ctx: Context) {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		return `Welcome, ${ctx.params.name}`;
	}
}
