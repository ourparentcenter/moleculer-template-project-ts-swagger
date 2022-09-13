// import { RequestMessage } from '../types';
export const serviceRoutes = [
	{
		// auth endpoint
		path: '/auth',
		cors: {
			origin: ['*'],
			methods: ['GET'],
			credentials: false,
			maxAge: 3600,
		},
		authorization: false,
		authentication: false,
		autoAliases: false,
		whitelist: [
			'v1.auth.login',
			'v1.auth.logout',
			'v1.auth.resolveToken',
			'v1.user.login',
			'v1.user.register',
			'v1.user.activate',
		],
		aliases: {
			'POST /login': 'v1.user.login',
			'GET /logout': 'v1.user.logout',
			'GET /verify': 'v1.auth.resolveToken',
			'POST /register': 'v1.user.register',
			'POST /activate': 'v1.user.activate',
		},
		// rate limit override for route
		/* rateLimit: {
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
		}, */
		bodyParsers: {
			json: true,
		},
	},
	{
		// for internal services communication only
		path: '/admin',
		cors: {
			origin: ['*'],
			methods: ['GET'],
			credentials: false,
			maxAge: 3600,
		},
		// Access to any alias actions in service under "/admin" URL
		whitelist: ['$node.*', 'api.listAliases'],
		authorization: false,
		authentication: false,
		// roles: [UserRole.SUPERADMIN],
		aliases: {
			'GET /health': '$node.health',
			'GET /services': '$node.services',
			'GET /actions': '$node.actions',
			'GET /list': '$node.list',
			'GET /metrics': '$node.metrics',
			'GET /events': '$node.events',
			'GET /options': '$node.options',
			'GET /aliases': 'api.listAliases',
		},

		bodyParsers: {
			json: true,
		},
	},
	{{#dbService}}
	{
		// for internal services communication only
		path: '/api/v1/greeter',
		cors: {
			origin: ['*'],
			methods: ['GET', 'OPTIONS', 'POST', 'PUT', 'DELETE'],
			credentials: false,
			maxAge: 3600,
		},
		whitelist: [
			// Access to any actions in service under "/api/v1/greeter" URL
			'v1.greeter.*',
		],
		// Enable authentication. Implement the logic into `authenticate` method. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Authentication
		authentication: false,

		// Enable authorization. Implement the logic into `authorize` method. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Authorization
		authorization: false,
		autoAliases: true,

		bodyParsers: {
			json: true,
		},
	},
	{
		// for internal services communication only
		path: '/api/v1/products',
		cors: {
			origin: ['*'],
			methods: ['GET', 'OPTIONS', 'POST', 'PUT', 'DELETE'],
			credentials: false,
			maxAge: 3600,
		},
		whitelist: [
			// Access to any actions in service under "/api/v1/products" URL
			'v1.products.*',
		],
		// Enable authentication. Implement the logic into `authenticate` method. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Authentication
		authentication: false,

		// Enable authorization. Implement the logic into `authorize` method. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Authorization
		authorization: false,
		autoAliases: true,

		bodyParsers: {
			json: true,
		},
	},
	{
		// for internal services communication only
		path: '/api/v1/user',
		cors: {
			origin: ['*'],
			methods: ['GET', 'OPTIONS', 'POST', 'PUT', 'DELETE'],
			credentials: false,
			maxAge: 3600,
		},
		whitelist: [
			// Access to any actions in service under "/api/v1/user" URL
			'v1.user.*',
		],
		// Enable authentication. Implement the logic into `authenticate` method. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Authentication
		authentication: true,

		// Enable authorization. Implement the logic into `authorize` method. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Authorization
		authorization: true,
		autoAliases: true,

		bodyParsers: {
			json: true,
		},
	},
	{{/dbService}}
];
