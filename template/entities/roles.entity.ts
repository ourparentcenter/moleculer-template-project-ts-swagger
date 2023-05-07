/* eslint-disable no-underscore-dangle */
import { Any, JsonObject, JsonProperty, PropertyConvertingMode } from 'json2typescript';
import { Types } from 'mongoose';
import { IUserRoleBase, ObjectId, ObjectIdNull, UserLang } from '../types';
import { Config } from '../common';
import { DateConverter } from './converters/date.converter';
import { UserLangConverter } from './converters/user/user-lang.converter';

export interface IUserRole extends IUserRoleBase {
	_id: ObjectIdNull;
	createdBy?: ObjectIdNull;
	createdDate?: Date | null;
	lastModifiedBy?: ObjectIdNull;
	lastModifiedDate?: Date | null;
	systemLocked?: boolean;
}

@JsonObject('Roles')
export class RolesEntity implements IUserRole {
	@JsonProperty('_id', String, PropertyConvertingMode.PASS_NULLABLE)
	public _id = Config.DB_ROLES.dialect === 'local' ? new Types.ObjectId() : null;

	@JsonProperty('role', String, PropertyConvertingMode.IGNORE_NULLABLE)
	public role? = '';

	@JsonProperty('value', String, PropertyConvertingMode.IGNORE_NULLABLE)
	public value? = '';

	@JsonProperty('langKey', UserLangConverter, PropertyConvertingMode.IGNORE_NULLABLE)
	public langKey? = UserLang.ENUS;

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

	@JsonProperty('systemLocked', Boolean, PropertyConvertingMode.IGNORE_NULLABLE)
	public systemLocked? = false;

	// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
	public getMongoEntity() {
		// eslint-disable-next-line no-underscore-dangle
		const result: IUserRole = {
			...this,
			_id: this._id && this._id.toString(),
		};
		// eslint-disable-next-line no-underscore-dangle
		if (!result._id) {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			delete result._id;
		}
		return result;
	}
}
