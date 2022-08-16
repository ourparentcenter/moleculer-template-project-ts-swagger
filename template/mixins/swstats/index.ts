import swStats from 'swagger-stats';
// import swaggerSpec = require('../../swagger.json');
import swaggerSpec from '../../swagger.json';
import * as promClient from 'prom-client';
// import { Config } from '../../common';
// const swaggerSpec = async () => {
// 	const apiCall = await fetch(`${Config.BASE_URL}:${Config.BASE_PORT}/openapi/swagger.json`, {
// 		method: 'GET',
// 		credentials: 'same-origin',
// 		headers: {
// 			'Content-Type': 'application/json',
// 			// 'Content-Type': 'application/x-www-form-urlencoded',
// 		},
// 	});
// 	return await apiCall.json();
// };
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
