'use strict';

// process.env.TEST = 'true';

import { clearDB } from '../helpers/helper';
import { Config } from '../../common';
import { ServiceBroker } from 'moleculer';
import TestService from '../../services/productService';

describe("Test 'products' service", () => {
	beforeEach(async () => {
		await clearDB(Config.DB_PRODUCT);
	});
	afterEach(async () => {
		await clearDB(Config.DB_PRODUCT);
	});

	describe('Test actions', () => {
		const broker = new ServiceBroker({ logger: false });
		const service = broker.createService(TestService);
		const version = `v${service.version}`;
		service.seedDB = null; // Disable seeding

		beforeAll(async () => {
			// await clearDB(Config.DB_USER);
			// if (!broker.started) {
			await broker.start();
			// }
			await broker.waitForServices(`${version}.${service.name}`);
		});
		afterAll(async () => {
			await broker.stop();
			// await clearDB(Config.DB_USER);
		});

		const record = {
			name: 'Awesome item',
			price: 999,
		};
		let newID: string;

		it('should contains the seeded items', async () => {
			const res = await broker.call(`${version}.products.list`);
			expect(res).toEqual({ page: 1, pageSize: 10, rows: [], total: 0, totalPages: 0 });
		});

		it('should add the new item', async () => {
			const res: any = await broker.call(`${version}.products.create`, record);
			expect(res).toEqual({
				_id: expect.any(String),
				name: 'Awesome item',
				price: 999,
				quantity: 0,
			});
			newID = res._id;

			const res2 = await broker.call(`${version}.products.count`);
			expect(res2).toBe(1);
		});

		it('should get the saved item', async () => {
			const res = await broker.call(`${version}.products.get`, { id: newID });
			expect(res).toEqual({
				_id: expect.any(String),
				name: 'Awesome item',
				price: 999,
				quantity: 0,
			});

			const res2 = await broker.call(`${version}.products.list`);
			expect(res2).toEqual({
				page: 1,
				pageSize: 10,
				rows: [{ _id: newID, name: 'Awesome item', price: 999, quantity: 0 }],
				total: 1,
				totalPages: 1,
			});
		});

		it('should update an item', async () => {
			const res = await broker.call(`${version}.products.update`, { id: newID, price: 499 });
			expect(res).toEqual({
				_id: expect.any(String),
				name: 'Awesome item',
				price: 499,
				quantity: 0,
			});
		});

		it('should get the updated item', async () => {
			const res = await broker.call(`${version}.products.get`, { id: newID });
			expect(res).toEqual({
				_id: expect.any(String),
				name: 'Awesome item',
				price: 499,
				quantity: 0,
			});
		});

		it('should increase the quantity', async () => {
			const res = await broker.call(`${version}.products.increaseQuantity`, {
				id: newID,
				value: 5,
			});
			expect(res).toEqual({
				_id: expect.any(String),
				name: 'Awesome item',
				price: 499,
				quantity: 5,
			});
		});

		it('should decrease the quantity', async () => {
			const res = await broker.call(`${version}.products.decreaseQuantity`, {
				id: newID,
				value: 2,
			});
			expect(res).toEqual({
				_id: expect.any(String),
				name: 'Awesome item',
				price: 499,
				quantity: 3,
			});
		});

		it('should remove the updated item', async () => {
			const res = await broker.call(`${version}.products.remove`, { id: newID });
			expect(res).toBe(1);

			const res2 = await broker.call(`${version}.products.count`);
			expect(res2).toBe(0);

			const res3 = await broker.call(`${version}.products.list`);
			expect(res3).toEqual({ page: 1, pageSize: 10, rows: [], total: 0, totalPages: 0 });
		});
	});
});
