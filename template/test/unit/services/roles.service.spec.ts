import moleculer, { Context, Endpoint, ServiceBroker } from 'moleculer';
import TestingService from '../../../services/rolesService';
import UserService from '../../../services/userService';
import AuthService from '../../../services/authService';
import {
	IUser,
	IUserBase,
	IUserRole,
	IUserRoleBase,
	UserAuthMeta,
	UserCreateParams,
	UserDeleteParams,
	UserGetParams,
	UserJWT,
	UserLang,
	UserLoginMeta,
	UserLoginParams,
	UserRoleDefault,
	UserRolesParams,
	UserTokenParams,
	UserRoleUpdateParams,
	UserRoleGetParams,
	UserRoleCreateParams,
	UserRoleDeleteParams,
} from '../../../types';
import {
	adminUser,
	disabledUser,
	simpleUser,
	superAdminUser,
	superAdminUserRole,
	testUserRole,
} from '../../helpers/user.helper';
import { clearDB, randString, testConfig, wait } from '../../helpers/helper';
import { Config } from '../../../common';
import 'jest-extended';
import 'jest-chain';
const JEST_TIMEOUT = 55 * 1000;
jest.setTimeout(JEST_TIMEOUT);

function calledCacheClean(mockFn: jest.SpyInstance) {
	expect(mockFn)
		.toHaveBeenCalled()
		.toHaveBeenCalledTimes(1)
		.toHaveBeenCalledWith(
			`cache.clean.${Config.DB_ROLES.dbname}.${Config.DB_ROLES.collection}`,
		);
}

describe('Unit tests for Roles service', () => {
	let broker: ServiceBroker;
	let endpoint: Endpoint;
	let userService: any;
	let authService: any;
	let roleService: any;
	const spyBroadcast = jest.spyOn(Context.prototype, 'broadcast');

	beforeAll(async () => {
		await wait(1);
		/* await clearDB(Config.DB_ROLES);
		await clearDB(Config.DB_USER); */
		broker = new ServiceBroker(testConfig);
		// broker = new ServiceBroker();
		endpoint = {
			broker,
			id: Math.random().toString(36).slice(2),
			local: true,
			node: {},
			state: true,
		};
		authService = broker.createService(AuthService);
		userService = broker.createService(UserService);
		roleService = broker.createService(TestingService);
		// version = `vv${service.version}`;

		await broker.start();
		await broker.waitForServices([
			`v${userService.version}.${userService.name}`,
			`v${authService.version}.${authService.name}`,
			`v${roleService.version}.${roleService.name}`,
		]);
	});
	afterEach(() => {
		jest.clearAllMocks();
		spyBroadcast.mockClear();
	});
	afterAll(async () => {
		await broker.stop();
		await clearDB(Config.DB_ROLES);
		await clearDB(Config.DB_USER);
	});

	beforeEach(() => expect.hasAssertions());

	describe('create role', () => {
		let role: IUserRoleBase;
		let context: Context<UserRoleCreateParams, UserAuthMeta>;
		beforeEach(() => {
			const str = randString();
			role = {
				role: `role-${str}`,
				value: `${str}-value`,
				langKey: UserLang.ENUS,
				active: true,
			};
			context = new Context<UserRoleCreateParams, UserAuthMeta>(broker, endpoint);
			context.action = { name: `v${roleService.version}.role.create` };
		});
		it('create role with wrong data', async () => {
			context.params = {} as UserRoleCreateParams;
			try {
				await roleService.createRole(context);
			} catch (err: any) {
				expect(err).toBeInstanceOf(Error);
			}
			expect(spyBroadcast).not.toHaveBeenCalled();
		});
		it('create role', async () => {
			context.params = { ...(role as UserRoleCreateParams) };
			context.meta = { user: superAdminUser };
			try {
				const response = await roleService.createRole(context);
				expect(response)
					.toBeDefined()
					.toBeObject()
					.toContainEntries([
						['role', role.role],
						['value', role.value],
						['langKey', role.langKey],
						['active', role.active],
						['systemLocked', false],
					]);
			} catch (err: any) {
				throw new Error(err);
			}
			calledCacheClean(spyBroadcast);
		});
		it('create existing role', async () => {
			context.meta = { user: superAdminUser };
			const newRole = { ...testUserRole };
			// @ts-ignore
			delete newRole.id;
			context.params = {
				...(newRole as UserRoleCreateParams),
			};
			try {
				await roleService.createRole(context);
			} catch (err: any) {
				expect(err).toBeInstanceOf(moleculer.Errors.MoleculerClientError);
			}
			expect(spyBroadcast).not.toHaveBeenCalled();
		});
	});

	describe('get role', () => {
		let context: Context<UserGetParams, UserAuthMeta>;
		beforeEach(() => {
			context = new Context<UserRoleGetParams, UserAuthMeta>(broker, endpoint);
			context.action = { name: `v${roleService.version}.role.id` };
		});
		it('not found', async () => {
			context.meta = { user: superAdminUser };
			context.params = { id: 'xxx' };
			try {
				await roleService.getRoleById(context);
			} catch (err: any) {
				expect(err).toBeInstanceOf(moleculer.Errors.MoleculerClientError);
			}
		});
		it('found role', async () => {
			context.meta = { user: superAdminUser };
			context.params = { id: testUserRole.id };
			try {
				const response = await roleService.getRoleById(context);
				expect(response)
					.toBeDefined()
					.toBeObject()
					.toContainEntries([
						['role', testUserRole.role],
						['value', testUserRole.value],
					]);
			} catch (err: any) {
				throw new Error(err);
			}
		});
	});

	describe('update role', () => {
		let context: Context<UserRoleUpdateParams, UserAuthMeta>;
		beforeEach(() => {
			context = new Context<UserRoleUpdateParams, UserAuthMeta>(broker, endpoint);
			context.action = { name: `v${roleService.version}.role.update` };
		});
		it('not found', async () => {
			context.meta = { user: superAdminUser };
			context.params = {
				...testUserRole,
				id: 'xxx',
			};
			try {
				await roleService.updateRole(context);
			} catch (err: any) {
				expect(err).toBeInstanceOf(moleculer.Errors.MoleculerClientError);
			}
			expect(spyBroadcast).not.toHaveBeenCalled();
		});
		it('update', async () => {
			const role = 'changed';
			const value = 'changed value';
			context.meta = { user: superAdminUser };
			context.params = {
				id: testUserRole.id,
				role: role,
				value: value,
			};
			const response = await roleService.updateRole(context);
			expect(response)
				.toBeDefined()
				.toBeObject()
				.toContainEntries([
					['role', role],
					['value', value],
					// ['lastModifiedBy.login', superAdminUser.login],
					// ['lastModifiedBy.firstName', superAdminUser.firstName],
					// ['lastModifiedBy.lastName', superAdminUser.lastName],
				]);
			// calledCacheClean(spyBroadcast);
		});
	});

	describe('delete role', () => {
		let context: Context<UserRoleDeleteParams, UserAuthMeta>;
		let mockServiceBroadcast: jest.SpyInstance;
		beforeEach(() => {
			context = new Context<UserRoleDeleteParams, UserAuthMeta>(broker, endpoint);
			context.action = { name: `v${roleService.version}.role.removeRole` };
			mockServiceBroadcast = jest.spyOn(roleService.broker, 'emit');
		});
		it('not found', async () => {
			context.meta = { user: superAdminUser };
			context.params = { id: 'xxx' };
			try {
				await roleService.removeRole(context);
			} catch (err: any) {
				expect(err).toBeInstanceOf(moleculer.Errors.MoleculerClientError);
			}
			expect(spyBroadcast).not.toHaveBeenCalled();
		});
		it('delete', async () => {
			context.meta = { user: superAdminUser };
			context.params = { id: testUserRole.id };
			await roleService.removeRole(context);
			calledCacheClean(spyBroadcast);
			expect(mockServiceBroadcast)
				.toHaveBeenCalled()
				.toHaveBeenCalledTimes(1)
				.toHaveBeenCalledWith('roles.deleted', { id: testUserRole.id });
			try {
				const contextRole = new Context<UserRoleGetParams, UserAuthMeta>(broker, endpoint);
				contextRole.meta = { user: superAdminUser };
				contextRole.action = { name: `v${roleService.version}.role.id` };
				contextRole.params = { id: testUserRole.id };
				// await broker.call('v${service.version}.user.get.id', { id: adminUser._id });
				await roleService.getRoleById(contextRole);
			} catch (err: any) {
				expect(err).toBeInstanceOf(moleculer.Errors.MoleculerClientError);
			}
		});
		it('delete role applied to self', async () => {
			context.meta = { user: superAdminUser };
			context.params = { id: superAdminUserRole.id };
			try {
				await roleService.removeRole(context);
			} catch (err: any) {
				expect(err).toBeInstanceOf(moleculer.Errors.MoleculerClientError);
			}
			expect(spyBroadcast).not.toHaveBeenCalled();
		});
	});

	describe('list roles', () => {
		let context: Context<Record<string, unknown>, UserAuthMeta>;
		beforeEach(() => {
			context = new Context<Record<string, unknown>, UserAuthMeta>(broker, endpoint);
			context.action = { name: `v${roleService.version}.role.list` };
		});
		it('get all roles', async () => {
			try {
				const response = await roleService.listAllUserRoles(context);
				expect(response)
					.toBeDefined()
					.toBeObject()
					.toContainEntries([
						['page', 1],
						['pageSize', 10],
						['totalPages', 1],
						['total', 5],
					]);
			} catch (err: any) {
				throw new Error(err);
			}
		});
	});
});
