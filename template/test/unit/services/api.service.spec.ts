import { Context, Endpoint, ServiceBroker } from 'moleculer';
import ApiGatewayService from 'moleculer-web';
import TestingService from '../../../services/apiService/api.service';
import { UserAuthMeta, UserLang, UserRole } from '../../../types';
import { UserEntity } from '../../../entities';
import { testConfig } from '../../helpers/helper';
import 'jest-extended';
import 'jest-chain';
const JEST_TIMEOUT = 35 * 1000;
jest.setTimeout(JEST_TIMEOUT);

describe('Unit tests for Api service', () => {
	const broker = new ServiceBroker(testConfig);
	const service = broker.createService(TestingService) as TestingService;
	const endpoint: Endpoint = {
		broker,
		id: Math.random().toString(36).slice(2),
		local: true,
		node: {},
		state: true,
	};
	beforeAll(async () => {
		await broker.start();
		await broker.waitForServices(service.name);
	});
	afterAll(() => {
		broker.stop();
	});

	const originalCall = Context.prototype.call;
	beforeEach(() => {
		Context.prototype.call = originalCall;
	});

	describe('authenticate', () => {
		let mockRequest: any;
		let context: Context<Record<string, unknown>, UserAuthMeta>;

		beforeEach(() => {
			mockRequest = {
				headers: {},
				$action: {},
			};
			context = new Context<Record<string, unknown>, UserAuthMeta>(broker, endpoint);
		});

		it('without headers', async () => {
			try {
				await service.authenticate(context, undefined, mockRequest);
			} catch (err) {
				expect(err).toBeInstanceOf(ApiGatewayService.Errors.UnAuthorizedError);
			}
		});
		it('with headers with wrong token', (done) => {
			expect.assertions(1);
			mockRequest = {
				...mockRequest,
				headers: {
					authorization: 'WrongToken_header',
				},
			};
			service.authenticate(context, undefined, mockRequest).catch((err) => {
				expect(err).toBeInstanceOf(ApiGatewayService.Errors.UnAuthorizedError);
				done();
			});
		});
		it('with headers with bearer token', async () => {
			const call = jest.fn().mockResolvedValue({ ...new UserEntity(), active: true });
			Context.prototype.call = call;
			const token = 'any_jwt_token';
			mockRequest = {
				...mockRequest,
				headers: {
					authorization: `Bearer ${token}`,
				},
			};
			await service.authenticate(context, undefined, mockRequest);
			expect(call)
				.toBeCalled()
				.toBeCalledTimes(1)
				.toBeCalledWith(expect.any(String), { token });
		});
		it('with headers with wrong bearer token', (done) => {
			expect.assertions(1);
			Context.prototype.call = jest.fn().mockResolvedValue(null);
			const token = 'any_jwt_token';
			mockRequest = {
				...mockRequest,
				headers: {
					authorization: `Bearer ${token}`,
				},
			};
			service.authenticate(context, undefined, mockRequest).catch((err) => {
				expect(err).toBeInstanceOf(ApiGatewayService.Errors.UnAuthorizedError);
				done();
			});
		});
		it('with headers with malformed bearer token', () => {
			Context.prototype.call = jest.fn().mockRejectedValue(new Error());
			const token = 'any_jwt_token';
			mockRequest = {
				...mockRequest,
				headers: {
					authorization: `Bearer ${token}`,
				},
			};
			expect(service.authenticate(context, undefined, mockRequest)).rejects.toBeDefined();
		});
	});

	describe('authorize', () => {
		let mockRequest: any;
		let context: Context<Record<string, unknown>, UserAuthMeta>;
		const user = {
			_id: '1234',
			roles: [UserRole.USER],
			login: 'mock',
			firstName: 'mock',
			lastName: 'mock',
			email: 'mock@mock.com',
			langKey: UserLang.ES,
		};

		beforeEach(() => {
			mockRequest = {
				headers: {},
				$action: {},
				$route: {},
			};
			context = new Context<Record<string, unknown>, UserAuthMeta>(broker, endpoint);
		});

		beforeEach(() => expect.hasAssertions());

		it('without auth', async () => {
			try {
				await service.authorize(context, undefined, mockRequest);
			} catch (err) {
				expect(err).toBeInstanceOf(ApiGatewayService.Errors.UnAuthorizedError);
			}
		});
		it('with auth false', async () => {
			mockRequest.$action.auth = false;
			try {
				const response = await service.authorize(context, undefined, mockRequest);
				expect(response).toBeNull();
			} catch (err) {
				fail(err);
			}
		});
		it('with auth and without user', async () => {
			mockRequest.$action.auth = true;
			try {
				await service.authorize(context, undefined, mockRequest);
			} catch (err) {
				expect(err).toBeInstanceOf(ApiGatewayService.Errors.UnAuthorizedError);
			}
		});
		it('with auth and with user', async () => {
			Context.prototype.call = jest.fn().mockResolvedValue(true);
			mockRequest.$action.auth = true;
			mockRequest.$action.roles = [];
			mockRequest.$route.opts = { roles: [] };
			context.meta.user = user;
			try {
				const response = await service.authorize(context, undefined, mockRequest);
				expect(response).toBeObject().toContainEntry(['meta', { user }]);
			} catch (err) {
				fail(err);
			}
		});
		it('with auth and with user and wrong response', async () => {
			Context.prototype.call = jest.fn().mockResolvedValue(false);
			mockRequest.$action.auth = true;
			mockRequest.$action.roles = [];
			mockRequest.$route.opts = { roles: [] };
			context.meta.user = user;
			try {
				await service.authorize(context, undefined, mockRequest);
			} catch (err) {
				expect(err).toBeInstanceOf(ApiGatewayService.Errors.UnAuthorizedError);
			}
		});
	});
});
