import { BrokerOptions, Service } from 'moleculer';
import config from '../../moleculer.config';
import request from 'supertest';
import { constants } from 'http2';
import path from 'path';
import rimraf from 'rimraf';
import mongodb from 'mongodb';
import { DBInfo } from '../../types';
import 'jest-extended';
import 'jest-chain';
import { adminUser } from './user.helper';

export async function clearDB(dbInfo: DBInfo) {
	const { dbname, collection, dialect } = dbInfo;
	if (dialect === 'file') {
		const base = path.resolve(__dirname, '../../data/');
		const dbPath = path.join(base, `${dbname}_${collection}.db`);
		rimraf.sync(dbPath);
	} /* else if (dialect === 'mongodb') {
		const conn = await mongodb.connect(
			`${dbInfo.dialect}://${dbInfo.user}:${dbInfo.password}@${dbInfo.host}:${dbInfo.port}/${dbname}?authSource=admin`,
		);
		const db = conn.db(dbname);
		const collections: string[] = await db.command({
			listCollections: 1.0,
			authorizedCollections: true,
			nameOnly: true,
		});
		if (collections.includes(collection)) {
			await db.collection(collection).drop();
		}
	} */
}

export function randString() {
	return Math.random().toString(36).slice(2);
}

export const testConfig: BrokerOptions = {
	...config,
	logger: false,
	// namespace: 'test-env',
	middlewares: [],
	metrics: false,
};

export function wait(secs: number) {
	return new Promise<void>((resolve) => {
		setTimeout(() => {
			resolve();
		}, secs * 1000);
	});
}

interface CheckWrongInfo {
	token?: string;
	method?: 'get' | 'post' | 'put' | 'patch' | 'delete' | 'options' | 'head' | 'connect' | 'trace';
	body?: string | any;
	attach?: string;
}

export async function checkWrongToken(server: string, infoUrl: string, info: CheckWrongInfo = {}) {
	const {
		token = 'Bearer WrongToken',
		method = 'get',
		body = undefined,
		attach = undefined,
	} = info;
	let response: request.Response;
	/* if (attach) {
		response = await request(server)
			[method](infoUrl)
			.send(body)
			.attach('file', attach)
			.set(AUTHORIZATION_KEY, token);
	} else { */
	response = await request(server)[method](infoUrl).send(body).set(AUTHORIZATION_KEY, token);
	// }
	expect(response.status).toBe(constants.HTTP_STATUS_UNAUTHORIZED);
	expect(response.body)
		.toBeDefined()
		.toBeObject()
		.toContainEntries([
			['message', 'Unauthorized'],
			['code', constants.HTTP_STATUS_UNAUTHORIZED],
			['type', 'INVALID_TOKEN'],
		]);
}
export async function checkCorrectToken(
	server: string,
	infoUrl: string,
	info: CheckWrongInfo = {},
) {
	const {
		token = 'Bearer WrongToken',
		method = 'get',
		body = undefined,
		// attach = undefined,
	} = info;
	let response: request.Response;
	/* if (attach) {
		response = await request(server)
			[method](infoUrl)
			.send(body)
			.attach('file', attach)
			.set(AUTHORIZATION_KEY, token);
	} else { */
	response = await request(server)[method](infoUrl).send(body).set(AUTHORIZATION_KEY, token);
	// }
	expect(response.status).toBe(constants.HTTP_STATUS_OK);
	expect(response.body)
		.toBeDefined()
		.toBeObject()
		.toContainEntries([
			['_id', '5eb725a7ada22e664c83e634'],
			['login', 'disabled'],
			['email', 'user1@admin.com'],
			['active', false],
		]);
}

export const AUTHORIZATION_KEY = 'Authorization';

export function getServer(server: Service) {
	return new Promise<string>((resolve) => {
		const interval = setInterval(() => {
			const addr = server.address();
			if (addr) {
				clearInterval(interval);
				resolve(`http://${addr.address}:${addr.port}`);
			}
		}, 100);
	});
}
