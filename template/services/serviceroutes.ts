export const serviceRoutes = [
	{
		// auth endpoint
		path: '/auth',
		authorization: false,
		authentication: false,
		whitelist: ['v1.user.login'],
		aliases: {
			'POST /login': 'v1.user.login',
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
	},
	{
		// for internal services communication only
		path: '/admin',
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
			// Access to any actions in all services under "/api" URL
			'v1.greeter.*',
		],
		// Enable authentication. Implement the logic into `authenticate` method. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Authentication
		authentication: false,

		// Enable authorization. Implement the logic into `authorize` method. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Authorization
		authorization: false,
		autoAliases: true,
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
			// Access to any actions in all services under "/api" URL
			'v1.products.*',
		],
		// Enable authentication. Implement the logic into `authenticate` method. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Authentication
		authentication: false,

		// Enable authorization. Implement the logic into `authorize` method. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Authorization
		authorization: false,
		autoAliases: true,
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
			// Access to any actions in all services under "/api" URL
			'v1.user.*',
		],
		// Enable authentication. Implement the logic into `authenticate` method. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Authentication
		authentication: true,

		// Enable authorization. Implement the logic into `authorize` method. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Authorization
		authorization: true,
		autoAliases: true,
	},
	{{/dbService}}
];
