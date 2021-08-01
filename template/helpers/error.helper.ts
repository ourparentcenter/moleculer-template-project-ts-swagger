import pick from 'lodash/pick';
import { Context } from 'moleculer';

const errorHandler = (
	info: Context<Record<string, never>>,
	message?: string,
	err?: unknown,
): void => {
	const context = pick(
		info,
		'nodeID',
		'id',
		'event',
		'eventName',
		'eventType',
		'eventGroups',
		'parentID',
		'requestID',
		'options.parentCtx.action.name',
		'options.parentCtx.action.rest',
		'caller',
		'params.services',
		// 'meta',
		'locals',
	);
	const action = pick(info.action, 'rawName', 'name', 'params.services', 'rest');
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	info.service.logger.error(
		'errorHandler:',
		message,
		'\n\n--- CONTEXT ---\n',
		context,
		'\n\n--- ACTION ---\n',
		action,
		'\n\n --- END ---\n',
		err,
	);
};
export default errorHandler;
