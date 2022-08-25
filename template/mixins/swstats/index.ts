import swStats from 'swagger-stats';
import swaggerSpec from '../../swagger.json';
import * as promClient from 'prom-client';
const tlBucket = 60000;
const swMiddleware = swStats.getMiddleware({
	name: 'swagger-stats',
	timelineBucketDuration: tlBucket,
	uriPath: '/dashboard',
	swaggerSpec: swaggerSpec,
});

// clears the promclient registry
const clearPrometheusMetrics = promClient.register.getMetricsAsJSON().then((metrics) =>
	metrics.forEach((metric: Record<string, any>) => {
		// let metric = metrics[metricId];
		promClient.register.removeSingleMetric(metric.name);
	}),
);

export { swMiddleware, swStats, clearPrometheusMetrics };
