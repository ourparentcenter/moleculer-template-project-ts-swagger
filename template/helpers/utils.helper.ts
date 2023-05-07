import { UserJWT } from 'types';

export const updateAuthor = <T extends Record<string, any>>(
	record: T,
	mod: {
		creator?: UserJWT;
		modifier?: UserJWT;
	},
): T => {
	const { creator, modifier } = mod;
	let result = { ...record };
	creator ? (result = { ...result, createdBy: creator.id, createdDate: new Date() }) : null;
	modifier
		? (result = { ...result, lastModifiedBy: modifier.id, lastModifiedDate: new Date() })
		: null;
	return result;
};

export const removeForbiddenFields = <T extends Record<string, any>>(
	record: T,
	fields: string[] = [],
): T => {
	const result = { ...record };
	fields.forEach((field) => {
		delete result[field];
	});
	/* delete result._id;
		delete result.createdDate;
		delete result.createdBy;
		delete result.lastModifiedDate;
		delete result.lastModifiedBy; */
	return result;
};
