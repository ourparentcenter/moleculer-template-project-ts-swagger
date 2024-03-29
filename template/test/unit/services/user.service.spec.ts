import moleculer, { Context, Endpoint, ServiceBroker } from 'moleculer';
import TestingService from '../../../services/userService/user.service';
import {
	IUser,
	IUserBase,
	UserAuthMeta,
	UserCreateParams,
	UserDeleteParams,
	UserGetParams,
	UserJWT,
	UserLang,
	UserLoginMeta,
	UserLoginParams,
	UserRole,
	UserRolesParams,
	UserTokenParams,
	UserUpdateParams,
} from '../../../types';
import { adminUser, disabledUser, simpleUser, superAdminUser } from '../../helpers/user.helper';
import { clearDB, randString, testConfig } from '../../helpers/helper';
import { Config } from '../../../common';
import 'jest-extended';
import 'jest-chain';
const JEST_TIMEOUT = 55 * 1000;
jest.setTimeout(JEST_TIMEOUT);

function calledCacheClean(mockFn: jest.SpyInstance) {
	expect(mockFn)
		.toHaveBeenCalled()
		.toHaveBeenCalledTimes(1)
		.toHaveBeenCalledWith(`cache.clean.${Config.DB_USER.dbname}.${Config.DB_USER.collection}`);
}

describe('Unit tests for User service', () => {
	let broker: ServiceBroker;
	let endpoint: Endpoint;
	let service: TestingService;
	const spyBroadcast = jest.spyOn(Context.prototype, 'broadcast');
	// let version: string;
	// const spyCall = jest.spyOn(Context.prototype, 'call');
	// Context.prototype.call = jest.fn();
	// beforeAll(async () => await clearDB(Config.DB_USER));
	beforeEach(async () => {
		broker = new ServiceBroker(testConfig);
		// broker = new ServiceBroker();
		endpoint = {
			broker,
			id: Math.random().toString(36).slice(2),
			local: true,
			node: {},
			state: true,
		};
		service = broker.createService(TestingService) as TestingService;
		// version = `vv${service.version}`;
		await clearDB(Config.DB_USER);
		await broker.start();
		await broker.waitForServices(`v${service.version}.${service.name}`);
	});
	afterEach(() => {
		jest.clearAllMocks();
		spyBroadcast.mockClear();
	});
	afterAll(async () => {
		await broker.stop();
		await clearDB(Config.DB_USER);
	});

	beforeEach(() => expect.hasAssertions());

	function getJWT(user: UserJWT) {
		return service.generateJWT(user as IUser);
	}

	describe('actions', () => {
		let context: Context<UserTokenParams, Record<string, unknown>>;
		beforeEach(() => {
			context = new Context<UserTokenParams, Record<string, unknown>>(broker, endpoint);
		});
		it('resolve token', async () => {
			context.params = { token: getJWT(simpleUser) };
			try {
				const response = await service.resolveToken(context);
				expect(response)
					.toBeDefined()
					.toBeObject()
					.toContainEntries([
						['_id', simpleUser._id],
						['login', simpleUser.login],
					]);
			} catch (err: any) {
				throw new Error(err);
			}
		});
		it('resolve wrong token', async () => {
			context.params = { token: getJWT(simpleUser) + 'asdf' };
			try {
				const response = await service.resolveToken(context);
				expect(response).toBeUndefined();
			} catch (err: any) {
				throw new Error(err);
			}
		});
		it('resolve not found user', async () => {
			context.params = { token: getJWT({ ...simpleUser, _id: '1234' }) };
			try {
				await service.resolveToken(context);
			} catch (err: any) {
				expect(err).toBeInstanceOf(moleculer.Errors.MoleculerClientError);
			}
		});
	});

	describe('validate role', () => {
		let context: Context<UserRolesParams, UserAuthMeta>;
		beforeEach(() => {
			context = new Context<UserRolesParams, UserAuthMeta>(broker, endpoint);
		});
		it('validate no role', async () => {
			context.params = {} as UserRolesParams;
			context.meta.user = simpleUser;
			try {
				const response = await service.validateRole(context);
				expect(response).toBe(true);
			} catch (err: any) {
				throw new Error(err);
			}
		});
		it('validate empty role', async () => {
			context.params = { roles: [] };
			context.meta.user = simpleUser;
			try {
				const response = await service.validateRole(context);
				expect(response).toBe(true);
			} catch (err: any) {
				throw new Error(err);
			}
		});
		it('validate valid role', async () => {
			context.params = { roles: [UserRole.USER] };
			context.meta.user = simpleUser;
			try {
				const response = await service.validateRole(context);
				expect(response).toBe(true);
			} catch (err: any) {
				throw new Error(err);
			}
		});
		it('validate wrong role', async () => {
			context.params = { roles: [UserRole.SUPERADMIN] };
			context.meta.user = simpleUser;
			try {
				const response = await service.validateRole(context);
				expect(response).toBe(false);
			} catch (err: any) {
				throw new Error(err);
			}
		});
	});

	describe('create user', () => {
		let user: IUserBase;
		let context: Context<UserCreateParams, UserAuthMeta>;
		beforeEach(() => {
			const str = randString();
			user = {
				login: `login-${str}`,
				email: `${str}@test.com`,
				firstName: str,
				lastName: str,
				roles: [UserRole.USER],
				langKey: UserLang.ES,
				active: true,
			};
			context = new Context<UserCreateParams, UserAuthMeta>(broker, endpoint);
		});
		it('create user with wrong data', async () => {
			context.params = {} as UserCreateParams;
			try {
				await service.createUser(context);
			} catch (err: any) {
				expect(err).toBeInstanceOf(Error);
			}
			expect(spyBroadcast).not.toHaveBeenCalled();
		});
		it('create user', async () => {
			context.params = { ...user, password: randString() };
			context.meta = { user: superAdminUser };
			try {
				const response = await service.createUser(context);
				expect(response)
					.toBeDefined()
					.toBeObject()
					.toContainEntries([
						['login', user.login],
						['email', user.email],
					]);
			} catch (err: any) {
				throw new Error(err);
			}
			calledCacheClean(spyBroadcast);
		});
		it('create existing user login', async () => {
			context.meta = { user: superAdminUser };
			const newUser = { ...simpleUser };
			// @ts-ignore
			delete newUser._id;
			context.params = {
				...newUser,
				email: `${randString()}@test.net`,
				password: randString(),
			};
			try {
				await service.createUser(context);
			} catch (err: any) {
				expect(err).toBeInstanceOf(moleculer.Errors.MoleculerClientError);
			}
			expect(spyBroadcast).not.toHaveBeenCalled();
		});
		it('create existing user email', async () => {
			context.meta = { user: superAdminUser };
			const newUser = { ...simpleUser };
			// @ts-ignore
			delete newUser._id;
			context.params = {
				...newUser,
				login: `other-login-${randString()}`,
				password: randString(),
			};
			try {
				await service.createUser(context);
			} catch (err: any) {
				expect(err).toBeInstanceOf(moleculer.Errors.MoleculerClientError);
			}
			expect(spyBroadcast).not.toHaveBeenCalled();
		});
	});

	describe('login user', () => {
		let context: Context<UserLoginParams, UserLoginMeta>;
		beforeEach(() => {
			context = new Context<UserLoginParams, UserLoginMeta>(broker, endpoint);
		});
		it('login wrong user', async () => {
			context.params = { login: 'not-valid-user', password: 'test' };
			try {
				await service.loginUser(context);
			} catch (err: any) {
				expect(err).toBeInstanceOf(moleculer.Errors.MoleculerClientError);
			}
		});
		it('login wrong password', async () => {
			context.params = { login: simpleUser.login, password: randString() };
			try {
				await service.loginUser(context);
			} catch (err: any) {
				expect(err).toBeInstanceOf(moleculer.Errors.MoleculerClientError);
			}
		});
		it('login disabled', async () => {
			context.params = { login: disabledUser.login, password: '123456' };
			try {
				await service.loginUser(context);
			} catch (err: any) {
				expect(err).toBeInstanceOf(moleculer.Errors.MoleculerClientError);
			}
		});
		it('login good', async () => {
			context.params = { login: simpleUser.login, password: '123456' };
			try {
				const response = await service.loginUser(context);
				expect(response)
					.toBeDefined()
					.toBeObject()
					.toContainEntry(['token', expect.any(String)]);
				// .toContainEntries([
				//   ['login', simpleUser.login],
				//   ['email', simpleUser.email]
				// ]);
			} catch (err: any) {
				throw new Error(err);
			}
		});
	});

	describe('get me', () => {
		let context: Context<Record<string, unknown>, UserAuthMeta>;
		beforeEach(() => {
			context = new Context<Record<string, unknown>, UserAuthMeta>(broker, endpoint);
			context.action = { name: `v${service.version}.user.getMe` };
		});
		it('not found', async () => {
			context.meta = { user: { ...simpleUser, _id: 'xxx' } };
			try {
				await service.getMe(context);
			} catch (err: any) {
				expect(err).toBeInstanceOf(moleculer.Errors.MoleculerClientError);
			}
		});
		it('user info', async () => {
			context.meta = { user: { ...simpleUser } };
			try {
				const response = await service.getMe(context);
				expect(response)
					.toBeDefined()
					.toBeObject()
					.toContainEntries([
						['login', simpleUser.login],
						['email', simpleUser.email],
					]);
			} catch (err: any) {
				throw new Error(err);
			}
		});
	});

	describe('get user', () => {
		let context: Context<UserGetParams, UserAuthMeta>;
		beforeEach(() => {
			context = new Context<UserGetParams, UserAuthMeta>(broker, endpoint);
			context.action = { name: `v${service.version}.user.get.id` };
		});
		it('not found', async () => {
			context.meta = { user: superAdminUser };
			context.params = { id: 'xxx' };
			try {
				await service.getUserId(context);
			} catch (err: any) {
				expect(err).toBeInstanceOf(moleculer.Errors.MoleculerClientError);
			}
		});
		it('user info', async () => {
			context.meta = { user: superAdminUser };
			context.params = { id: simpleUser._id };
			try {
				const response = await service.getUserId(context);
				expect(response)
					.toBeDefined()
					.toBeObject()
					.toContainEntries([
						['login', simpleUser.login],
						['email', simpleUser.email],
					]);
			} catch (err: any) {
				throw new Error(err);
			}
		});
	});

	describe('update user', () => {
		let context: Context<UserUpdateParams, UserAuthMeta>;
		beforeEach(() => {
			context = new Context<UserUpdateParams, UserAuthMeta>(broker, endpoint);
			context.action = { name: `v${service.version}.user.update` };
		});
		it('not found', async () => {
			context.meta = { user: superAdminUser };
			context.params = {
				id: 'xxx',
				...simpleUser,
			};
			try {
				await service.updateUser(context);
			} catch (err: any) {
				expect(err).toBeInstanceOf(moleculer.Errors.MoleculerClientError);
			}
			expect(spyBroadcast).not.toHaveBeenCalled();
		});
		it('update', async () => {
			const firstName = 'changed';
			const lastName = 'changed name';
			context.meta = { user: superAdminUser };
			context.params = {
				id: simpleUser._id,
				...simpleUser,
				firstName: firstName,
				lastName: lastName,
			};
			try {
				const response = await service.updateUser(context);
				expect(response)
					.toBeDefined()
					.toBeObject()
					.toContainEntries([
						['login', simpleUser.login],
						['email', simpleUser.email],
					]);
			} catch (err: any) {
				throw new Error(err);
			}
			calledCacheClean(spyBroadcast);
		});
	});

	describe('delete user', () => {
		let context: Context<UserDeleteParams, UserAuthMeta>;
		let mockServiceBroadcast: jest.SpyInstance;
		beforeEach(() => {
			context = new Context<UserDeleteParams, UserAuthMeta>(broker, endpoint);
			context.action = { name: `v${service.version}.user.remove` };
			mockServiceBroadcast = jest.spyOn(service.broker, 'emit');
		});
		it('not found', async () => {
			context.meta = { user: superAdminUser };
			context.params = { id: 'xxx' };
			try {
				await service.deleteUser(context);
			} catch (err: any) {
				expect(err).toBeInstanceOf(moleculer.Errors.MoleculerClientError);
			}
			expect(spyBroadcast).not.toHaveBeenCalled();
		});
		it('delete', async () => {
			context.meta = { user: superAdminUser };
			context.params = { id: adminUser._id };
			await service.deleteUser(context);
			calledCacheClean(spyBroadcast);
			expect(mockServiceBroadcast)
				.toHaveBeenCalled()
				.toHaveBeenCalledTimes(1)
				.toHaveBeenCalledWith('user.deleted', { id: adminUser._id });
			try {
				const contextUser = new Context<UserGetParams, UserAuthMeta>(broker, endpoint);
				contextUser.meta = { user: superAdminUser };
				contextUser.action = { name: `v${service.version}.user.get.id` };
				contextUser.params = { id: adminUser._id };
				// await broker.call('v${service.version}.user.get.id', { id: adminUser._id });
				await service.getUserId(contextUser);
			} catch (err: any) {
				expect(err).toBeInstanceOf(moleculer.Errors.MoleculerClientError);
			}
		});
		it('delete itself', async () => {
			context.meta = { user: superAdminUser };
			context.params = { id: superAdminUser._id };
			try {
				await service.deleteUser(context);
			} catch (err: any) {
				expect(err).toBeInstanceOf(moleculer.Errors.MoleculerClientError);
			}
			expect(spyBroadcast).not.toHaveBeenCalled();
		});
	});

	describe('list users', () => {
		let context: Context<Record<string, unknown>, UserAuthMeta>;
		beforeEach(() => {
			context = new Context<Record<string, unknown>, UserAuthMeta>(broker, endpoint);
			context.action = { name: `v${service.version}.user.list` };
		});
		it('get all users', async () => {
			try {
				const response = await service.listAllUsers(context);
				expect(response)
					.toBeDefined()
					.toBeObject()
					.toContainEntries([
						['page', 1],
						['pageSize', 10],
						['totalPages', 1],
					]);
			} catch (err: any) {
				throw new Error(err);
			}
		});
	});
});
