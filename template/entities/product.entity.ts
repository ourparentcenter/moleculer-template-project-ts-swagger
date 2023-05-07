import { IProductBase } from './../types/products';
import { Any, JsonObject, JsonProperty, PropertyConvertingMode } from 'json2typescript';
import { Types } from 'mongoose';
import { ObjectIdNull } from 'types';
import { Config } from '../common';
import { DateConverter } from './converters/date.converter';

export interface IProduct extends IProductBase {
	_id: Types.ObjectId | string | null;
	createdBy?: ObjectIdNull;
	createdDate?: Date | null;
	lastModifiedBy?: ObjectIdNull;
	lastModifiedDate?: Date | null;
}

@JsonObject('Product')
export class ProductEntity implements IProduct {
	@JsonProperty('_id', String, PropertyConvertingMode.PASS_NULLABLE)
	public _id = Config.DB_PRODUCT.dialect === 'local' ? new Types.ObjectId() : null;

	@JsonProperty('name', String, PropertyConvertingMode.IGNORE_NULLABLE)
	public name = '';

	@JsonProperty('quantity', Number, PropertyConvertingMode.IGNORE_NULLABLE)
	public quantity? = 0;

	@JsonProperty('price', Number, PropertyConvertingMode.IGNORE_NULLABLE)
	public price = 0;

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
		const result: IProduct = {
			...this,
			_id: this._id && this._id.toString(),
		};

		if (!result._id) {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			delete result._id;
		}
		return result;
	}
}
