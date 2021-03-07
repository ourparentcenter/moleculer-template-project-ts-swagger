import { Options } from 'moleculer-decorators-extended';
import { DbContextParameters, DbServiceSettings } from 'moleculer-db';
import { IUser } from '../entities';
import { ApiGatewayMeta } from './interfaces';

export interface UserServiceSettingsOptions extends DbServiceSettings {
	rest: '/v1/user';
	JWT_SECRET: string;
	fields: (keyof Required<IUser>)[];
	populates?: any;
}

export interface UsersServiceOptions extends Options {
	name: 'user';
	settings: UserServiceSettingsOptions;
}

export enum UserRole {
	SUPERADMIN = 'ROLE_SUPERADMIN',
	ADMIN = 'ROLE_ADMIN',
	APPROVER = 'ROLE_APPROVER',
	MODIFIER = 'ROLE_MODIFIER',
	USER = 'ROLE_USER',
}

export enum UserLang {
	ES = 'es',
	CA = 'ca',
	EN = 'en',
	IT = 'it',
	FR = 'fr',
}

export interface IUserBase {
	login: string;
	firstName: string;
	lastName?: string;
	email: string;
	langKey?: UserLang;
	roles: UserRole[];
	active?: boolean;
}

export interface UserJWT extends IUserBase {
	_id: string;
}

// PARAMS
export interface UserCreateParams extends IUserBase {
	password: string;
}

export interface UserLoginParams {
	login: string;
	password: string;
}

export interface UserTokenParams {
	token: string;
}

export interface UserRolesParams {
	roles: UserRole[];
}

export interface UserUpdateParams extends Partial<IUser> {
	id: string;
	password?: string;
}

export interface UserGetParams extends DbContextParameters {
	id: string;
}

export interface UserDeleteParams extends DbContextParameters {
	id: string;
}

// META
export interface UserAuthMeta extends ApiGatewayMeta {
	user: UserJWT;
}

export type UserLoginMeta = ApiGatewayMeta;

export enum UserEvent {
	DELETED = 'user.deleted',
}

export interface UserEventDeletedParams {
	id: string;
}
