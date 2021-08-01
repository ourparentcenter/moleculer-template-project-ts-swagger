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
		required: true,
		min: 0,
	},
	price: {
		type: Number,
		required: true,
	},
});

export const productMongoModel = (collection: string): unknown => {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	const schema = new Schema<IProduct>(definition(), { autoIndex: true });
	return models[collection] || model(collection, schema);
};
