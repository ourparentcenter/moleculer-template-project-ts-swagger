import { Options } from '@ourparentcenter/moleculer-decorators-extended';
import { DbContextParameters, DbServiceSettings } from 'moleculer-db';
import { IUserRole } from '../entities';
import { UserLang } from './user';

export interface RoleServiceSettingsOptions extends DbServiceSettings {
	rest?: string;
	// rest?: '/v1/user';
	JWT_SECRET: string;
	fields: (keyof Required<IUserRole>)[];
	populates?: any;
}

export interface RolesServiceOptions extends Options {
	name: 'roles';
	settings: RoleServiceSettingsOptions;
}

export enum UserRoleDefault {
	SUPERADMIN = 'ROLE_SUPERADMIN',
	ADMIN = 'ROLE_ADMIN',
	APPROVER = 'ROLE_APPROVER',
	MODIFIER = 'ROLE_MODIFIER',
	USER = 'ROLE_USER',
}

export interface IUserRoleBase {
	role?: string;
	value?: string;
	langKey?: UserLang;
	active?: boolean;
}

// PARAMS
export interface UserRoleCreateParams extends IUserRoleBase {
	role: string;
	value: string;
	langKey: UserLang;
	active: boolean;
}

export interface UserRoleUpdateParams extends Partial<IUserRole> {
	id: string;
	role?: string;
	value?: string;
	langKey?: UserLang;
	active?: boolean;
	systemLocked?: boolean;
}

export interface UserRoleGetParams extends DbContextParameters {
	id: string;
}

export interface UserRoleActivateParams extends DbContextParameters {
	active: boolean;
}

export interface UserRoleDeleteParams extends DbContextParameters {
	id: string;
}

export interface UsersRoleDeleteParams extends DbContextParameters {
	userIDs: string[];
}

export enum UserRoleEvent {
	CREATED = 'roles.created',
	DELETED = 'roles.deleted',
	UPDATED = 'roles.updated',
}
export interface RolesManipulateValueParams {
	id: string;
	role?: string;
	value?: string;
	langKey?: UserLang;
	active?: boolean;
	systemLocked?: boolean;
}
export interface UserRoleEventDeletedParams {
	id: string;
}
