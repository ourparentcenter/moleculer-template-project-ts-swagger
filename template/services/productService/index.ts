/* eslint-disable @typescript-eslint/explicit-member-accessibility */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
'use strict';
import { Context } from 'moleculer';
import { Put, Method, Service } from '@ourparentcenter/moleculer-decorators-extended';
import { dbProductMixin, eventsProductMixin } from '../../mixins/dbMixins';
import { Config } from '../../common';
import {
	IProduct,
	MoleculerDBService,
	ProductServiceSettingsOptions,
	ProductsManipulateValueParams,
	ProductsServiceOptions,
	RestOptions,
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
	mixins: [dbProductMixin, eventsProductMixin],
	/**
	 * Settings
	 */
	settings: {
		idField: '_id',
		// Available fields in the responses
		fields: ['_id', 'name', 'quantity', 'price'],
		// Base path
		rest: '/',
		// rest: '/v1/products',
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
	 *  /api/v1/products:
	 *    post:
	 *      tags:
	 *      - "Products"
	 *      summary: Create a product (auto generated)
	 *      description: Create a product
	 *      requestBody:
	 *        required: true
	 *        content:
	 *          application/json:
	 *            schema:
	 *              required:
	 *              - name
	 *              - price
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

	/**
	 *  @swagger
	 *
	 *  /api/v1/products/{id}:
	 *    get:
	 *      tags:
	 *      - "Products"
	 *      summary: Get product by id (auto generated)
	 *      description: Get product by id
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
	 *      summary: Delete a product (auto generated)
	 *      description: Delete product by id
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
}
