import { UserJWT, UserLang, UserRoleDefault, UserRoleUpdateParams } from '../../types';
import request from 'supertest';

export const simpleUser: UserJWT = {
	_id: '5eb71bad0e58852bae1d10c3',
	roles: [UserRoleDefault.USER],
	login: 'user',
	firstName: 'user',
	lastName: 'user',
	email: 'user@admin.com',
	langKey: UserLang.ENUS,
	active: true,
};

export const superAdminUser: UserJWT = {
	_id: '5eb71ba74676dfca3fef434f',
	roles: [UserRoleDefault.SUPERADMIN],
	login: 'superadmin',
	firstName: 'sadmin',
	lastName: 'sadmin',
	email: 'sadmin@admin.com',
	langKey: UserLang.ENUS,
	active: true,
};

export const adminUser: UserJWT = {
	_id: '5eb71bb3b3a17a2fd4f83322',
	roles: [UserRoleDefault.ADMIN],
	login: 'admin',
	firstName: 'admin',
	lastName: 'admin',
	email: 'admin@admin.com',
	langKey: UserLang.ENUS,
	active: true,
};

export const disabledUser: UserJWT = {
	_id: '5eb725a7ada22e664c83e634',
	roles: [UserRoleDefault.USER],
	login: 'disabled',
	firstName: 'user',
	lastName: 'user',
	email: 'user1@admin.com',
	langKey: UserLang.ENUS,
	active: false,
};

export const testUserRole: UserRoleUpdateParams = {
	id: '63f26703441301e9afcd6e57',
	role: 'APPROVER',
	value: 'ROLE_APPROVER',
	langKey: UserLang.ENUS,
	active: true,
	systemLocked: true,
};
export const superAdminUserRole: UserRoleUpdateParams = {
	id: '63f38c2fa7c75a13db9755d1',
	role: 'SUPERADMIN',
	value: 'ROLE_SUPERADMIN',
	langKey: UserLang.ENUS,
	active: true,
	systemLocked: true,
};

export async function getJWT(
	server: string,
	login = superAdminUser.login,
	// file deepcode ignore NoHardcodedPasswords: password in a test file
	password = '123456',
	round = 0,
): Promise<string> {
	const loginUrl = '/auth/login';
	// deepcode ignore NoHardcodedCredentials: <please specify a reason of ignoring this>
	const response = await request(server).post(loginUrl).send({ login, password });
	return response.status !== 200 && round < 2
		? (round && console.log('loop login', round), getJWT(server, login, password, round++))
		: response.header.authorization;
}
