'use strict';

// process.env.TEST = 'true';

import { clearDB } from '../../helpers/helper';
import { Config } from '../../../common';
import { Context, Errors, ServiceBroker } from 'moleculer';
import TestService from '../../../services/productService';
import 'jest-extended';
import 'jest-chain';
const JEST_TIMEOUT = 35 * 1000;
jest.setTimeout(JEST_TIMEOUT);

describe("Test 'products' service", () => {
	let version: string;

	afterEach(async () => {
		await clearDB(Config.DB_PRODUCT);
	});

	describe('Test actions', () => {
		const broker = new ServiceBroker({
			logger: false,
			metrics: false,
		});
		const service = broker.createService(TestService);

		version = `v${service.version}`;
		jest.spyOn(service.adapter, 'updateById');
		jest.spyOn(service, 'transformDocuments');
		jest.spyOn(service, 'entityChanged');

		beforeAll(() => broker.start());
		afterAll(() => broker.stop());

		const record = {
			_id: '123',
			name: 'Awesome thing',
			price: 999,
			quantity: 25,
			createdAt: Date.now(),
		};

		describe(`Test '${version}.increaseQuantity'`, () => {
			it('should call the adapter updateById method & transform result', async () => {
				service.adapter.updateById.mockImplementation(async () => record);
				service.transformDocuments.mockClear();
				service.entityChanged.mockClear();

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

				expect(service.adapter.updateById).toBeCalledTimes(1);
				expect(service.adapter.updateById).toBeCalledWith('123', {
					$inc: { quantity: 10 },
				});

				expect(service.transformDocuments).toBeCalledTimes(1);
				expect(service.transformDocuments).toBeCalledWith(
					expect.any(Context),
					{ id: '123', value: 10 },
					record,
				);

				expect(service.entityChanged).toBeCalledTimes(1);
				expect(service.entityChanged).toBeCalledWith(
					'updated',
					{ _id: '123', name: 'Awesome thing', price: 999, quantity: 25 },
					expect.any(Context),
				);
			});
		});

		describe(`Test '${version}.products.decreaseQuantity'`, () => {
			it('should call the adapter updateById method & transform result', async () => {
				service.adapter.updateById.mockClear();
				service.transformDocuments.mockClear();
				service.entityChanged.mockClear();

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

				expect(service.adapter.updateById).toBeCalledTimes(1);
				expect(service.adapter.updateById).toBeCalledWith('123', {
					$inc: { quantity: -10 },
				});

				expect(service.transformDocuments).toBeCalledTimes(1);
				expect(service.transformDocuments).toBeCalledWith(
					expect.any(Context),
					{ id: '123', value: 10 },
					record,
				);

				expect(service.entityChanged).toBeCalledTimes(1);
				expect(service.entityChanged).toBeCalledWith(
					'updated',
					{ _id: '123', name: 'Awesome thing', price: 999, quantity: 25 },
					expect.any(Context),
				);
			});

			it('should throw error if params is not valid', async () => {
				service.adapter.updateById.mockClear();
				service.transformDocuments.mockClear();
				service.entityChanged.mockClear();

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
	});

	/* xdescribe('Test methods', () => {
		const broker = new ServiceBroker({ logger: false });
		const service = broker.createService(TestService);

		jest.spyOn(service.adapter, 'insertMany');
		jest.spyOn(service, 'seedDB');

		beforeAll(() => broker.start());
		afterAll(() => broker.stop());

		describe('Test "seedDB"', () => {
			it('should be called after service started & DB connected', async () => {
				expect(service.seedDB).toBeCalledTimes(1).toBeCalledWith();
			});

			it('should insert 3 documents', async () => {
				expect(service.adapter.insertMany)
					.toBeCalledTimes(1)
					.toBeCalledWith([
						{ name: 'Samsung Galaxy S10 Plus', quantity: 10, price: 704 },
						{ name: 'iPhone 11 Pro', quantity: 25, price: 999 },
						{ name: 'Huawei P30 Pro', quantity: 15, price: 679 },
					]);
			});
		});
	}); */

	/* describe('Test hooks', () => {
		const createActionFn = jest.fn();
		const broker = new ServiceBroker({
			logger: false,
			metrics: false,
		});
		const service = broker.createService(TestService);
		// service.actions.create = createActionFn;

		beforeAll(() => broker.start());
		afterAll(() => broker.stop());

		describe('Test before "create" hook', () => {
			it('should add quantity with zero', async () => {
				await broker.call(`v${service.version}.products.create`, {
					id: '111',
					name: 'Test product',
					price: 100,
				});

				expect(createActionFn).toBeCalledTimes(1);
				expect(createActionFn.mock.calls[0][0].params).toEqual({
					id: '111',
					name: 'Test product',
					price: 100,
					quantity: 0,
				});
			});
		});
	}); */
});
