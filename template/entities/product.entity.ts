import { JsonObject, JsonProperty } from 'json2typescript';
import { Types } from 'mongoose';
import { Config } from '../common';

export interface IProduct {
	_id: Types.ObjectId | string | null;
	name: string;
	quantity: number;
	price: number;
}

@JsonObject('Product')
export class ProductEntity implements IProduct {
	@JsonProperty('_id', String, true)
	public _id = Config.DB_PRODUCT.dialect === 'local' ? Types.ObjectId() : null;

	@JsonProperty('name', String)
	public name = '';

	@JsonProperty('quantity', Number)
	public quantity = 0;

	@JsonProperty('price', Number)
	public price = 0;

	// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
	public getMongoEntity() {
		// eslint-disable-next-line no-underscore-dangle
		return { ...this, _id: this._id && (this._id as Types.ObjectId).toString() };
	}
}
