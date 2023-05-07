import { constants } from 'http2';

// eslint-disable-next-line no-shadow, @typescript-eslint/naming-convention
export enum userErrorMessage {
	NOT_FOUND = 'user.notfound',
	WRONG = 'user.wrong',
	NOT_ACTIVE = 'user.notactive',
	DUPLICATED_LOGIN = 'user.duplicated.login',
	DUPLICATED_EMAIL = 'user.duplicated.email',
	DELETE_ITSELF = 'user.delete.itself',
	INVALID_TOKEN = 'user.invalid.token',
	DELETE_ERROR = 'user.delete.error',
}

export enum productErrorMessage {
	NOT_FOUND = 'product.notfound',
	NOT_ACTIVE = 'product.notactive',
	DUPLICATED_NAME = 'product.duplicated.name',
	UPDATE_FAILED = 'product.update.failed',
	PRODUCT_NOT_CREATED = 'product.not.created',
	COULD_NOT_ACTIVATE = 'product.could.not.activate',
	DELETE_FAILED = 'product.delete.failed',
}

export enum roleErrorMessage {
	NOT_FOUND = 'role.notfound',
	WRONG = 'role.wrong',
	NOT_ACTIVE = 'role.notactive',
	DUPLICATED_ROLE = 'role.duplicated.name',
	DUPLICATED_VALUE = 'role.duplicated.value',
	DELETE_SYSTEMLOCKED = 'role.delete.systemLocked',
	DELETE_ITSELF = 'role.delete.used',
	UPDATE_FAILED = 'role.update.failed',
	ROLE_NOT_CREATED = 'role.not.created',
	COULD_NOT_ACTIVATE = 'role.could.not.activate',
	DELETE_FAILED = 'role.delete.failed',
}

export const userErrorCode = {
	NOT_FOUND: constants.HTTP_STATUS_NOT_FOUND,
	WRONG: constants.HTTP_STATUS_UNPROCESSABLE_ENTITY,
	NOT_ACTIVE: constants.HTTP_STATUS_FORBIDDEN,
	DUPLICATED_LOGIN: constants.HTTP_STATUS_UNPROCESSABLE_ENTITY,
	DUPLICATED_EMAIL: constants.HTTP_STATUS_UNPROCESSABLE_ENTITY,
	DELETE_ITSELF: constants.HTTP_STATUS_UNPROCESSABLE_ENTITY,
	INVALID_TOKEN: constants.HTTP_STATUS_UNPROCESSABLE_ENTITY,
	DELETE_ERROR: constants.HTTP_STATUS_UNPROCESSABLE_ENTITY,
};

export const roleErrorCode = {
	NOT_FOUND: constants.HTTP_STATUS_NOT_FOUND,
	WRONG: constants.HTTP_STATUS_UNPROCESSABLE_ENTITY,
	NOT_ACTIVE: constants.HTTP_STATUS_FORBIDDEN,
	DUPLICATED_ROLE: constants.HTTP_STATUS_UNPROCESSABLE_ENTITY,
	DUPLICATED_VALUE: constants.HTTP_STATUS_UNPROCESSABLE_ENTITY,
	DELETE_SYSTEMLOCKED: constants.HTTP_STATUS_UNPROCESSABLE_ENTITY,
	DELETE_ITSELF: constants.HTTP_STATUS_UNPROCESSABLE_ENTITY,
	UPDATE_FAILED: constants.HTTP_STATUS_UNPROCESSABLE_ENTITY,
	ROLE_NOT_CREATED: constants.HTTP_STATUS_UNPROCESSABLE_ENTITY,
	COULD_NOT_ACTIVATE: constants.HTTP_STATUS_UNPROCESSABLE_ENTITY,
	DELETE_FAILED: constants.HTTP_STATUS_UNPROCESSABLE_ENTITY,
};

export const productErrorCode = {
	NOT_FOUND: constants.HTTP_STATUS_NOT_FOUND,
	WRONG: constants.HTTP_STATUS_UNPROCESSABLE_ENTITY,
	NOT_ACTIVE: constants.HTTP_STATUS_FORBIDDEN,
	DUPLICATED_NAME: constants.HTTP_STATUS_UNPROCESSABLE_ENTITY,
	UPDATE_FAILED: constants.HTTP_STATUS_UNPROCESSABLE_ENTITY,
	PRODUCT_NOT_CREATED: constants.HTTP_STATUS_UNPROCESSABLE_ENTITY,
	COULD_NOT_ACTIVATE: constants.HTTP_STATUS_UNPROCESSABLE_ENTITY,
	DELETE_FAILED: constants.HTTP_STATUS_UNPROCESSABLE_ENTITY,
};
