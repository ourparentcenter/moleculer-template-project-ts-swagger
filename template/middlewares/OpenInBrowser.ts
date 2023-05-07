import open from 'open';
import { Config } from '../common';

export const OpenInBrowserMiddleware = async (broker: any) => {
	if (process.env.NODE_ENV == 'development') {
		broker.logger.debug(`Opening browser to app url: ${Config.BASE_URL}:${Config.PORT}`);
		await open(`${Config.BASE_URL}:${Config.PORT}`);
	}
};
