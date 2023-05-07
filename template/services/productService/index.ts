/* eslint-disable @typescript-eslint/explicit-member-accessibility */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
('use strict');
import moleculer, { ActionParams, Context, ServiceSchema } from 'moleculer';
import {
	Put,
	Method,
	Service,
	Post,
	Delete,
	Get,
} from '@ourparentcenter/moleculer-decorators-extended';
import { Config } from '@Common';
import {
	IProduct,
	ProductCreateParams,
	ProductDeleteParams,
	productErrorCode,
	productErrorMessage,
	ProductEvent,
	ProductGetParams,
	ProductServiceSettingsOptions,
	ProductsManipulateValueParams,
	ProductsServiceOptions,
	RestOptions,
	UserAuthMeta,
	UserRoleDefault,
} from '@CoreTypes';
import { BaseServiceWithDB, DBMixinFactory } from '@Factories';
import { JsonConvert } from 'json2typescript';
import { IUserRole, ProductEntity } from '@Entities';
import { constants } from 'http2';

const validateRoleBase: ActionParams = {
	name: { type: 'string', optional: true },
	quantity: { type: 'number', optional: true },
	price: { type: 'number', optional: true },
	active: { type: 'boolean', optional: true },
};

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */
@Service<ProductsServiceOptions>({
	name: 'products',
	version: 1,
	mergeActions: true,
	/**
	 * Service guard token
	 */
	authToken: Config.PRODUCTS_AUTH_TOKEN,
	/**
	 * Mixins
	 */
	mixins: [...new DBMixinFactory('Product').createMixin()],
	/**
	 * Settings
	 */
	settings: {
		idField: '_id',
		// Available fields in the responses
		fields: [
			'_id',
			'name',
			'quantity',
			'price',
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
		// rest: '/v1/products',
		// Validator for the `create` & `insert` actions.
		/* entityValidator: {
			name: 'string|min:3',
			quantity: 'number|positive',
			price: 'number|positive',
			active: 'boolean',
		}, */
	},
	/**
	 * Action Hooks
	 */
	hooks: {
		before: {
			/**
			 * Register a before hook for the `create` action.
			 * It sets a default value for the quantity field.
			 *
			 * @param {Context} ctx
			 */
			// @ts-ignore
			create: (ctx: Context<{ price: number; quantity: number; active: boolean }>) => {
				if (!ctx.params.price) {
					ctx.params.price = 0;
				}
				if (!ctx.params.quantity) {
					ctx.params.quantity = 0;
				}
				if (!ctx.params.active) {
					ctx.params.active = false;
				}
			},
		},
	},
})
export default class ProductService extends BaseServiceWithDB<
	Partial<ServiceSchema<ProductServiceSettingsOptions>>,
	IProduct
> {
	/**
	 *  @swagger
	 *
	 *  /api/v1/products:
	 *    post:
	 *      tags:
	 *      - "Products"
	 *      summary: Create a product
	 *      description: Create a product
	 *      operationId: createProduct
	 *      requestBody:
	 *        required: true
	 *        content:
	 *          application/json:
	 *            schema:
	 *              required:
	 *              - name
	 *              type: object
	 *              properties:
	 *                name:
	 *                  type: string
	 *                  description: Name to be used
	 *                  example: product name
	 *                price:
	 *                  type: number
	 *                  description: Price of product
	 *                  example: 5.00
	 *                quantity:
	 *                  type: number
	 *                  description: Quantity of product
	 *                  example: 5
	 *                active:
	 *                  type: boolean
	 *                  description: Quantity of product
	 *                  example: false
	 *      responses:
	 *        200:
	 *          description: Create product result
	 *          content:
	 *            application/json:
	 *              schema:
	 *                allOf:
	 *                - type: object
	 *                  properties:
	 *                    _id:
	 *                      type: string
	 *                - $ref: '#/components/schemas/Product'
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
	async createProduct(ctx: Context<ProductCreateParams, UserAuthMeta>) {
		this.logger.debug(`♻ Attempting to create product...`);
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const product: ProductUpdateParams = await this.adapter.findOne<IProduct>({
			name: ctx.params.name!,
		});
		if (product) {
			this.logger.debug(
				`♻ Role ${ctx.params.name} with id ${product.id} already exists. Please update it instead.`,
			);
			throw new moleculer.Errors.MoleculerClientError(
				productErrorMessage.DUPLICATED_NAME,
				productErrorCode.DUPLICATED_NAME,
				'',
				`♻ Product ${ctx.params.name} with id ${product.id} already exists. Please update it instead.`,
			);
		}
		this.logger.debug(`♻ Creating product ${ctx.params.name}`);
		const parsedEntity = this.removeForbiddenFields<IProduct>(
			new JsonConvert().deserializeObject({ ...ctx.params }, ProductEntity).getMongoEntity(),
			['_id', 'createdBy', 'createdDate', 'lastModifiedBy', 'lastModifiedDate'],
		);
		const newProduct = this.updateAuthor<IUserRole>(parsedEntity, {
			creator: ctx.meta.user || null,
			modifier: ctx.meta.user || null,
		});

		const result = await this._create(ctx, newProduct)
			.then(async (res) => {
				this.logger.debug(`♻ Product ${ctx.params.name} created successfully.`);
				ctx.meta.$statusCode = constants.HTTP_STATUS_ACCEPTED;
				await this.broker.emit(ProductEvent.CREATED, res);
				return res;
			})
			.catch((err) => {
				this.logger.debug(`♻ Product ${ctx.params.name} could not be created.`);
				throw new moleculer.Errors.MoleculerClientError(
					productErrorMessage.PRODUCT_NOT_CREATED,
					productErrorCode.PRODUCT_NOT_CREATED,
					err,
				);
			});
		const transform = await this.transformDocuments(
			ctx,
			{ populate: ['createdBy', 'lastModifiedBy'] },
			// {},
			result,
		);
		this.logger.debug('♻ Returning new product: ', transform);
		return transform;
	}

	/**
	 *  @swagger
	 *
	 *  /api/v1/products/{id}:
	 *    get:
	 *      tags:
	 *      - "Products"
	 *      summary: Get product by id
	 *      description: Get product by id
	 *      operationId: getProductById
	 *      parameters:
	 *      - name: id
	 *        in: path
	 *        description: Id of product
	 *        required: true
	 *        schema:
	 *          type: string
	 *          example: '5ec51b33ead6ef2b423e4089'
	 *      responses:
	 *        200:
	 *          description: Products result
	 *          content:
	 *            application/json:
	 *              schema:
	 *                allOf:
	 *                - type: object
	 *                  properties:
	 *                    _id:
	 *                      type: string
	 *                - $ref: '#/components/schemas/Product'
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
	async getProductById(ctx: Context<ProductGetParams, UserAuthMeta>) {
		const params = this.sanitizeParams(ctx, ctx.params);
		this.logger.debug(`♻ Attempting to get product with id ${ctx.params.id}`);
		const product = await this._get(
			ctx,
			await { ...params, populate: ['createdBy', 'lastModifiedBy'] },
		)
			.then((res) => {
				this.logger.debug(`♻ Product with id ${ctx.params.id} found`);
				ctx.meta.$statusCode = constants.HTTP_STATUS_FOUND;
				return res;
			})
			.catch((err) => {
				this.logger.debug(`♻ Product with id ${ctx.params.id} not found`);
				throw new moleculer.Errors.MoleculerClientError(
					productErrorMessage.NOT_FOUND,
					productErrorCode.NOT_FOUND,
					err,
				);
			});
		this.logger.debug('♻ Returning role: ', product);
		return product;
	}

	/**
	 *  @swagger
	 *
	 *  /api/v1/products/{id}/quantity/increase:
	 *    put:
	 *      tags:
	 *      - "Products"
	 *      summary: Increase the quantity of the product item
	 *      description: Increase the quantity of the product item.
	 *      operationId: increaseQuantity
	 *      parameters:
	 *      - name: id
	 *        in: path
	 *        description: Id of product
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
	 *              - value
	 *              type: object
	 *              properties:
	 *                value:
	 *                  type: number
	 *                  description: Quantity to increase
	 *      responses:
	 *        200:
	 *          description: Increased quantity result
	 *          content:
	 *            application/json:
	 *              schema:
	 *                allOf:
	 *                - type: object
	 *                  properties:
	 *                    _id:
	 *                      type: string
	 *                - $ref: '#/components/schemas/Product'
	 *        422:
	 *          description: Missing parameters
	 *          content: {}
	 *      x-codegen-request-body-name: params
	 */
	@Put<RestOptions>('/:id/quantity/increase', {
		name: 'increaseQuantity',
		/**
		 * Service guard services allowed to connect
		 */
		restricted: ['api'],
		params: {
			// Id: 'string',
			id: 'string',
			value: ['number|integer|positive'],
		},
	})
	async increaseQuantity(ctx: Context<ProductsManipulateValueParams, Record<string, unknown>>) {
		this.logger.debug('♻ Increasing product quantity to: ', ctx.params.value);
		const doc = await this.adapter.updateById(ctx.params.id, {
			$inc: { quantity: ctx.params.value },
		});
		// .then((res: Record<string, unknown>) => res.value);
		const json = await this.transformDocuments(ctx, ctx.params, doc);
		await this.entityChanged('updated', json, ctx);
		return json;
	}
	/**
	 *  @swagger
	 *
	 *  /api/v1/products/{id}/quantity/decrease:
	 *    put:
	 *      tags:
	 *      - "Products"
	 *      summary: Decrease the quantity of the product item
	 *      description: Decrease the quantity of the product item.
	 *      operationId: decreaseQuantity
	 *      parameters:
	 *      - name: id
	 *        in: path
	 *        description: Id of product
	 *        required: true
	 *        schema:
	 *          type: string
	 *      requestBody:
	 *        required: true
	 *        content:
	 *          application/json:
	 *            schema:
	 *              required:
	 *              - value
	 *              type: object
	 *              properties:
	 *                value:
	 *                  type: number
	 *                  description: Quantity to increase
	 *      responses:
	 *        200:
	 *          description: Decreased quantity result
	 *          content:
	 *            application/json:
	 *              schema:
	 *                allOf:
	 *                - type: object
	 *                  properties:
	 *                    _id:
	 *                      type: string
	 *                - $ref: '#/components/schemas/Product'
	 *        422:
	 *          description: Missing parameters
	 *          content: {}
	 *      x-codegen-request-body-name: params
	 */
	@Put<RestOptions>('/:id/quantity/decrease', {
		name: 'decreaseQuantity',
		/**
		 * Service guard services allowed to connect
		 */
		restricted: ['api'],
		params: {
			id: 'string',
			value: ['number|integer|positive'],
		},
	})
	async decreaseQuantity(ctx: Context<ProductsManipulateValueParams, Record<string, unknown>>) {
		this.logger.debug('♻ Decreasing product quantity to: ', ctx.params.value);
		const doc = await this.adapter.updateById(ctx.params.id, {
			$inc: { quantity: -ctx.params.value },
		});
		const json = await this.transformDocuments(ctx, ctx.params, doc);
		await this.entityChanged('updated', json, ctx);
		return json;
	}

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
	 *  - insert
	 *  - update
	 *  - remove
	 */

	/**
	 *  @swagger
	 *
	 *  /api/v1/products:
	 *    get:
	 *      tags:
	 *      - "Products"
	 *      summary: Get all products (auto generated)
	 *      description: Get all products
	 *      responses:
	 *        200:
	 *          description: Products result
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
	 *                      - $ref: '#/components/schemas/Product'
	 *                  total:
	 *                    type: number
	 *                    description: Products result count
	 *                  page:
	 *                    type: number
	 *                    description: Products result page
	 *                  pageSize:
	 *                    type: number
	 *                    description: Products result page size max
	 *                  totalPages:
	 *                    type: number
	 *                    description: Products result total pages
	 *        403:
	 *          description: Server error
	 *          content: {}
	 */

	/**
	 *  @swagger
	 *
	 *  /api/v1/products/{id}:
	 *    put:
	 *      tags:
	 *      - "Products"
	 *      summary: Update a product (auto generated)
	 *      description: Update product.
	 *      parameters:
	 *      - name: id
	 *        in: path
	 *        description: Id of product
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
	 *              - $ref: '#/components/schemas/Product'
	 *      responses:
	 *        200:
	 *          description: Product update result
	 *          content:
	 *            application/json:
	 *              schema:
	 *                allOf:
	 *                - type: object
	 *                  properties:
	 *                    _id:
	 *                      type: string
	 *                - $ref: '#/components/schemas/Product'
	 *        403:
	 *          description: Server error
	 *          content: {}
	 *        422:
	 *          description: Missing parameters
	 *          content: {}
	 *      x-codegen-request-body-name: params
	 */

	/**
	 *  @swagger
	 *
	 *  /api/v1/products/{id}:
	 *    delete:
	 *      tags:
	 *      - "Products"
	 *      summary: Delete a product
	 *      description: Delete product by id
	 *      operationId: removeProduct
	 *      parameters:
	 *      - name: id
	 *        in: path
	 *        description: Id of product
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
	async removeProduct(ctx: Context<ProductDeleteParams, UserAuthMeta>) {
		// todo: update last modifed by to user deleting product
		const { id } = ctx.params;
		this.logger.debug('♻ Attempting to delete product...');
		const recordToDelete = await this._get(ctx, {
			id: id,
			populate: ['createdBy', 'lastModifiedBy'],
		})
			.then((res) => {
				this.logger.debug('♻ Product found');
				return res;
			})
			.catch((err) => {
				this.logger.error('♻ Product not found', err);
				throw new moleculer.Errors.MoleculerClientError(
					productErrorMessage.NOT_FOUND,
					productErrorCode.NOT_FOUND,
				);
			});
		return await this._remove(ctx, { id: id })
			.then(async (record) => {
				this.logger.debug('♻ Role deleted successfully');
				ctx.meta.$statusCode = constants.HTTP_STATUS_ACCEPTED;
				await this.broker.emit(ProductEvent.DELETED, { id: id });
				return { recordsDeleted: record, record: recordToDelete };
			})
			.catch((err) => {
				this.logger.error('♻ Product deletion error:', err);
				throw new moleculer.Errors.MoleculerClientError(
					productErrorMessage.DELETE_FAILED,
					productErrorCode.DELETE_FAILED,
					err,
				);
			});
	}
}
