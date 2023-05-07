import { existsSync, writeFileSync } from 'fs';
import { generateOpenAPISchema } from '@ServiceHelpers';

const swJSONFile = existsSync('./swagger.json');
module.exports = {
	name: 'generateOpenAPIFile',

	createService(next: any) {
		return function (schema: any, schemaMods: any) {
			const generatedScheme = generateOpenAPISchema();
			// @ts-ignore
			this.logger.debug('♻ checking for openAPI schema json before server start.');
			if (!swJSONFile) {
				// @ts-ignore
				this.logger.warn('♻ No Swagger JSON file found, creating it.');
				Promise.resolve(
					writeFileSync(
						'./swagger.json',
						JSON.stringify(generatedScheme, null, 4),
						'utf8',
					),
				);
				return next(schema, schemaMods);
			}
			// @ts-ignore
			this.logger.debug('♻ Swagger JSON file found, continuing...');
			return next(schema, schemaMods);
		};
	},
};
