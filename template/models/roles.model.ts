import { model, models, Schema, Types } from 'mongoose';
import { definitionType, UserLang, IUserRole } from '../types';

const definition: definitionType<IUserRole> = (collection?: string) => ({
	_id: Types.ObjectId,
	role: {
		type: String,
		max: 50,
		unique: true,
		required: true,
		index: true,
	},
	value: {
		type: String,
		max: 100,
		required: true,
	},
	active: {
		type: Boolean,
		default: false,
	},
	langKey: {
		type: String,
		enum: Object.values(UserLang),
		default: 'en-us',
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
	systemLocked: {
		type: Boolean,
		default: false,
	},
});

export const rolesMongoModel = (collection: string): unknown => {
	try {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const schema = new Schema<IUserRole>(definition(collection), { autoIndex: true });
		return models[collection] || model(collection, schema);
	} catch (err) {
		console.log('Role Model error: ', err);
		return;
	}
};
