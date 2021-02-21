'use strict';
import { Errors, Context } from 'moleculer';
// eslint-disable-next-line @typescript-eslint/naming-convention
const MoleculerClientError = Errors.MoleculerClientError;
module.exports = {
	name: 'ServiceGuard',
	// Wrap local action handlers (legacy middleware handler)
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	localAction(next: any, action: Record<string, unknown>) {
		// If this feature enabled
		if (action.restricted) {
			// Create new handler
			// eslint-disable-next-line @typescript-eslint/naming-convention
			const ServiceGuardMiddleware = (async (
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				ctx: Context<string, Record<string, any>>,
			) => {
				// Check the service auth token in Context meta
				const token = ctx.meta.$authToken;
				if (!token) {
					throw new MoleculerClientError(
						'Service token is missing',
						401,
						'TOKEN_MISSING',
					);
				}

				// Verify token & restricted services
				// Tip: For better performance, you can cache the response because it won't change in runtime.
				await ctx.call('guard.check', { token, services: action.restricted });

				// Call the original handler
				return await next(ctx);
			}).bind(this);

			return ServiceGuardMiddleware;
		}

		// Return original handler, because feature is disabled
		return next;
	},

	// Wrap broker.call method
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	call(next: any) {
		// Create new handler
		return (async (
			actionName: string,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			params: Record<string, any>,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			opts: Record<string, any> = {},
		) => {
			// Put the service auth token in the meta
			if (opts.parentCtx) {
				const service = opts.parentCtx.service;
				const token = service.schema.authToken;

				if (!opts.meta) {
					opts.meta = {};
				}

				opts.meta.$authToken = token;
			}

			// Call the original handler
			return await next(actionName, params, opts);
		}).bind(this);
	},
};
