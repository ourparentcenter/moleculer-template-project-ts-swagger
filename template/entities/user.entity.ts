/* eslint-disable no-underscore-dangle */
import { Any, JsonObject, JsonProperty, PropertyConvertingMode } from 'json2typescript';
import { Types } from 'mongoose';
import { IUserBase, ObjectId, ObjectIdNull, UserLang, UserRole } from '../types';
import { Config } from '../common';
import { DateConverter } from './converters/date.converter';
import { UserRoleConverter } from './converters/user/user-role.converter';
import { UserLangConverter } from './converters/user/user-lang.converter';

export interface IUser extends IUserBase {
	_id: ObjectIdNull;
	password?: string;
	verificationToken?: string;
	createdBy?: ObjectIdNull;
	createdDate?: Date | null;
	lastModifiedBy?: ObjectIdNull;
	lastModifiedDate?: Date | null;
}

@JsonObject('User')
export class UserEntity implements IUser {
	@JsonProperty('_id', String, PropertyConvertingMode.PASS_NULLABLE)
	public _id = Config.DB_USER.dialect === 'local' ? new Types.ObjectId() : null;

	@JsonProperty('login', String, PropertyConvertingMode.IGNORE_NULLABLE)
	public login? = '';

	@JsonProperty('password', String, PropertyConvertingMode.IGNORE_NULLABLE)
	public password? = '';

	@JsonProperty('firstName', String, PropertyConvertingMode.IGNORE_NULLABLE)
	public firstName? = '';

	@JsonProperty('lastName', String, PropertyConvertingMode.IGNORE_NULLABLE)
	public lastName? = '';

	@JsonProperty('email', String, PropertyConvertingMode.IGNORE_NULLABLE)
	public email? = '';

	@JsonProperty('langKey', UserLangConverter, PropertyConvertingMode.IGNORE_NULLABLE)
	public langKey? = UserLang.ES;

	@JsonProperty('roles', UserRoleConverter, PropertyConvertingMode.IGNORE_NULLABLE)
	public roles? = [UserRole.USER];

	@JsonProperty('verificationToken', PropertyConvertingMode.PASS_NULLABLE)
	public verificationToken?: string;

	@JsonProperty('active', Boolean, PropertyConvertingMode.IGNORE_NULLABLE)
	public active? = false;

	@JsonProperty('createdBy', Any, PropertyConvertingMode.PASS_NULLABLE)
	public createdBy? = null;

	@JsonProperty('createdDate', DateConverter, PropertyConvertingMode.PASS_NULLABLE)
	public createdDate? = null;

	@JsonProperty('lastModifiedBy', Any, PropertyConvertingMode.PASS_NULLABLE)
	public lastModifiedBy? = null;

	@JsonProperty('lastModifiedDate', DateConverter, PropertyConvertingMode.PASS_NULLABLE)
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
