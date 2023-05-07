export const swComponents = {
	securitySchemes: {
		bearerAuth: {
			type: 'http',
			scheme: 'bearer',
			bearerFormat: 'JWT',
		},
	},
	schemas: {
		VerificationToken: {
			type: 'object',
			properties: {
				verificationToken: {
					type: 'string',
					description: 'Token to activate user',
					example: 'pl9A3MLkTRy7O7fVyIG5WUmdKDxvYPH14on3lQ7G31Clwhmhcd6Nqv4OeM9l5hDS',
				},
			},
		},
		Product: {
			type: 'object',
			properties: {
				name: {
					type: 'string',
					description: 'Name of product',
					example: 'Samsung Galaxy S20 Edge',
				},
				quantity: {
					type: 'number',
					description: 'Quantity of product',
					example: 10,
				},
				price: {
					type: 'number',
					description: 'Cost of product',
					example: 875,
				},
				active: {
					type: 'boolean',
					description: 'Product active',
					example: false,
				},
			},
		},
		User: {
			type: 'object',
			properties: {
				login: {
					type: 'string',
					description: 'Login to be used',
					example: 'joeLogin',
				},
				firstName: {
					type: 'string',
					description: 'First Name',
					default: 'Joe',
				},
				lastName: {
					type: 'string',
					description: 'Surname',
					example: 'Doe',
				},
				email: {
					type: 'string',
					description: 'Email',
					example: 'joedoe@test.com',
				},
				password: {
					type: 'string',
					description: 'Password',
					example: 'testPass1234',
				},
				langKey: {
					type: 'string',
					description: 'User language',
					example: 'en-us',
				},
			},
		},
		Roles: {
			type: 'object',
			properties: {
				role: {
					type: 'string',
					description: 'Name of role',
					example: 'Admin',
				},
				value: {
					type: 'string',
					description: 'Value of role',
					default: 'ROLE_ADMIN',
				},
				active: {
					type: 'boolean',
					description: 'Active role',
					example: true,
				},
				langKey: {
					type: 'string',
					description: 'User language',
					example: 'en-us',
				},
				systemLocked: {
					type: 'boolean',
					description: 'Locked by system for deletion',
					example: true,
				},
			},
		},
		UserAdditional: {
			type: 'object',
			properties: {
				active: {
					type: 'boolean',
					description: 'user enabled',
					example: false,
				},
				createdBy: {
					type: 'string',
					description: 'User id',
					example: '5eb71ba74676dfca3fef434f',
				},
				createdDate: {
					type: 'string',
					description: 'Created date',
					default: '2022-09-12T17:22:32.243Z',
				},
				lastModifiedBy: {
					type: 'string',
					description: 'User id',
					example: '5eb71ba74676dfca3fef434f',
				},
				lastModifiedDate: {
					type: 'string',
					description: 'Last modified date',
					example: '2022-09-12T17:43:28.957Z',
				},
			},
		},
	},
};
export const swSecurity = [
	{
		bearerAuth: [],
	},
];
