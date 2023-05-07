/* eslint-disable @typescript-eslint/explicit-member-accessibility */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
'use strict';
import moleculer, { ActionParams, Context, ServiceSchema } from 'moleculer';
import {
	Put,
	Method,
	Service,
	Post,
	Get,
	Delete,
} from '@ourparentcenter/moleculer-decorators-extended';
import { Config } from '@Common';
import {
	IUserRole,
	listActionConfig,
	RestOptions,
	roleErrorCode,
	roleErrorMessage,
	RoleServiceSettingsOptions,
	RolesManipulateValueParams,
	RolesServiceOptions,
	UserAuthMeta,
	UserRoleCreateParams,
	UserRoleDefault,
	UserRoleDeleteParams,
	UserRoleEvent,
	UserRoleGetParams,
	UserRoleUpdateParams,
	// UserJWT,
} from '@CoreTypes';
import { JsonConvert } from 'json2typescript';
import { /* IUser, */ RolesEntity } from '@Entities';
import { BaseServiceWithDB, DBMixinFactory } from '@Factories';
import { DbContextParameters } from 'moleculer-db';
import { constants } from 'http2';

const validateRoleBase: ActionParams = {
	role: { type: 'string', optional: true },
	value: { type: 'string', optional: true },
	active: { type: 'boolean', optional: true },
	langKey: { type: 'string', min: 2, max: 5, optional: true },
	systemLocked: { type: 'boolean', optional: true },
};

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */
@Service<RolesServiceOptions>({
	name: 'roles',
	version: 1,
	mergeActions: true,
	/**
	 * Service guard token
	 */
	authToken: Config.ROLES_AUTH_TOKEN,
	/**
	 * Mixins
	 */
	mixins: [...new DBMixinFactory('Roles').createMixin()],
	/**
	 * Settings
	 */
	settings: {
		idField: '_id',
		// Available fields in the responses
		fields: [
			'_id',
			'role',
			'value',
			'langKey',
			'active',
			'createdBy',
			'createdDate',
			'lastModifiedBy',
			'lastModifiedDate',
			'systemLocked',
		],
		// additional fields added to responses
		populates: {
			createdBy: {
				action: 'v1.user.id',
				params: { fields: ['_id', 'login', 'firstName', 'lastName'] },
				// params: { fields: 'login firstName lastName' },
			},
			lastModifiedBy: {
				action: 'v1.user.id',
				params: { fields: ['_id', 'login', 'firstName', 'lastName'] },
			},
		},
		// Base path
		rest: '/',
		// user jwt secret
		JWT_SECRET: Config.JWT_SECRET,
		entityValidator: {
			role: 'string|min:3',
			value: 'string',
			active: 'boolean',
			systemLocked: 'boolean',
		},
	},
	/**
	 * Action Hooks
	 */
	hooks: {
		before: {
			/**
			 * Register a before hook for the `create` action.
			 * It sets a default value for the active field to false.
			 *
			 * @param {Context} ctx
			 */
			create: (ctx: Context<{ active: boolean; systemLocked: boolean }>) => {
				ctx.params.active = false;
				ctx.params.systemLocked = false;
			},
		},
	},
	/* actions: {
		list: false,
	}, */
})
export default class RolesService extends BaseServiceWithDB<
	Partial<ServiceSchema<RoleServiceSettingsOptions>>,
	IUserRole
> {
	/**
	 *  @swagger
	 *
	 *  /api/v1/roles/{id}/activate:
	 *    put:
	 *      tags:
	 *      - "Roles"
	 *      summary: Activate role
	 *      description: Activate or deactivate a role by id.
	 *      operationId: activateRole
	 *      parameters:
	 *      - name: id
	 *        in: path
	 *        description: Id of role
	 *        required: true
	 *        schema:
	 *          type: string
	 *          example: '5ec51b33ead6ef2b423e4089'
	 *      requestBody:
	 *        required: true
	 *        content:
	 *          application/json; charset=utf-8:
	 *            schema:
	 *              required:
	 *              - active
	 *              type: object
	 *              properties:
	 *                active:
	 *                  type: boolean
	 *                  description: Set to active or inactive
	 *      responses:
	 *        200:
	 *          description: Activate role result
	 *          content:
	 *            application/json:
	 *              schema:
	 *                allOf:
	 *                - type: object
	 *                  properties:
	 *                    _id:
	 *                      type: string
	 *                - $ref: '#/components/schemas/Roles'
	 *        422:
	 *          description: Missing parameters
	 *          content: {}
	 *      x-codegen-request-body-name: params
	 */
	@Put<RestOptions>('/:id/activate', {
		name: 'activateRole',
		/**
		 * Service guard services allowed to connect
		 */
		restricted: ['api'],
		params: {
			// Id: 'string',
			id: 'string',
			active: {
				type: 'boolean',
				optional: false,
			},
		},
	})
	async activateRole(ctx: Context<RolesManipulateValueParams, UserAuthMeta>) {
		const { id } = ctx.params;
		this.logger.debug('♻ Activating role by id');
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		delete ctx.params.id;
		this.logger.debug('♻ Finding role by id: ', id);
		const role = (await this.adapter
			.findById(id)
			.then((res) => {
				if (res) {
					return res;
				}
				this.logger.debug(`♻ Role id ${id} not found`);
				throw new moleculer.Errors.MoleculerClientError(
					roleErrorMessage.NOT_FOUND,
					roleErrorCode.NOT_FOUND,
				);
			})
			.catch((err) => {
				this.logger.debug(`♻ Role id ${id} not found`);
				throw new moleculer.Errors.MoleculerClientError(
					roleErrorMessage.NOT_FOUND,
					roleErrorCode.NOT_FOUND,
					err,
				);
			})) as IUserRole;
		this.logger.debug(`♻ Found role, activating...`);
		const parsedEntity = this.removeForbiddenFields<IUserRole>(
			new JsonConvert()
				.deserializeObject({ ...role, ...ctx.params }, RolesEntity)
				.getMongoEntity(),
			['_id', 'createdBy', 'createdDate', 'lastModifiedBy', 'lastModifiedDate'],
		);
		this.logger.debug(`♻ Updating author on role`);
		const newRole = this.updateAuthor<IUserRole>(
			{
				...role,
				...parsedEntity,
				createdBy: role.createdBy,
				createdDate: role.createdDate,
			},
			{ modifier: ctx.meta.user },
		);

		const result = await this.adapter
			.updateById(id, newRole)
			.then((res) => {
				if (res) {
					this.logger.debug(`♻ Role updated: `, res);
					ctx.meta.$statusCode = constants.HTTP_STATUS_ACCEPTED;
					this.broker.emit('roles.updated', newRole);
					return newRole;
				}
				throw new moleculer.Errors.MoleculerClientError(
					roleErrorMessage.COULD_NOT_ACTIVATE,
					roleErrorCode.COULD_NOT_ACTIVATE,
				);
			})
			.catch((err) => {
				this.logger.error(`♻ Error updating role: `, err);
				throw new moleculer.Errors.MoleculerClientError(
					roleErrorMessage.COULD_NOT_ACTIVATE,
					roleErrorCode.COULD_NOT_ACTIVATE,
				);
			});
		const transform = await this.transformDocuments(
			ctx,
			{ populate: ['createdBy', 'lastModifiedBy'] },
			// {},
			result,
		);
		this.logger.debug(`♻ Returning updated role: `, result);
		return transform;
	}
	/**
	 * Loading sample data to the collection.
	 * It is called in the DB.mixin after the database
	 * connection establishing & the collection is empty.
	 */
	/* @Method
	async seedDB() {
		await this.adapter.insertMany([
			{ name: 'Samsung Galaxy S10 Plus', quantity: 10, price: 704 },
			{ name: 'iPhone 11 Pro', quantity: 25, price: 999 },
			{ name: 'Huawei P30 Pro', quantity: 15, price: 679 },
		]);
	} */

	/**
	 * Fired after database connection establishing.
	 */
	@Method
	async afterConnected() {
		// After db connection
	}

	/**
	 * The "moleculer-db" mixin registers the following actions:
	 *  - list
	 *  - find
	 *  - count
	 *  - create
	 *  - insert
	 *  - update
	 *  - remove
	 */

	/**
	 *  @swagger
	 *
	 *  /api/v1/roles:
	 *    get:
	 *      tags:
	 *      - "Roles"
	 *      summary: Get all roles
	 *      description: Get all roles
	 *      operationId: listAllUserRoles
	 *      responses:
	 *        200:
	 *          description: Roles result
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
	 *                      - $ref: '#/components/schemas/Roles'
	 *                  total:
	 *                    type: number
	 *                    description: Roles result count
	 *                  page:
	 *                    type: number
	 *                    description: Roles result page
	 *                  pageSize:
	 *                    type: number
	 *                    description: Roles result page size max
	 *                  totalPages:
	 *                    type: number
	 *                    description: Roles result total pages
	 *        403:
	 *          description: Server error
	 *          content: {}
	 */
	@Get<RestOptions>('/', {
		name: 'list',
		restricted: ['api'],
		// roles: [UserRoleDefault.SUPERADMIN, UserRoleDefault.ADMIN],
		...listActionConfig,
	})
	async listAllUserRoles(ctx: Context<DbContextParameters, UserAuthMeta>) {
		const params = this.sanitizeParams(ctx, ctx.params);
		this.logger.debug('♻ Listing user roles...');
		const userList = await this._list(
			ctx,
			await { ...params, populate: ['createdBy', 'lastModifiedBy'] },
		);
		return userList;
	}

	/**
	 *  @swagger
	 *
	 *  /api/v1/roles:
	 *    post:
	 *      tags:
	 *      - "Roles"
	 *      summary: Create a role
	 *      description: Create a role
	 *      operationId: createRole
	 *      requestBody:
	 *        required: true
	 *        content:
	 *          application/json:
	 *            schema:
	 *              required:
	 *              - role
	 *              - value
	 *              type: object
	 *              properties:
	 *                role:
	 *                  type: string
	 *                  description: Name to be used
	 *                  example: role name
	 *                value:
	 *                  type: string
	 *                  description: Value of role
	 *                  example: Admin
	 *                langKey:
	 *                  type: string
	 *                  description: Language of role
	 *                  example: en-us
	 *                active:
	 *                  type: boolean
	 *                  description: Role active
	 *                  example: true
	 *                systemLocked:
	 *                  type: boolean
	 *                  description: Roles locked by system from deletion
	 *                  example: true
	 *      responses:
	 *        200:
	 *          description: Create role result
	 *          content:
	 *            application/json:
	 *              schema:
	 *                allOf:
	 *                - type: object
	 *                  properties:
	 *                    _id:
	 *                      type: string
	 *                - $ref: '#/components/schemas/Roles'
	 *        422:
	 *          description: Missing parameters
	 *          content: {}
	 *      x-codegen-request-body-name: params
	 */
	@Post<RestOptions>('/', {
		name: 'create',
		/**
		 * Service guard services allowed to connect
		 */
		restricted: ['api'],
		roles: [UserRoleDefault.SUPERADMIN, UserRoleDefault.ADMIN],
		params: {
			...validateRoleBase,
		},
	})
	async createRole(ctx: Context<UserRoleCreateParams, UserAuthMeta>) {
		this.logger.debug(`♻ Attempting to create role...`);
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const role: UserRoleUpdateParams = await this.adapter.findOne<IUserRole>({
			role: ctx.params.role,
		});
		if (role) {
			this.logger.debug(
				`♻ Role ${ctx.params.role} with id ${role.id} already exists. Please update it instead.`,
			);
			throw new moleculer.Errors.MoleculerClientError(
				roleErrorMessage.DUPLICATED_ROLE,
				roleErrorCode.DUPLICATED_ROLE,
				'',
				`♻ Role ${ctx.params.role} with id ${role.id} already exists. Please update it instead.`,
			);
		}
		this.logger.debug(`♻ Creating role ${ctx.params.role}`);
		const parsedEntity = this.removeForbiddenFields<IUserRole>(
			new JsonConvert().deserializeObject({ ...ctx.params }, RolesEntity).getMongoEntity(),
			['_id', 'createdBy', 'createdDate', 'lastModifiedBy', 'lastModifiedDate'],
		);
		const newRole = this.updateAuthor<IUserRole>(parsedEntity, {
			creator: ctx.meta.user,
			modifier: ctx.meta.user,
		});

		const result = await this._create(ctx, newRole)
			.then((res) => {
				if (res) {
					this.logger.debug(`♻ Role ${ctx.params.role} created successfully.`);
					ctx.meta.$statusCode = constants.HTTP_STATUS_ACCEPTED;
					this.broker.emit(UserRoleEvent.CREATED, res);
					return res;
				}
				this.logger.debug(`♻ Role ${ctx.params.role} could not be created.`);
				throw new moleculer.Errors.MoleculerClientError(
					roleErrorMessage.ROLE_NOT_CREATED,
					roleErrorCode.ROLE_NOT_CREATED,
				);
			})
			.catch((err) => {
				this.logger.debug(`♻ Role ${ctx.params.role} could not be created.`);
				throw new moleculer.Errors.MoleculerClientError(
					roleErrorMessage.ROLE_NOT_CREATED,
					roleErrorCode.ROLE_NOT_CREATED,
					err,
				);
			});
		const transform = await this.transformDocuments(
			ctx,
			{ populate: ['createdBy', 'lastModifiedBy'] },
			// {},
			result,
		);
		this.logger.debug('♻ Returning new role: ', transform);
		return transform;
	}

	/**
	 *  @swagger
	 *
	 *  /api/v1/roles/{id}:
	 *    get:
	 *      tags:
	 *      - "Roles"
	 *      summary: Get role by id
	 *      description: Get role by id
	 *      operationId: getRoleById
	 *      parameters:
	 *      - name: id
	 *        in: path
	 *        description: Id of role
	 *        required: true
	 *        schema:
	 *          type: string
	 *          example: '5ec51b33ead6ef2b423e4089'
	 *      responses:
	 *        200:
	 *          description: Roles result
	 *          content:
	 *            application/json:
	 *              schema:
	 *                allOf:
	 *                - type: object
	 *                  properties:
	 *                    _id:
	 *                      type: string
	 *                - $ref: '#/components/schemas/Roles'
	 *        403:
	 *          description: Server error
	 *          content: {}
	 */
	@Get<RestOptions>('/:id', {
		name: 'get',
		restricted: ['api'],
		// roles: [UserRoleDefault.SUPERADMIN, UserRoleDefault.ADMIN],
		params: {
			id: { type: 'string', min: 3 },
		},
	})
	async getRoleById(ctx: Context<UserRoleGetParams, UserAuthMeta>) {
		const params = this.sanitizeParams(ctx, ctx.params);
		this.logger.debug(`♻ Attempting to get role with id ${ctx.params.id}`);
		const role = await this._get(
			ctx,
			await { ...params, populate: ['createdBy', 'lastModifiedBy'] },
		).then((res) => {
			if (res) {
				this.logger.debug(`♻ Role with id ${ctx.params.id} found`);
				ctx.meta.$statusCode = constants.HTTP_STATUS_FOUND;
				return res;
			}
			this.logger.debug(`♻ Role with id ${ctx.params.id} not found`);
			throw new moleculer.Errors.MoleculerClientError(
				roleErrorMessage.NOT_FOUND,
				roleErrorCode.NOT_FOUND,
			);
		});
		this.logger.debug('♻ Returning role: ', role);
		return role;
	}

	/**
	 *  @swagger
	 *
	 *  /api/v1/roles/{id}:
	 *    put:
	 *      tags:
	 *      - "Roles"
	 *      summary: Update a role
	 *      description: Update role.
	 *      operationId: updateRole
	 *      parameters:
	 *      - name: id
	 *        in: path
	 *        description: Id of role
	 *        required: true
	 *        schema:
	 *          type: string
	 *          example: '5ec51b33ead6ef2b423e4089'
	 *      requestBody:
	 *        required: true
	 *        content:
	 *          application/json:
	 *            schema:
	 *              anyOf:
	 *              - $ref: '#/components/schemas/Roles'
	 *      responses:
	 *        200:
	 *          description: Roles update result
	 *          content:
	 *            application/json:
	 *              schema:
	 *                allOf:
	 *                - type: object
	 *                  properties:
	 *                    _id:
	 *                      type: string
	 *                - $ref: '#/components/schemas/Roles'
	 *        403:
	 *          description: Server error
	 *          content: {}
	 *        422:
	 *          description: Missing parameters
	 *          content: {}
	 *      x-codegen-request-body-name: params
	 */
	@Put<RestOptions>('/:id', {
		name: 'update',
		restricted: ['api'],
		// roles: [UserRoleDefault.SUPERADMIN, UserRoleDefault.ADMIN],
		params: {
			...validateRoleBase,
		},
	})
	async updateRole(ctx: Context<UserRoleUpdateParams, UserAuthMeta>) {
		const { id } = ctx.params;
		this.logger.debug('♻ Deleting param id');
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		delete ctx.params.id;
		this.logger.debug(`♻ Attempting to update role with id ${ctx.params.id}`);
		const role = (await this.adapter
			.findById(id)
			.then((res) => {
				if (res) {
					this.logger.debug(`♻ Role with id ${ctx.params.id} found`);
					return res;
				}
				this.logger.debug(`♻ Role with id ${ctx.params.id} not found`);
				throw new moleculer.Errors.MoleculerClientError(
					roleErrorMessage.NOT_FOUND,
					roleErrorCode.NOT_FOUND,
				);
			})
			.catch((err) => {
				this.logger.error(`♻ Role with id ${ctx.params.id} not found`);
				throw new moleculer.Errors.MoleculerClientError(
					roleErrorMessage.NOT_FOUND,
					roleErrorCode.NOT_FOUND,
					'NOT_FOUND',
					[{ field: 'id', message: 'Role not found', error: err }],
				);
			})) as IUserRole;
		this.logger.debug('♻ Removing forbidden fields from found role');
		const parsedEntity = this.removeForbiddenFields<IUserRole>(
			new JsonConvert().deserializeObject({ ...ctx.params }, RolesEntity).getMongoEntity(),
			['_id', 'createdBy', 'createdDate', 'lastModifiedBy', 'lastModifiedDate'],
		);
		const newRole = this.updateAuthor<IUserRole>(
			{
				...role,
				...parsedEntity,
				createdBy: role.createdBy,
				createdDate: role.createdDate,
			},
			{ modifier: ctx.meta.user },
		);
		const result = await this.adapter
			.updateById(id, newRole)
			.then((res) => {
				if (res) {
					this.logger.debug('♻ Role updated successfully');
					ctx.meta.$statusCode = constants.HTTP_STATUS_ACCEPTED;
					this.broker.emit(UserRoleEvent.UPDATED, res);
					return res;
				}
				this.logger.error('♻ Role update failed');
				throw new moleculer.Errors.MoleculerClientError(
					roleErrorMessage.UPDATE_FAILED,
					roleErrorCode.UPDATE_FAILED,
				);
			})
			.catch((err) => {
				this.logger.error('♻ Role update failed');
				throw new moleculer.Errors.MoleculerClientError(
					roleErrorMessage.UPDATE_FAILED,
					roleErrorCode.UPDATE_FAILED,
					err,
				);
			});
		const transform = await this.transformDocuments(
			ctx,
			{ populate: ['createdBy', 'lastModifiedBy'] },
			// {},
			result,
		);
		this.logger.debug('♻ Returning updated role: ', transform);
		return transform;
	}

	/**
	 *  @swagger
	 *
	 *  /api/v1/roles/{id}:
	 *    delete:
	 *      tags:
	 *      - "Roles"
	 *      summary: Delete a role
	 *      description: Delete role by id
	 *      operationId: removeRole
	 *      parameters:
	 *      - name: id
	 *        in: path
	 *        description: Id of role
	 *        required: true
	 *        schema:
	 *          type: string
	 *          example: '5ec51b33ead6ef2b423e4089'
	 *      responses:
	 *        200:
	 *          description: Delete result
	 *          content: {}
	 *        403:
	 *          description: Server error
	 *          content: {}
	 */
	@Delete<RestOptions>('/:id', {
		name: 'remove',
		restricted: ['api'],
		// roles: [UserRoleDefault.SUPERADMIN, UserRoleDefault.ADMIN],
		params: {
			id: { type: 'string', min: 3 },
		},
	})
	async removeRole(ctx: Context<UserRoleDeleteParams, UserAuthMeta>) {
		const { id } = ctx.params;
		this.logger.debug('♻ Checking if user is deleting role they are using');
		const recordToDelete = (await this._get(ctx, { id: id }).then((res) => {
			if (res) {
				this.logger.debug('♻ Role found');
				return res;
			}
			this.logger.error('♻ Role not found');
			throw new moleculer.Errors.MoleculerClientError(
				roleErrorMessage.NOT_FOUND,
				roleErrorCode.NOT_FOUND,
			);
		})) as IUserRole;
		if (ctx.meta.user.roles!.includes(recordToDelete.value as UserRoleDefault)) {
			this.logger.error('♻ Cannot delete role user is currently using');
			throw new moleculer.Errors.MoleculerClientError(
				roleErrorMessage.DELETE_ITSELF,
				roleErrorCode.DELETE_ITSELF,
			);
		}
		const params = await this.sanitizeParams(ctx, ctx.params);
		this.logger.debug('♻ Attempting to delete role...');
		return await this._remove(ctx, params)
			.then(async (record) => {
				if (record) {
					this.logger.debug('♻ Role deleted successfully');
					ctx.meta.$statusCode = constants.HTTP_STATUS_ACCEPTED;
					await this.broker.emit(UserRoleEvent.DELETED, { id: id });
					return { recordsDeleted: record, record: recordToDelete };
				}
				this.logger.error('♻ Role deletion failed');
				throw new moleculer.Errors.MoleculerClientError(
					roleErrorMessage.DELETE_FAILED,
					roleErrorCode.DELETE_FAILED,
				);
			})
			.catch((err) => {
				this.logger.error('♻ Role deletion error:', err);
				throw new moleculer.Errors.MoleculerClientError(
					roleErrorMessage.DELETE_FAILED,
					roleErrorCode.DELETE_FAILED,
					err,
				);
			});
	}
}
