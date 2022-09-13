/* eslint-disable arrow-parens */
/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/explicit-member-accessibility */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
'use strict';
// import { constants } from 'http2';
import moleculer, { ActionParams, Context } from 'moleculer';
import {
	Action,
	// Delete,
	Get,
	Method,
	// Post,
	// Put,
	Service,
} from '@ourparentcenter/moleculer-decorators-extended';
import bcrypt from 'bcryptjs';
// import jwt, { VerifyErrors } from 'jsonwebtoken';
import { EncryptJWT, jwtDecrypt } from 'jose';
// import { JsonConvert } from 'json2typescript';
// import { DbContextParameters } from 'moleculer-db';
import { dbAuthMixin, eventsAuthMixin } from '../../mixins/dbMixins';
import { Config } from '../../common';
import randomstring from 'randomstring';
import {
	getActionConfig,
	IUser,
	IUserBase,
	// listActionConfig,
	MoleculerDBService,
	RestOptions,
	UserAuthMeta,
	UserCreateParams,
	// UserDeleteParams,
	// UserEvent,
	// UserGetParams,
	// UserJWT,
	// UserLoginMeta,
	// UserLoginParams,
	UserRole,
	UserRolesParams,
	UserServiceSettingsOptions,
	// UsersServiceOptions,
	UserTokenParams,
	// UserUpdateParams,
} from '../../types';

// import { UserEntity } from '../../entities';

import { userErrorCode, userErrorMessage } from '../../types/errors';

/* const validateUserBase: ActionParams = {
	login: 'string',
	email: 'email',
	firstName: 'string',
	lastName: { type: 'string', optional: true },
	active: { type: 'boolean', optional: true },
	roles: { type: 'array', items: 'string' },
	langKey: { type: 'string', min: 2, max: 2, optional: true },
};

const validateUserBaseOptional: ActionParams = {
	login: { type: 'string', optional: true },
	email: { type: 'email', optional: true },
	firstName: { type: 'string', optional: true },
	lastName: { type: 'string', optional: true },
	active: { type: 'boolean', optional: true },
	roles: { type: 'array', items: 'string', optional: true },
	langKey: { type: 'string', min: 2, max: 2, optional: true },
};

const encryptPassword = (password: string) =>
	bcrypt.hashSync(password, JSON.parse(Config.SALT_VALUE)); */

@Service({
	name: 'auth',
	version: 1,
	/**
	 * Service guard token
	 */
	authToken: Config.AUTH_SERVICE_TOKEN,
	/**
	 * Mixins
	 */
	mixins: [dbAuthMixin, eventsAuthMixin],
	/**
	 * Settings
	 */
	settings: {
		$dependencyTimeout: 30000, // Default: 0 - no timeout
		idField: '_id',
		pageSize: 10,
		// Base path
		rest: '/',
		// rest: '/v1/user',
		// user jwt secret
		JWT_SECRET: Config.JWT_SECRET,
		// Available fields in the responses
		fields: [
			'_id',
			'login',
			'firstName',
			'lastName',
			'email',
			'langKey',
			'roles',
			'verificationToken',
			'active',
			'createdBy',
			'createdDate',
			'lastModifiedBy',
			'lastModifiedDate',
		],
		// additional fields added to responses
		populates: {
			createdBy: {
				action: 'v1.user.id',
				params: { fields: ['login', 'firstName', 'lastName'] },
				// params: { fields: 'login firstName lastName' },
			},
			lastModifiedBy: {
				action: 'v1.user.id',
				params: { fields: ['login', 'firstName', 'lastName'] },
				// params: { fields: 'login firstName lastName' },
			},
		},
	},
	dependencies: 'v1.user',
})
export default class AuthService extends MoleculerDBService<UserServiceSettingsOptions, IUser> {
	@Action({
		name: 'resolveToken',
		restricted: ['api'],
		cache: {
			keys: ['token'],
			ttl: 30 * 60, // 0,5 hour
		},
		params: {
			token: 'string',
		},
	})
	async resolveToken(ctx: Context<UserTokenParams, Record<string, unknown>>) {
		try {
			const key = Buffer.from(this.settings.JWT_SECRET, 'hex');
			const { payload, protectedHeader }: { payload: any; protectedHeader: any } =
				await jwtDecrypt(
					ctx.params.token,
					key /* , {
						issuer: 'urn:example:issuer',
						audience: 'urn:example:audience',
					} */,
				);
			if (protectedHeader && payload.data._id) {
				// returns user from payload _id
				return await this._get(ctx, { id: payload.data._id });
			}
		} catch (err) {
			this.logger.error('Error resolving token', ctx.params.token, err);
			return err;
		}
	}

	@Action({
		name: 'validateRole',
		restricted: ['api'],
		cache: {
			keys: ['roles', 'user'],
		},
		params: {
			roles: { type: 'array', items: 'string', enum: Object.values(UserRole) },
		},
	})
	async validateRole(ctx: Context<UserRolesParams, UserAuthMeta>) {
		const roles = ctx.params.roles;
		const userRoles = ctx.meta.user.roles;
		return !roles || !roles.length || roles.some((r) => userRoles!.includes(r));
	}

	@Action({
		name: 'createJWT',
		restricted: ['api', 'user'],
		cache: {
			keys: ['roles', 'user'],
		},
		params: {
			roles: { type: 'array', items: 'string', enum: Object.values(UserRole) },
		},
	})
	async createJWT(ctx: Context<IUser>) {
		try {
			const user: IUser = ctx.params as IUser;
			if (user && typeof user === 'object') {
				if (!user.active) {
					throw new moleculer.Errors.MoleculerClientError(
						userErrorMessage.WRONG,
						userErrorCode.WRONG,
						'',
						[{ message: 'Error: User not found or disabled' }],
					);
				} else {
					return await this.generateJWT(user);
				}
			}
		} catch (err) {
			return err;
		}
	}

	@Method
	async generateJWT(user: IUser) {
		const exp = new Date();
		const key = Buffer.from(this.settings.JWT_SECRET, 'hex');
		exp.setDate(exp.getDate() + 60);
		return await new EncryptJWT({
			data: user,
			// exp: Math.floor(exp.getTime() / 1000),
		})
			.setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
			// .setIssuedAt()
			// .setIssuer()
			// .setAudience()
			.setExpirationTime(Math.floor(exp.getTime() / 1000))
			.encrypt(key);
	}
}
