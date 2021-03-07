import { constants } from 'http2';

// eslint-disable-next-line no-shadow, @typescript-eslint/naming-convention
export enum userErrorMessage {
	NOT_FOUND = 'user.notfound',
	WRONG = 'user.wrong',
	NOT_ACTIVE = 'user.notactive',
	DUPLICATED_LOGIN = 'user.duplicated.login',
	DUPLICATED_EMAIL = 'user.duplicated.email',
	DELETE_ITSELF = 'user.delete.itself',
}

export const userErrorCode = {
	NOT_FOUND: constants.HTTP_STATUS_NOT_FOUND,
	WRONG: constants.HTTP_STATUS_UNPROCESSABLE_ENTITY,
	NOT_ACTIVE: constants.HTTP_STATUS_FORBIDDEN,
	DUPLICATED_LOGIN: constants.HTTP_STATUS_UNPROCESSABLE_ENTITY,
	DUPLICATED_EMAIL: constants.HTTP_STATUS_UNPROCESSABLE_ENTITY,
	DELETE_ITSELF: constants.HTTP_STATUS_UNPROCESSABLE_ENTITY,
};
