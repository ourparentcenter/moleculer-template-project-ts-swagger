import * as swStats from 'swagger-stats';
import swaggerSpec from '../../swagger.json';

const promClient = swStats.getPromClient();
const tlBucket = 60000;
const swMiddleware = swStats.getMiddleware({
	name: 'swagger-stats',
	timelineBucketDuration: tlBucket,
	uriPath: '/dashboard',
	swaggerSpec: swaggerSpec,
});

// clears the promclient registry
const clearPrometheusMetrics = promClient.register
	.getMetricsAsJSON()
	.then((metrics) =>
		metrics.forEach((metric: Record<string, any>) => {
			promClient.register.removeSingleMetric(metric.name);
		}),
	)
	.catch((err) => {
		// @ts-ignore
		this.logger.error(err);
		throw err;
	});

export { swMiddleware, swStats, clearPrometheusMetrics };
