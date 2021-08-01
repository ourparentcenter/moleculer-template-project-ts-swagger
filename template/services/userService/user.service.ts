/* eslint-disable arrow-parens */
/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/explicit-member-accessibility */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
'use strict';
import { constants } from 'http2';
import moleculer, { ActionParams, Context } from 'moleculer';
import { Action, Delete, Get, Method, Post, Put, Service } from '@ourparentcenter/moleculer-decorators-extended';
import bcrypt from 'bcryptjs';
import jwt, { VerifyErrors } from 'jsonwebtoken';
import { JsonConvert } from 'json2typescript';
import { DbContextParameters } from 'moleculer-db';
import { dbUserMixin, eventsUserMixin } from '../../mixins/dbMixins';
import { Config } from '../../common';

import {
	getActionConfig,
	IUser,
	listActionConfig,
	MoleculerDBService,
	RestOptions,
	UserAuthMeta,
	UserCreateParams,
	UserDeleteParams,
	UserEvent,
	UserGetParams,
	UserJWT,
	UserLoginMeta,
	UserLoginParams,
	UserRole,
	UserRolesParams,
	UserServiceSettingsOptions,
	UsersServiceOptions,
	UserTokenParams,
	UserUpdateParams,
} from '../../types';

import { UserEntity } from '../../entities';

import { userErrorCode, userErrorMessage } from '../../types/errors';

const validateUserBase: ActionParams = {
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

const encryptPassword = (password: string) => bcrypt.hashSync(password, 10);

@Service<UsersServiceOptions>({
	name: 'user',
	version: 1,
	authToken: Config.USER_AUTH_TOKEN,
	mixins: [dbUserMixin, eventsUserMixin],
	settings: {
		idField: '_id',
		pageSize: 10,
		rest: '/v1/user',
		JWT_SECRET: Config.JWT_SECRET,
		fields: [
			'_id',
			'login',
			'firstName',
			'lastName',
			'email',
			'langKey',
			'roles',
			'active',
			'createdBy',
			'createdDate',
			'lastModifiedBy',
			'lastModifiedDate',
		],
		populates: {
			createdBy: {
				action: 'user.id',
				fields: ['login', 'firstName', 'lastName'],
			},
			lastModifiedBy: {
				action: 'user.id',
				fields: ['login', 'firstName', 'lastName'],
			},
		},
	},
})
export default class UserService extends MoleculerDBService<UserServiceSettingsOptions, IUser> {
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
			const result = await new Promise<IUser | undefined>((resolve, reject) => {
				jwt.verify(
					ctx.params.token,
					this.settings.JWT_SECRET,
					(err: VerifyErrors | null, decoded?: any) => {
						if (err) {
							reject(err);
						} else {
							resolve(decoded);
						}
					},
				);
			});
			if (result && result._id) {
				return this._get(ctx, { id: result._id });
			}
		} catch (e) {
			this.logger.error('Error resolving token', ctx.params.token, e);
		}
		return undefined;
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
		console.log(roles);
		console.log(ctx.meta.user);
		return !roles || !roles.length || roles.some((r) => userRoles.includes(r));
	}

	@Action({
		name: 'id',
		restricted: ['api'],
		...getActionConfig,
	})
	async getUserId(ctx: Context<UserGetParams, UserAuthMeta>) {
		const params = this.sanitizeParams(ctx, ctx.params);
		return this._get(ctx, params);
	}

	@Action({
		name: 'login',
		restricted: ['api'],
		params: {
			login: { type: 'string' },
			password: { type: 'string', min: 1 },
		},
	})
	async loginUser(ctx: Context<UserLoginParams, UserLoginMeta>) {
		const { login, password } = ctx.params;

		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const result: any = await this.adapter.findOne<IUser>({ login });
		if (!result) {
			throw new moleculer.Errors.MoleculerClientError(
				userErrorMessage.WRONG,
				userErrorCode.WRONG,
				'',
				[{ field: 'login/password', message: 'not found' }],
			);
		} else if (!result.active) {
			throw new moleculer.Errors.MoleculerClientError(
				userErrorMessage.NOT_ACTIVE,
				userErrorCode.NOT_ACTIVE,
				'',
				[{ field: 'disabled', message: 'user not active' }],
			);
		}

		const valid = await bcrypt.compare(password, result.password);
		if (!valid) {
			throw new moleculer.Errors.MoleculerClientError(
				userErrorMessage.WRONG,
				userErrorCode.WRONG,
				'',
				[{ field: 'login/password', message: 'not found' }],
			);
		}

		const user: any = await this.transformDocuments(ctx, {}, result);
		const token = this.generateJWT(user);
		console.log(user);
		// eslint-disable-next-line require-atomic-updates
		ctx.meta.$responseHeaders = { Authorization: `Bearer ${token}` };
		return { token };
	}

	@Get<RestOptions>('/logout', {
		name: 'logout',
		restricted: ['api'],
	})
	logout(ctx: Context<Record<string, unknown>, UserAuthMeta>) {
		console.log('user logout', ctx.meta.user);
	}

	@Post<RestOptions>('/', {
		name: 'create',
		roles: UserRole.SUPERADMIN,
		restricted: ['api'],
		params: {
			...validateUserBase,
			password: 'string',
		},
	})
	async createUser(ctx: Context<UserCreateParams, UserAuthMeta>) {
		const entity = ctx.params;
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const foundLogin = await this.adapter.findOne<IUser>({ login: entity.login });
		if (foundLogin) {
			throw new moleculer.Errors.MoleculerClientError(
				userErrorMessage.DUPLICATED_LOGIN,
				userErrorCode.DUPLICATED_LOGIN,
				'',
				[{ field: 'login', message: 'duplicated' }],
			);
		}
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const foundEmail = await this.adapter.findOne<IUser>({ email: entity.email });
		if (foundEmail) {
			throw new moleculer.Errors.MoleculerClientError(
				userErrorMessage.DUPLICATED_EMAIL,
				userErrorCode.DUPLICATED_EMAIL,
				'',
				[{ field: 'email', message: 'duplicated' }],
			);
		}

		entity.password = encryptPassword(entity.password);
		const parsedEntity = this.removeForbiddenFields(
			new JsonConvert().deserializeObject(entity, UserEntity).getMongoEntity(),
		);
		const modEntity = this.updateAuthor(parsedEntity, { creator: ctx.meta.user });
		return this._create(ctx, modEntity);
	}

	@Get<RestOptions>('/', {
		name: 'getMe',
		restricted: ['api'],
		cache: getActionConfig.cache,
		params: {
			...getActionConfig.params,
			id: { type: 'string', optional: true },
		},
	})
	async getMe(ctx: Context<DbContextParameters, UserAuthMeta>) {
		const params = this.sanitizeParams(ctx, ctx.params);
		return this._get(ctx, { ...params, id: ctx.meta.user._id });
	}

	@Get<RestOptions>('/:id', {
		name: 'get.id',
		restricted: ['api'],
		roles: UserRole.SUPERADMIN,
		...getActionConfig,
	})
	async getUser(ctx: Context<UserGetParams, UserAuthMeta>) {
		const params = this.sanitizeParams(ctx, ctx.params);
		return this._get(ctx, { ...params, populate: ['createdBy', 'lastModifiedBy'] });
	}

	@Put<RestOptions>('/:id', {
		name: 'update',
		restricted: ['api'],
		roles: UserRole.SUPERADMIN,
		params: {
			...validateUserBaseOptional,
			password: { type: 'string', optional: true },
			id: 'string',
		},
	})
	async updateUser(ctx: Context<UserUpdateParams, UserAuthMeta>) {
		const { id } = ctx.params;
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		delete ctx.params.id;
		const user = await this.getById(id);
		if (!user) {
			throw new moleculer.Errors.MoleculerClientError(
				userErrorMessage.NOT_FOUND,
				userErrorCode.NOT_FOUND,
			);
		}
		const parsedEntity = this.removeForbiddenFields(
			new JsonConvert().deserializeObject(ctx.params, UserEntity).getMongoEntity(),
		);
		const newUser = this.updateAuthor(
			{
				...user,
				...parsedEntity,
				password: user.password,
				createdBy: user.createdBy,
				createdDate: user.createdDate,
				_id: id,
			},
			{ modifier: ctx.meta.user },
		);
		const { password } = ctx.params;
		if (password) {
			newUser.password = encryptPassword(password);
		}
		const result = await this._update(ctx, newUser);
		return this.transformDocuments(ctx, { populate: ['createdBy', 'lastModifiedBy'] }, result);
	}

	@Delete<RestOptions>('/:id', {
		name: 'remove',
		restricted: ['api'],
		roles: UserRole.SUPERADMIN,
		params: { id: 'string' },
	})
	async deleteUser(ctx: Context<UserDeleteParams, UserAuthMeta>) {
		if (ctx.params.id === ctx.meta.user._id) {
			throw new moleculer.Errors.MoleculerClientError(
				userErrorMessage.DELETE_ITSELF,
				userErrorCode.DELETE_ITSELF,
			);
		}
		const params = this.sanitizeParams(ctx, ctx.params);
		await this._remove(ctx, params);
		await this.broker.emit(UserEvent.DELETED, { id: ctx.params.id });
		// eslint-disable-next-line require-atomic-updates
		ctx.meta.$statusCode = constants.HTTP_STATUS_ACCEPTED;
	}

	@Get<RestOptions>('/list', {
		name: 'list',
		restricted: ['api'],
		roles: UserRole.SUPERADMIN,
		...listActionConfig,
	})
	async listAllUsers(ctx: Context<DbContextParameters, UserAuthMeta>) {
		const params = this.sanitizeParams(ctx, ctx.params);
		return this._list(ctx, { ...params });
	}

	@Method
	generateJWT(user: IUser) {
		const exp = new Date();
		exp.setDate(exp.getDate() + 60);

		return jwt.sign(
			{
				...user,
				exp: Math.floor(exp.getTime() / 1000),
			},
			this.settings.JWT_SECRET,
		);
	}

	@Method
	// eslint-disable-next-line @typescript-eslint/naming-convention
	private updateAuthor(
		user: IUser,
		mod: {
			creator?: UserJWT;
			modifier?: UserJWT;
		},
	) {
		const { creator, modifier } = mod;
		let result = { ...user } as IUser;
		if (creator) {
			result = { ...result, createdBy: creator._id, createdDate: new Date() };
		}
		if (modifier) {
			result = { ...result, lastModifiedBy: modifier._id, lastModifiedDate: new Date() };
		}
		return result;
	}

	@Method
	// eslint-disable-next-line @typescript-eslint/naming-convention
	private removeForbiddenFields(user: IUser) {
		const result = { ...user };
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		delete user._id;
		delete (user as any).id;
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		delete user.createdDate;
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		delete user.createdBy;
		delete user.lastModifiedDate;
		delete user.lastModifiedBy;
		return result;
	}
}
