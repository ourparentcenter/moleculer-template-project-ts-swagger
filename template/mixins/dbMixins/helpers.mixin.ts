'use strict';
import path from 'path';
import fs from 'fs';
import { DbAdapter } from 'moleculer-db';
import bcrypt from 'bcryptjs';
import parseSync from 'csv-parse/lib/sync';
import { JsonConvert } from 'json2typescript';
import { CastingContext, Options } from 'csv-parse';
import { Config } from '../../common';
import { DBInfo } from '../../types';

const getValue = (value: string, context: CastingContext): unknown => {
	let result: any = value;
	if (context.lines > 1) {
		if (!value) {
			return undefined;
		}
		if (value.toLowerCase() === 'true') {
			result = true;
		} else if (value.toLowerCase() === 'false') {
			result = false;
		} else if (value.includes('|')) {
			result = value.split('|').filter(Boolean);
		} else if (context.column === 'password') {
			result = bcrypt.hashSync(value, JSON.parse(Config.SALT_VALUE));
		} else if (Number(value)) {
			result = Number(value);
		} else if (value.startsWith('{') && value.endsWith('}')) {
			result = JSON.parse(value.replace(/'/g, '"'));
		}
	}
	// eslint-disable-next-line @typescript-eslint/no-unsafe-return
	return result;
};

const dbSeed =
	(dbInfo: DBInfo, classReference: new () => any) =>
	async (adapter: DbAdapter): Promise<void> => {
		const csvFile = path.resolve(
			__dirname,
			'../../database',
			Config.NODE_ENV,
			`${dbInfo.collection}.csv`,
		);
		if (fs.existsSync(csvFile)) {
			const content = fs.readFileSync(csvFile, 'utf8');
			const cast = (value: string, context: CastingContext) => getValue(value, context);
			const options: Options = {
				delimiter: ',',
				trim: true,
				cast,
				comment: '#',
				// eslint-disable-next-line camelcase
				auto_parse: true,
				// eslint-disable-next-line camelcase
				skip_empty_lines: true,
				columns: true,
			};
			for (const row of parseSync(content, options)) {
				const item: any = new JsonConvert().deserializeObject(row, classReference);
				await adapter.insert(item);
			}
		}
	};
export { dbSeed };
