'use strict';
import { verify } from 'jsonwebtoken';
import { Context, Errors } from 'moleculer';
import EncryptionUtil from '../helpers/encryption.helper';
import { Config } from '../common';

// eslint-disable-next-line @typescript-eslint/naming-convention
const MoleculerClientError = Errors.MoleculerClientError;

/**
 * Create connection options to tenant db
 *
 * @param {Object} entity - Entity of service
 * @param {Object} ctx - Service context
 * @returns {Object} DB Connection Options
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
const ServiceConnection = async (
	entity: unknown,
	ctx: Context,
	// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
	connect: any,
): Promise<unknown> => {
	const { token }: Record<string, string> = ctx.meta;
	if (!token) {
		throw new MoleculerClientError('Unauthorized', 401, '', [
			{ field: 'token', message: 'token is missing or expired' },
		]);
	} else {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const options: Record<string, never> = verify(Config.JWT_SECRET);
		const connectionOpts = {
			database: String(options.database),
			name: `${ctx.action?.name}:${options.database}`,
			// url: process.env.URL,
			type: String(Config.DBENGINE),
			username: String(options.dbUsername),
			password: EncryptionUtil.decrypt(options.dbPass),
			host: String(Config.DBHOST),
			port: Number(Config.DBPORT),
			authSource: String(options.database),
			appname: `${ctx.action?.name}:${options.database}`,
			entities: [entity],
			synchronize: Config.SYNCHRONIZE,
			useNewUrlParser: Config.USENEWURLPARSER,
			useUnifiedTopology: Config.USENEWURLPARSER,
		};

		const connection: Record<string, unknown> = await new Promise(async (resolve, reject) => {
			await connect('mt', connectionOpts, (conn: Record<string, unknown>) => {
				if (!conn) {
					return reject("Can't create connection");
				}
				resolve(conn);
			});
		});

		return connection;
	}
};
export default ServiceConnection;
