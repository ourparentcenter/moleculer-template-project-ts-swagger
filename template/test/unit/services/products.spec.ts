'use strict';

// process.env.TEST = 'true';

import { clearDB, testConfig, wait } from '../../helpers/helper';
import { Config } from '../../../common';
import moleculer, { Context, Endpoint, Errors, ServiceBroker } from 'moleculer';
import TestingService from '../../../services/productService';
import UserService from '../../../services/userService';
import AuthService from '../../../services/authService';
import 'jest-extended';
import 'jest-chain';
import { ProductCreateParams, ProductDeleteParams, UserAuthMeta } from '../../../types';
import { superAdminUser } from '../../helpers/user.helper';
import { IProduct } from './../../../entities/product.entity';
const JEST_TIMEOUT = 35 * 1000;
jest.setTimeout(JEST_TIMEOUT);

function calledCacheClean(mockFn: jest.SpyInstance) {
	expect(mockFn)
		.toHaveBeenCalled()
		.toHaveBeenCalledTimes(1)
		.toHaveBeenCalledWith(
			`cache.clean.${Config.DB_PRODUCT.dbname}.${Config.DB_PRODUCT.collection}`,
		);
}

describe("Test 'products' service", () => {
	let version: string;
	let endpoint: Endpoint;
	let productService: any;
	let userService: any;
	let authService: any;
	let testProductRemove: IProduct;
	const spyBroadcast = jest.spyOn(Context.prototype, 'broadcast');

	describe('Unit tests for Products service', () => {
		const broker = new ServiceBroker(testConfig);
		authService = broker.createService(AuthService);
		productService = broker.createService(TestingService);
		userService = broker.createService(UserService);

		version = `v${productService.version}`;
		jest.spyOn(productService.adapter, 'updateById');
		jest.spyOn(productService, 'transformDocuments');
		jest.spyOn(productService, 'entityChanged');

		beforeAll(async () => {
			await wait(1);
			broker.start();
			await broker.waitForServices([
				`v${userService.version}.${userService.name}`,
				`v${authService.version}.${authService.name}`,
				`v${productService.version}.${productService.name}`,
			]);
		});
		afterAll(async () => {
			broker.stop();
			await clearDB(Config.DB_PRODUCT);
			await clearDB(Config.DB_USER);
		});
		beforeEach(() => {
			expect.hasAssertions();
			endpoint = {
				broker,
				id: Math.random().toString(36).slice(2),
				local: true,
				node: {},
				state: true,
			};
		});
		afterEach(() => {
			jest.clearAllMocks();
			spyBroadcast.mockClear();
		});

		const record = {
			_id: '123',
			name: 'Awesome thing',
			price: 999,
			quantity: 25,
			createdAt: Date.now(),
		};

		describe(`Test '${version}.products.create'`, () => {
			let context: Context<ProductCreateParams, UserAuthMeta>;
			beforeEach(() => {
				context = new Context<ProductCreateParams, UserAuthMeta>(broker, endpoint);
				context.action = { name: `${version}.products.create` };
				context.meta = { user: superAdminUser };
			});
			it('should call the adapter create method with price', async () => {
				context.params = {
					name: 'test product price',
					price: 10,
				};
				const res = await productService.createProduct(context);
				testProductRemove = res;
				expect(res)
					.toBeObject()
					.toContainEntries([
						['_id', expect.any(String)],
						['name', 'test product price'],
						['price', 10],
						['quantity', 0],
						['active', false],
					]);
			});
			it('should call the adapter create method with quantity', async () => {
				context.params = {
					name: 'test product quantity',
					quantity: 10,
				};
				const res = await productService.createProduct(context);
				expect(res)
					.toBeObject()
					.toContainEntries([
						['_id', expect.any(String)],
						['name', 'test product quantity'],
						['price', 0],
						['quantity', 10],
						['active', false],
					]);
			});
			it('should call the adapter create method with full product and set to active', async () => {
				context.params = {
					name: 'test product active',
					price: 10,
					quantity: 10,
				};
				const res = await productService.createProduct(context);
				expect(res)
					.toBeObject()
					.toContainEntries([
						['_id', expect.any(String)],
						['name', 'test product active'],
						['price', 10],
						['quantity', 10],
						['active', false],
					]);
			});
			it('should call the adapter create method with existing product and error', async () => {
				try {
					context.params = {
						name: 'test product active',
						quantity: 20,
					};
					await productService.createProduct(context);
				} catch (err) {
					expect(err).toBeInstanceOf(moleculer.Errors.MoleculerClientError);
				}
				expect(spyBroadcast).not.toHaveBeenCalled();
			});
		});

		describe(`Test '${version}.products.increaseQuantity'`, () => {
			it('should call the adapter updateById method & transform result', async () => {
				productService.adapter.updateById.mockImplementation(async () => record);
				productService.transformDocuments.mockClear();
				productService.entityChanged.mockClear();

				const res = await broker.call(`${version}.products.increaseQuantity`, {
					id: '123',
					value: 10,
				});
				expect(res).toEqual({
					_id: '123',
					name: 'Awesome thing',
					price: 999,
					quantity: 25,
				});

				expect(productService.adapter.updateById).toBeCalledTimes(1);
				expect(productService.adapter.updateById).toBeCalledWith('123', {
					$inc: { quantity: 10 },
				});

				expect(productService.transformDocuments).toBeCalledTimes(1);
				expect(productService.transformDocuments).toBeCalledWith(
					expect.any(Context),
					{ id: '123', value: 10 },
					record,
				);

				expect(productService.entityChanged).toBeCalledTimes(1);
				expect(productService.entityChanged).toBeCalledWith(
					'updated',
					{ _id: '123', name: 'Awesome thing', price: 999, quantity: 25 },
					expect.any(Context),
				);
			});
		});

		describe(`Test '${version}.products.decreaseQuantity'`, () => {
			it('should call the adapter updateById method & transform result', async () => {
				productService.adapter.updateById.mockClear();
				productService.transformDocuments.mockClear();
				productService.entityChanged.mockClear();

				const res = await broker.call(`${version}.products.decreaseQuantity`, {
					id: '123',
					value: 10,
				});
				expect(res).toEqual({
					_id: '123',
					name: 'Awesome thing',
					price: 999,
					quantity: 25,
				});

				expect(productService.adapter.updateById).toBeCalledTimes(1);
				expect(productService.adapter.updateById).toBeCalledWith('123', {
					$inc: { quantity: -10 },
				});

				expect(productService.transformDocuments).toBeCalledTimes(1);
				expect(productService.transformDocuments).toBeCalledWith(
					expect.any(Context),
					{ id: '123', value: 10 },
					record,
				);

				expect(productService.entityChanged).toBeCalledTimes(1);
				expect(productService.entityChanged).toBeCalledWith(
					'updated',
					{ _id: '123', name: 'Awesome thing', price: 999, quantity: 25 },
					expect.any(Context),
				);
			});

			it('should throw error if params is not valid', async () => {
				productService.adapter.updateById.mockClear();
				productService.transformDocuments.mockClear();
				productService.entityChanged.mockClear();

				expect.assertions(2);
				try {
					await broker.call(`${version}.products.decreaseQuantity`, {
						id: '123',
						value: -5,
					});
				} catch (err) {
					expect(err).toBeInstanceOf(Errors.ValidationError);
					expect(err).toStrictEqual(
						expect.objectContaining({
							data: [
								{
									action: `${version}.products.decreaseQuantity`,
									actual: -5,
									field: 'value',
									message: "The 'value' field must be a positive number.",
									nodeID: broker.nodeID,
									type: 'numberPositive',
								},
							],
						}),
					);
				}
			});
		});

		describe(`Test '${version}.products.remove'`, () => {
			let context: Context<ProductDeleteParams, UserAuthMeta>;
			let mockServiceBroadcast: jest.SpyInstance;
			beforeEach(() => {
				context = new Context<ProductDeleteParams, UserAuthMeta>(broker, endpoint);
				context.action = { name: `${version}.products.remove` };
				mockServiceBroadcast = jest.spyOn(productService.broker, 'emit');
			});
			it('should call the adapter remove method with id', async () => {
				context.params = {
					id: testProductRemove._id!.toString(),
				};
				context.meta = { user: superAdminUser };

				const res = await productService.removeProduct(context);
				calledCacheClean(spyBroadcast);
				expect(mockServiceBroadcast)
					.toHaveBeenCalled()
					.toHaveBeenCalledTimes(1)
					.toHaveBeenCalledWith('product.deleted', { id: testProductRemove._id });
				expect(res)
					.toBeObject()
					.toContainEntries([
						[
							'record',
							expect.toContainEntries([
								['_id', testProductRemove._id],
								['active', false],
								// ['createdBy', '5eb71ba74676dfca3fef434f'],
								// ['lastModifiedBy', '5eb71ba74676dfca3fef434f'],
								['name', 'test product price'],
								['price', 10],
								['quantity', 0],
							]),
						],
						['recordsDeleted', 1],
					]);
			});
		});
	});
});
