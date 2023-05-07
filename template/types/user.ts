import { Options } from '@ourparentcenter/moleculer-decorators-extended';
import { DbContextParameters, DbServiceSettings } from 'moleculer-db';
import { IUser } from '../entities';
import { ApiGatewayMeta } from './interfaces';
import { UserRoleDefault } from './roles';

export interface UserServiceSettingsOptions extends DbServiceSettings {
	rest?: string;
	// rest?: '/v1/user';
	JWT_SECRET: string;
	fields: (keyof Required<IUser>)[];
	populates?: any;
}

export interface UsersServiceOptions extends Options {
	name: 'user';
	settings: UserServiceSettingsOptions;
}

export enum UserLang {
	ES = 'es',
	CA = 'ca',
	ENUS = 'en-us',
	IT = 'it',
	FR = 'fr',
}

export interface IUserBase {
	login?: string;
	firstName?: string;
	lastName?: string;
	email?: string;
	langKey?: UserLang;
	roles?: UserRoleDefault[];
	active?: boolean;
}

export interface UserJWT extends IUserBase {
	// _id: string;
	id: string;
}

// PARAMS
export interface UserCreateParams extends IUserBase {
	password: string;
	requireRegToken?: boolean;
}

export interface UserLoginParams {
	login: string;
	password: string;
}

export interface UserTokenParams {
	token: string;
}

export interface UserRolesParams {
	roles: UserRoleDefault[];
}

export interface UserUpdateParams extends Partial<IUser> {
	id: string;
	password?: string;
}

export interface UserGetParams extends DbContextParameters {
	id: string;
}

export interface UserActivateParams extends DbContextParameters {
	verificationToken: string;
}

export interface UserDeleteParams extends DbContextParameters {
	id?: string;
}

export interface UsersDeleteParams extends DbContextParameters {
	userIDs: string[];
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
