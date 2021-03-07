/* eslint-disable capitalized-comments */
import os from 'os';
import { LogLevels } from 'moleculer';
import dotenvFlow from 'dotenv-flow';
import _ from 'lodash';
import { DBDialog, DBInfo } from '../types';

const processEnv = process.env;
const envVariables = Object.keys(
	dotenvFlow.parse(['./env/.env', `./env/.env.${process.env.NODE_ENV}`, './env/envIncludes.env']),
);
const configObj = _.pick(processEnv, envVariables);

const isTrue = (text?: string | number) => [1, true, '1', 'true', 'yes'].includes(text || '');

const isFalse = (text?: string | number) => [0, false, '0', 'false', 'no'].includes(text || '');

const getValue = (text?: string, defaultValud?: string | boolean) => {
	const vtrue = isTrue(text);
	const vfalse = isFalse(text);
	const val = text || defaultValud;
	if (vtrue) {
		return true;
	} else if (vfalse) {
		return false;
	}
	return val;
};

const HOST_NAME = os.hostname().toLowerCase();

const getDbInfo = (where: string, what: string, defaultValue: string) => {
	const value = process.env[`DB_${where}_${what}`];
	const generic = process.env[`DB_GENERIC_${what}`];
	return value || generic || defaultValue;
};

const genericDbInfo = (where: string): DBInfo => ({
	dialect: getDbInfo(where, 'DIALECT', 'local') as DBDialog,
	user: getDbInfo(where, 'USER', ''),
	password: getDbInfo(where, 'PASSWORD', ''),
	host: getDbInfo(where, 'HOST', ''),
	port: +getDbInfo(where, 'PORT', '0'),
	dbname: getDbInfo(where, 'DBNAME', ''),
	collection: getDbInfo(where, 'COLLECTION', where.toLowerCase()),
});

export default class ConfigClass {
	// Dynamic property key
	[index: string]: any;
	public static NODE_ENV: string;
	// public static IS_TEST = ConfigClass.NODE_ENV === 'test';
	// public static HOST = process.env.HOST || '0.0.0.0';
	// public static PORT = +(process.env.PORT || 80);
	// public static REQUEST_TIMEOUT = +(process.env.REQUEST_TIMEOUT || 10000);
	// public static NAMESPACE = process.env.NAMESPACE || undefined;
	public static NODEID: string;
	// public static TRANSPORTER = process.env.TRANSPORTER || undefined;
	// public static CACHER = getValue(process.env.CACHER, undefined);
	// public static SERIALIZER = process.env.SERIALIZER || 'JSON'; // "JSON", "Avro", "ProtoBuf", "MsgPack", "Notepack", "Thrift"
	// public static MAPPING_POLICY = process.env.MAPPING_POLICY || 'restrict';
	// public static LOGLEVEL = (process.env.LOGLEVEL || 'info') as LogLevels;
	// public static TRACING_ENABLED = isTrue(process.env.TRACING_ENABLED || '1');
	// public static TRACING_TYPE = process.env.TRACING_TYPE || 'Console';
	// public static TRACING_ZIPKIN_URL = process.env.TRACING_ZIPKIN_URL || 'http://zipkin:9411';
	// public static METRICS_ENABLED = isTrue(process.env.METRICS_ENABLED || '1');
	// public static METRICS_TYPE = process.env.METRICS_TYPE || 'Prometheus';
	// public static METRICS_PORT = +(process.env.METRICS_PORT || 3030);
	// public static METRICS_PATH = process.env.METRICS_PATH || '/metrics';
	// public static RATE_LIMIT = +(process.env.RATE_LIMIT || 10);
	// public static RATE_LIMIT_WINDOW = +(process.env.RATE_LIMIT_WINDOW || 10000);
	// public static STRATEGY = process.env.STRATEGY || 'RoundRobin'; // "RoundRobin", "Random", "CpuUsage", "Latency", "Shard"
	// public static JWT_SECRET = process.env.JWT_SECRET || 'dummy-secret';
	public static DB_USER: any;
	public static DB_PRODUCT: any;

	public constructor() {
		Object.keys(configObj).forEach((key: string) => {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			this[key] = configObj[key];
		});
		this.NODE_ENV = process.env.NODE_ENV;
		this.NODEID = `${process.env.NODEID ? process.env.NODEID + '-' : ''}${HOST_NAME}-${
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			this.NODE_ENV
		}`;
		this.DB_USER = genericDbInfo('USER');
		this.DB_PRODUCT = genericDbInfo('PRODUCT');
	}
}
