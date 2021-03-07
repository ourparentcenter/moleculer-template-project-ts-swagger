/* eslint-disable @typescript-eslint/explicit-member-accessibility */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
'use strict';
import { Context } from 'moleculer';
import { Put, Method, Service } from 'moleculer-decorators-extended';
import { dbProductMixin, eventsProductMixin } from '../../mixins/dbMixins';
import { Config } from '../../common';
import {
	IProduct,
	MoleculerDBService,
	ProductServiceSettingsOptions,
	ProductsManipulateValueParams,
	ProductsServiceOptions,
} from '../../types';

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */
@Service<ProductsServiceOptions>({
	name: 'products',
	version: 1,
	/**
	 * Service guard token
	 */
	authToken: Config.PRODUCTS_AUTH_TOKEN,
	/**
	 * Mixins
	 */
	// Mixins: [DbMixin],
	mixins: [dbProductMixin, eventsProductMixin],
	/**
	 * Settings
	 */
	settings: {
		idField: '_id',
		// Available fields in the responses
		fields: ['_id', 'name', 'quantity', 'price'],
		rest: '/v1/products',
		// Validator for the `create` & `insert` actions.
		entityValidator: {
			name: 'string|min:3',
			price: 'number|positive',
		},
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
			create: (ctx: Context<{ quantity: number }>) => {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				ctx.params.quantity = 0;
			},
		},
	},
})
export default class ProductService extends MoleculerDBService<
	ProductServiceSettingsOptions,
	IProduct
> {
	/**
	 *  @swagger
	 *
	 *  /v1/products/{id}/quantity/increase:
	 *    put:
	 *      tags:
	 *      - "Products"
	 *      summary: Increase the quantity of the product item
	 *      description: Increase the quantity of the product item.
	 *      operationId: increaseQuantity
	 *      produces:
	 *        - application/json
	 *      consumes:
	 *        - application/json; charset=utf-8
	 *      parameters:
	 *        - in: path
	 *          name: id
	 *          description: Id of product
	 *          required: true
	 *          type: string
	 *        - in: body
	 *          name: params
	 *          schema:
	 *            type: object
	 *            required:
	 *              - value
	 *            properties:
	 *              value:
	 *                type: number
	 *                description: Quantity to increase
	 *      responses:
	 *        200:
	 *          description: Increased quantity result
	 *        422:
	 *          description: Missing parameters
	 */
	@Put('/:id/quantity/increase', {
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
	 *  /v1/products/{id}/quantity/decrease:
	 *    put:
	 *      tags:
	 *      - "Products"
	 *      summary: Decrease the quantity of the product item
	 *      description: Decrease the quantity of the product item.
	 *      produces:
	 *        - application/json
	 *      consumes:
	 *        - application/json
	 *      parameters:
	 *        - in: path
	 *          name: id
	 *          description: Id of product
	 *          required: true
	 *          type: string
	 *        - in: body
	 *          name: params
	 *          schema:
	 *            type: object
	 *            required:
	 *              - value
	 *            properties:
	 *              value:
	 *                type: number
	 *                description: Quantity to decrease
	 *      responses:
	 *        200:
	 *          description: Decreased quantity result
	 *        422:
	 *          description: Missing parameters
	 */
	@Put('/:id/quantity/decrease', {
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
		const doc = await this.adapter.updateById(ctx.params.id, {
			$inc: { quantity: -ctx.params.value },
		});
		const json = await this.transformDocuments(ctx, ctx.params, doc);
		await this.entityChanged('updated', json, ctx);
		return json;
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
	 *  /v1/products:
	 *    get:
	 *      tags:
	 *      - "Products"
	 *      summary: Get all products (auto generated)
	 *      description: Get all products
	 *      produces:
	 *        - application/json
	 *      consumes:
	 *        - application/json
	 *      responses:
	 *        200:
	 *          description: Products result
	 *        403:
	 *          description: Server error
	 */
	/**
	 *  @swagger
	 *
	 *  /v1/products/{id}:
	 *    get:
	 *      tags:
	 *      - "Products"
	 *      summary: Get product by id (auto generated)
	 *      description: Get product by id
	 *      produces:
	 *        - application/json
	 *      consumes:
	 *        - application/json
	 *      parameters:
	 *        - in: path
	 *          name: id
	 *          description: Id of product
	 *          required: true
	 *          type: string
	 *      responses:
	 *        200:
	 *          description: Products result
	 *        403:
	 *          description: Server error
	 */
	/**
	 *  @swagger
	 *
	 *  /v1/products:
	 *    post:
	 *      tags:
	 *      - "Products"
	 *      summary: Create a product (auto generated)
	 *      description: Create a product
	 *      produces:
	 *        - application/json
	 *      consumes:
	 *        - application/json
	 *      parameters:
	 *        - in: body
	 *          name: params
	 *          schema:
	 *            type: object
	 *            required:
	 *              - name
	 *              - price
	 *            properties:
	 *              name:
	 *                type: string
	 *                default: product name
	 *                description: Name to be used
	 *              price:
	 *                type: number
	 *                default: 99
	 *                description: Price of product
	 *      responses:
	 *        200:
	 *          description: welcome result
	 *        422:
	 *          description: Missing parameters
	 */
	/**
	 *  @swagger
	 *
	 *  /v1/products/{id}:
	 *    put:
	 *      tags:
	 *      - "Products"
	 *      summary: Update a product (auto generated)
	 *      description: Update product.
	 *      produces:
	 *        - application/json
	 *      consumes:
	 *        - application/json
	 *      parameters:
	 *        - in: path
	 *          name: id
	 *          description: Id of product
	 *          required: true
	 *          type: string
	 *        - in: body
	 *          name: params
	 *          schema:
	 *            type: object
	 *            required:
	 *              - name
	 *              - Price
	 *            properties:
	 *              name:
	 *                type: string
	 *                description: Name of product
	 *              price:
	 *                type: number
	 *                description: Price of product
	 *      responses:
	 *        200:
	 *          description: Product update result
	 *        403:
	 *          description: Server error
	 *        422:
	 *          description: Missing parameters
	 */
	/**
	 *  @swagger
	 *
	 *  /v1/products/{id}:
	 *    delete:
	 *      tags:
	 *      - "Products"
	 *      summary: Delete a product (auto generated)
	 *      description: Delete product by id
	 *      produces:
	 *        - application/json
	 *      consumes:
	 *        - application/json
	 *      parameters:
	 *        - in: path
	 *          name: id
	 *          description: Id of product
	 *          required: true
	 *          type: string
	 *      responses:
	 *        200:
	 *          description: Delete result
	 *        403:
	 *          description: Server error
	 */
}
