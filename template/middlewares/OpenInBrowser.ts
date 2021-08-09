import open from 'open';
import { Config } from '../common';

const OpenInBrowserMiddleware = async (broker: any) => {
	if ((process.env.NODE_ENV = 'development')) {
		broker.logger.info(`Opening browser to app url: ${Config.BASE_URL}:${Config.PORT}`);
		await open(`${Config.BASE_URL}:${Config.PORT}`);
	}
};
export default OpenInBrowserMiddleware;
