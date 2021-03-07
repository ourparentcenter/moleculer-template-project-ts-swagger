/* eslint-disable no-underscore-dangle */
import { Any, JsonObject, JsonProperty } from 'json2typescript';
import { Types } from 'mongoose';
import { IUserBase, ObjectId, ObjectIdNull, UserLang, UserRole } from '../types';
import { Config } from '../common';
import { DateConverter } from './converters/date.converter';
import { UserRoleConverter } from './converters/user/user-role.converter';
import { UserLangConverter } from './converters/user/user-lang.converter';

export interface IUser extends IUserBase {
	_id: ObjectIdNull;
	password: string;
	createdBy: ObjectId;
	createdDate: Date | null;
	lastModifiedBy?: ObjectIdNull;
	lastModifiedDate?: Date | null;
}

@JsonObject('User')
export class UserEntity implements IUser {
	@JsonProperty('_id', String, true)
	public _id = Config.DB_USER.dialect === 'local' ? Types.ObjectId() : null;

	@JsonProperty('login', String)
	public login = '';

	@JsonProperty('password', String, true)
	public password = '';

	@JsonProperty('firstName', String)
	public firstName = '';

	@JsonProperty('lastName', String, true)
	public lastName = '';

	@JsonProperty('email', String)
	public email = '';

	@JsonProperty('langKey', UserLangConverter, true)
	public langKey? = UserLang.ES;

	@JsonProperty('roles', UserRoleConverter)
	public roles = [UserRole.USER];

	@JsonProperty('active', Boolean, true)
	public active? = false;

	@JsonProperty('createdBy', Any, true)
	public createdBy = '';

	@JsonProperty('createdDate', DateConverter, true)
	public createdDate = null;

	@JsonProperty('lastModifiedBy', Any, true)
	public lastModifiedBy? = null;

	@JsonProperty('lastModifiedDate', DateConverter, true)
	public lastModifiedDate? = null;

	// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
	public getMongoEntity() {
		// eslint-disable-next-line no-underscore-dangle
		const result: IUser = { ...this, _id: this._id && (this._id as Types.ObjectId).toString() };
		// eslint-disable-next-line no-underscore-dangle
		if (!result._id) {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			delete result._id;
		}
		return result;
	}
}
