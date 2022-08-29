'use strict';

module.exports = function (values) {
	return {
		questions: [
			{
				type: 'input',
				name: 'projectdescription',
				message: 'Give a description of your app:',
				default: () => 'My Moleculer-based microservices project',
			},
			{
				type: 'confirm',
				name: 'apiGW',
				message: 'Add API Gateway (moleculer-web) service?',
				default: true,
			},
			{
				type: 'confirm',
				name: 'frontend',
				message: 'Add demo frontend project (Quasar)?',
				when: (answers) => {
					if (!answers.apiGW || answers.apiGW == false) {
						answers.apiGW = false;
						answers.frontend = false;
					}
					return answers.apiGW;
				},
				default: true,
			},
			{
				type: 'confirm',
				name: 'swagger',
				message: 'Use Swagger?',
				when: (answers) => {
					if (!answers.apiGW || answers.apiGW == false) {
						answers.swagger = answers.apiGW;
					}
					return answers.apiGW;
				},
				default: true,
			},
			{
				type: 'confirm',
				name: 'swaggerstats',
				message: 'Use Swagger-Stats?',
				when: (answers) => {
					if (!answers.apiGW || answers.apiGW == false) {
						answers.swaggerstats = answers.apiGW;
					}
					return answers.apiGW;
				},
				default: true,
			},
			{
				type: 'confirm',
				name: 'swaggereditor',
				message: 'Use Swagger-Editor?',
				when: (answers) => {
					if (!answers.apiGW || answers.apiGW == false) {
						answers.swaggereditor = answers.apiGW;
					}
					return answers.apiGW;
				},
				default: true,
			},
			{
				type: 'confirm',
				name: 'dbService',
				message: 'Add DB sample services?',
				default: true,
			},
			{
				type: 'confirm',
				name: 'httptransport',
				message: 'Would you like to select an http transport?',
				when: (answers) => {
					if (!answers.dbService) {
						answers.httptransport = answers.dbService;
					}
					return answers.dbService;
				},
				default: true,
			},
			{
				type: 'list',
				name: 'choosehttptransport',
				message: 'Select AXIOS or Socket',
				choices: [
					{ name: 'Axios', value: 'AXIOS' },
					{ name: 'Socket.io', value: 'SOCKET' },
				],
				when: (answers) => {
					if (!answers.dbService) {
						answers.httptransport = null;
					}
					return answers.httptransport;
				},
				default: 'AXIOS',
			},
			{
				type: 'confirm',
				name: 'needTransporter',
				message: 'Would you like to communicate with other nodes?',
				default: true,
			},
			{
				type: 'list',
				name: 'transporter',
				message: 'Select a transporter',
				choices: [
					{ name: 'NATS (recommended)', value: 'NATS' },
					{ name: 'Redis', value: 'Redis' },
					{ name: 'MQTT', value: 'MQTT' },
					{ name: 'AMQP', value: 'AMQP' },
					{ name: 'TCP', value: 'TCP' },
					{ name: 'NATS Streaming', value: 'STAN' },
					{ name: 'Kafka', value: 'Kafka' },
					{ name: 'AMQP 1.0 (experimental)', value: 'AMQP10' },
				],
				when(answers) {
					return answers.needTransporter;
				},
				default: 'NATS',
			},
			{
				type: 'confirm',
				name: 'needCacher',
				message: 'Would you like to use cache?',
				default: false,
			},
			{
				type: 'list',
				name: 'cacher',
				message: 'Select a cacher solution',
				choices: [
					{ name: 'Memory', value: 'Memory' },
					{ name: 'Redis', value: 'Redis' },
				],
				when(answers) {
					return answers.needCacher;
				},
				default: 'Memory',
			},
			{
				type: 'confirm',
				name: 'metrics',
				message: 'Would you like to enable metrics?',
				default: true,
			},
			{
				type: 'list',
				name: 'reporter',
				message: 'Select a reporter solution',
				choices: [
					{ name: 'Console', value: 'Console' },
					{ name: 'CSV', value: 'Redis' },
					{ name: 'Event', value: 'CSV' },
					{ name: 'Prometheus', value: 'Prometheus' },
					{ name: 'Datadog', value: 'Datadog' },
					{ name: 'StatsD', value: 'StatsD' },
				],
				when(answers) {
					return answers.metrics;
				},
				default: 'Prometheus',
			},
			{
				type: 'confirm',
				name: 'tracing',
				message: 'Would you like to enable tracing?',
				default: true,
			},
			{
				type: 'list',
				name: 'exporter',
				message: 'Select a exporter solution',
				choices: [
					{ name: 'Console', value: 'Console' },
					{ name: 'EventLegacy', value: 'EventLegacy' },
					{ name: 'Event', value: 'CSV' },
					{ name: 'Jaeger', value: 'Jaeger' },
					{ name: 'Datadog', value: 'Datadog' },
					{ name: 'Zipkin', value: 'Zipkin' },
					{ name: 'NewRelic', value: 'NewRelic' },
				],
				when(answers) {
					return answers.tracing;
				},
				default: 'Console',
			},
			{
				type: 'confirm',
				name: 'docker',
				message: 'Add Docker & Kubernetes sample files?',
				default: true,
			},
			{
				type: 'confirm',
				name: 'lint',
				message: 'Use ESLint to lint your code?',
				default: true,
			},
			{
				type: 'confirm',
				name: 'chooseWatcher',
				message: 'Would you like to choose a file watcher?',
				default: true,
			},
			{
				type: 'list',
				name: 'watcher',
				message: 'Select a file watcher',
				choices: [
					{ name: 'ts-node (recommended)', value: 'TSNODE' },
					{ name: 'ts-node-dev', value: 'TSNODEDEV' },
				],
				when(answers) {
					return answers.chooseWatcher;
				},
				default: 'TSNODE',
			},
		],

		metalsmith: {
			before(metalsmith) {
				const data = metalsmith.metadata();
				data.redis = data.cacher == 'Redis' || data.transporter == 'Redis';
				data.hasDepends =
					(data.needCacher && data.cacher !== 'Memory') ||
					(data.needTransporter && data.transporter != 'TCP');
			},
		},

		skipInterpolation: [
			// "frontend/**/*"
			//"public/index.html"
		],

		filters: {
			'services/apiService/*': 'apiGW',
			'public/**/*': 'apiGW',
			'frontend/**/*': 'frontend',

			'boot/socketIO.ts': 'dbService',
			'services/**/*': 'dbService',
			'mixins/dbmixins/db.mixin.ts': 'dbService',
			'mixins/openapi/openapi.mixin.ts': 'swagger',
			'mixins/editor/editor.mixin.ts': 'swaggereditor',
			'mixins/swstats/index.ts': 'swaggerstats',
			'test/mixins/db.mixin.spec.ts': 'dbService',
			'test/integration/*': 'dbService',
			'test/unit/services/*': 'dbService',

			'.eslintrc.js': 'lint',

			'.dockerignore': 'docker',
			'docker-compose.*': 'docker',
			Dockerfile: 'docker',
			'k8s.yaml': 'docker',
		},

		completeMessage: `
		To get started:

		cd {{projectName}}
		npm run dev or yarn run dev

			`,
	};
};
