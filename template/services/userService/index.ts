/* eslint-disable arrow-parens */
/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/explicit-member-accessibility */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
'use strict';
import { constants } from 'http2';
import moleculer, { ActionParams, Context } from 'moleculer';
import {
	Action,
	Delete,
	Get,
	Method,
	Post,
	Put,
	Service,
} from '@ourparentcenter/moleculer-decorators-extended';
import bcrypt from 'bcryptjs';
import { JsonConvert } from 'json2typescript';
import { DbContextParameters } from 'moleculer-db';
import { dbUserMixin, eventsUserMixin } from '../../mixins/dbMixins';
import { Config } from '../../common';
import randomstring from 'randomstring';
import {
	getActionConfig,
	IUser,
	listActionConfig,
	MoleculerDBService,
	RestOptions,
	UserAuthMeta,
	UserCreateParams,
	UserDeleteParams,
	UsersDeleteParams,
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
	UserActivateParams,
} from '../../types';

import { UserEntity } from '../../entities';

import { userErrorCode, userErrorMessage } from '../../types/errors';

const validateUserBase: ActionParams = {
	login: 'string',
	email: 'email',
	firstName: 'string',
	lastName: { type: 'string', optional: true },
	active: { type: 'boolean', optional: true },
	roles: { type: 'array', items: 'string', optional: true },
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
	requireRegToken: { type: 'boolean', optional: true },
};

const encryptPassword = (password: string) =>
	bcrypt.hashSync(password, JSON.parse(Config.SALT_VALUE));

@Service<UsersServiceOptions>({
	name: 'user',
	version: 1,
	/**
	 * Service guard token
	 */
	authToken: Config.USER_AUTH_TOKEN,
	/**
	 * Mixins
	 */
	mixins: [dbUserMixin, eventsUserMixin],
	/**
	 * Settings
	 */
	settings: {
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
})
export default class UserService extends MoleculerDBService<UserServiceSettingsOptions, IUser> {
	@Action({
		name: 'id',
		restricted: ['api', 'user'],
		...getActionConfig,
	})
	async getUserId(ctx: Context<UserGetParams, UserAuthMeta>) {
		const params = this.sanitizeParams(ctx, ctx.params);
		const result = await this._get(ctx, await params);
		return result;
	}

	@Action({
		name: 'activate',
		restricted: ['api'],
		params: {
			verificationToken: 'string',
		},
	})
	async activateUser(ctx: Context<UserActivateParams, UserAuthMeta>) {
		const foundUser: Record<string, unknown> = (await this.adapter.findOne({
			verificationToken: ctx.params.verificationToken,
		})) as Record<string, unknown>;
		const activateUser = await ctx.call('v1.user.update', { id: foundUser._id, active: true });
		return activateUser;
	}

	/**
	 *  @swagger
	 *
	 *  /auth/register:
	 *    post:
	 *      tags:
	 *      - "Auth"
	 *      summary: Register user
	 *      description: Register a user
	 *      operationId: registerUser
	 *      requestBody:
	 *        required: true
	 *        content:
	 *          application/json:
	 *            schema:
	 *              allOf:
	 *                - $ref: '#/components/schemas/User'
	 *                - required:
	 *                  - login
	 *                  - firstName
	 *                  - lastName
	 *                  - email
	 *                  - password
	 *                  - langKey
	 *      responses:
	 *        200:
	 *          description: Register user result
	 *          content:
	 *            application/json:
	 *              schema:
	 *                allOf:
	 *                - type: object
	 *                  properties:
	 *                    _id:
	 *                      type: string
	 *                - $ref: '#/components/schemas/User'
	 *                - $ref: '#/components/schemas/VerificationToken'
	 *                - $ref: '#/components/schemas/UserAdditional'
	 *        422:
	 *          description: Missing parameters
	 *          content: {}
	 *      x-codegen-request-body-name: params
	 */
	@Action({
		name: 'register',
		// roles: UserRole.SUPERADMIN,
		restricted: ['api'],
		params: {
			...validateUserBase,
			password: 'string',
		},
	})
	async registerUser(ctx: Context<UserCreateParams, UserAuthMeta>) {
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
		entity.roles = JSON.parse(Config.defaultRoles);

		const parsedEntity = this.removeForbiddenFields(
			new JsonConvert().deserializeObject(entity, UserEntity).getMongoEntity(),
		);
		const modEntity = this.updateAuthor(parsedEntity, { creator: ctx.meta.user || null });
		const addVerificationToken = this.addVerificationToken(
			modEntity,
			Boolean(Config.registrationTokenRequired),
		);
		return this._create(ctx, addVerificationToken);
		// return this._create(ctx, modEntity);
	}

	/**
	 *  @swagger
	 *
	 *  /auth/login:
	 *    post:
	 *      tags:
	 *      - "Auth"
	 *      summary: Login a user
	 *      description: Login a user.
	 *      operationId: loginUser
	 *      requestBody:
	 *        required: true
	 *        content:
	 *           application/json; charset=utf-8:
	 *              schema:
	 *                required:
	 *                - login
	 *                - password
	 *                type: object
	 *                properties:
	 *                  login:
	 *                    type: string
	 *                    description: user login name
	 *                    example: superadmin
	 *                  password:
	 *                    type: string
	 *                    description: user password
	 *                    example: 123456
	 *      responses:
	 *        200:
	 *          description: Login user result
	 *          content: {}
	 *        422:
	 *          description: Missing parameters
	 *          content: {}
	 *      x-codegen-request-body-name: params
	 */
	@Action({
		name: 'login',
		restricted: ['api'],
		params: {
			login: { type: 'string' },
			password: { type: 'string', min: 1 },
		},
	})
	async loginUser(ctx: Context<UserLoginParams, UserLoginMeta>) {
		try {
			const { login, password } = ctx.params;

			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			const result: any = await this.adapter.findOne<IUser>({ login: login });
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

			const user: IUser = (await this.transformDocuments(ctx, {}, result)) as IUser;
			const token: any = await ctx.call('v1.auth.createJWT', user);
			if (token.code) {
				return token;
			}

			ctx.meta.$responseHeaders = { Authorization: `Bearer ${token}` };
			return { token };
		} catch (err) {
			return err;
		}
	}

	/**
	 *  @swagger
	 *
	 *  /api/v1/user/logout:
	 *    get:
	 *      tags:
	 *      - "Users"
	 *      summary: Logout user
	 *      description: Logout current user.
	 *      operationId: logout
	 *      responses:
	 *        200:
	 *          description: Logout user result
	 *          content: {}
	 *        422:
	 *          description: Missing parameters
	 *          content: {}
	 *      x-codegen-request-body-name: params
	 */
	@Get<RestOptions>('/logout', {
		name: 'logout',
		restricted: ['api'],
	})
	logout(ctx: Context<Record<string, unknown>, UserAuthMeta>) {
		console.log('user logout', ctx.meta.user);
		console.log('headers: ', ctx.meta);
		return { logout: true, user: ctx.meta.user };
	}

	/**
	 *  @swagger
	 *
	 *  /api/v1/user:
	 *    post:
	 *      tags:
	 *      - "Users"
	 *      summary: Create user
	 *      description: Create a user
	 *      requestBody:
	 *        required: true
	 *        content:
	 *          application/json:
	 *            schema:
	 *              allOf:
	 *                - $ref: '#/components/schemas/User'
	 *                - required:
	 *                  - login
	 *                  - firstName
	 *                  - lastName
	 *                  - email
	 *                  - password
	 *                  - langKey
	 *              anyOf:
	 *              - type: object
	 *                properties:
	 *                  requireRegToken:
	 *                    type: boolean
	 *                    description: Require registration token
	 *                    example: true
	 *      responses:
	 *        200:
	 *          description: Create user result
	 *          content:
	 *            application/json:
	 *              schema:
	 *                allOf:
	 *                - type: object
	 *                  properties:
	 *                    _id:
	 *                      type: string
	 *                - $ref: '#/components/schemas/User'
	 *                - $ref: '#/components/schemas/VerificationToken'
	 *                - $ref: '#/components/schemas/UserAdditional'
	 *        422:
	 *          description: Missing parameters
	 *          content: {}
	 *      x-codegen-request-body-name: params
	 */
	@Post<RestOptions>('/', {
		name: 'create',
		roles: UserRole.SUPERADMIN,
		restricted: ['api'],
		params: {
			...validateUserBase,
			password: 'string',
			requireRegToken: { type: 'boolean', optional: true },
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
				[{ field: 'login', message: 'login not available' }],
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
				[{ field: 'email', message: 'email not available' }],
			);
		}

		entity.password = encryptPassword(entity.password);
		const parsedEntity = this.removeForbiddenFields(
			new JsonConvert().deserializeObject(entity, UserEntity).getMongoEntity(),
		);
		const modEntity = this.updateAuthor(parsedEntity, { creator: ctx.meta.user });
		const requireToken = () => {
			if (
				entity.hasOwnProperty('requireRegToken') &&
				typeof entity.requireRegToken === 'boolean'
			) {
				return entity.requireRegToken;
			} else {
				return JSON.parse(Config.registrationTokenRequired);
			}
		};
		const addVerificationToken = this.addVerificationToken(modEntity, requireToken());
		return await this._create(ctx, addVerificationToken);
	}

	/**
	 *  @swagger
	 *
	 *  /api/v1/user:
	 *    get:
	 *      tags:
	 *      - "Users"
	 *      summary: get me
	 *      description: get me.
	 *      operationId: getMe
	 *      responses:
	 *        200:
	 *          description: Get me result
	 *          content:
	 *            application/json:
	 *              schema:
	 *                allOf:
	 *                - type: object
	 *                  properties:
	 *                    _id:
	 *                      type: string
	 *                - $ref: '#/components/schemas/User'
	 *        422:
	 *          description: Missing parameters
	 *          content: {}
	 */
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
		return await this._get(ctx, { ...params, id: ctx.meta.user._id });
	}

	/**
	 *  @swagger
	 *
	 *  /api/v1/user/{id}:
	 *    get:
	 *      tags:
	 *      - "Users"
	 *      summary: get user by id
	 *      description: get user by id.
	 *      operationId: getUser
	 *      parameters:
	 *        - name: id
	 *          in: path
	 *          description: Id of user
	 *          required: true
	 *          schema:
	 *            type: string
	 *            example: 5eb71ba74676dfca3fef434f
	 *      responses:
	 *        200:
	 *          description: Get user result
	 *          content:
	 *            application/json:
	 *              schema:
	 *                allOf:
	 *                - type: object
	 *                  properties:
	 *                    _id:
	 *                      type: string
	 *                - $ref: '#/components/schemas/User'
	 *        422:
	 *          description: Missing parameters
	 *          content: {}
	 */
	@Get<RestOptions>('/:id', {
		name: 'get.id',
		restricted: ['api'],
		roles: UserRole.SUPERADMIN,
		...getActionConfig,
	})
	async getUser(ctx: Context<UserGetParams, UserAuthMeta>) {
		const params = this.sanitizeParams(ctx, ctx.params);
		return await this._get(ctx, await { ...params, populate: ['createdBy', 'lastModifiedBy'] });
	}

	/**
	 *  @swagger
	 *
	 *  /api/v1/user/{id}:
	 *    put:
	 *      tags:
	 *      - "Users"
	 *      summary: update a user
	 *      description: update a user.
	 *      operationId: updateUser
	 *      parameters:
	 *        - name: id
	 *          in: path
	 *          description: Id of user
	 *          required: true
	 *          schema:
	 *            type: string
	 *            example: 5eb71ba74676dfca3fef434f
	 *      requestBody:
	 *        required: true
	 *        content:
	 *         application/json:
	 *            schema:
	 *              anyOf:
	 *              - $ref: '#/components/schemas/User'
	 *      responses:
	 *        200:
	 *          description: Update user result
	 *          content:
	 *            application/json:
	 *              schema:
	 *                allOf:
	 *                - type: object
	 *                  properties:
	 *                    _id:
	 *                      type: string
	 *                - $ref: '#/components/schemas/User'
	 *        422:
	 *          description: Missing parameters
	 *          content: {}
	 *      x-codegen-request-body-name: params
	 */
	@Put<RestOptions>('/:id', {
		name: 'update',
		restricted: ['api', 'user'],
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
		// const user = await this.getById(id);
		const user = (await this.adapter.findById(id)) as IUser;
		if (!user) {
			throw new moleculer.Errors.MoleculerClientError(
				userErrorMessage.NOT_FOUND,
				userErrorCode.NOT_FOUND,
			);
		}
		const parsedEntity = this.removeForbiddenFields(
			new JsonConvert()
				.deserializeObject({ ...user, ...ctx.params }, UserEntity)
				.getMongoEntity(),
		);
		const newUser = this.updateAuthor(
			{
				...user,
				...parsedEntity,
				createdBy: user.createdBy,
				createdDate: user.createdDate,
			},
			{ modifier: ctx.meta.user },
		);
		const { password } = ctx.params;
		if (password) {
			newUser.password = encryptPassword(password);
		}
		// const result = { test: 'result check' };
		const result = await this.adapter.updateById(id, newUser);
		// const result = await this._update(ctx, newUser);
		const transform = await this.transformDocuments(
			ctx,
			{ populate: ['createdBy', 'lastModifiedBy'] },
			// {},
			result,
		);
		return transform;
	}

	/**
	 *  @swagger
	 *
	 *  /api/v1/user/{id}:
	 *    delete:
	 *      tags:
	 *      - "Users"
	 *      summary: Delete user by id
	 *      description: Delete user by id.
	 *      operationId: deleteUser
	 *      parameters:
	 *        - name: id
	 *          in: path
	 *          description: Id of user
	 *          required: true
	 *          schema:
	 *            type: string
	 *            example: 5eb725a7ada22e664c83e634
	 *      responses:
	 *        200:
	 *          description: Delete user result
	 *          content: {}
	 *        422:
	 *          description: Missing parameters
	 *          content: {}
	 */
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
		const params = await this.sanitizeParams(ctx, ctx.params);
		try {
			let recordToDelete: IUser = (await this._get(ctx, { id: ctx.params.id })) as IUser;

			return await this._remove(ctx, params)
				.then(async (record) => {
					ctx.meta.$statusCode = constants.HTTP_STATUS_ACCEPTED;
					await this.broker.emit(UserEvent.DELETED, { id: ctx.params.id });
					return { recordsDeleted: record, record: recordToDelete };
				})
				.catch((err) => console.log('Deletion error:', err));
		} catch (err) {
			return err;
		}
	}

	/**
	 *  @swagger
	 *
	 *  /api/v1/user/removeMany:
	 *    post:
	 *      tags:
	 *      - "Users"
	 *      summary: Delete users
	 *      description: Delete multiple users
	 *      requestBody:
	 *        content:
	 *          application/json:
	 *            schema:
	 *              required:
	 *              - userIDs
	 *              type: object
	 *              properties:
	 *                userIDs:
	 *                  type: array
	 *                  description: user ids
	 *                  items:
	 *                    type: string
	 *                  example: ["5eb725a7ada22e664c83e634","5eb71c1e9662c4530b2e9d2a"]
	 *      responses:
	 *        200:
	 *          description: Delet users result
	 *          content: {}
	 *        422:
	 *          description: Missing parameters
	 *          content: {}
	 *      x-codegen-request-body-name: params
	 */
	@Post<RestOptions>('/removeMany', {
		name: 'removeMany',
		restricted: ['api'],
		roles: UserRole.SUPERADMIN,
		params: { userIDs: { type: 'array', items: 'string' } },
	})
	async deleteManyUsers(ctx: Context<UsersDeleteParams, UserAuthMeta>) {
		try {
			const isArray = ctx.params.userIDs;
			let recordsToDelete: any[] = [];
			let deletionErrors: any[] = [];
			if (Array.isArray(isArray) && isArray.length > 1) {
				let recordsCount = 0;
				let recordErrors = 0;
				for (let i = 0; i < isArray.length; i++) {
					if (isArray[i] === ctx.meta.user._id) {
						deletionErrors.push({
							error: {
								message: 'Cannot delete self',
								code: userErrorCode.DELETE_ITSELF,
								type: userErrorMessage.DELETE_ITSELF,
							},
							record: await this._get(ctx, { id: isArray[i] }),
						});
						recordErrors++;
					} else {
						await this._get(ctx, { id: isArray[i] })
							.then(async (userRecord) => {
								recordsToDelete.push(userRecord);
								await this._remove(ctx, { id: isArray[i] });
								recordsCount++;
							})
							.catch(async (err) => {
								deletionErrors.push({
									error: err,
									record: {
										id: isArray[i],
									},
								});
								recordErrors++;
							});
					}
				}

				if (deletionErrors.length > 0) {
					return {
						recordsDeleted: {
							deletionCount: recordsCount,
							deletedRecords: recordsToDelete,
						},
						deletionErrors: { errorCount: recordErrors, records: deletionErrors },
					};
				} else {
					return {
						recordsDeleted: {
							deletionCount: recordsCount,
							deletedRecords: recordsToDelete,
						},
					};
				}
			}
			if (Array.isArray(isArray) && isArray.length === 1) {
				return {
					code: userErrorCode.WRONG,
					message: `Deletion skipped. API removemany called with 1 item in array. Use DELETE /api/v${this.version}/user/:id instead.`,
				};
			}
			if (!Array.isArray(isArray) || (Array.isArray(isArray) && isArray.length) < 1) {
				return {
					code: userErrorCode.WRONG,
					message: 'API removemany called with unprocessable parameter',
				};
			}
		} catch (err) {
			return err;
		}
	}

	/**
	 *  @swagger
	 *
	 *  /api/v1/user/list:
	 *    get:
	 *      tags:
	 *      - "Users"
	 *      summary: list all users
	 *      description: list all users.
	 *      operationId: listAllUsers
	 *      responses:
	 *        200:
	 *          description: Get user result
	 *          content:
	 *            application/json:
	 *              schema:
	 *                type: object
	 *                properties:
	 *                  rows:
	 *                    type: array
	 *                    items:
	 *                      allOf:
	 *                      - type: object
	 *                        properties:
	 *                          _id:
	 *                            type: string
	 *                      - $ref: '#/components/schemas/User'
	 *                  total:
	 *                    type: number
	 *                    description: Users result count
	 *                  page:
	 *                    type: number
	 *                    description: Users result page
	 *                  pageSize:
	 *                    type: number
	 *                    description: Users result page size max
	 *                  totalPages:
	 *                    type: number
	 *                    description: Users result total pages
	 *        422:
	 *          description: Missing parameters
	 *          content: {}
	 */
	@Get<RestOptions>('/list', {
		name: 'list',
		restricted: ['api'],
		roles: UserRole.SUPERADMIN,
		...listActionConfig,
	})
	async listAllUsers(ctx: Context<DbContextParameters, UserAuthMeta>) {
		const params = this.sanitizeParams(ctx, ctx.params);
		return await this._list(ctx, await { ...params });
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
		if (creator || creator === null || undefined) {
			if (creator !== null || undefined) {
				result = { ...result, createdBy: creator!._id, createdDate: new Date() };
			} else {
				result = { ...result, createdBy: null, createdDate: new Date() };
			}
		}
		if (modifier || modifier === null || undefined) {
			if (creator !== null || undefined) {
				result = { ...result, lastModifiedBy: modifier!._id, lastModifiedDate: new Date() };
			} else {
				result = { ...result, lastModifiedBy: null, lastModifiedDate: new Date() };
			}
		}
		return result;
	}

	@Method
	// eslint-disable-next-line @typescript-eslint/naming-convention
	private addVerificationToken(user: IUser, requireToken: boolean) {
		let result = { ...user } as IUser;
		if (requireToken) {
			result = { ...result, verificationToken: randomstring.generate(64) };
		} else {
			result.active = true;
		}
		return result;
	}

	@Method
	// eslint-disable-next-line @typescript-eslint/naming-convention
	private removeForbiddenFields(user: IUser) {
		const result = { ...user };
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		delete result._id;
		// delete (user as any).id;

		// delete result.login;
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		delete result.createdDate;
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		delete result.createdBy;
		delete result.lastModifiedDate;
		delete result.lastModifiedBy;
		return result;
	}
}
