/* eslint-disable @typescript-eslint/explicit-member-accessibility */
/* eslint-disable @typescript-eslint/member-ordering */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { ServerResponse } from 'http';
import { Context, Errors } from 'moleculer';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import ApiGateway from 'moleculer-web';
import { Service, Method, Action } from '@ourparentcenter/moleculer-decorators-extended';
import pick from 'lodash/pick';
{{#swagger}}import { openAPIMixin, {{#swaggereditor}}editorMixin,{{/swaggereditor}} {{#swaggerstats}}swMiddleware, swStats{{/swaggerstats}} } from '@Mixins';{{/swagger}}
import { Config } from '@Common';
import {
	RequestMessage,
	UserJWT,
	// UserRole,
	UserRolesParams,
	UserTokenParams,
	UserAuthMeta,
} from '../../types';
import { serviceRoutes } from '../serviceroutes';
// {{#swaggerstats}} import { swMiddleware, swStats } from '../../mixins/swstats'; {{/swaggerstats}}
import { BaseService } from '@Factories';
{{#if_eq httptransport "SOCKET"}}
import { Server, Socket } from 'socket.io';
{{/if_eq}}

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 * @typedef {import('http').IncomingMessage} IncomingRequest Incoming HTTP Request
 * @typedef {import('http').ServerResponse} ServerResponse HTTP Server Response
 */
@Service({
	name: 'api',
	authToken: Config.API_AUTH_TOKEN,
	mixins: [ApiGateway{{#swagger}}, openAPIMixin(){{/swagger}}{{#swaggereditor}}, editorMixin(){{/swaggereditor}}],
	// More info about settings: https://moleculer.services/docs/0.14/moleculer-web.html
	settings: {
		// rate limiter default for all routes
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

		port: Config.PORT || 3000,

		use: [
			cookieParser(),
			helmet({
				contentSecurityPolicy: {
					directives: {
						'default-src': ["'self'"],
						'base-uri': ["'self'"],
						// 'block-all-mixed-content',
						'font-src': ["'self'"],
						'frame-ancestors': ["'self'"],
						'img-src': ["'self'", 'data:'],
						'object-src': ["'none'"],
						'script-src': ["'self'", "'unsafe-inline'"{{#swaggereditor}}, "'unsafe-eval'"{{/swaggereditor}}],
						'script-src-attr': ["'none'"],
						'style-src': ["'self'", "'unsafe-inline'"],
						'upgrade-insecure-requests': [],
						{{#swaggereditor}}'worker-src': ['blob:'],
						'connect-src': [
							"'self'",
							'https://generator3.swagger.io/openapi.json',
							'https://generator3.swagger.io/api/clients',
							'https://generator3.swagger.io/api/servers',
							'https://generator.swagger.io/api/swagger.json',
							'https://generator.swagger.io/api/gen/clients',
							'https://generator.swagger.io/api/gen/servers',
							'https://converter.swagger.io/api/convert',
						],{{/swaggereditor}}
					},
				},
			}),
		],
		routes: [
			{
				// api dashboard thorugh swagger stats
				path: '/api',
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
				// Route-level Express middlewares. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Middlewares
				// usign swagger stats dachboard
				use: [{{#swaggerstats}}swMiddleware{{/swaggerstats}}],
				// Enable/disable parameter merging method. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Disable-merging
				mergeParams: true,

				// Enable authentication. Implement the logic into `authenticate` method. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Authentication
				authentication: false,

				// Enable authorization. Implement the logic into `authorize` method. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Authorization
				authorization: false,

				// The auto-alias feature allows you to declare your route alias directly in your services.
				// The gateway will dynamically build the full routes from service schema.
				autoAliases: false,

				aliases: {
					{{#swaggerstats}}
					// swagger stats dashboard route at root
					'GET /'(req: any, res: any) {
						// @ts-ignore
						this.apiDashboard(res);
					},
					'GET /stats'(req: any, res: any) {
						// @ts-ignore
						this.getStats(res);
					},
					'GET /metrics'(req: any, res: any) {
						// @ts-ignore
						this.getMetrics(res);
					},
					{{/swaggerstats}}
				},
				/**
				 * Before call hook. You can check the request.
				 * @param {Context} ctx
				 * @param {Object} route
				 * @param {IncomingMessage} req
				 * @param {ServerResponse} res
				 * @param {Object} data
				onBeforeCall(ctx: Context<any,{userAgent: string}>,
					route: object, req: IncomingMessage, res: ServerResponse) {
					Set request headers to context meta
					ctx.meta.userAgent = req.headers["user-agent"];
				},
				*/

				/**
				 * After call hook. You can modify the data.
				 * @param {Context} ctx
				 * @param {Object} route
				 * @param {IncomingMessage} req
				 * @param {ServerResponse} res
				 * @param {Object} data
				 *
				 onAfterCall(ctx: Context, route: object, req: IncomingMessage, res: ServerResponse, data: object) {
					// Async function which return with Promise
					return doSomething(ctx, res, data);
				},
				*/

				// Calling options. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Calling-options
				callingOptions: {},

				bodyParsers: {
					json: {
						strict: false,
						limit: '1MB',
					},
					urlencoded: {
						extended: true,
						limit: '1MB',
					},
				},

				// Mapping policy setting. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Mapping-policy
				mappingPolicy: Config.MAPPING_POLICY, // Available values: "all", "restrict"

				// Enable/disable logging
				logging: true,
			},
			...serviceRoutes,
		],
		// Do not log client side errors (does not log an error response when the error.code is 400<=X<500)
		log4XXResponses: false,
		// Logging the request parameters. Set to any log level to enable it. E.g. "info"
		logRequestParams: 'info',
		// Logging the response data. Set to any log level to enable it. E.g. "info"
		logResponseData: null,
		// Serve assets from "public" folder
		assets: {
			folder: 'public',
			// Options to `server-static` module
			options: {},
		},
	},
	{{#if_eq httptransport "SOCKET"}}
	events: {
		'**'(payload, sender, event) {
			if (this.io) {
				this.io.emit('event', {
					sender,
					event,
					payload,
				});
			}
		},
	},
	{{/if_eq}}
})
export default class ApiService extends BaseService {
	// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
	public onError(req: RequestMessage, res: ServerResponse, err: any): void {
		// Return with the error as JSON object
		res.setHeader('Content-type', 'application/json; charset=utf-8').writeHead(err.code || 500);
		const error422 = () => {
			const o: any = {};
			err.data.forEach((e: any) => {
				const field = e.field.split('.').pop();
				o[field] = e.message;
			});
			this.sendResponse(req, res, JSON.stringify({ errors: o }, null, 2));
		};
		const nonError422 = () => {
			const errObj = pick(err, ['name', 'message', 'code', 'type', 'data']);
			// deepcode ignore ServerLeak: errorObj is reduced to only necessary information relayed
			// res.end(JSON.stringify(errObj, null, 2));
			this.sendResponse(req, res, JSON.stringify(errObj, null, 2));
		};

		err.code === 422 ? error422() : nonError422();
		return this.logResponse(req, res, err ? err.ctx : null);
	}

	@Method
	apiDashboard(res: any): void {
		this.logger.debug('♻ Redirecting to api dashboard');
		this.sendRedirect(res, '/api/dashboard/', 302);
	}

	@Method
	getStats(res: any) {
		this.logger.debug('♻ Sending sw stats');
		res.setHeader('Content-Type', 'application/json; charset=utf-8');
		return res.end(JSON.stringify(swStats.getCoreStats()));
	}

	@Method
	getMetrics(res: any) {
		this.logger.debug('♻ Sending sw metrics');
		res.setHeader('Content-Type', 'application/json; charset=utf-8');
		return res.end(JSON.stringify(swStats.getPromStats()));
	}

	/**
	 * Reject response for the authentication or authorization request.
	 *
	 * @param {Context} ctx
	 * @param {Errors.MoleculerError} error
	 * @returns {Promise}
	 */
	@Method
	async rejectAuth(
		ctx: Context<Record<string, unknown>, UserAuthMeta>,
		error: Errors.MoleculerError,
	): Promise<unknown> {
		const action = pick(ctx.action, 'rawName', 'name', 'params', 'rest');
		const context = pick(
			ctx,
			'nodeID',
			'id',
			'event',
			'eventName',
			'eventType',
			'eventGroups',
			'parentID',
			'requestID',
			'caller',
			'params',
			'meta',
			'locals',
		);
		const logInfo = {
			action: 'Authorize connection',
			details: {
				error,
				context,
				action,
				meta: ctx.meta,
			},
		};
		if (ctx.meta.user) {
			this.logger.error(logInfo);
		}
		this.logger.error('♻ Error authenticating: ', logInfo);
		return Promise.reject(error);
	}

	/**
	 * Authenticate the request. It check the `Authorization` token value in the request header.
	 * Check the token value & resolve the user by the token.
	 * The resolved user will be available in `ctx.meta.user`
	 *
	 * PLEASE NOTE, IT'S JUST AN EXAMPLE IMPLEMENTATION. DO NOT USE IN PRODUCTION!
	 *
	 * @param {Context} ctx
	 * @param {any} route
	 * @param {RequestMessage} req
	 * @returns {Promise}
	 */
	@Method
	async authenticate(
		ctx: Context<Record<string, unknown>, UserAuthMeta>,
		route: any,
		req: RequestMessage,
	): Promise<unknown> {
		const auth = req.headers.authorization;

		this.logger.debug('♻ Attempting to authenticte request...');
		if (auth) {
			const type = auth.split(' ')[0];
			let token: string | undefined;
			if (type === 'Token' || type === 'Bearer') {
				this.logger.debug('♻ Aquired token');
				token = auth.split(' ')[1];
			}

			if (token) {
				this.logger.debug('♻ Attempting to get user from token...');
				const user = await ctx.call<UserJWT | undefined, UserTokenParams>(
					'v1.auth.resolveToken',
					{ token },
				);
				if (user && user.active) {
					this.logger.debug('♻ Returning user from token...');
					return Promise.resolve(user);
				}
			}
			return this.rejectAuth(
				ctx,
				new ApiGateway.Errors.UnAuthorizedError(ApiGateway.Errors.ERR_INVALID_TOKEN, null),
			);
		}
		return this.rejectAuth(
			ctx,
			new ApiGateway.Errors.UnAuthorizedError(ApiGateway.Errors.ERR_NO_TOKEN, null),
		);
	}

	/**
	 * Authorize the request.
	 *
	 * @param {Context} ctx
	 * @param {any} route
	 * @param {RequestMessage} req
	 * @returns {Promise}
	 */
	@Method
	async authorize(
		ctx: Context<Record<string, unknown>, UserAuthMeta>,
		route: any,
		req: RequestMessage,
	): Promise<unknown> {
		const user = ctx.meta.user;

		this.logger.debug('♻ Attempting to authorize request...');
		if (req.$action.auth === false) {
			this.logger.debug('♻ Not authorized');
			return Promise.resolve(null);
		}
		if (!user) {
			this.logger.debug('♻ No useer to request');
			return this.rejectAuth(
				ctx,
				new ApiGateway.Errors.UnAuthorizedError(ApiGateway.Errors.ERR_NO_TOKEN, null),
			);
		}
		const aroles = Array.isArray(req.$action.roles) ? req.$action.roles : [req.$action.roles];
		const oroles = Array.isArray(req.$route.opts.roles)
			? req.$route.opts.roles
			: [req.$route.opts.roles];
		const allRoles = [...aroles, ...oroles].filter(Boolean);
		const roles = [...new Set(allRoles)];
		this.logger.debug('♻ Attempting to validate user role...');
		const valid = await ctx.call<boolean, UserRolesParams>('v1.auth.validateRole', { roles });
		if (!valid) {
			this.logger.debug('♻ User role not valid');
			return this.rejectAuth(
				ctx,
				new ApiGateway.Errors.UnAuthorizedError(ApiGateway.Errors.ERR_INVALID_TOKEN, null),
			);
		}
		this.logger.debug('♻ Forwarding authorized request');
		return Promise.resolve(ctx);
	}
	{{#if_eq httptransport "SOCKET"}}
	started() {
		this.logger.info('Starting socket.io server....');
		this.io = new Server(this.server, {
			cors: {
				origin: '*',
				methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
			},
		});
		const brokerNamespace: Socket = this.io.of('/brokercomponent');
		const nodesNamespace: Socket = this.io.of('/nodescomponent');
		const servicesNamespace: Socket = this.io.of('/servicescomponent');
		this.io.on('connection', (socket: Socket) => {
			this.logger.info(`Client connected to default via websocket ${socket.id}`);
			// @ts-ignore
			socket.on('call', ({ action, params, opts }, done: any) => {
				this.logger.info(
					`Received request from client to default namespace! Action: ${action}, Params: `,
					params,
				);
				this.broker
					.call(action, params, opts)
					.then((res) => {
						if (done) done(res);
					})
					.catch((err) => this.logger.error(err));
			});
			socket.on('disconnect', () => {
				this.logger.info('Client disconnected from default namespace');
			});
		});

		brokerNamespace.on('connection', (socket: Socket) => {
			this.logger.info(`Client connected to broker via websocket ${socket.id}`);
			brokerNamespace.emit(
				'connected',
				`Socket connected to broker namespace, ID is ${socket.id}`,
			);
			socket.on('call', ({ action, params, opts }, done: any) => {
				this.logger.info(
					`Received request from client to broker namespace! Action: ${action}, Params: `,
					params,
				);
				this.broker
					.call(action, params, opts)
					.then((res) => {
						if (done) done(res);
					})
					.catch((err) => this.logger.error(err));
			});
			socket.on('disconnect', () => {
				this.logger.info('Client disconnected from broker namespace');
			});
		});

		nodesNamespace.on('connection', (socket: Socket) => {
			this.logger.info(`Client connected to nodes via websocket ${socket.id}`);
			nodesNamespace.emit(
				'connected',
				`Socket connected to nodes namespace, ID is ${socket.id}`,
			);
			socket.on('call', ({ action, params, opts }, done: any) => {
				this.logger.info(
					`Received request from client to nodes namespace! Action: ${action}, Params: `,
					params,
				);
				this.broker
					.call(action, params, opts)
					.then((res) => {
						if (done) done(res);
					})
					.catch((err) => this.logger.error(err));
			});
			socket.on('disconnect', () => {
				this.logger.info('Client disconnected from nodes namespace');
			});
		});

		servicesNamespace.on('connection', (socket: Socket) => {
			this.logger.info(`Client connected to services via websocket ${socket.id}`);
			servicesNamespace.emit(
				'connected',
				`Socket connected to services namespace, ID is ${socket.id}`,
			);
			socket.on('call', ({ action, params, opts }, done: any) => {
				this.logger.info(
					`Received request from client to services namespace! Action: ${action}, Params: `,
					params,
				);
				this.broker
					.call(action, params, opts)
					.then((res) => {
						if (done) done(res);
					})
					.catch((err) => this.logger.error(err));
			});
			socket.on('disconnect', () => {
				this.logger.info('Client disconnected from services namespace');
			});
		});
	}
	{{/if_eq}}
}
