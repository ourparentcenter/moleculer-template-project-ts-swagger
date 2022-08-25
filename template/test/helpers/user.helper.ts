import { UserJWT, UserLang, UserRole } from '../../types';
import request from 'supertest';

export const simpleUser: UserJWT = {
	_id: '5eb71bad0e58852bae1d10c3',
	roles: [UserRole.USER],
	login: 'user',
	firstName: 'user',
	lastName: 'user',
	email: 'user@admin.com',
	langKey: UserLang.ES,
	active: true,
};

export const superAdminUser: UserJWT = {
	_id: '5eb71ba74676dfca3fef434f',
	roles: [UserRole.SUPERADMIN],
	login: 'superadmin',
	firstName: 'sadmin',
	lastName: 'sadmin',
	email: 'sadmin@admin.com',
	langKey: UserLang.ES,
	active: true,
};

export const adminUser: UserJWT = {
	_id: '5eb71bb3b3a17a2fd4f83322',
	roles: [UserRole.ADMIN],
	login: 'admin',
	firstName: 'admin',
	lastName: 'admin',
	email: 'admin@admin.com',
	langKey: UserLang.ES,
	active: true,
};

export const disabledUser: UserJWT = {
	_id: '5eb725a7ada22e664c83e634',
	roles: [UserRole.USER],
	login: 'disabled',
	firstName: 'user',
	lastName: 'user',
	email: 'user1@admin.com',
	langKey: UserLang.ES,
	active: false,
};

export async function getJWT(
	server: string,
	login = superAdminUser.login,
	password = '123456',
	round = 0,
): Promise<string> {
	const loginUrl = '/auth/login';
	const response = await request(server).post(loginUrl).send({ login, password });
	if (response.status !== 200 && round < 2) {
		round && console.log('loop login', round);
		return getJWT(server, login, password, round++);
	} else {
		return response.header.authorization;
	}
}
