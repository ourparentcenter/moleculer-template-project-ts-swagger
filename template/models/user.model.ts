import { model, models, Schema, Types } from 'mongoose';
import { definitionType, IUser, UserLang, UserRole } from '../types';

const definition: definitionType<IUser> = (collection?: string) => ({
	_id: Types.ObjectId,
	login: {
		type: String,
		max: 50,
		unique: true,
		required: true,
		index: true,
	},
	password: {
		type: String,
		max: 100,
		required: true,
	},
	roles: {
		type: [String],
		enum: Object.values(UserRole),
		required: true,
		default: [UserRole.USER.toString()],
	},
	firstName: {
		type: String,
		max: 50,
		required: true,
		index: true,
	},
	lastName: {
		type: String,
		max: 50,
		required: false,
	},
	email: {
		type: String,
		max: 100,
		required: true,
		unique: true,
		index: true,
	},
	active: {
		type: Boolean,
		default: false,
	},
	langKey: {
		type: String,
		enum: Object.values(UserLang),
		default: 'es',
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
});

export const userMongoModel = (collection: string): unknown => {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	const schema = new Schema<IUser>(definition(collection), { autoIndex: true });
	return models[collection] || model(collection, schema);
};
