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
import TestingService from '../../services/userService';
import ApiService from '../../services/apiService';
import AuthService from '../../services/authService';
import { constants } from 'http2';
import {
	adminUser,
	disabledUser,
	getJWT,
	simpleUser,
	superAdminUser,
} from '../helpers/user.helper';
import {
	UserCreateParams,
	UserJWT,
	UserLang,
	UserRoleDefault,
	UserUpdateParams,
} from '../../types';
import { Config } from '../../common';
import 'jest-extended';
import 'jest-chain';
const JEST_TIMEOUT = 35 * 1000;
jest.setTimeout(JEST_TIMEOUT);

async function loginTest(server: string, info: { user: UserJWT; password: string; url?: string }) {
	const { user, password, url = '/auth/login' } = info;
	const response = await request(server).post(url).send({
		login: user.login,
		// file deepcode ignore NoHardcodedPasswords: password in a test file
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
const authService = broker.createService(AuthService);
const version = `v${testingService.version}`;
const authversion = `v${authService.version}`;

describe('Integration tests for Users service', () => {
	let server: string;
	let testUrl = '';
	let token = '';
	let userToken = '';

	beforeAll(async () => {
		await wait(1);
		if (!broker.started) {
			await broker.start();
		}
		await broker.waitForServices([
			`${version}.${testingService.name}`,
			`${authversion}.${authService.name}`,
			apiService.name,
		]);

		server = await getServer(apiService.server);
	});

	afterAll(async () => {
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
			expect(response.status).toBe(constants.HTTP_STATUS_OK);
			expect(response.body)
				.toBeDefined()
				.toBeObject()
				.toContainKey('data')
				.toContainEntry(['code', constants.HTTP_STATUS_UNPROCESSABLE_ENTITY]);
			expect(response.body.data).toBeDefined().toBeArray().toHaveLength(1);
			expect(response.body.data[0])
				.toBeDefined()
				.toBeObject()
				.toContainEntries([
					['field', 'login/password'],
					['message', 'login/password incorrect'],
				]);
		});
		it('wrong password', async () => {
			const response = await request(server).post(testUrl).send({
				login: superAdminUser.login,
				password: 'not-valid',
			});
			expect(response.status).toBe(constants.HTTP_STATUS_OK);
			expect(response.body)
				.toBeDefined()
				.toBeObject()
				.toContainKey('data')
				.toContainEntry(['code', constants.HTTP_STATUS_UNPROCESSABLE_ENTITY]);
			expect(response.body.data).toBeDefined().toBeArray().toHaveLength(1);
			expect(response.body.data[0])
				.toBeDefined()
				.toBeObject()
				.toContainEntries([
					['field', 'login/password'],
					['message', 'login/password incorrect'],
				]);
		});
		it('disabled user', async () => {
			const response = await request(server).post(testUrl).send({
				login: disabledUser.login,
				password: '123456',
			});
			expect(response.status).toBe(constants.HTTP_STATUS_OK);
			expect(response.body)
				.toBeDefined()
				.toBeObject()
				.toContainKey('data')
				.toContainEntry(['code', constants.HTTP_STATUS_FORBIDDEN]);
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
			roles: [UserRoleDefault.USER],
			langKey: UserLang.ENUS,
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
		it('should update password & log in', async () => {
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
		beforeAll(async () => {
			testUrl = `/api/${version}/user/${disabledUser._id}`;
			token = await getJWT(server);
		});
		it('should error on wrong token', async () => {
			await checkWrongToken(server, testUrl, { method: 'delete' });
		});
		it('should delete user by id', async () => {
			const response = await request(server).delete(testUrl).set(AUTHORIZATION_KEY, token);
			expect(response.status).toBe(constants.HTTP_STATUS_ACCEPTED);
		});
		it('delete with admin', async () => {
			const adminToken = await getJWT(server, adminUser.login);
			await checkWrongToken(server, testUrl, { token: adminToken, method: 'delete' });
		});
		it('should error deleting itself', async () => {
			const response = await request(server)
				.delete(`/api/${version}/user/${superAdminUser._id}`)
				.set(AUTHORIZATION_KEY, token);
			expect(response.status).toBe(constants.HTTP_STATUS_UNPROCESSABLE_ENTITY);
		});
	});

	describe('Delete multiple users by id', () => {
		beforeAll(async () => {
			testUrl = `/api/${version}/user/removeMany`;
			token = await getJWT(server, adminUser.login);
			userToken = await getJWT(server, simpleUser.login, 'test-password');
		});
		it('wrong token', async () => {
			await checkWrongToken(server, testUrl, { method: 'delete' });
		});
		it('should error deleting nonexistent users', async () => {
			const response = await request(server)
				.delete(testUrl)
				.set(AUTHORIZATION_KEY, token)
				.send({
					userIDs: ['xxx', 'xx1'],
				});
			expect(response.status).toBe(constants.HTTP_STATUS_UNPROCESSABLE_ENTITY);
			expect(response.body)
				.toBeDefined()
				.toBeObject()
				.toStrictEqual({
					code: 422,
					data: {
						deletionErrors: {
							errorCount: 2,
							records: [
								{
									error: {
										code: 404,
										data: { id: 'xxx' },
										retryable: false,
										type: null,
									},
									record: { id: 'xxx' },
								},
								{
									error: {
										code: 404,
										data: { id: 'xx1' },
										retryable: false,
										type: null,
									},
									record: { id: 'xx1' },
								},
							],
						},
						recordsDeleted: { deletedRecords: [], deletionCount: 0 },
					},
					message: '♻ API removemany error: 2 errors occured of 2 records',
					name: 'MoleculerClientError',
					type: '200',
				});
		});
		it('should error deleting with non admin', async () => {
			const response = await request(server)
				.delete(testUrl)
				.set(AUTHORIZATION_KEY, userToken)
				.send({
					userIDs: [
						'5eb71ba74676dfca3fef434f',
						'5eb71bb3b3a17a2fd4f83322',
						'5eb71c114b35f4c17db3a773',
					],
				});
			expect(response.status).toBe(constants.HTTP_STATUS_UNAUTHORIZED);
			expect(response.body)
				.toBeDefined()
				.toBeObject()
				.toContainEntries([
					['name', 'UnAuthorizedError'],
					['message', 'Unauthorized'],
					['code', 401],
					['type', 'INVALID_TOKEN'],
					['data', null],
				]);
		});
		it('should error deleting itself and delete other users in array', async () => {
			const response = await request(server)
				.delete(testUrl)
				.set(AUTHORIZATION_KEY, token)
				.send({
					userIDs: [
						'5eb71ba74676dfca3fef434f',
						'5eb71bb3b3a17a2fd4f83322',
						'5eb71c114b35f4c17db3a773',
					],
				});
			expect(response.status).toBe(constants.HTTP_STATUS_UNPROCESSABLE_ENTITY);
			expect(response.body)
				.toBeDefined()
				.toBeObject()
				.toContainEntries([
					['name', 'MoleculerClientError'],
					['code', 422],
					['type', '200'],
					['message', '♻ API removemany error: 1 errors occured of 3 records'],
					[
						'data',
						expect.toContainEntries([
							[
								'recordsDeleted',
								expect.toContainEntries([
									['deletionCount', 2],
									['deletedRecords', expect.toBeArrayOfSize(2)],
								]),
							],
							[
								'deletionErrors',
								expect.toContainEntries([
									['errorCount', 1],
									['records', expect.toBeArrayOfSize(1)],
								]),
							],
						]),
					],
				]);
		});
	});
});
