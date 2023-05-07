import { model, models, Schema, Types } from 'mongoose';
import { definitionType, IProduct } from '../types';

const definition: definitionType<IProduct> = () => ({
	_id: Types.ObjectId,
	name: {
		type: String,
		max: 50,
		min: 3,
		unique: true,
		required: true,
		index: true,
	},
	quantity: {
		type: Number,
		min: 0,
	},
	price: {
		type: Number,
	},
	active: {
		type: Boolean,
		default: false,
	},
	createdBy: {
		type: Types.ObjectId,
		ref: collection,
		required: true,
	},
	createdDate: {
		type: Date,
		default: Date.now,
	},
	lastModifiedBy: {
		type: Types.ObjectId,
		ref: collection,
		required: false,
	},
	lastModifiedDate: {
		type: Date,
		required: false,
	},
	deletedDate: {
		type: Date,
		required: false,
	},
});

export const productMongoModel = (collection: string): unknown => {
	try {// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const schema = new Schema<IProduct>(definition(), { autoIndex: true });
		return models[collection] || model(collection, schema);
	} catch (err) {
		console.log('Product Model error: ', err);
		return;
	}

};
