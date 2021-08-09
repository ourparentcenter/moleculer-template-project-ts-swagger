'use strict';
import { inspect } from 'util';
import { BrokerOptions, Errors, MetricRegistry } from 'moleculer';
import 'reflect-metadata';
import pick from 'lodash/pick';
import ServiceGuard = require('./middlewares/ServiceGuard');
import HotReloadMiddleware from './middlewares/HotReloadCHokidar';
{{#apiGW}}
import OpenInBrowserMiddleware from './middlewares/OpenInBrowser';
{{/apiGW}}
import { Config } from './common';
import MoleculerRetryableError = Errors.MoleculerRetryableError;

/**
 * Moleculer ServiceBroker configuration file
 *
 * More info about options:
 *     https://moleculer.services/docs/0.14/configuration.html
 *
 *
 * Overwriting options in production:
 * ================================
 *    You can overwrite any option with environment variables.
 *    For example to overwrite the "logLevel" value, use `LOGLEVEL=warn` env var.
 *    To overwrite a nested parameter, e.g. retryPolicy.retries, use `RETRYPOLICY_RETRIES=10` env var.
 *
 *    To overwrite broker’s deeply nested default options, which are not presented in "moleculer.config.js",
 *    use the `MOL_` prefix and double underscore `__` for nested properties in .env file.
 *    For example, to set the cacher prefix to `MYCACHE`, you should declare an env var as `MOL_CACHER__OPTIONS__PREFIX=mycache`.
 *  It will set this:
 *  {
 *    cacher: {
 *      options: {
 *        prefix: "mycache"
 *      }
 *    }
 *  }
 */

const brokerConfig: BrokerOptions = {
	// Namespace of nodes to segment your nodes on the same network.
	namespace: Config.NAMESPACE,
	// Unique node identifier. Must be unique in a namespace.
	nodeID: Config.NODEID,
	// Custom metadata store. Store here what you want. Accessing: `this.broker.metadata`
	metadata: {},

	// Enable/disable logging or use custom logger. More info: https://moleculer.services/docs/0.14/logging.html
	// Available logger types: "Console", "File", "Pino", "Winston", "Bunyan", "debug", "Log4js", "Datadog"
	logger: {
		type: Config.LOGGERTYPE /* || 'Console' */,
		options: {
			// Using colors on the output
			colors: JSON.parse(Config.LOGGERCOLORS) || true,
			// Print module names with different colors (like docker-compose for containers)
			moduleColors: JSON.parse(Config.LOGGERMODULECOLORS) || false,
			// Line formatter. It can be "json", "short", "simple", "full", a `Function` or a template string like "{timestamp} {level} {nodeID}/{mod}: {msg}"
			formatter: Config.LOGGERFORMATTER || 'full',
			// Custom object printer. If not defined, it uses the `util.inspect` method.
			objectPrinter: (o: never) => inspect(o, { depth: 4, colors: true, breakLength: 100 }),
			// Auto-padding the module name in order to messages begin at the same column.
			autoPadding: JSON.parse(Config.LOGGERAUTOPADDING) || false,
		},
	},
	// Default log level for built-in console logger. It can be overwritten in logger options above.
	// Available values: trace, debug, info, warn, error, fatal
	logLevel: Config.LOGLEVEL,

	// Define transporter.
	// More info: https://moleculer.services/docs/0.14/networking.html
	// Note: During the development, you don't need to define it because all services will be loaded locally.
	// In production you can set it via `TRANSPORTER=nats://localhost:4222` environment variable.
	transporter: Config.TRANSPORTER || undefined, // "NATS"

	// Define a cacher.
	// More info: https://moleculer.services/docs/0.14/caching.html
	cacher: Config.CACHER || undefined,

	// Define a serializer.
	// Available values: "JSON", "Avro", "ProtoBuf", "MsgPack", "Notepack", "Thrift".
	// More info: https://moleculer.services/docs/0.14/networking.html#Serialization
	serializer: Config.SERIALIZER,

	// Number of milliseconds to wait before reject a request with a RequestTimeout error. Disabled: 0
	requestTimeout: Config.REQUEST_TIMEOUT, // Config.REQUEST_TIMEOUT

	// Retry policy settings. More info: https://moleculer.services/docs/0.14/fault-tolerance.html#Retry
	retryPolicy: {
		// Enable feature
		enabled: Config.RETRYPOLICY,
		// Count of retries
		retries: Config.RETRIES,
		// First delay in milliseconds.
		delay: Config.RETRYDELAY,
		// Maximum delay in milliseconds.
		maxDelay: Config.RETRYMAXDELAY,
		// Backoff factor for delay. 2 means exponential backoff.
		factor: Config.RETRYFACTOR,
		// A function to check failed requests.
		check: (err: Error): boolean =>
			err && err instanceof MoleculerRetryableError && !!err.retryable,
	},

	// Limit of calling level. If it reaches the limit, broker will throw an MaxCallLevelError error. (Infinite loop protection)
	maxCallLevel: Config.MAXCALLLEVEL,

	// Number of seconds to send heartbeat packet to other nodes.
	heartbeatInterval: Config.HEARTBEATINTERVAL,
	// Number of seconds to wait before setting node to unavailable status.
	heartbeatTimeout: Config.HEARTBEATTIMEOUT,

	// Cloning the params of context if enabled. High performance impact, use it with caution!
	contextParamsCloning: JSON.parse(Config.CTXPARAMSCLONING) || false,

	// Tracking requests and waiting for running requests before shuting down. More info: https://moleculer.services/docs/0.14/context.html#Context-tracking
	tracking: {
		// Enable feature
		enabled: JSON.parse(Config.TRACKING_ENABLED) || false,
		// Number of milliseconds to wait before shuting down the process.
		shutdownTimeout: Config.TRACKINGSHUTDOWNTIME,
	},

	// Disable built-in request & emit balancer. (Transporter must support it, as well.). More info: https://moleculer.services/docs/0.14/networking.html#Disabled-balancer
	disableBalancer: JSON.parse(Config.BALANCER_ENABLED) || false,

	// Settings of Service Registry. More info: https://moleculer.services/docs/0.14/registry.html
	registry: {
		// Define balancing strategy. More info: https://moleculer.services/docs/0.14/balancing.html
		// Available values: "RoundRobin", "Random", "CpuUsage", "Latency", "Shard"
		strategy: Config.STRATEGY || 'RoundRobin',
		// Enable local action call preferring. Always call the local action instance if available.
		preferLocal: JSON.parse(Config.PREFERLOCAL) || true,
	},

	// Settings of Circuit Breaker. More info: https://moleculer.services/docs/0.14/fault-tolerance.html#Circuit-Breaker
	circuitBreaker: {
		// Enable feature
		enabled: JSON.parse(Config.BREAKER_ENABLED) || false,
		// Threshold value. 0.5 means that 50% should be failed for tripping.
		threshold: Config.BREAKERTHRESHOLD || 0.5,
		// Minimum request count. Below it, CB does not trip.
		minRequestCount: Config.BREAKERMINREQCOUNT || 20,
		// Number of seconds for time window.
		windowTime: Config.WINDOWTIME || 60,
		// Number of milliseconds to switch from open to half-open state
		halfOpenTime: Config.HALFOPENTIME || 10 * 1000,
		// A function to check failed requests.
		check: (err: Error): boolean =>
			err && err instanceof MoleculerRetryableError && err.code >= 500,
	},

	// Settings of bulkhead feature. More info: https://moleculer.services/docs/0.14/fault-tolerance.html#Bulkhead
	bulkhead: {
		// Enable feature.
		enabled: JSON.parse(Config.BULKHEAD_ENABLED) || false,
		// Maximum concurrent executions.
		concurrency: Config.CONCURRENCY || 10,
		// Maximum size of queue
		maxQueueSize: Config.MAXQUEUESIZE || 100,
	},

	// Enable action & event parameter validation. More info: https://moleculer.services/docs/0.14/validating.html
	validator: JSON.parse(Config.VALIDATOR_ENABLED) || true,

	// eslint-disable-next-line capitalized-comments
	/* errorHandler: (err: any, info: any) => {
		const context = pick(
			info.ctx,
			'nodeID',
			'id',
			'event',
			'eventName',
			'eventType',
			'eventGroups',
			'parentID',
			'requestID',
			'caller',
			'params',
			'meta',
			'locals',
		);
		const action = pick(info.action, 'rawName', 'name', 'params', 'rest');
		const msg = err.message;
		info.service.logger.error(
			'errorHandler:',
			msg,
			'\n\n--- CONTEXT ---\n',
			context,
			'\n\n--- ACTION ---\n',
			action,
			'\n\n --- END ---\n',
			err,
		);
		// BROADCAST ERROR or EVENT emit
		// Info.service.broker.broadcast()
		// eslint-disable-next-line capitalized-comments
		// throw err; // Throw further
	}, */

	// Enable/disable built-in metrics function. More info: https://moleculer.services/docs/0.14/metrics.html
	metrics: {
		enabled: Config.METRICS_ENABLED,
		// Available built-in reporters: "Console", "CSV", "Event", "Prometheus", "Datadog", "StatsD"
		reporter: {
			type: Config.METRICS_TYPE,
			{{#if_eq reporter "Console"}}
			options: {
				// HTTP port
				port: Config.METRICS_PORT || 3030,
				// HTTP URL path
				path: Config.METRICS_PATH || '/metrics',
				// Default labels which are appended to all metrics labels
				defaultLabels: (registry: MetricRegistry) => ({
					namespace: registry.broker.namespace,
					nodeID: registry.broker.nodeID,
				}),
			},
			{{/if_eq}}
			{{#if_eq reporter "CSV"}}
			options: {
				// Folder of CSV files.
				folder: './reports/metrics',
				// CSV field delimiter
				delimiter: ',',
				// CSV row delimiter
				rowDelimiter: '\n',
				// Saving mode.
				//   - "metric" - save metrics to individual files
				//   - "label" - save metrics by labels to individual files
				mode: 'metric',
				// Saved metrics types.
				types: null,
				// Saving interval in seconds
				interval: 5,
				// Custom filename formatter
				filenameFormatter: null,
				// Custom CSV row formatter.
				rowFormatter: null,
			},
			{{/if_eq}}
			{{#if_eq reporter "Event"}}
			options: {
				// Event name
				eventName: '$metrics.snapshot',
				// Broadcast or emit
				broadcast: false,
				// Event groups
				groups: null,
				// Send only changed metrics
				onlyChanges: false,
				// Sending interval in seconds
				interval: 5,
			},
			{{/if_eq}}
			{{#if_eq reporter "Datadog"}}
			options: {
				// Hostname
				host: Config.DATADOG_HOST,
				// Base URL
				baseUrl: Config.DATADOG_BASE_URL, //'https://api.datadoghq.eu/api/', // Default is https://api.datadoghq.com/api/
				// API version
				apiVersion: 'v1',
				// Server URL path
				path: Config.METRICS_PATH || '/series',
				// Datadog API Key
				apiKey: Config.DATADOG_API_KEY,
				// Default labels which are appended to all metrics labels
				defaultLabels: (registry: MetricRegistry) => ({
					namespace: registry.broker.namespace,
					nodeID: registry.broker.nodeID,
				}),
				// Sending interval in seconds
				interval: 10
			},
			{{/if_eq}}
			{{#if_eq reporter "Prometheus"}}
			options: {
				// HTTP port
				port: Config.METRICS_PORT || 3030,
				// HTTP URL path
				path: Config.METRICS_PATH || '/metrics',
				// Default labels which are appended to all metrics labels
				defaultLabels: (registry: MetricRegistry) => ({
					namespace: registry.broker.namespace,
					nodeID: registry.broker.nodeID,
				}),
			},
			{{/if_eq}}
			{{#if_eq reporter "StatsD"}}
			options: {
				// Server host
				host: 'localhost',
				// Server port
				port: Config.METRICS_PORT || 8125,
				// Maximum payload size.
				maxPayloadSize: 1300
			},
			{{/if_eq}}
		},
	},

	// Enable built-in tracing function. More info: https://moleculer.services/docs/0.14/tracing.html
	tracing: {
		enabled: Config.TRACING_ENABLED,
		// Available built-in exporters: "Console", "Datadog", "Event", "EventLegacy", "Jaeger", "Zipkin"
		exporter: {
			type: Config.TRACING_TYPE, // Console exporter is only for development!
			{{#if_eq exporter "Console"}}
			options: {
				// Custom logger
				logger: null,
				// Using colors
				colors: JSON.parse(Config.TRACING_COLORS) || true,
				// Width of row
				width: Config.TRACING_WIDTH || 100,
				// Gauge width in the row
				gaugeWidth: Config.TRACING_GUAGEWIDTH || 40,
			},
			{{/if_eq}}
			{{#if_eq exporter "Datadog"}}
			options: {
				// Datadog Agent URL
				agentUrl: Config.DD_AGENT_URL || 'http://localhost:8126',
				// Environment variable
				env: Config.DD_ENVIRONMENT || null,
				// Sampling priority. More info: https://docs.datadoghq.com/tracing/guide/trace_sampling_and_storage/?tab=java#sampling-rules
				samplingPriority: 'AUTO_KEEP',
				// Default tags. They will be added into all span tags.
				defaultTags: null,
				// Custom Datadog Tracer options. More info: https://datadog.github.io/dd-trace-js/#tracer-settings
				tracerOptions: null,
			},
			{{/if_eq}}
			{{#if_eq exporter "Event"}}
			options: {
				// Name of event
				eventName: '$tracing.spans',
				// Send event when a span started
				sendStartSpan: false,
				// Send event when a span finished
				sendFinishSpan: true,
				// Broadcast or emit event
				broadcast: false,
				// Event groups
				groups: null,
				// Sending time interval in seconds
				interval: 5,
				// Custom span object converter before sending
				spanConverter: null,
				// Default tags. They will be added into all span tags.
				defaultTags: null
			},
			{{/if_eq}}
			{{#if_eq exporter "Jaeger"}}
			options: {
				// HTTP Reporter endpoint. If set, HTTP Reporter will be used.
				endpoint: null,
				// UDP Sender host option.
				host: '127.0.0.1',
				// UDP Sender port option.
				port: 6832,
				// Jaeger Sampler configuration.
				sampler: {
					// Sampler type. More info: https://www.jaegertracing.io/docs/1.14/sampling/#client-sampling-configuration
					type: 'Const',
					// Sampler specific options.
					options: {}
				},
				// Additional options for `Jaeger.Tracer`
				tracerOptions: {},
				// Default tags. They will be added into all span tags.
				defaultTags: null
			},
			{{/if_eq}}
			{{#if_eq exporter "Zipkin"}}
			options: {
				// Base URL for Zipkin server.
				baseURL: Config.TRACING_BASE_URL || undefined,
				// Sending time interval in seconds.
				interval: 5,
				// Additional payload options.
				payloadOptions: {
				// Set `debug` property in payload.
				debug: false,
					// Set `shared` property in payload.
					shared: false,
				},
				// Default tags. They will be added into all span tags.
				defaultTags: null
			},
			{{/if_eq}}
			{{#if_eq exporter "NewRelic"}}
			options: {
				// Base URL for NewRelic server
				baseURL: Config.TRACING_BASE_URL, //'https://trace-api.newrelic.com',
				// NewRelic Insert Key
				insertKey: 'my-secret-key',
				// Sending time interval in seconds.
				interval: 5,
				// Additional payload options.
				payloadOptions: {
				// Set `debug` property in payload.
				debug: false,
					// Set `shared` property in payload.
					shared: false,
				},
				// Default tags. They will be added into all span tags.
				defaultTags: null,
			},
			{{/if_eq}}
		},
	},

	// Register custom middlewares
	middlewares: [hotreload, ServiceGuard{{#apiGW}}, OpenInBrowserMiddleware{{/apiGW}}],

	// Register custom REPL commands.
	replCommands: undefined,
	/*
	// Called after broker created.
	created : (broker: ServiceBroker): void => {},
	// Called after broker started.
	started: async (broker: ServiceBroker): Promise<void> => {},
	stopped: async (broker: ServiceBroker): Promise<void> => {},
	 */
};

export = brokerConfig;
