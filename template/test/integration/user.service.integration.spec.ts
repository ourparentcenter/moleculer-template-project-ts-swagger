import { ServiceBroker } from 'moleculer';
import {
	AUTHORIZATION_KEY,
	checkWrongToken,
	checkCorrectToken,
	clearDB,
	getServer,
	randString,
	testConfig,
	wait,
} from '../helpers/helper';
import request from 'supertest';
import TestingService from '../../services/userService/user.service';
import ApiService from '../../services/apiService/api.service';
import { constants } from 'http2';
import {
	adminUser,
	disabledUser,
	getJWT,
	simpleUser,
	superAdminUser,
} from '../helpers/user.helper';
import { UserCreateParams, UserJWT, UserLang, UserRole, UserUpdateParams } from '../../types';
import { Config } from '../../common';
import 'jest-extended';
import 'jest-chain';
const JEST_TIMEOUT = 35 * 1000;
jest.setTimeout(JEST_TIMEOUT);

async function loginTest(server: string, info: { user: UserJWT; password: string; url?: string }) {
	const { user, password, url = '/auth/login' } = info;
	const response = await request(server).post(url).send({
		login: user.login,
		password,
	});
	expect(response.status).toBe(constants.HTTP_STATUS_OK);
	expect(response.body)
		.toBeDefined()
		.toBeObject()
		.toContainEntry(['token', expect.any(String)]);
	expect(response.header).toBeDefined().toContainKey(AUTHORIZATION_KEY.toLowerCase());
	expect(response.header.authorization).toBeDefined().toStartWith('Bearer ');
}

const broker = new ServiceBroker(testConfig);
// const broker = new ServiceBroker();
const testingService = broker.createService(TestingService);
const apiService = broker.createService(ApiService);
const version = `v${testingService.version}`;

describe('Integration tests for Users service', () => {
	let firstStart = true;
	let server: string;
	let testUrl = '';
	let token = '';

	beforeEach(async () => {
		await clearDB(Config.DB_USER);
		if (!broker.started) {
			await broker.start();
		}
		await broker.waitForServices(`${version}.${testingService.name}`);
		await broker.waitForServices(apiService.name);
		server = await getServer(apiService.server);
		if (firstStart) {
			await wait(1);
			// eslint-disable-next-line require-atomic-updates
			firstStart = false;
		}
	});

	afterEach(async () => {
		await broker.stop();
		await clearDB(Config.DB_USER);
	});
	beforeEach(() => expect.hasAssertions());

	describe('login', () => {
		beforeEach(() => {
			testUrl = '/auth/login';
		});
		it('wrong login', async () => {
			const response = await request(server).post(testUrl).send({
				login: 'test',
				password: 'not-valid',
			});
			expect(response.status).toBe(constants.HTTP_STATUS_UNPROCESSABLE_ENTITY);
			expect(response.body)
				.toBeDefined()
				.toBeObject()
				.toContainKey('data')
				.toContainEntry(['name', 'MoleculerClientError']);
			expect(response.body.data).toBeDefined().toBeArray().toHaveLength(1);
			expect(response.body.data[0])
				.toBeDefined()
				.toBeObject()
				.toContainEntries([
					['field', 'login/password'],
					['message', 'not found'],
				]);
		});
		it('wrong password', async () => {
			const response = await request(server).post(testUrl).send({
				login: superAdminUser.login,
				password: 'not-valid',
			});
			expect(response.status).toBe(constants.HTTP_STATUS_UNPROCESSABLE_ENTITY);
			expect(response.body)
				.toBeDefined()
				.toBeObject()
				.toContainKey('data')
				.toContainEntry(['name', 'MoleculerClientError']);
			expect(response.body.data).toBeDefined().toBeArray().toHaveLength(1);
			expect(response.body.data[0])
				.toBeDefined()
				.toBeObject()
				.toContainEntries([
					['field', 'login/password'],
					['message', 'not found'],
				]);
		});
		it('disabled user', async () => {
			const response = await request(server).post(testUrl).send({
				login: disabledUser.login,
				password: '123456',
			});
			expect(response.status).toBe(constants.HTTP_STATUS_FORBIDDEN);
			expect(response.body)
				.toBeDefined()
				.toBeObject()
				.toContainKey('data')
				.toContainEntry(['name', 'MoleculerClientError']);
			expect(response.body.data).toBeDefined().toBeArray().toHaveLength(1);
			expect(response.body.data[0])
				.toBeDefined()
				.toBeObject()
				.toContainEntries([
					['field', 'disabled'],
					['message', 'user not active'],
				]);
		});
		it('good login', async () => {
			await loginTest(server, { user: superAdminUser, password: '123456' });
		});
	});

	describe('Get User', () => {
		beforeEach(async () => {
			testUrl = `/api/${version}/user`;
			token = await getJWT(server);
		});
		it('wrong token', async () => {
			await checkWrongToken(server, testUrl);
		});
		it('info', async () => {
			const response = await request(server).get(testUrl).set(AUTHORIZATION_KEY, token);
			expect(response.status).toBe(constants.HTTP_STATUS_OK);
			expect(response.body)
				.toBeDefined()
				.toBeObject()
				.toContainEntries([
					['login', superAdminUser.login],
					['email', superAdminUser.email],
				]);
		});
	});

	describe('Get All Users', () => {
		beforeEach(async () => {
			testUrl = `/api/${version}/user/list`;
			token = await getJWT(server);
		});
		it('wrong token', async () => {
			await checkWrongToken(server, testUrl);
		});
		it('list', async () => {
			const response = await request(server).get(testUrl).set(AUTHORIZATION_KEY, token);
			expect(response.status).toBe(constants.HTTP_STATUS_OK);
			expect(response.body)
				.toBeDefined()
				.toBeObject()
				.toContainEntries([
					['page', 1],
					['pageSize', 10],
					['totalPages', 1],
				]);
		});
		it('list with admin', async () => {
			const adminToken = await getJWT(server, adminUser.login);
			await checkWrongToken(server, testUrl, { token: adminToken });
		});
	});

	describe('Get User by id', () => {
		beforeEach(async () => {
			testUrl = `/api/${version}/user/${disabledUser._id}`;
			token = await getJWT(server);
		});
		it('wrong token', async () => {
			await checkWrongToken(server, testUrl);
		});
		it('info', async () => {
			const response = await request(server).get(testUrl).set(AUTHORIZATION_KEY, token);
			expect(response.status).toBe(constants.HTTP_STATUS_OK);
			expect(response.body)
				.toBeDefined()
				.toBeObject()
				.toContainEntries([
					['login', disabledUser.login],
					['email', disabledUser.email],
				]);
		});
		it('info with admin', async () => {
			const adminToken = await getJWT(server, adminUser.login);
			await checkCorrectToken(server, testUrl, { token: adminToken, method: 'get' });
		});
	});

	describe('Create Users', () => {
		const password = randString();
		const user: UserCreateParams = {
			login: `test-${randString()}`,
			password,
			firstName: 'test',
			lastName: 'test',
			email: `test-${randString()}@test.com`,
			roles: [UserRole.USER],
			langKey: UserLang.ES,
			active: true,
		};
		beforeEach(async () => {
			testUrl = `/api/${version}/user`;
			token = await getJWT(server);
		});
		it('wrong token', async () => {
			await checkWrongToken(server, testUrl, { method: 'post', body: user });
		});
		it('create with admin', async () => {
			const adminToken = await getJWT(server, adminUser.login);
			await checkWrongToken(server, testUrl, {
				token: adminToken,
				method: 'post',
				body: user,
			});
		});
		it('create + login', async () => {
			const response = await request(server)
				.post(testUrl)
				.send(user)
				.set(AUTHORIZATION_KEY, token);
			expect(response.status).toBe(constants.HTTP_STATUS_OK);
			expect(response.body)
				.toBeDefined()
				.toBeObject()
				.toContainEntries([
					['login', user.login],
					['email', user.email],
				]);
			await loginTest(server, { user: response.body, password });
		});
	});

	describe('Update user by id', () => {
		const user: UserUpdateParams = {
			...simpleUser,
			firstName: 'other name',
			id: simpleUser._id,
		};
		beforeEach(async () => {
			testUrl = `/api/${version}/user/${simpleUser._id}`;
			token = await getJWT(server);
		});
		it('wrong token', async () => {
			await checkWrongToken(server, testUrl, { method: 'put', body: user });
		});
		it('info with admin', async () => {
			const adminToken = await getJWT(server, adminUser.login);
			await checkWrongToken(server, testUrl, {
				token: adminToken,
				method: 'put',
				body: user,
			});
		});
		it('update + login', async () => {
			const response = await request(server)
				.put(testUrl)
				.send(user)
				.set(AUTHORIZATION_KEY, token);
			expect(response.status).toBe(constants.HTTP_STATUS_OK);
			expect(response.body)
				.toBeDefined()
				.toBeObject()
				.toContainEntries([
					['firstName', user.firstName],
					['email', user.email],
				]);
			await loginTest(server, { user: response.body, password: '123456' });
		});
		it('update password + login', async () => {
			const password = 'test-password';
			const response = await request(server)
				.put(testUrl)
				.send({ ...user, password })
				.set(AUTHORIZATION_KEY, token);
			expect(response.status).toBe(constants.HTTP_STATUS_OK);
			expect(response.body)
				.toBeDefined()
				.toBeObject()
				.toContainEntries([
					['firstName', user.firstName],
					['email', user.email],
				]);
			await loginTest(server, { user: response.body, password });
		});
	});

	describe('Delete User by id', () => {
		beforeEach(async () => {
			testUrl = `/api/${version}/user/${disabledUser._id}`;
			token = await getJWT(server);
		});
		it('wrong token', async () => {
			await checkWrongToken(server, testUrl, { method: 'delete' });
		});
		it('delete', async () => {
			const response = await request(server).delete(testUrl).set(AUTHORIZATION_KEY, token);
			expect(response.status).toBe(constants.HTTP_STATUS_ACCEPTED);
		});
		it('delete with admin', async () => {
			const adminToken = await getJWT(server, adminUser.login);
			await checkWrongToken(server, testUrl, { token: adminToken, method: 'delete' });
		});
		it('delete itself', async () => {
			const response = await request(server)
				.delete(`/api/${version}/user/${superAdminUser._id}`)
				.set(AUTHORIZATION_KEY, token);
			expect(response.status).toBe(constants.HTTP_STATUS_UNPROCESSABLE_ENTITY);
		});
	});
});
